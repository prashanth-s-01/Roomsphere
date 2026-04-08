import uuid
from django.db import models
from .users import User


class Conversation(models.Model):
    id           = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    participant1 = models.ForeignKey(User, on_delete=models.CASCADE, related_name='conversations_as_p1')
    participant2 = models.ForeignKey(User, on_delete=models.CASCADE, related_name='conversations_as_p2')
    created_at   = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('participant1', 'participant2')

    def save(self, *args, **kwargs):
        if self.participant1_id and self.participant2_id and self.participant1_id > self.participant2_id:
            self.participant1_id, self.participant2_id = self.participant2_id, self.participant1_id
        super().save(*args, **kwargs)

    @classmethod
    def get_or_create_conversation(cls, user1, user2):
        p1, p2 = sorted([user1, user2], key=lambda u: u.pk)
        conversation, created = cls.objects.get_or_create(
            participant1=p1,
            participant2=p2
        )
        return conversation

    def __str__(self):
        return f"Conversation between {self.participant1} and {self.participant2}"