import uuid
from django.db import models
from .users import User
from .listing import Listing


class ListingRequest(models.Model):
    STATUS_CHOICES = [
        ('PENDING', 'Pending'),
        ('ACCEPTED', 'Accepted'),
        ('REJECTED', 'Rejected'),
        ('WITHDRAWN', 'Withdrawn'),
    ]

    id         = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    sender     = models.ForeignKey(User, on_delete=models.CASCADE, related_name='sent_requests')
    listing    = models.ForeignKey(Listing, on_delete=models.CASCADE, related_name='requests')
    status     = models.CharField(max_length=20, choices=STATUS_CHOICES, default='PENDING')
    message    = models.TextField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ('sender', 'listing')

    def __str__(self):
        return f"{self.sender.email} -> {self.listing.title} ({self.status})"
