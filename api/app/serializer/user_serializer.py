
from rest_framework import serializers

ALLOWED_EMAIL_DOMAINS = {
    "amherst.edu",
    "hampshire.edu",
    "mtholyoke.edu",
    "smith.edu",
    "umass.edu",
}


def _is_allowed_email(email):
    if "@" not in email:
        return False
    domain = email.split("@")[-1].lower().strip()
    return domain in ALLOWED_EMAIL_DOMAINS


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
        if not _is_allowed_email(value):
            raise serializers.ValidationError(
                "Email must be from the Five College Consortium"
            )
        return value


class LoginSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField()

    def validate_email(self, value):
        if not _is_allowed_email(value):
            raise serializers.ValidationError(
                "Email must be from the Five College Consortium"
            )
        return value


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

    def validate_email(self, value):
        if not _is_allowed_email(value):
            raise serializers.ValidationError(
                "Email must be from the Five College Consortium"
            )
        return value
