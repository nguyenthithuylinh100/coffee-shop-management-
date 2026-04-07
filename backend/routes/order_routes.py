from flask import Blueprint, request, jsonify, g
from services import order_service
from middleware.auth_middleware import require_roles

order_bp = Blueprint('orders', __name__)

@order_bp.route('', methods=['POST'])
@require_roles('Cashier')
def create_order():
    data = request.get_json()
    if not data or not data.get('table_id') or not data.get('items'):
        return jsonify({'error': 'table_id and items are required'}), 400

    employee_id = g.user.get('employee_id')
    if employee_id is None:
        return jsonify({'error': 'Invalid token payload'}), 401

    result, err = order_service.create_order(
        table_id=data['table_id'],
        items=data['items'],
        employee_id=employee_id,
    )
    if err:
        return jsonify({'error': err}), 400
    return jsonify(result), 201


@order_bp.route('/preparing', methods=['GET'])
@require_roles('Barista')
def get_preparing():
    orders = order_service.get_preparing_orders()
    return jsonify(orders), 200


@order_bp.route('/<int:order_id>/complete', methods=['PUT'])
@require_roles('Barista')
def complete_order(order_id):
    result, err = order_service.complete_order(order_id)
    if err:
        return jsonify({'error': err}), 400
    return jsonify(result), 200
