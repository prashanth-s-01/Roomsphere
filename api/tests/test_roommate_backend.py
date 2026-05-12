from datetime import date, timedelta

import pytest
from rest_framework import status
from rest_framework.test import APIRequestFactory

from app.models.room_vacancy import RoomVacancy
from app.service.roommate_service import RoommateService
from app.view.roommate_view import get_roommate_detail, get_roommates

pytestmark = pytest.mark.django_db


@pytest.fixture
def api_factory():
    return APIRequestFactory()


@pytest.fixture
def vacancy_factory():
    def create_vacancy(*, owner, title=None, location=None, rent="900.00"):
        return RoomVacancy.objects.create(
            owner=owner,
            title=title or f"Room from {owner.first_name}",
            description="Sunny room near campus",
            location=location or owner.campus,
            housing_type="APARTMENT",
            rent=rent,
            available_from=date(2026, 8, 1),
            lease_duration="12_MONTHS",
            total_rooms=3,
            gender_preference="ANY",
            contact_email=owner.email,
        )

    return create_vacancy


@pytest.fixture
def current_user(user_factory):
    return user_factory(
        email="current@umass.edu",
        first_name="Casey",
        last_name="Current",
        campus="UMass Amherst",
        budget_min=700,
        budget_max=1200,
    )


@pytest.fixture
def strong_match(user_factory):
    user = user_factory(
        email="alex@umass.edu",
        first_name="Alex",
        last_name="Match",
        campus="UMass Amherst",
        budget_min=800,
        budget_max=1100,
    )
    user.smoking_preference = "NO"
    user.drinking_preference = "SOCIALLY"
    user.sleep_schedule = "FLEXIBLE"
    user.gender = "FEMALE"
    user.gender_preference = "ANY"
    user.move_in_date = date.today() + timedelta(days=20)
    user.bio = "Quiet and organized roommate looking for a calm apartment."
    user.save()
    return user


@pytest.fixture
def weaker_match(user_factory):
    user = user_factory(
        email="jamie@smith.edu",
        first_name="Jamie",
        last_name="Different",
        campus="Smith College",
        budget_min=1400,
        budget_max=1800,
    )
    user.smoking_preference = "YES"
    user.drinking_preference = "REGULARLY"
    user.sleep_schedule = "NIGHT_OWL"
    user.gender = "MALE"
    user.gender_preference = "MALE"
    user.move_in_date = date.today() + timedelta(days=120)
    user.bio = "Outgoing and loves late nights."
    user.save()
    return user


@pytest.fixture
def no_vacancy_user(user_factory):
    return user_factory(
        email="hidden@hampshire.edu",
        first_name="Hidden",
        last_name="Profile",
        campus="Hampshire College",
        budget_min=600,
        budget_max=900,
    )


@pytest.fixture(autouse=True)
def align_current_user(current_user):
    current_user.smoking_preference = "NO"
    current_user.drinking_preference = "SOCIALLY"
    current_user.sleep_schedule = "FLEXIBLE"
    current_user.gender = "FEMALE"
    current_user.gender_preference = "ANY"
    current_user.move_in_date = date.today()
    current_user.bio = "Looking for a tidy, quiet roommate."
    current_user.save()


def test_list_roommates_returns_only_vacancy_owners_sorted_by_compatibility(
    current_user,
    strong_match,
    weaker_match,
    no_vacancy_user,
    vacancy_factory,
):
    vacancy_factory(owner=current_user)
    vacancy_factory(owner=strong_match)
    vacancy_factory(owner=weaker_match)

    profiles = RoommateService.list_roommates({"email": current_user.email})

    assert [profile["email"] for profile in profiles] == [strong_match.email, weaker_match.email]
    assert all(profile["email"] != no_vacancy_user.email for profile in profiles)
    assert all(profile["email"] != current_user.email for profile in profiles)
    assert profiles[0]["compatibility_score"] > profiles[1]["compatibility_score"]
    assert "Attends the same campus" in profiles[0]["match_reasons"]
    assert profiles[0]["match_label"] == "Great match"


def test_list_roommates_applies_filters_and_search(
    current_user,
    strong_match,
    weaker_match,
    vacancy_factory,
):
    vacancy_factory(owner=strong_match)
    vacancy_factory(owner=weaker_match)

    profiles = RoommateService.list_roommates(
        {
            "email": current_user.email,
            "campus": "UMass Amherst",
            "smoking_preference": "NO",
            "max_budget": 950,
            "search": "quiet",
        }
    )

    assert len(profiles) == 1
    assert profiles[0]["email"] == strong_match.email
    assert profiles[0]["compatibility_score"] is not None


def test_get_roommate_detail_requires_public_vacancy_and_hides_current_user(
    current_user,
    strong_match,
    no_vacancy_user,
    vacancy_factory,
):
    vacancy_factory(owner=strong_match)

    visible_profile = RoommateService.get_roommate_detail(strong_match.userid, current_user.email)
    hidden_profile = RoommateService.get_roommate_detail(str(no_vacancy_user.userid), current_user.email)
    own_profile = RoommateService.get_roommate_detail(str(current_user.userid), current_user.email)

    assert visible_profile is not None
    assert visible_profile["email"] == strong_match.email
    assert hidden_profile is None
    assert own_profile is None


def test_roommate_views_validate_queries_and_return_expected_payloads(
    api_factory,
    current_user,
    strong_match,
    vacancy_factory,
):
    vacancy_factory(owner=strong_match)

    invalid_request = api_factory.get("/api/auth/roommates/", {"max_budget": -1})
    invalid_response = get_roommates(invalid_request)
    assert invalid_response.status_code == status.HTTP_400_BAD_REQUEST

    list_request = api_factory.get("/api/auth/roommates/", {"email": current_user.email})
    list_response = get_roommates(list_request)
    assert list_response.status_code == status.HTTP_200_OK
    assert list_response.data["count"] == 1
    assert list_response.data["profiles"][0]["email"] == strong_match.email

    detail_request = api_factory.get(
        f"/api/auth/roommates/{strong_match.userid}/",
        {"email": current_user.email},
    )
    detail_response = get_roommate_detail(detail_request, strong_match.userid)
    assert detail_response.status_code == status.HTTP_200_OK
    assert detail_response.data["display_name"] == "Alex Match"

    missing_request = api_factory.get(
        "/api/auth/roommates/00000000-0000-0000-0000-000000000000/",
        {"email": current_user.email},
    )
    missing_response = get_roommate_detail(
        missing_request,
        "00000000-0000-0000-0000-000000000000",
    )
    assert missing_response.status_code == status.HTTP_404_NOT_FOUND
