from datetime import date
from types import SimpleNamespace
from unittest.mock import MagicMock

import pytest
from rest_framework import status
from rest_framework.test import APIRequestFactory

from app.message_urls import urlpatterns as message_urlpatterns
from app.models.moveout_item import MoveoutItem
from app.models.room_vacancy import RoomVacancy
from app.routing import websocket_urlpatterns
from app.view import message_view
from app.view.message_view import (
    _broadcast_message_events,
    conversations,
    send_listing_interest_message,
    send_room_vacancy_interest_message,
    send_roommate_interest_message,
)

pytestmark = pytest.mark.django_db


@pytest.fixture
def api_factory():
    return APIRequestFactory()


@pytest.fixture
def current_user(user_factory):
    user = user_factory(
        email="sender@umass.edu",
        first_name="Sender",
        last_name="User",
        campus="UMass Amherst",
    )
    user.gender = "FEMALE"
    user.gender_preference = "ANY"
    user.move_in_date = date(2026, 8, 1)
    user.save()
    return user


@pytest.fixture
def other_user(user_factory):
    user = user_factory(
        email="recipient@smith.edu",
        first_name="Recipient",
        last_name="User",
        campus="Smith College",
    )
    user.gender = "MALE"
    user.gender_preference = "ANY"
    user.move_in_date = date(2026, 8, 15)
    user.save()
    return user


@pytest.fixture
def listing_item(other_user):
    return MoveoutItem.objects.create(
        owner=other_user,
        title="Desk Lamp",
        description="Small lamp",
        category="OTHER",
        condition="GOOD",
        price="25.00",
        contact_email=other_user.email,
    )


@pytest.fixture
def room_vacancy(other_user):
    return RoomVacancy.objects.create(
        owner=other_user,
        title="Cozy room",
        description="Close to campus",
        location=other_user.campus,
        housing_type="APARTMENT",
        rent="900.00",
        available_from=date(2026, 8, 1),
        lease_duration="12_MONTHS",
        total_rooms=2,
        gender_preference="ANY",
        contact_email=other_user.email,
    )


def test_broadcast_message_events_returns_without_channel_layer(monkeypatch):
    monkeypatch.setattr(message_view, "get_channel_layer", lambda: None)

    _broadcast_message_events(
        SimpleNamespace(id="conversation-1"),
        SimpleNamespace(id="message-1"),
        SimpleNamespace(userid="sender"),
        SimpleNamespace(userid="recipient"),
    )


def test_broadcast_message_events_sends_conversation_and_inbox_updates(monkeypatch):
    group_send = MagicMock()
    monkeypatch.setattr(message_view, "get_channel_layer", lambda: SimpleNamespace(group_send=group_send))
    monkeypatch.setattr(message_view, "async_to_sync", lambda fn: fn)
    monkeypatch.setattr(
        message_view.MessageService,
        "serialize_conversation_summary",
        lambda conversation, user: {"for": str(user.userid)},
    )

    conversation = SimpleNamespace(id="conversation-123")
    message = SimpleNamespace(id="message-456")
    sender = SimpleNamespace(userid="sender-user")
    recipient = SimpleNamespace(userid="recipient-user")

    _broadcast_message_events(conversation, message, sender, recipient)

    calls = group_send.call_args_list
    assert len(calls) == 3
    assert calls[0].args[0] == "conversation_conversation-123"
    assert calls[0].args[1]["type"] == "chat.message"
    assert calls[1].args[0] == "inbox_sender-user"
    assert calls[2].args[0] == "inbox_recipient-user"


def test_conversations_post_branches(api_factory, current_user, other_user):
    invalid_request = api_factory.post("/api/messages/conversations/", {"email": current_user.email}, format="json")
    invalid_response = conversations(invalid_request)
    assert invalid_response.status_code == status.HTTP_400_BAD_REQUEST

    missing_user_request = api_factory.post(
        "/api/messages/conversations/",
        {"email": current_user.email, "other_email": "missing@umass.edu"},
        format="json",
    )
    missing_user_response = conversations(missing_user_request)
    assert missing_user_response.status_code == status.HTTP_404_NOT_FOUND

    self_request = api_factory.post(
        "/api/messages/conversations/",
        {"email": current_user.email, "other_email": current_user.email},
        format="json",
    )
    self_response = conversations(self_request)
    assert self_response.status_code == status.HTTP_400_BAD_REQUEST
    assert self_response.data["error"] == "You cannot message yourself"

    success_request = api_factory.post(
        "/api/messages/conversations/",
        {"email": current_user.email, "other_email": other_user.email},
        format="json",
    )
    success_response = conversations(success_request)
    assert success_response.status_code == status.HTTP_201_CREATED
    assert success_response.data["conversation"]["participant"]["email"] == other_user.email


