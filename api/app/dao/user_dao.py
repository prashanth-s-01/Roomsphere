
from app.models.users import User


class UserDAO:
    """
    Data Access Layer:
    ONLY responsible for database operations (queries).
    """


    @staticmethod
    def get_user_by_email(email):
        # Fetch single user by email (case-insensitive, trimmed)
        normalized_email = (email or "").strip()
        if not normalized_email:
            return None
        return User.objects.filter(email__iexact=normalized_email).first()


