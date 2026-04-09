
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


class ProfileUpdateSerializer(serializers.Serializer):
    email = serializers.EmailField()
    campus = serializers.CharField(required=False, allow_blank=True)
    budget_min = serializers.IntegerField(required=False, min_value=0)
    budget_max = serializers.IntegerField(required=False, min_value=0)
    smoking_preference = serializers.ChoiceField(
        choices=[('YES', 'Smoker'), ('NO', 'Non-Smoker'), ('OCC', 'Occasional')],
        required=False
    )
    drinking_preference = serializers.ChoiceField(
        choices=[('NEVER', 'Never'), ('SOCIALLY', 'Socially'), ('REGULARLY', 'Regularly')],
        required=False
    )
    sleep_schedule = serializers.ChoiceField(
        choices=[('EARLY_BIRD', 'Early Bird (Before 10 PM)'),
                 ('NIGHT_OWL', 'Night Owl (After 12 AM)'),
                 ('FLEXIBLE', 'Flexible / In-between')],
        required=False
    )
    gender_preference = serializers.ChoiceField(
        choices=[
            ('MALE', 'Male'),
            ('FEMALE', 'Female'),
            ('NON_BINARY', 'Non-Binary'),
            ('OTHER', 'Other'),
            ('PREFER_NOT_SAY', 'Prefer not to say'),
            ('ANY', 'No Preference'),
        ],
        required=False
    )
