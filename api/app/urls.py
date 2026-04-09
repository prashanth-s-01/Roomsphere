from django.urls import path
from app.view.auth_view import signup, login, update_profile

urlpatterns = [
    path("signup/", signup),
    path("login/", login),
    path("profile/", update_profile),
]
