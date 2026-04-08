from django.db import models
from .listing import Listing


class HouseListing(Listing):
    GENDER_CHOICES = [
        ('MALE', 'Male'),
        ('FEMALE', 'Female'),
        ('NON_BINARY', 'Non-Binary'),
        ('OTHER', 'Other'),
        ('PREFER_NOT_SAY', 'Prefer not to say'),
    ]

    LEASE_DURATION_CHOICES = [
        ('month_to_month', 'Month to Month'),
        ('3_months', '3 Months'),
        ('6_months', '6 Months'),
        ('12_months', '12 Months'),
        ('12_months_plus', '12+ Months'),
    ]

    rent              = models.DecimalField(max_digits=10, decimal_places=2)
    available_from    = models.DateTimeField()
    lease_duration    = models.CharField(max_length=20, choices=LEASE_DURATION_CHOICES)
    total_rooms       = models.PositiveIntegerField()
    gender_preference = models.CharField(max_length=20, choices=GENDER_CHOICES, default='any')

    def __str__(self):
        return f"{self.title} - {self.location}"
