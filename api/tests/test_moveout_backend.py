"""
Unit tests for moveout sales backend workflow.
Tests cover: model creation, serialization, views, and service layer.
"""

import io
from decimal import Decimal

import pytest
from django.core.files.uploadedfile import SimpleUploadedFile
from rest_framework import status
from rest_framework.test import APIRequestFactory

from app.models.moveout_item import MoveoutItem
from app.serializer.moveout_serializer import (
    MoveoutItemSerializer,
    MoveoutItemResponseSerializer,
)
from app.service.moveout_service import MoveoutService
from app.view.moveout_view import (
    get_moveout_item_detail,
    get_moveout_items,
    post_moveout_item,
)

pytestmark = pytest.mark.django_db


@pytest.fixture
def api_factory():
    return APIRequestFactory()


@pytest.fixture
def test_user(user_factory):
    return user_factory(
        email="seller@umass.edu",
        first_name="John",
        last_name="Seller",
        campus="UMass Amherst",
    )


@pytest.fixture
def test_image():
    """Create a simple test image"""
    image_content = b"fake image content"
    return SimpleUploadedFile(
        name="test_image.jpg",
        content=image_content,
        content_type="image/jpeg",
    )


@pytest.fixture
def moveout_item_data(test_user, test_image):
    """Standard moveout item data for testing"""
    return {
        "owner_email": test_user.email,
        "title": "IKEA Desk and Chair Set",
        "description": "Used desk and chair from my college room. Good condition.",
        "category": "FURNITURE",
        "condition": "GOOD",
        "price": "125.50",
        "contact_email": test_user.email,
        "image": test_image,
    }


class TestMoveoutItemCreation:
    """Test: POST /auth/moveout/post-item/ - Create moveout item"""

    def test_post_moveout_item_success(self, api_factory, test_user, moveout_item_data):
        """Test successfully posting a moveout item"""
        request = api_factory.post("/auth/moveout/post-item/", moveout_item_data)
        response = post_moveout_item(request)

        assert response.status_code == status.HTTP_201_CREATED
        assert "item_id" in response.data
        assert response.data["message"] == "Moveout item posted successfully"

        # Verify item was created in database
        created_item = MoveoutItem.objects.get(id=response.data["item_id"])
        assert created_item.title == "IKEA Desk and Chair Set"
        assert created_item.owner == test_user
        assert created_item.price == Decimal("125.50")

    def test_post_moveout_item_invalid_owner_email(self, api_factory, test_image):
        """Test posting with non-college email"""
        invalid_data = {
            "owner_email": "outsider@gmail.com",
            "title": "Test Item",
            "description": "Test description",
            "category": "ELECTRONICS",
            "condition": "NEW",
            "price": "50.00",
            "contact_email": "outsider@gmail.com",
            "image": test_image,
        }
        request = api_factory.post("/auth/moveout/post-item/", invalid_data)
        response = post_moveout_item(request)

        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert "Owner email must be from the Five College Consortium" in str(
            response.data
        )

    def test_post_moveout_item_missing_required_fields(
        self, api_factory, test_user, test_image
    ):
        """Test posting with missing required fields"""
        incomplete_data = {
            "owner_email": test_user.email,
            "title": "Test Item",
            # Missing description
            "category": "FURNITURE",
            "condition": "GOOD",
            "price": "100.00",
            "contact_email": test_user.email,
            "image": test_image,
        }
        request = api_factory.post("/auth/moveout/post-item/", incomplete_data)
        response = post_moveout_item(request)

        assert response.status_code == status.HTTP_400_BAD_REQUEST

    def test_post_moveout_item_invalid_price(
        self, api_factory, test_user, test_image
    ):
        """Test posting with invalid price"""
        invalid_price_data = {
            "owner_email": test_user.email,
            "title": "Test Item",
            "description": "Test description",
            "category": "ELECTRONICS",
            "condition": "NEW",
            "price": "not_a_number",
            "contact_email": test_user.email,
            "image": test_image,
        }
        request = api_factory.post("/auth/moveout/post-item/", invalid_price_data)
        response = post_moveout_item(request)

        assert response.status_code == status.HTTP_400_BAD_REQUEST


