from rest_framework import status
from rest_framework.decorators import api_view
from rest_framework.response import Response

from app.serializer.roommate_serializer import (
    RoommateDetailQuerySerializer,
    RoommateQuerySerializer,
)
from app.service.roommate_service import RoommateService


@api_view(["GET"])
def get_roommates(request):
    serializer = RoommateQuerySerializer(data=request.query_params)
    if not serializer.is_valid():
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    try:
        profiles = RoommateService.list_roommates(serializer.validated_data)
        return Response(
            {
                "profiles": profiles,
                "count": len(profiles),
            },
            status=status.HTTP_200_OK,
        )
    except Exception as exc:
        return Response(
            {"error": str(exc)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )


@api_view(["GET"])
def get_roommate_detail(request, user_id):
    serializer = RoommateDetailQuerySerializer(data=request.query_params)
    if not serializer.is_valid():
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    try:
        profile = RoommateService.get_roommate_detail(
            user_id,
            serializer.validated_data.get("email"),
        )
        if not profile:
            return Response(
                {"error": "Roommate profile not found"},
                status=status.HTTP_404_NOT_FOUND,
            )
        return Response(profile, status=status.HTTP_200_OK)
    except Exception as exc:
        return Response(
            {"error": str(exc)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )
