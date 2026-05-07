from rest_framework import serializers

from app.models.users import User


class RoommateQuerySerializer(serializers.Serializer):
    email = serializers.EmailField(required=False)
    campus = serializers.CharField(required=False, allow_blank=True)
    gender = serializers.ChoiceField(choices=User.GENDER_CHOICES, required=False)
    smoking_preference = serializers.ChoiceField(
        choices=User.SMOKING_CHOICES,
        required=False,
    )
    max_budget = serializers.IntegerField(required=False, min_value=0)
    search = serializers.CharField(required=False, allow_blank=True)


class RoommateDetailQuerySerializer(serializers.Serializer):
    email = serializers.EmailField(required=False)

