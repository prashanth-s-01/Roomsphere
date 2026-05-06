from app.dao.user_dao import UserDAO
from app.models.moveout_item import MoveoutItem


class MoveoutService:
    @staticmethod
    def create_moveout_item(data):
        owner = UserDAO.get_user_by_email(data['owner_email'])
        if not owner:
            return {'error': 'Owner email does not match a registered user'}

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

        return {
            'message': 'Moveout item posted successfully',
            'item_id': str(moveout_item.id),
        }

    @staticmethod
    def get_all_moveout_items():
        """Retrieve all moveout items from the database"""
        items = MoveoutItem.objects.all()
        return items

    @staticmethod
    def get_moveout_item_by_id(item_id):
        """Retrieve a specific moveout item by ID"""
        try:
            return MoveoutItem.objects.get(id=item_id)
        except MoveoutItem.DoesNotExist:
            return None
