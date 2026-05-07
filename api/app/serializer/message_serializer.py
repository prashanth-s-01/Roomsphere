from rest_framework import serializers


class InboxQuerySerializer(serializers.Serializer):
    email = serializers.EmailField()
    search = serializers.CharField(required=False, allow_blank=True)


class ConversationCreateSerializer(serializers.Serializer):
    email = serializers.EmailField()
    other_email = serializers.EmailField()


class SendMessageSerializer(serializers.Serializer):
    email = serializers.EmailField()
    body = serializers.CharField(allow_blank=False, trim_whitespace=True)


class ListingInterestMessageSerializer(serializers.Serializer):
    email = serializers.EmailField()
    body = serializers.CharField(allow_blank=False, trim_whitespace=True)