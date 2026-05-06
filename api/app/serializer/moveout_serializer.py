from rest_framework import serializers
from app.models.moveout_item import MoveoutItem
from app.serializer.user_serializer import _is_allowed_email
import base64


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


class MoveoutItemResponseSerializer(serializers.Serializer):
    """Serializer for returning moveout item details"""
    id = serializers.CharField()
    title = serializers.CharField()
    description = serializers.CharField()
    category = serializers.CharField()
    condition = serializers.CharField()
    price = serializers.DecimalField(max_digits=10, decimal_places=2)
    contact_email = serializers.EmailField()
    image_url = serializers.SerializerMethodField()
    created_at = serializers.DateTimeField()
    owner = serializers.SerializerMethodField()
    location = serializers.SerializerMethodField()

    def get_image_url(self, obj):
        if obj.image_data:
            return f"data:{obj.image_content_type};base64,{base64.b64encode(obj.image_data).decode('utf-8')}"
        return None

    def get_owner(self, obj):
        return {
            'firstName': obj.owner.first_name,
            'lastName': obj.owner.last_name,
        }

    def get_location(self, obj):
        return obj.owner.campus or 'Unknown'
