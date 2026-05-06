from urllib.parse import parse_qs

from channels.db import database_sync_to_async
from channels.generic.websocket import AsyncJsonWebsocketConsumer

from app.dao.user_dao import UserDAO
from app.models.message import Message
from app.service.message_service import MessageService
import logging

logger = logging.getLogger(__name__)


class BaseMessageConsumer(AsyncJsonWebsocketConsumer):
    async def get_current_user(self):
        query_string = parse_qs(self.scope.get("query_string", b"").decode())
        email = query_string.get("email", [""])[0].strip()
        if not email:
            return None
        return await database_sync_to_async(UserDAO.get_user_by_email)(email)


class InboxConsumer(BaseMessageConsumer):
    async def connect(self):
        qs_raw = self.scope.get("query_string", b"")
        try:
            qs_str = qs_raw.decode()
        except Exception:
            qs_str = str(qs_raw)
        logger.info("InboxConsumer connecting; query_string=%s", qs_str)
        self.current_user = await self.get_current_user()
        logger.info("InboxConsumer user found=%s", bool(self.current_user))
        if not self.current_user:
            logger.warning("InboxConsumer closing: unauthorized (no user)")
            await self.close(code=4401)
            return

        self.group_name = f"inbox_{self.current_user.userid}"
        await self.channel_layer.group_add(self.group_name, self.channel_name)
        await self.accept()

        conversations = await database_sync_to_async(MessageService.list_conversations)(self.current_user)
        await self.send_json({"type": "inbox.snapshot", "conversations": conversations})

    async def disconnect(self, close_code):
        if getattr(self, "group_name", None):
            await self.channel_layer.group_discard(self.group_name, self.channel_name)

    async def inbox_updated(self, event):
        await self.send_json({"type": "inbox.updated", "conversation": event["conversation"]})


class ConversationConsumer(BaseMessageConsumer):

    async def connect(self):
        qs_raw = self.scope.get("query_string", b"")
        try:
            qs_str = qs_raw.decode()
        except Exception:
            qs_str = str(qs_raw)
        logger.info("ConversationConsumer connecting; query_string=%s url_route=%s", qs_str, self.scope.get("url_route"))
        self.current_user = await self.get_current_user()
        logger.info("ConversationConsumer user found=%s", bool(self.current_user))
        if not self.current_user:
            logger.warning("ConversationConsumer closing: unauthorized (no user)")
            await self.close(code=4401)
            return

        self.conversation_id = self.scope["url_route"]["kwargs"]["conversation_id"]
        self.conversation = await database_sync_to_async(MessageService.get_conversation_for_user)(
            self.conversation_id,
            self.current_user,
        )
        if not self.conversation:
            await self.close(code=4404)
            return

        self.group_name = f"conversation_{self.conversation_id}"
        await self.channel_layer.group_add(self.group_name, self.channel_name)
        await self.accept()

        thread_payload = await database_sync_to_async(MessageService.build_thread_payload)(
            self.conversation,
            self.current_user,
        )
        await self.send_json({"type": "thread.snapshot", "thread": thread_payload})
        await self._broadcast_inbox_updates()

    async def disconnect(self, close_code):
        if getattr(self, "group_name", None):
            await self.channel_layer.group_discard(self.group_name, self.channel_name)

    async def receive_json(self, content, **kwargs):
        action = content.get("action")
        if action != "send_message":
            await self.send_json({"type": "error", "message": "Unsupported action"})
            return

        body = str(content.get("body", "")).strip()
        if not body:
            await self.send_json({"type": "error", "message": "Message body cannot be empty"})
            return

        logger.info(f"receive_json send_message from {self.current_user.email} in {self.conversation_id}")
        message = await database_sync_to_async(MessageService.send_message)(
            self.conversation,
            self.current_user,
            body,
        )

        await self.channel_layer.group_send(
            self.group_name,
            {
                "type": "chat.message",
                "message_id": str(message.id),
            },
        )

        await self._broadcast_inbox_updates()

    async def chat_message(self, event):
        message = await database_sync_to_async(Message.objects.select_related("sender", "conversation").get)(id=event["message_id"])
        message_payload = await database_sync_to_async(MessageService.serialize_message)(message, self.current_user)
        await self.send_json({"type": "message.created", "message": message_payload})

    async def _broadcast_inbox_updates(self):
        logger.debug(f"_broadcast_inbox_updates for {self.conversation_id}")
        current_summary = await database_sync_to_async(MessageService.serialize_conversation_summary)(
            self.conversation,
            self.current_user,
        )
        await self.channel_layer.group_send(
            f"inbox_{self.current_user.userid}",
            {
                "type": "inbox.updated",
                "conversation": current_summary,
            },
        )

        other_user = await database_sync_to_async(MessageService.get_other_participant)(
            self.conversation,
            self.current_user,
        )
        if other_user:
            other_summary = await database_sync_to_async(MessageService.serialize_conversation_summary)(
                self.conversation,
                other_user,
            )
            logger.debug(f"broadcasting to {other_user.email}")
            await self.channel_layer.group_send(
                f"inbox_{other_user.userid}",
                {
                    "type": "inbox.updated",
                    "conversation": other_summary,
                },
            )