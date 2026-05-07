import logging

from rest_framework.decorators import api_view, parser_classes
from rest_framework.parsers import FormParser, MultiPartParser
from rest_framework.response import Response
from rest_framework import status

from app.serializer.moveout_serializer import MoveoutItemSerializer, MoveoutItemResponseSerializer
from app.service.moveout_service import MoveoutService

logger = logging.getLogger(__name__)


@api_view(['POST'])
@parser_classes([MultiPartParser, FormParser])
def post_moveout_item(request):
    logger.debug('post_moveout_item called', {'user': getattr(request, 'user', None)})
    serializer = MoveoutItemSerializer(data=request.data)
    if serializer.is_valid():
        logger.debug('moveout item serializer valid', serializer.validated_data)
        result = MoveoutService.create_moveout_item(serializer.validated_data)
        if 'error' in result:
            logger.warning('moveout item creation failed', result)
            return Response(result, status=status.HTTP_400_BAD_REQUEST)
        logger.info('moveout item created successfully', {'item_id': result.get('item_id')})
        return Response(result, status=status.HTTP_201_CREATED)

    logger.warning('moveout item serializer invalid', serializer.errors)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET'])
def get_moveout_items(request):
    """Retrieve all moveout items"""
    logger.debug('get_moveout_items called')
    try:
        items = MoveoutService.get_all_moveout_items()
        serializer = MoveoutItemResponseSerializer(items, many=True)
        logger.debug('retrieved moveout items', {'count': len(serializer.data)})
        return Response({
            'items': serializer.data,
            'count': len(serializer.data)
        }, status=status.HTTP_200_OK)
    except Exception as e:
        logger.exception('failed to retrieve moveout items')
        return Response(
            {'error': str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['GET'])
def get_moveout_item_detail(request, item_id):
    """Retrieve a specific moveout item by ID"""
    logger.debug('get_moveout_item_detail called', {'item_id': item_id})
    try:
        item = MoveoutService.get_moveout_item_by_id(item_id)
        if not item:
            logger.warning('moveout item not found', {'item_id': item_id})
            return Response(
                {'error': 'Moveout item not found'},
                status=status.HTTP_404_NOT_FOUND
            )
        serializer = MoveoutItemResponseSerializer(item)
        logger.debug('moveout item detail retrieved', {'item_id': item_id})
        return Response(serializer.data, status=status.HTTP_200_OK)
    except Exception as e:
        logger.exception('failed to retrieve moveout item detail')
        return Response(
            {'error': str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )
