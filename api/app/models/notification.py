import uuid
from django.db import models
from .users import User
from .request import ListingRequest


class Notification(models.Model):
    NOTIFICATION_TYPES = [
        ('REQUEST_RECEIVED', 'Request Received'),
        ('REQUEST_ACCEPTED', 'Request Accepted'),
        ('REQUEST_REJECTED', 'Request Rejected'),
        ('REQUEST_WITHDRAWN', 'Request Withdrawn'),
    ]

    id              = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    recipient       = models.ForeignKey(User, on_delete=models.CASCADE, related_name='notifications')
    request         = models.ForeignKey(ListingRequest, on_delete=models.CASCADE, related_name='notifications')
    notification_type = models.CharField(max_length=20, choices=NOTIFICATION_TYPES)
    is_read         = models.BooleanField(default=False)
    created_at      = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['recipient', '-created_at']),
            models.Index(fields=['is_read']),
        ]

    def __str__(self):
        return f"Notification for {self.recipient.email} - {self.notification_type}"
