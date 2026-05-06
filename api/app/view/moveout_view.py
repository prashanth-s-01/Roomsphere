from rest_framework.decorators import api_view, parser_classes
from rest_framework.parsers import FormParser, MultiPartParser
from rest_framework.response import Response
from rest_framework import status

from app.serializer.moveout_serializer import MoveoutItemSerializer, MoveoutItemResponseSerializer
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


@api_view(['GET'])
def get_moveout_items(request):
    """Retrieve all moveout items"""
    try:
        items = MoveoutService.get_all_moveout_items()
        serializer = MoveoutItemResponseSerializer(items, many=True)
        return Response({
            'items': serializer.data,
            'count': len(serializer.data)
        }, status=status.HTTP_200_OK)
    except Exception as e:
        return Response(
            {'error': str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['GET'])
def get_moveout_item_detail(request, item_id):
    """Retrieve a specific moveout item by ID"""
    try:
        item = MoveoutService.get_moveout_item_by_id(item_id)
        if not item:
            return Response(
                {'error': 'Moveout item not found'},
                status=status.HTTP_404_NOT_FOUND
            )
        serializer = MoveoutItemResponseSerializer(item)
        return Response(serializer.data, status=status.HTTP_200_OK)
    except Exception as e:
        return Response(
            {'error': str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )
