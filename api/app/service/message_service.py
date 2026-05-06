from __future__ import annotations

from datetime import timedelta
import logging

from django.db.models import Q
from django.utils import timezone

from app.dao.user_dao import UserDAO
from app.models.converstation import Conversation
from app.models.message import Message

logger = logging.getLogger(__name__)


class MessageService:
    @staticmethod
    def _display_name(user):
        full_name = f"{user.first_name} {user.last_name}".strip()
        return full_name if full_name else user.email.split("@")[0]

    @staticmethod
    def _initials(user):
        parts = [part[0] for part in [user.first_name, user.last_name] if part]
        if parts:
            return "".join(parts).upper()
        return user.email[:2].upper()

    @staticmethod
    def _serialize_user(user):
        return {
            "userid": str(user.userid),
            "first_name": user.first_name,
            "last_name": user.last_name,
            "email": user.email,
            "campus": user.campus,
            "display_name": MessageService._display_name(user),
            "initials": MessageService._initials(user),
        }

    @staticmethod
    def _format_relative_time(value):
        if value is None:
            return ""

        now = timezone.localtime(timezone.now())
        value = timezone.localtime(value)
        delta = now - value

        if delta < timedelta(minutes=60):
            minutes = max(1, int(delta.total_seconds() // 60))
            return f"{minutes}m"
        if delta < timedelta(hours=24):
            hours = max(1, int(delta.total_seconds() // 3600))
            return f"{hours}h"
        if delta < timedelta(days=2):
            return "Yesterday"
        if delta < timedelta(days=7):
            return value.strftime("%A")
        return value.strftime("%b %d")

    @staticmethod
    def _other_participant(conversation, current_user):
        if conversation.participant1_id == current_user.userid:
            return conversation.participant2
        if conversation.participant2_id == current_user.userid:
            return conversation.participant1
        return None

    @staticmethod
    def get_other_participant(conversation, current_user):
        return MessageService._other_participant(conversation, current_user)

    @staticmethod
    def _last_message(conversation):
        return conversation.messages.select_related("sender").order_by("-created_at").first()

    @staticmethod
    def _serialize_conversation(conversation, current_user):
        other_user = MessageService._other_participant(conversation, current_user)
        if other_user is None:
            return None

        last_message = MessageService._last_message(conversation)
        unread_count = conversation.messages.filter(is_read=False).exclude(sender=current_user).count()
        activity = last_message.created_at if last_message else conversation.created_at

        return {
            "id": str(conversation.id),
            "participant": MessageService._serialize_user(other_user),
            "preview": last_message.body if last_message else "No messages yet",
            "last_message_at": activity.isoformat(),
            "time_label": MessageService._format_relative_time(activity),
            "unread_count": unread_count,
            "has_unread": unread_count > 0,
            "last_sender_email": last_message.sender.email if last_message else None,
        }

    @staticmethod
    def serialize_conversation_summary(conversation, current_user):
        return MessageService._serialize_conversation(conversation, current_user)

    @staticmethod
    def _serialize_message(message, current_user):
        return {
            "id": str(message.id),
            "conversation": str(message.conversation_id),
            "body": message.body,
            "is_read": message.is_read,
            "created_at": message.created_at.isoformat(),
            "is_current_user": message.sender_id == current_user.userid,
            "sender": MessageService._serialize_user(message.sender),
        }

    @staticmethod
    def serialize_message(message, current_user):
        return MessageService._serialize_message(message, current_user)

    @staticmethod
    def get_current_user(email):
        return UserDAO.get_user_by_email(email)

    @staticmethod
    def list_conversations(current_user, search=""):
        logger.debug(f"list_conversations for {current_user.email} search={bool(search)}")
        queryset = (
            Conversation.objects.filter(
                Q(participant1=current_user) | Q(participant2=current_user)
            )
            .select_related("participant1", "participant2")
            .prefetch_related("messages__sender")
        )

        items = []
        lowered = search.strip().lower()

        for conversation in queryset:
            serialized = MessageService._serialize_conversation(conversation, current_user)
            if serialized is None:
                continue

            if lowered:
                haystack = " ".join(
                    [
                        serialized["participant"]["display_name"],
                        serialized["participant"]["email"],
                        serialized["participant"].get("campus") or "",
                        serialized["preview"],
                    ]
                ).lower()
                if lowered not in haystack:
                    continue

            items.append(serialized)

        items.sort(key=lambda item: item["last_message_at"], reverse=True)
        return items

    @staticmethod
    def get_conversation_for_user(conversation_id, current_user):
        logger.debug(f"get_conversation_for_user {conversation_id} for {current_user.email}")
        conversation = (
            Conversation.objects.select_related("participant1", "participant2")
            .prefetch_related("messages__sender")
            .filter(id=conversation_id)
            .first()
        )

        if not conversation:
            logger.warning(f"conversation {conversation_id} not found")
            return None

        if current_user.userid not in {conversation.participant1_id, conversation.participant2_id}:
            logger.warning(f"unauthorized access to {conversation_id} by {current_user.email}")
            return None

        logger.debug(f"conversation {conversation_id} authorized")
        return conversation

    @staticmethod
    def build_thread_payload(conversation, current_user):
        logger.debug(f"build_thread_payload for {conversation.id}")
        conversation.messages.filter(is_read=False).exclude(sender=current_user).update(is_read=True)

        messages = conversation.messages.select_related("sender").order_by("created_at")
        other_user = MessageService._other_participant(conversation, current_user)
        logger.debug(f"thread payload: {messages.count()} messages")

        return {
            "conversation": {
                "id": str(conversation.id),
                "participant": MessageService._serialize_user(other_user),
                "created_at": conversation.created_at.isoformat(),
                "other_user": MessageService._serialize_user(other_user),
            },
            "messages": [MessageService._serialize_message(message, current_user) for message in messages],
        }

    @staticmethod
    def create_or_get_conversation(current_user, other_user):
        conversation = Conversation.get_or_create_conversation(current_user, other_user)
        return conversation

    @staticmethod
    def send_message(conversation, sender, body):
        logger.info(f"send_message by {sender.email} in {conversation.id} len={len(body)}")
        return Message.objects.create(conversation=conversation, sender=sender, body=body)