class TestMoveoutItemRetrieval:
    """Test: GET /auth/moveout/ - Retrieve moveout items"""

    def test_get_moveout_items_empty(self, api_factory):
        """Test retrieving items when database is empty"""
        request = api_factory.get("/auth/moveout/")
        response = get_moveout_items(request)

        assert response.status_code == status.HTTP_200_OK
        assert response.data["count"] == 0
        assert response.data["items"] == []

    def test_get_moveout_items_returns_all_items(
        self, api_factory, test_user, moveout_item_data
    ):
        """Test retrieving all moveout items"""
        # Create 3 items
        for i in range(3):
            item_data = moveout_item_data.copy()
            item_data["title"] = f"Item {i+1}"
            MoveoutService.create_moveout_item(item_data)

        request = api_factory.get("/auth/moveout/")
        response = get_moveout_items(request)

        assert response.status_code == status.HTTP_200_OK
        assert response.data["count"] == 3
        assert len(response.data["items"]) == 3

    def test_get_moveout_items_includes_required_fields(
        self, api_factory, test_user, moveout_item_data
    ):
        """Test that response includes all required fields"""
        MoveoutService.create_moveout_item(moveout_item_data)

        request = api_factory.get("/auth/moveout/")
        response = get_moveout_items(request)

        assert response.status_code == status.HTTP_200_OK
        item = response.data["items"][0]

        # Verify all required fields are present
        assert "id" in item
        assert "title" in item
        assert "price" in item
        assert "category" in item
        assert "condition" in item
        assert "created_at" in item
        assert "owner" in item
        assert "location" in item


class TestMoveoutItemDetail:
    """Test: GET /auth/moveout/<item_id>/ - Retrieve specific item"""

    def test_get_moveout_item_detail_success(
        self, api_factory, test_user, moveout_item_data
    ):
        """Test retrieving specific moveout item"""
        result = MoveoutService.create_moveout_item(moveout_item_data)
        item_id = result["item_id"]

        request = api_factory.get(f"/auth/moveout/{item_id}/")
        response = get_moveout_item_detail(request, item_id)

        assert response.status_code == status.HTTP_200_OK
        assert response.data["title"] == "IKEA Desk and Chair Set"
        assert response.data["price"] == "125.50"
        assert response.data["owner"]["firstName"] == "John"

    def test_get_moveout_item_detail_not_found(self, api_factory):
        """Test retrieving non-existent item returns 404"""
        fake_id = "00000000-0000-0000-0000-000000000000"
        request = api_factory.get(f"/auth/moveout/{fake_id}/")
        response = get_moveout_item_detail(request, fake_id)

        assert response.status_code == status.HTTP_404_NOT_FOUND
        assert "Moveout item not found" in response.data["error"]


class TestMoveoutItemOrdering:
    """Test: Item ordering and listing"""

    def test_moveout_items_ordered_reverse_chronological(
        self, api_factory, test_user, moveout_item_data
    ):
        """Test that newest items appear first"""
        # Create items with slight delay to ensure different timestamps
        for i in range(3):
            item_data = moveout_item_data.copy()
            item_data["title"] = f"Item {i+1}"
            MoveoutService.create_moveout_item(item_data)

        request = api_factory.get("/auth/moveout/")
        response = get_moveout_items(request)

        items = response.data["items"]
        # Items should be ordered reverse chronologically (newest first)
        assert items[0]["title"] == "Item 3"
        assert items[1]["title"] == "Item 2"
        assert items[2]["title"] == "Item 1"


class TestMoveoutItemCategories:
    """Test: Item categories validation"""

    @pytest.mark.parametrize(
        "category", ["FURNITURE", "ELECTRONICS", "TEXTBOOKS", "APPLIANCES", "OTHER"]
    )
    def test_all_category_options_valid(
        self, api_factory, test_user, test_image, category
    ):
        """Test all category options are accepted"""
        data = {
            "owner_email": test_user.email,
            "title": f"Test {category}",
            "description": "Description",
            "category": category,
            "condition": "NEW",
            "price": "50.00",
            "contact_email": test_user.email,
            "image": test_image,
        }
        result = MoveoutService.create_moveout_item(data)
        assert "error" not in result
        assert "item_id" in result