def test_send_listing_interest_message_branches(
    api_factory,
    current_user,
    other_user,
    listing_item,
    monkeypatch,
):
    monkeypatch.setattr(message_view, "_broadcast_message_events", lambda *args, **kwargs: None)

    invalid_request = api_factory.post(
        f"/api/messages/moveout/{listing_item.id}/",
        {"email": current_user.email, "body": ""},
        format="json",
    )
    invalid_response = send_listing_interest_message(invalid_request, listing_item.id)
    assert invalid_response.status_code == status.HTTP_400_BAD_REQUEST

    missing_user_request = api_factory.post(
        f"/api/messages/moveout/{listing_item.id}/",
        {"email": "missing@umass.edu", "body": "Hi"},
        format="json",
    )
    missing_user_response = send_listing_interest_message(missing_user_request, listing_item.id)
    assert missing_user_response.status_code == status.HTTP_404_NOT_FOUND

    missing_item_request = api_factory.post(
        "/api/messages/moveout/00000000-0000-0000-0000-000000000000/",
        {"email": current_user.email, "body": "Hi"},
        format="json",
    )
    missing_item_response = send_listing_interest_message(
        missing_item_request,
        "00000000-0000-0000-0000-000000000000",
    )
    assert missing_item_response.status_code == status.HTTP_404_NOT_FOUND

    own_item_request = api_factory.post(
        f"/api/messages/moveout/{listing_item.id}/",
        {"email": other_user.email, "body": "Hi"},
        format="json",
    )
    own_item_response = send_listing_interest_message(own_item_request, listing_item.id)
    assert own_item_response.status_code == status.HTTP_400_BAD_REQUEST

    success_request = api_factory.post(
        f"/api/messages/moveout/{listing_item.id}/",
        {"email": current_user.email, "body": "Interested in the lamp"},
        format="json",
    )
    success_response = send_listing_interest_message(success_request, listing_item.id)
    assert success_response.status_code == status.HTTP_201_CREATED
    assert success_response.data["conversation"]["participant"]["email"] == other_user.email
    assert success_response.data["message"]["body"] == "Interested in the lamp"


def test_send_roommate_interest_message_branches(api_factory, current_user, other_user, monkeypatch):
    monkeypatch.setattr(message_view, "_broadcast_message_events", lambda *args, **kwargs: None)

    missing_user_request = api_factory.post(
        f"/api/messages/roommates/{other_user.userid}/",
        {"email": "missing@umass.edu", "body": "Hi"},
        format="json",
    )
    missing_user_response = send_roommate_interest_message(missing_user_request, other_user.userid)
    assert missing_user_response.status_code == status.HTTP_404_NOT_FOUND

    missing_roommate_request = api_factory.post(
        "/api/messages/roommates/00000000-0000-0000-0000-000000000000/",
        {"email": current_user.email, "body": "Hi"},
        format="json",
    )
    missing_roommate_response = send_roommate_interest_message(
        missing_roommate_request,
        "00000000-0000-0000-0000-000000000000",
    )
    assert missing_roommate_response.status_code == status.HTTP_404_NOT_FOUND

    self_request = api_factory.post(
        f"/api/messages/roommates/{current_user.userid}/",
        {"email": current_user.email, "body": "Hi"},
        format="json",
    )
    self_response = send_roommate_interest_message(self_request, current_user.userid)
    assert self_response.status_code == status.HTTP_400_BAD_REQUEST

    success_request = api_factory.post(
        f"/api/messages/roommates/{other_user.userid}/",
        {"email": current_user.email, "body": "Want to compare housing plans?"},
        format="json",
    )
    success_response = send_roommate_interest_message(success_request, other_user.userid)
    assert success_response.status_code == status.HTTP_201_CREATED
    assert success_response.data["conversation"]["participant"]["email"] == other_user.email


def test_send_room_vacancy_interest_message_branches(
    api_factory,
    current_user,
    other_user,
    room_vacancy,
    monkeypatch,
):
    monkeypatch.setattr(message_view, "_broadcast_message_events", lambda *args, **kwargs: None)

    missing_vacancy_request = api_factory.post(
        "/api/messages/room-vacancies/00000000-0000-0000-0000-000000000000/",
        {"email": current_user.email, "body": "Hi"},
        format="json",
    )
    missing_vacancy_response = send_room_vacancy_interest_message(
        missing_vacancy_request,
        "00000000-0000-0000-0000-000000000000",
    )
    assert missing_vacancy_response.status_code == status.HTTP_404_NOT_FOUND

    own_vacancy_request = api_factory.post(
        f"/api/messages/room-vacancies/{room_vacancy.id}/",
        {"email": other_user.email, "body": "Hi"},
        format="json",
    )
    own_vacancy_response = send_room_vacancy_interest_message(own_vacancy_request, room_vacancy.id)
    assert own_vacancy_response.status_code == status.HTTP_400_BAD_REQUEST

    success_request = api_factory.post(
        f"/api/messages/room-vacancies/{room_vacancy.id}/",
        {"email": current_user.email, "body": "Is the room still available?"},
        format="json",
    )
    success_response = send_room_vacancy_interest_message(success_request, room_vacancy.id)
    assert success_response.status_code == status.HTTP_201_CREATED
    assert success_response.data["conversation"]["participant"]["email"] == other_user.email


def test_message_and_websocket_routes_are_registered():
    assert str(message_urlpatterns[0].pattern) == "conversations/"
    assert message_urlpatterns[0].callback == conversations
    assert str(message_urlpatterns[1].pattern) == "conversations/<uuid:conversation_id>/"
    assert message_urlpatterns[1].callback == message_view.conversation_detail
    assert str(websocket_urlpatterns[0].pattern) == "ws/messages/inbox/"
    assert str(websocket_urlpatterns[1].pattern) == "ws/messages/conversations/<uuid:conversation_id>/"
