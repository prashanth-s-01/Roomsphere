from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status

from app.dao.user_dao import UserDAO
from app.serializer.message_serializer import (
    ConversationCreateSerializer,
    InboxQuerySerializer,
    SendMessageSerializer,
)
from app.service.message_service import MessageService


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