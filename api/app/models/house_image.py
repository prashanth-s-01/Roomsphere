import uuid
from django.db import models
from .house_listing import HouseListing


class HouseListingImage(models.Model):
    id          = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    listing     = models.ForeignKey(HouseListing, on_delete=models.CASCADE, related_name='images')
    image       = models.ImageField(upload_to='house_listings/')
    is_primary  = models.BooleanField(default=False)
    uploaded_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Image for {self.listing.title}"
