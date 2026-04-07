from flask import Blueprint, request, jsonify
from database.db import db
from models.menu_item import MenuItem
from middleware.auth_middleware import require_auth, require_roles

menu_bp = Blueprint('menu', __name__)

@menu_bp.route('', methods=['GET'])
@require_auth
def get_available_menu():
    items = MenuItem.query.filter_by(isAvailable=True).all()
    return jsonify([i.to_dict() for i in items]), 200

@menu_bp.route('/all', methods=['GET'])
@require_roles('Manager')
def get_all_menu():
    items = MenuItem.query.all()
    return jsonify([i.to_dict() for i in items]), 200

@menu_bp.route('', methods=['POST'])
@require_roles('Manager')
def create_menu_item():
    data = request.get_json()
    if not data:
        return jsonify({'error': 'Request body is required'}), 400
    if data.get('name') in (None, '') or data.get('price') is None:
        return jsonify({'error': 'name and price are required'}), 400

    item = MenuItem(
        nameMenuItem = data['name'],
        price        = data['price'],
        category     = data.get('category', ''),
        isAvailable  = data.get('is_available', True),
    )
    db.session.add(item)
    db.session.commit()
    return jsonify(item.to_dict()), 201

@menu_bp.route('/<int:item_id>', methods=['PUT'])
@require_roles('Manager')
def update_menu_item(item_id):
    item = MenuItem.query.get_or_404(item_id)
    data = request.get_json()
    if not data:
        return jsonify({'error': 'Request body is required'}), 400

    if 'name'         in data: item.nameMenuItem = data['name']
    if 'price'        in data: item.price        = data['price']
    if 'category'     in data: item.category     = data['category']
    if 'is_available' in data: item.isAvailable  = data['is_available']
    db.session.commit()
    return jsonify(item.to_dict()), 200

@menu_bp.route('/<int:item_id>', methods=['DELETE'])
@require_roles('Manager')
def delete_menu_item(item_id):
    item = MenuItem.query.get_or_404(item_id)
    db.session.delete(item)
    db.session.commit()
    return jsonify({'message': 'Deleted'}), 200
