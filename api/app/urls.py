from django.urls import path
from app.view.auth_view import signup, login, update_profile
from app.view.moveout_view import post_moveout_item, get_moveout_items, get_moveout_item_detail

urlpatterns = [
    path("signup/", signup),
    path("login/", login),
    path("profile/", update_profile),
    path("moveout/post-item/", post_moveout_item),
    path("moveout/", get_moveout_items),
    path("moveout/<str:item_id>/", get_moveout_item_detail),
]
