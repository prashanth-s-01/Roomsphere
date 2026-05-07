import base64

from rest_framework import serializers

from app.models.room_vacancy import RoomVacancy
from app.serializer.user_serializer import _is_allowed_email


class RoomVacancySerializer(serializers.Serializer):
    owner_email = serializers.EmailField()
    title = serializers.CharField(max_length=255)
    description = serializers.CharField()
    location = serializers.CharField(max_length=255)
    housing_type = serializers.ChoiceField(choices=RoomVacancy.HOUSING_TYPE_CHOICES)
    rent = serializers.DecimalField(max_digits=10, decimal_places=2)
    available_from = serializers.DateField()
    lease_duration = serializers.ChoiceField(choices=RoomVacancy.LEASE_DURATION_CHOICES)
    total_rooms = serializers.IntegerField(min_value=1)
    gender_preference = serializers.ChoiceField(choices=RoomVacancy.GENDER_PREFERENCE_CHOICES)
    contact_email = serializers.EmailField()
    image = serializers.FileField()

    def validate_owner_email(self, value):
        if not _is_allowed_email(value):
            raise serializers.ValidationError(
                "Owner email must be from the Five College Consortium"
            )
        return value

    def validate_contact_email(self, value):
        if not _is_allowed_email(value):
            raise serializers.ValidationError(
                "Contact email must be from the Five College Consortium"
            )
        return value


class RoomVacancyResponseSerializer(serializers.Serializer):
    id = serializers.CharField()
    title = serializers.CharField()
    description = serializers.CharField()
    location = serializers.CharField()
    housing_type = serializers.CharField()
    rent = serializers.DecimalField(max_digits=10, decimal_places=2)
    available_from = serializers.DateField()
    lease_duration = serializers.CharField()
    total_rooms = serializers.IntegerField()
    gender_preference = serializers.CharField()
    contact_email = serializers.EmailField()
    image_url = serializers.SerializerMethodField()
    created_at = serializers.DateTimeField()
    owner = serializers.SerializerMethodField()

    def get_image_url(self, obj):
        if obj.image_data:
            encoded = base64.b64encode(obj.image_data).decode("utf-8")
            return f"data:{obj.image_content_type};base64,{encoded}"
        return None

    def get_owner(self, obj):
        return {
            "firstName": obj.owner.first_name,
            "lastName": obj.owner.last_name,
            "email": obj.owner.email,
        }


class RoomVacancyDeleteSerializer(serializers.Serializer):
    email = serializers.EmailField()

    def validate_email(self, value):
        if not _is_allowed_email(value):
            raise serializers.ValidationError(
                "Email must be from the Five College Consortium"
            )
        return value
