from datetime import timedelta

import pytest
from django.utils import timezone
from rest_framework import status
from rest_framework.test import APIRequestFactory

from app.models.message import Message
from app.service.message_service import MessageService
from app.view.message_view import conversation_detail, conversations

pytestmark = pytest.mark.django_db


@pytest.fixture
def api_factory():
    return APIRequestFactory()


@pytest.fixture
def alice(user_factory):
    return user_factory(
        email="alice@umass.edu",
        first_name="Alice",
        last_name="Anderson",
        campus="UMass Amherst",
    )


@pytest.fixture
def bob(user_factory):
    return user_factory(
        email="bob@umass.edu",
        first_name="Bob",
        last_name="Brown",
        campus="Amherst College",
    )


@pytest.fixture
def carol(user_factory):
    return user_factory(
        email="carol@umass.edu",
        first_name="Carol",
        last_name="Clark",
        campus="Smith College",
    )


@pytest.fixture
def outsider(user_factory):
    return user_factory(
        email="outsider@umass.edu",
        first_name="Out",
        last_name="Sider",
        campus="Hampshire College",
    )


@pytest.fixture
def alice_bob_thread(conversation_factory, message_factory, alice, bob):
    conversation = conversation_factory(alice, bob)
    older_message = message_factory(conversation=conversation, sender=bob, body="Need a sublet?")
    Message.objects.filter(id=older_message.id).update(created_at=timezone.now() - timedelta(days=1))
    return conversation


@pytest.fixture
def alice_carol_thread(conversation_factory, message_factory, alice, carol):
    conversation = conversation_factory(alice, carol)
    newer_message = message_factory(conversation=conversation, sender=carol, body="Fresh thread")
    Message.objects.filter(id=newer_message.id).update(created_at=timezone.now())
    return conversation


@pytest.fixture
def alice_bob_with_thread(conversation_factory, message_factory, alice, bob):
    conversation = conversation_factory(alice, bob)
    incoming = message_factory(conversation=conversation, sender=bob, body="Incoming message")
    outgoing = message_factory(conversation=conversation, sender=alice, body="Outgoing message")
    now = timezone.now()
    Message.objects.filter(id=incoming.id).update(created_at=now - timedelta(minutes=2))
    Message.objects.filter(id=outgoing.id).update(created_at=now - timedelta(minutes=1))
    return conversation


def test_list_conversations_returns_only_participant_threads_and_orders_by_recent_activity(alice, bob, carol, alice_bob_thread, alice_carol_thread):
    items = MessageService.list_conversations(alice)

    assert [item["participant"]["email"] for item in items] == [carol.email, bob.email]
    assert items[0]["preview"] == "Fresh thread"
    assert items[1]["preview"] == "Need a sublet?"


def test_list_conversations_search_filters_by_name_and_preview(alice, alice_bob_thread, alice_carol_thread):
    by_preview = MessageService.list_conversations(alice, search="fresh")
    by_name = MessageService.list_conversations(alice, search="bob")

    assert len(by_preview) == 1
    assert by_preview[0]["participant"]["email"] == "carol@umass.edu"
    assert len(by_name) == 1
    assert by_name[0]["participant"]["email"] == "bob@umass.edu"


def test_get_conversation_for_user_returns_conversation_for_participant(alice, alice_bob_thread):
    conversation = MessageService.get_conversation_for_user(alice_bob_thread.id, alice)

    assert conversation.id == alice_bob_thread.id


def test_get_conversation_for_user_rejects_outsider(alice_bob_thread, outsider):
    conversation = MessageService.get_conversation_for_user(alice_bob_thread.id, outsider)

    assert conversation is None


def test_build_thread_payload_marks_incoming_messages_read(alice, alice_bob_with_thread):
    payload = MessageService.build_thread_payload(alice_bob_with_thread, alice)

    stored_messages = list(alice_bob_with_thread.messages.order_by("created_at"))
    stored_messages[0].refresh_from_db()
    stored_messages[1].refresh_from_db()

    assert stored_messages[0].is_read is True
    assert stored_messages[1].is_read is False
    assert payload["messages"][0]["body"] == "Incoming message"
    assert payload["messages"][0]["is_current_user"] is False
    assert payload["messages"][1]["body"] == "Outgoing message"
    assert payload["messages"][1]["is_current_user"] is True


def test_message_views_return_snapshots_and_create_messages(api_factory, alice, bob, alice_bob_with_thread, outsider):
    get_request = api_factory.get("/api/messages/conversations/", {"email": alice.email})
    get_response = conversations(get_request)

    assert get_response.status_code == status.HTTP_200_OK
    assert get_response.data["current_user"]["email"] == alice.email
    assert len(get_response.data["conversations"]) == 1

    detail_get_request = api_factory.get(
        f"/api/messages/conversations/{alice_bob_with_thread.id}/",
        {"email": outsider.email},
    )
    detail_get_response = conversation_detail(detail_get_request, alice_bob_with_thread.id)

    assert detail_get_response.status_code == status.HTTP_404_NOT_FOUND

    post_request = api_factory.post(
        f"/api/messages/conversations/{alice_bob_with_thread.id}/",
        {"email": alice.email, "body": "Hello Bob"},
        format="json",
    )
    post_response = conversation_detail(post_request, alice_bob_with_thread.id)

    assert post_response.status_code == status.HTTP_201_CREATED
    assert post_response.data["message"]["body"] == "Hello Bob"
    assert post_response.data["message"]["is_current_user"] is True
    assert Message.objects.filter(conversation=alice_bob_with_thread, body="Hello Bob").exists()
