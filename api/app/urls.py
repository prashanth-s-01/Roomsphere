from django.urls import path
from app.view.auth_view import signup, login, update_profile
from app.view.moveout_view import post_moveout_item, get_moveout_items, get_moveout_item_detail
from app.view.roommate_view import get_roommates, get_roommate_detail
from app.view.room_vacancy_view import (
    post_room_vacancy,
    get_room_vacancies,
    get_room_vacancy_detail,
)

urlpatterns = [
    path("signup/", signup),
    path("login/", login),
    path("profile/", update_profile),
    path("roommates/", get_roommates),
    path("roommates/<uuid:user_id>/", get_roommate_detail),
    path("room-vacancies/post-item/", post_room_vacancy),
    path("room-vacancies/", get_room_vacancies),
    path("room-vacancies/<uuid:vacancy_id>/", get_room_vacancy_detail),
    path("moveout/post-item/", post_moveout_item),
    path("moveout/", get_moveout_items),
    path("moveout/<str:item_id>/", get_moveout_item_detail),
]
