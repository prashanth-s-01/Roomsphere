import uuid

from django.db import models

from .users import User


class RoomVacancy(models.Model):
    LEASE_DURATION_CHOICES = [
        ("MONTH_TO_MONTH", "Month to Month"),
        ("3_MONTHS", "3 Months"),
        ("6_MONTHS", "6 Months"),
        ("12_MONTHS", "12 Months"),
        ("12_PLUS", "12+ Months"),
    ]

    GENDER_PREFERENCE_CHOICES = User.GENDER_CHOICES + [("ANY", "No Preference")]

    HOUSING_TYPE_CHOICES = [
        ("APARTMENT", "Apartment"),
        ("HOUSE", "House"),
        ("STUDIO", "Studio"),
        ("DORM", "Dorm / Campus Housing"),
        ("OTHER", "Other"),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    owner = models.ForeignKey(User, on_delete=models.CASCADE, related_name="room_vacancies")
    title = models.CharField(max_length=255)
    description = models.TextField()
    location = models.CharField(max_length=255)
    housing_type = models.CharField(max_length=32, choices=HOUSING_TYPE_CHOICES)
    rent = models.DecimalField(max_digits=10, decimal_places=2)
    available_from = models.DateField()
    lease_duration = models.CharField(max_length=20, choices=LEASE_DURATION_CHOICES)
    total_rooms = models.PositiveIntegerField()
    gender_preference = models.CharField(
        max_length=20,
        choices=GENDER_PREFERENCE_CHOICES,
        default="ANY",
    )
    contact_email = models.EmailField()
    image_data = models.BinaryField(null=True, blank=True)
    image_filename = models.CharField(max_length=255, blank=True)
    image_content_type = models.CharField(max_length=64, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.title} ({self.location})"
