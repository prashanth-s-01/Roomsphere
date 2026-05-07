from django.urls import path

from app.view.message_view import (
    conversation_detail,
    conversations,
    send_listing_interest_message,
    send_roommate_interest_message,
)

urlpatterns = [
    path("conversations/", conversations),
    path("conversations/<uuid:conversation_id>/", conversation_detail),
    path("moveout/<uuid:item_id>/", send_listing_interest_message),
    path("roommates/<uuid:user_id>/", send_roommate_interest_message),
]
