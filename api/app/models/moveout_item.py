import uuid
from django.db import models
from .users import User


class MoveoutItem(models.Model):
    CATEGORY_CHOICES = [
        ('FURNITURE', 'Furniture'),
        ('ELECTRONICS', 'Electronics'),
        ('TEXTBOOKS', 'Textbooks'),
        ('APPLIANCES', 'Appliances'),
        ('OTHER', 'Other'),
    ]

    CONDITION_CHOICES = [
        ('NEW', 'New'),
        ('GOOD', 'Good'),
        ('FAIR', 'Fair'),
        ('USED', 'Used'),
        ('DAMAGED', 'Damaged'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    owner = models.ForeignKey(User, on_delete=models.CASCADE, related_name='moveout_items')
    title = models.CharField(max_length=255)
    description = models.TextField()
    category = models.CharField(max_length=32, choices=CATEGORY_CHOICES)
    condition = models.CharField(max_length=16, choices=CONDITION_CHOICES)
    price = models.DecimalField(max_digits=10, decimal_places=2)
    contact_email = models.EmailField()
    image_data = models.BinaryField(null=True, blank=True)
    image_filename = models.CharField(max_length=255, blank=True)
    image_content_type = models.CharField(max_length=64, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.title} ({self.category})"
