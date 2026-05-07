import logging

from app.dao.user_dao import UserDAO
from app.models.moveout_item import MoveoutItem

logger = logging.getLogger(__name__)


class MoveoutService:
    @staticmethod
    def create_moveout_item(data):
        logger.debug('create_moveout_item called', {'owner_email': data.get('owner_email'), 'title': data.get('title')})
        owner = UserDAO.get_user_by_email(data['owner_email'])
        if not owner:
            error = {'error': 'Owner email does not match a registered user'}
            logger.warning('moveout item creation failed: owner not found', error)
            return error

        file_obj = data['image']
        image_bytes = file_obj.read() if hasattr(file_obj, 'read') else None

        moveout_item = MoveoutItem(
            owner=owner,
            title=data['title'],
            description=data['description'],
            category=data['category'],
            condition=data['condition'],
            price=data['price'],
            contact_email=data['contact_email'],
            image_data=image_bytes,
            image_filename=getattr(file_obj, 'name', ''),
            image_content_type=getattr(file_obj, 'content_type', ''),
        )
        moveout_item.save()
        logger.info('moveout item created', {'item_id': str(moveout_item.id), 'owner_id': owner.id})

        return {
            'message': 'Moveout item posted successfully',
            'item_id': str(moveout_item.id),
        }

    @staticmethod
    def get_all_moveout_items():
        """Retrieve all moveout items from the database"""
        logger.debug('get_all_moveout_items called')
        items = MoveoutItem.objects.all()
        logger.debug('retrieved moveout items', {'count': items.count()})
        return items

    @staticmethod
    def get_moveout_item_by_id(item_id):
        """Retrieve a specific moveout item by ID"""
        logger.debug('get_moveout_item_by_id called', {'item_id': item_id})
        try:
            item = MoveoutItem.objects.get(id=item_id)
            logger.debug('moveout item found', {'item_id': item_id})
            return item
        except MoveoutItem.DoesNotExist:
            logger.warning('moveout item not found', {'item_id': item_id})
            return None
