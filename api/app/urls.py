from django.urls import path
from app.view.auth_view import signup, login, update_profile
from app.view.moveout_view import post_moveout_item

urlpatterns = [
    path("signup/", signup),
    path("login/", login),
    path("profile/", update_profile),
    path("moveout/post-item/", post_moveout_item),
]
