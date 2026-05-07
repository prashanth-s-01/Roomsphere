from __future__ import annotations

from django.db.models import Q

from app.dao.user_dao import UserDAO
from app.models.users import User


class RoommateService:
    @staticmethod
    def _display_name(user: User) -> str:
        return f"{user.first_name} {user.last_name}".strip()

    @staticmethod
    def _initials(user: User) -> str:
        parts = [part[0] for part in [user.first_name, user.last_name] if part]
        if parts:
            return "".join(parts).upper()
        return user.email[:2].upper()

    @staticmethod
    def _budget_overlap(current_user: User, other_user: User) -> bool:
        if current_user.budget_max <= 0 or other_user.budget_max <= 0:
            return False
        return max(current_user.budget_min, other_user.budget_min) <= min(
            current_user.budget_max,
            other_user.budget_max,
        )

    @staticmethod
    def _move_in_window_match(current_user: User, other_user: User) -> bool:
        if not current_user.move_in_date or not other_user.move_in_date:
            return False
        return abs((current_user.move_in_date - other_user.move_in_date).days) <= 45

    @staticmethod
    def _compatibility(current_user: User | None, other_user: User):
        if current_user is None:
            return None, []

        score = 0
        max_score = 0
        reasons: list[str] = []

        def add_rule(weight: int, matched: bool, reason: str):
            nonlocal score, max_score
            max_score += weight
            if matched:
                score += weight
                reasons.append(reason)

        add_rule(
            15,
            bool(current_user.campus and current_user.campus == other_user.campus),
            "Attends the same campus",
        )
        add_rule(
            20,
            RoommateService._budget_overlap(current_user, other_user),
            "Budget ranges overlap well",
        )
        add_rule(
            15,
            current_user.smoking_preference == other_user.smoking_preference,
            "Similar smoking preference",
        )
        add_rule(
            10,
            current_user.drinking_preference == other_user.drinking_preference,
            "Similar social habits",
        )
        add_rule(
            10,
            current_user.sleep_schedule == other_user.sleep_schedule,
            "Compatible sleep schedule",
        )
        add_rule(
            15,
            current_user.gender_preference in {"ANY", other_user.gender},
            "Matches your gender preference",
        )
        add_rule(
            15,
            other_user.gender_preference in {"ANY", current_user.gender},
            "You match their gender preference",
        )
        add_rule(
            10,
            RoommateService._move_in_window_match(current_user, other_user),
            "Move-in timing is aligned",
        )

        normalized = round((score / max_score) * 100) if max_score else None
        return normalized, reasons[:4]

    @staticmethod
    def _match_label(score: int | None) -> str:
        if score is None:
            return "Explore profile"
        if score >= 80:
            return "Great match"
        if score >= 60:
            return "Strong match"
        if score >= 40:
            return "Possible fit"
        return "Worth a look"

    @staticmethod
    def _serialize_roommate(user: User, current_user: User | None):
        score, reasons = RoommateService._compatibility(current_user, user)
        return {
            "userid": str(user.userid),
            "first_name": user.first_name,
            "last_name": user.last_name,
            "display_name": RoommateService._display_name(user),
            "initials": RoommateService._initials(user),
            "email": user.email,
            "campus": user.campus,
            "bio": user.bio or "",
            "phone_number": user.phone_number or "",
            "budget_min": user.budget_min,
            "budget_max": user.budget_max,
            "smoking_preference": user.smoking_preference,
            "drinking_preference": user.drinking_preference,
            "sleep_schedule": user.sleep_schedule,
            "gender": user.gender,
            "gender_preference": user.gender_preference,
            "move_in_date": user.move_in_date.isoformat() if user.move_in_date else None,
            "compatibility_score": score,
            "match_label": RoommateService._match_label(score),
            "match_reasons": reasons,
        }

    @staticmethod
    def list_roommates(filters: dict):
        current_user = UserDAO.get_user_by_email(filters.get("email"))

        queryset = User.objects.all()
        if current_user:
            queryset = queryset.exclude(userid=current_user.userid)

        campus = (filters.get("campus") or "").strip()
        if campus:
            queryset = queryset.filter(campus__iexact=campus)

        gender = filters.get("gender")
        if gender:
            queryset = queryset.filter(gender=gender)

        smoking_preference = filters.get("smoking_preference")
        if smoking_preference:
            queryset = queryset.filter(smoking_preference=smoking_preference)

        max_budget = filters.get("max_budget")
        if max_budget is not None:
            queryset = queryset.filter(Q(budget_min__lte=max_budget) | Q(budget_min=0))

        search = (filters.get("search") or "").strip()
        if search:
            queryset = queryset.filter(
                Q(first_name__icontains=search)
                | Q(last_name__icontains=search)
                | Q(email__icontains=search)
                | Q(campus__icontains=search)
                | Q(bio__icontains=search)
            )

        items = [
            RoommateService._serialize_roommate(user, current_user)
            for user in queryset.order_by("campus", "first_name", "last_name")
        ]
        items.sort(
            key=lambda item: (
                item["compatibility_score"] is None,
                -(item["compatibility_score"] or 0),
                item["display_name"].lower(),
            )
        )
        return items

    @staticmethod
    def get_roommate_detail(user_id: str, email: str | None = None):
        current_user = UserDAO.get_user_by_email(email)
        queryset = User.objects.filter(userid=user_id)
        if current_user:
            queryset = queryset.exclude(userid=current_user.userid)
        user = queryset.first()
        if not user:
            return None
        return RoommateService._serialize_roommate(user, current_user)
