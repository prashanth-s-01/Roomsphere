from django.urls import path
from app.view.auth_view import signup, login

urlpatterns = [
    path("signup/", signup),
    path("login/", login),
]