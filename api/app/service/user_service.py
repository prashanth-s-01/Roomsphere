
from app.dao.user_dao import UserDAO
from app.models.users import User


class UserService:
    """
    Business Logic Layer:
    Handles rules like password hashing, login validation, etc.
    """

    @staticmethod
    def signup_user(data):
        """
        Handles signup logic:
        - check if user exists
        - hash password
        - create user
        """

        # check if email already exists
        existing = UserDAO.get_user_by_email(data["email"])
        if existing:
            return {"error": "User already exists"}

        # create user object
        user = User(
            first_name=data["first_name"],
            last_name=data["last_name"],
            email=data["email"],
            dob=data["dob"],
            password=data["password"],  
            campus=data["campus"],
            phone_number=data.get("phone_number"),  # optional safe access
            gender=data.get("gender", "PREFER_NOT_SAY")  # fallback default
        )

        # IMPORTANT: use your model method
        user.set_password(data["password"])
        user.save()

        return {"message": "User created successfully"}

    @staticmethod
    def login_user(email, password):
        """
        Login logic:
        - find user
        - verify password
        """

        user = UserDAO.get_user_by_email(email)

        if not user or not user.check_password(password):
            return {"error": "Invalid username or password"}

        return {"message": "Login successful"}

    @staticmethod
    def update_profile(data):
        """
        Update profile preferences for a user.
        """

        user = UserDAO.get_user_by_email(data["email"])

        if not user:
            return {"error": "User not found"}

        fields = [
            "campus",
            "budget_min",
            "budget_max",
            "smoking_preference",
            "drinking_preference",
            "sleep_schedule",
            "gender_preference",
        ]

        for field in fields:
            if field in data:
                setattr(user, field, data[field])

        user.save()

        return {"message": "Profile updated successfully"}
