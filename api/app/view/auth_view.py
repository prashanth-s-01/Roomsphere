# accounts/views/auth_views.py

from rest_framework.decorators import api_view
from rest_framework.response import Response

from app.serializer.user_serializer import SignupSerializer, LoginSerializer, ProfileUpdateSerializer
from app.service.user_service import UserService


@api_view(["POST"])
def signup(request):
    """
    View = Entry point from React
    """

    serializer = SignupSerializer(data=request.data)

    if serializer.is_valid():
        result = UserService.signup_user(serializer.validated_data)
        return Response(result)

    return Response(serializer.errors)


@api_view(["POST"])
def login(request):
    """
    Login endpoint
    """

    serializer = LoginSerializer(data=request.data)

    if serializer.is_valid():
        data = serializer.validated_data
        result = UserService.login_user(data["email"], data["password"])
        return Response(result)

    return Response(serializer.errors)


@api_view(["POST"])
def update_profile(request):
    """
    Update user preferences from React
    """

    serializer = ProfileUpdateSerializer(data=request.data)

    if serializer.is_valid():
        result = UserService.update_profile(serializer.validated_data)
        return Response(result)

    return Response(serializer.errors)
