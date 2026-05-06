from rest_framework.decorators import api_view, parser_classes
from rest_framework.parsers import FormParser, MultiPartParser
from rest_framework.response import Response
from rest_framework import status

from app.serializer.moveout_serializer import MoveoutItemSerializer
from app.service.moveout_service import MoveoutService


@api_view(['POST'])
@parser_classes([MultiPartParser, FormParser])
def post_moveout_item(request):
    serializer = MoveoutItemSerializer(data=request.data)
    if serializer.is_valid():
        result = MoveoutService.create_moveout_item(serializer.validated_data)
        if 'error' in result:
            return Response(result, status=status.HTTP_400_BAD_REQUEST)
        return Response(result, status=status.HTTP_201_CREATED)

    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
