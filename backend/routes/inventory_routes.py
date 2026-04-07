from flask import Blueprint, request, jsonify
from services import inventory_service
from middleware.auth_middleware import require_roles

inventory_bp = Blueprint('inventory', __name__)

@inventory_bp.route('', methods=['GET'])
@require_roles('Manager')
def get_inventory():
    return jsonify(inventory_service.get_all_inventory()), 200

@inventory_bp.route('/alerts', methods=['GET'])
@require_roles('Manager')
def low_stock_alerts():
    return jsonify(inventory_service.get_low_stock_alerts()), 200

@inventory_bp.route('', methods=['POST'])
@require_roles('Manager')
def create_inventory():
    data = request.get_json()
    if not data:
        return jsonify({'error': 'Request body is required'}), 400
    if data.get('ingredient_name') in (None, '') or data.get('quantity') is None:
        return jsonify({'error': 'ingredient_name and quantity are required'}), 400

    result, err = inventory_service.create_inventory(
        ingredient_name=data['ingredient_name'],
        quantity=data['quantity'],
        unit=data.get('unit', ''),
        min_quantity=data.get('min_quantity', 0),
    )
    if err:
        return jsonify({'error': err}), 400
    return jsonify(result), 201

@inventory_bp.route('/<int:inventory_id>', methods=['PUT'])
@require_roles('Manager')
def update_inventory(inventory_id):
    data = request.get_json()
    if not data or data.get('quantity') is None:
        return jsonify({'error': 'quantity is required'}), 400

    result, err = inventory_service.update_inventory(inventory_id, data['quantity'])
    if err:
        return jsonify({'error': err}), 400
    return jsonify(result), 200
