from django.urls import path

from app.consumers import ConversationConsumer, InboxConsumer

websocket_urlpatterns = [
    path("ws/messages/inbox/", InboxConsumer.as_asgi()),
    path("ws/messages/conversations/<uuid:conversation_id>/", ConversationConsumer.as_asgi()),
]