from rest_framework import status
from rest_framework.decorators import api_view, parser_classes
from rest_framework.parsers import FormParser, MultiPartParser
from rest_framework.response import Response

from app.serializer.room_vacancy_serializer import (
    RoomVacancyDeleteSerializer,
    RoomVacancyResponseSerializer,
    RoomVacancySerializer,
)
from app.service.room_vacancy_service import RoomVacancyService


@api_view(["POST"])
@parser_classes([MultiPartParser, FormParser])
def post_room_vacancy(request):
    serializer = RoomVacancySerializer(data=request.data)
    if serializer.is_valid():
        result = RoomVacancyService.create_room_vacancy(serializer.validated_data)
        if "error" in result:
            return Response(result, status=status.HTTP_400_BAD_REQUEST)
        return Response(result, status=status.HTTP_201_CREATED)

    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(["GET"])
def get_room_vacancies(request):
    try:
        items = RoomVacancyService.get_all_room_vacancies()
        serializer = RoomVacancyResponseSerializer(items, many=True)
        return Response(
            {
                "items": serializer.data,
                "count": len(serializer.data),
            },
            status=status.HTTP_200_OK,
        )
    except Exception as exc:
        return Response(
            {"error": str(exc)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )


@api_view(["GET", "DELETE"])
def get_room_vacancy_detail(request, vacancy_id):
    if request.method == "DELETE":
        serializer = RoomVacancyDeleteSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        result, status_code = RoomVacancyService.delete_room_vacancy(
            vacancy_id,
            serializer.validated_data["email"],
        )
        return Response(result, status=status_code)

    try:
        vacancy = RoomVacancyService.get_room_vacancy_by_id(vacancy_id)
        if not vacancy:
            return Response(
                {"error": "Room vacancy not found"},
                status=status.HTTP_404_NOT_FOUND,
            )
        serializer = RoomVacancyResponseSerializer(vacancy)
        return Response(serializer.data, status=status.HTTP_200_OK)
    except Exception as exc:
        return Response(
            {"error": str(exc)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )
