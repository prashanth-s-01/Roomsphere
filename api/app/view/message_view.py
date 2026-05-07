from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status
from asgiref.sync import async_to_sync
from channels.layers import get_channel_layer

from app.dao.user_dao import UserDAO
from app.serializer.message_serializer import (
    ConversationCreateSerializer,
    InboxQuerySerializer,
    ListingInterestMessageSerializer,
    SendMessageSerializer,
)
from app.service.message_service import MessageService
from app.models.moveout_item import MoveoutItem
from app.models.room_vacancy import RoomVacancy
from app.models.users import User


def _broadcast_message_events(conversation, message, sender_user, recipient_user):
    channel_layer = get_channel_layer()
    if not channel_layer:
        return

    async_to_sync(channel_layer.group_send)(
        f"conversation_{conversation.id}",
        {
            "type": "chat.message",
            "message_id": str(message.id),
        },
    )

    sender_summary = MessageService.serialize_conversation_summary(conversation, sender_user)
    recipient_summary = MessageService.serialize_conversation_summary(conversation, recipient_user)

    if sender_summary:
        async_to_sync(channel_layer.group_send)(
            f"inbox_{sender_user.userid}",
            {
                "type": "inbox.updated",
                "conversation": sender_summary,
            },
        )

    if recipient_summary:
        async_to_sync(channel_layer.group_send)(
            f"inbox_{recipient_user.userid}",
            {
                "type": "inbox.updated",
                "conversation": recipient_summary,
            },
        )


@api_view(["GET", "POST"])
def conversations(request):
    if request.method == "GET":
        serializer = InboxQuerySerializer(data=request.query_params)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        current_user = MessageService.get_current_user(serializer.validated_data["email"])
        if not current_user:
            return Response({"error": "User not found"}, status=status.HTTP_404_NOT_FOUND)

        conversations_data = MessageService.list_conversations(
            current_user,
            serializer.validated_data.get("search", ""),
        )
        return Response(
            {
                "current_user": MessageService._serialize_user(current_user),
                "conversations": conversations_data,
            }
        )

    serializer = ConversationCreateSerializer(data=request.data)
    if not serializer.is_valid():
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    current_user = MessageService.get_current_user(serializer.validated_data["email"])
    other_user = MessageService.get_current_user(serializer.validated_data["other_email"])

    if not current_user or not other_user:
        return Response({"error": "User not found"}, status=status.HTTP_404_NOT_FOUND)

    if current_user.userid == other_user.userid:
        return Response({"error": "You cannot message yourself"}, status=status.HTTP_400_BAD_REQUEST)

    conversation = MessageService.create_or_get_conversation(current_user, other_user)

    return Response(
        {
            "conversation": {
                "id": str(conversation.id),
                "participant": MessageService._serialize_user(other_user),
            }
        },
        status=status.HTTP_201_CREATED,
    )


