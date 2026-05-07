from app.dao.user_dao import UserDAO
from app.models.room_vacancy import RoomVacancy


class RoomVacancyService:
    @staticmethod
    def create_room_vacancy(data):
        owner = UserDAO.get_user_by_email(data["owner_email"])
        if not owner:
            return {"error": "Owner email does not match a registered user"}

        file_obj = data["image"]
        image_bytes = file_obj.read() if hasattr(file_obj, "read") else None

        vacancy = RoomVacancy(
            owner=owner,
            title=data["title"],
            description=data["description"],
            location=data["location"],
            housing_type=data["housing_type"],
            rent=data["rent"],
            available_from=data["available_from"],
            lease_duration=data["lease_duration"],
            total_rooms=data["total_rooms"],
            gender_preference=data["gender_preference"],
            contact_email=data["contact_email"],
            image_data=image_bytes,
            image_filename=getattr(file_obj, "name", ""),
            image_content_type=getattr(file_obj, "content_type", ""),
        )
        vacancy.save()

        return {
            "message": "Room vacancy posted successfully",
            "vacancy_id": str(vacancy.id),
        }

    @staticmethod
    def get_all_room_vacancies():
        return RoomVacancy.objects.select_related("owner").all()

    @staticmethod
    def get_room_vacancy_by_id(vacancy_id):
        try:
            return RoomVacancy.objects.select_related("owner").get(id=vacancy_id)
        except RoomVacancy.DoesNotExist:
            return None

    @staticmethod
    def delete_room_vacancy(vacancy_id, email):
        vacancy = RoomVacancyService.get_room_vacancy_by_id(vacancy_id)
        if not vacancy:
            return {"error": "Room vacancy not found"}, 404

        requester = UserDAO.get_user_by_email(email)
        if not requester:
            return {"error": "User not found"}, 404

        if vacancy.owner_id != requester.userid:
            return {"error": "You can only delete your own room vacancy"}, 403

        vacancy.delete()
        return {"message": "Room vacancy deleted successfully"}, 200
