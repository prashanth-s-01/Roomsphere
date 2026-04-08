
from app.models.users import User


class UserDAO:
    """
    Data Access Layer:
    ONLY responsible for database operations (queries).
    """


    @staticmethod
    def get_user_by_email(email):
        # Fetch single user by email
        return User.objects.filter(email=email).first()


