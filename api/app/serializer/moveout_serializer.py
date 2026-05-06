from rest_framework import serializers
from app.models.moveout_item import MoveoutItem
from app.serializer.user_serializer import _is_allowed_email


class MoveoutItemSerializer(serializers.Serializer):
    owner_email = serializers.EmailField()
    title = serializers.CharField(max_length=255)
    description = serializers.CharField()
    category = serializers.ChoiceField(choices=MoveoutItem.CATEGORY_CHOICES)
    condition = serializers.ChoiceField(choices=MoveoutItem.CONDITION_CHOICES)
    price = serializers.DecimalField(max_digits=10, decimal_places=2)
    contact_email = serializers.EmailField()
    image = serializers.FileField()

    def validate_owner_email(self, value):
        if not _is_allowed_email(value):
            raise serializers.ValidationError(
                'Owner email must be from the Five College Consortium'
            )
        return value

    def validate_contact_email(self, value):
        if not _is_allowed_email(value):
            raise serializers.ValidationError(
                'Contact email must be from the Five College Consortium'
            )
        return value
