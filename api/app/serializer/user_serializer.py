
from rest_framework import serializers


class SignupSerializer(serializers.Serializer):
    """
    Serializer = Validation layer
    - checks empty fields
    - checks format (email, etc.)
    """

    first_name = serializers.CharField()
    last_name = serializers.CharField()
    email = serializers.EmailField()
    dob = serializers.DateField()
    password = serializers.CharField(write_only=True)
    campus = serializers.CharField()
    phone_number = serializers.CharField(required=False, allow_blank=True)
    gender = serializers.ChoiceField(choices=[
        ('MALE', 'Male'),
        ('FEMALE', 'Female'),
        ('NON_BINARY', 'Non-Binary'),
        ('OTHER', 'Other'),
        ('PREFER_NOT_SAY', 'Prefer not to say'),
    ], default='PREFER_NOT_SAY')

    def validate_email(self, value):
        # basic validation hook
        if "@" not in value:
            raise serializers.ValidationError("Invalid email")
        return value


class LoginSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField()