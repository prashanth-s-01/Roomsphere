import uuid
from django.db import models
from django.contrib.auth.hashers import make_password, check_password


class User(models.Model):
    # Choices for smoking preference
    SMOKING_CHOICES = [('YES', 'Smoker'), ('NO', 'Non-Smoker'), ('OCC', 'Occasional')]

    # Gender Choices
    GENDER_CHOICES = [
        ('MALE', 'Male'),
        ('FEMALE', 'Female'),
        ('NON_BINARY', 'Non-Binary'),
        ('OTHER', 'Other'),
        ('PREFER_NOT_SAY', 'Prefer not to say'),
    ]

    # Drinking Choices
    DRINKING_CHOICES = [
        ('NEVER', 'Never'),
        ('SOCIALLY', 'Socially'),
        ('REGULARLY', 'Regularly'),
    ]

    # Sleep Schedule Choices
    SLEEP_CHOICES = [
        ('EARLY_BIRD', 'Early Bird (Before 10 PM)'),
        ('NIGHT_OWL', 'Night Owl (After 12 AM)'),
        ('FLEXIBLE', 'Flexible / In-between'),
    ]

    # Preference Logic (For who they want to live with)
    GENDER_PREF_CHOICES = GENDER_CHOICES + [('ANY', 'No Preference')]

    userid = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    
    # Strictly required fields
    first_name = models.CharField(max_length=100)
    last_name = models.CharField(max_length=100)
    email = models.EmailField(unique=True, db_index=True)
    dob = models.DateField()
    password = models.CharField(max_length=255) # Stores the hash
    
    # Optional fields (nullable)
    phone_number = models.CharField(max_length=20, blank=True, null=True)
    bio = models.TextField(blank=True, null=True)
    move_in_date = models.DateField(null=True, blank=True) # DateField is often better than DateTime for simple dates
    
    # Data with defaults/choices
    campus = models.CharField(max_length=255, db_index=True)
    budget_min = models.PositiveIntegerField(default=0)
    budget_max = models.PositiveIntegerField(default=0)
    
    # Preferences with strict choices
    smoking_preference = models.CharField(
        max_length=3, 
        choices=SMOKING_CHOICES, 
        default='NO'
    )

    # Personal Identity
    gender = models.CharField(
        max_length=20, 
        choices=GENDER_CHOICES, 
        default='PREFER_NOT_SAY'
    )

    # Lifestyle Habits
    drinking_preference = models.CharField(
        max_length=20, 
        choices=DRINKING_CHOICES, 
        default='SOCIALLY'
    )

    sleep_schedule = models.CharField(
        max_length=20, 
        choices=SLEEP_CHOICES, 
        default='FLEXIBLE'
    )

    # Matching Preference
    gender_preference = models.CharField(
        max_length=20, 
        choices=GENDER_PREF_CHOICES, 
        default='ANY'
    )

    def __str__(self):
        return f"{self.first_name} {self.last_name} ({self.userid})"

    # Manual hashing helper
    def set_password(self, raw_password):
        self.password = make_password(raw_password)

    # Manual verification helper
    def check_password(self, raw_password):
        return check_password(raw_password, self.password)
