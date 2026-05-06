from django.urls import path

from app.view.message_view import conversation_detail, conversations

urlpatterns = [
    path("conversations/", conversations),
    path("conversations/<uuid:conversation_id>/", conversation_detail),
]