from datetime import date

import pytest

from app.models.converstation import Conversation
from app.models.message import Message
from app.models.users import User


@pytest.fixture
def user_factory():
    def create_user(
        *,
        email,
        first_name,
        last_name,
        campus="UMass Amherst",
        budget_min=500,
        budget_max=1200,
    ):
        user = User.objects.create(
            first_name=first_name,
            last_name=last_name,
            email=email,
            dob=date(2000, 1, 1),
            password="temporary",
            campus=campus,
            budget_min=budget_min,
            budget_max=budget_max,
        )
        user.set_password("password123")
        user.save(update_fields=["password"])
        return user

    return create_user


@pytest.fixture
def conversation_factory():
    def create_conversation(user1, user2):
        return Conversation.objects.create(participant1=user1, participant2=user2)

    return create_conversation


@pytest.fixture
def message_factory():
    def create_message(*, conversation, sender, body, is_read=False):
        return Message.objects.create(
            conversation=conversation,
            sender=sender,
            body=body,
            is_read=is_read,
        )

    return create_message