@api_view(["GET", "POST"])
def conversation_detail(request, conversation_id):
    serializer = InboxQuerySerializer(data=request.query_params if request.method == "GET" else request.data)
    if not serializer.is_valid():
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    current_user = MessageService.get_current_user(serializer.validated_data["email"])
    if not current_user:
        return Response({"error": "User not found"}, status=status.HTTP_404_NOT_FOUND)

    conversation = MessageService.get_conversation_for_user(conversation_id, current_user)
    if not conversation:
        return Response({"error": "Conversation not found"}, status=status.HTTP_404_NOT_FOUND)

    if request.method == "GET":
        return Response(MessageService.build_thread_payload(conversation, current_user))

    send_serializer = SendMessageSerializer(data=request.data)
    if not send_serializer.is_valid():
        return Response(send_serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    message = MessageService.send_message(
        conversation,
        current_user,
        send_serializer.validated_data["body"],
    )

    return Response(
        {
            "message": MessageService._serialize_message(message, current_user),
            "thread": MessageService.build_thread_payload(conversation, current_user),
        },
        status=status.HTTP_201_CREATED,
    )


@api_view(["POST"])
def send_listing_interest_message(request, item_id):
    serializer = ListingInterestMessageSerializer(data=request.data)
    if not serializer.is_valid():
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    current_user = MessageService.get_current_user(serializer.validated_data["email"])
    if not current_user:
        return Response({"error": "User not found"}, status=status.HTTP_404_NOT_FOUND)

    item = MoveoutItem.objects.select_related("owner").filter(id=item_id).first()
    if not item:
        return Response({"error": "Moveout item not found"}, status=status.HTTP_404_NOT_FOUND)

    if item.owner_id == current_user.userid:
        return Response({"error": "You cannot message yourself"}, status=status.HTTP_400_BAD_REQUEST)

    conversation = MessageService.create_or_get_conversation(current_user, item.owner)
    message = MessageService.send_message(
        conversation,
        current_user,
        serializer.validated_data["body"],
    )
    _broadcast_message_events(conversation, message, current_user, item.owner)

    return Response(
        {
            "conversation": {
                "id": str(conversation.id),
                "participant": MessageService._serialize_user(item.owner),
            },
            "message": MessageService._serialize_message(message, current_user),
            "thread": MessageService.build_thread_payload(conversation, current_user),
        },
        status=status.HTTP_201_CREATED,
    )


@api_view(["POST"])
def send_roommate_interest_message(request, user_id):
    serializer = ListingInterestMessageSerializer(data=request.data)
    if not serializer.is_valid():
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    current_user = MessageService.get_current_user(serializer.validated_data["email"])
    if not current_user:
        return Response({"error": "User not found"}, status=status.HTTP_404_NOT_FOUND)

    roommate = User.objects.filter(userid=user_id).first()
    if not roommate:
        return Response({"error": "Roommate profile not found"}, status=status.HTTP_404_NOT_FOUND)

    if roommate.userid == current_user.userid:
        return Response({"error": "You cannot message yourself"}, status=status.HTTP_400_BAD_REQUEST)

    conversation = MessageService.create_or_get_conversation(current_user, roommate)
    message = MessageService.send_message(
        conversation,
        current_user,
        serializer.validated_data["body"],
    )
    _broadcast_message_events(conversation, message, current_user, roommate)

    return Response(
        {
            "conversation": {
                "id": str(conversation.id),
                "participant": MessageService._serialize_user(roommate),
            },
            "message": MessageService._serialize_message(message, current_user),
            "thread": MessageService.build_thread_payload(conversation, current_user),
        },
        status=status.HTTP_201_CREATED,
    )


@api_view(["POST"])
def send_room_vacancy_interest_message(request, vacancy_id):
    serializer = ListingInterestMessageSerializer(data=request.data)
    if not serializer.is_valid():
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    current_user = MessageService.get_current_user(serializer.validated_data["email"])
    if not current_user:
        return Response({"error": "User not found"}, status=status.HTTP_404_NOT_FOUND)

    vacancy = RoomVacancy.objects.select_related("owner").filter(id=vacancy_id).first()
    if not vacancy:
        return Response({"error": "Room vacancy not found"}, status=status.HTTP_404_NOT_FOUND)

    if vacancy.owner_id == current_user.userid:
        return Response({"error": "You cannot message yourself"}, status=status.HTTP_400_BAD_REQUEST)

    conversation = MessageService.create_or_get_conversation(current_user, vacancy.owner)
    message = MessageService.send_message(
        conversation,
        current_user,
        serializer.validated_data["body"],
    )
    _broadcast_message_events(conversation, message, current_user, vacancy.owner)

    return Response(
        {
            "conversation": {
                "id": str(conversation.id),
                "participant": MessageService._serialize_user(vacancy.owner),
            },
            "message": MessageService._serialize_message(message, current_user),
            "thread": MessageService.build_thread_payload(conversation, current_user),
        },
        status=status.HTTP_201_CREATED,
    )
