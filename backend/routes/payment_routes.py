from flask import Blueprint, request, jsonify
from services import payment_service
from middleware.auth_middleware import require_roles

payment_bp = Blueprint('payment', __name__)


@payment_bp.route('/bills/unpaid', methods=['GET'])
@require_roles('Cashier')
def unpaid_bills():
    return jsonify(payment_service.get_unpaid_bills()), 200


@payment_bp.route('/bills/history', methods=['GET'])
@require_roles('Manager')
def bill_history():
    """UC10: Lịch sử bill đã thanh toán theo khoảng ngày"""
    from_date = request.args.get('from')
    to_date   = request.args.get('to')
    if not from_date or not to_date:
        return jsonify({'error': 'Cần truyền tham số from và to (YYYY-MM-DD)'}), 400
    result, err = payment_service.get_bill_history(from_date, to_date)
    if err:
        return jsonify({'error': err}), 400
    return jsonify(result), 200


@payment_bp.route('/bills/<int:bill_id>', methods=['GET'])
@require_roles('Cashier')
def bill_detail(bill_id):
    result, err = payment_service.get_bill_detail(bill_id)
    if err:
        return jsonify({'error': err}), 404
    return jsonify(result), 200


@payment_bp.route('', methods=['POST'])
@require_roles('Cashier')
def process_payment():
    data = request.get_json()
    if not data or not data.get('bill_id') or not data.get('payment_method'):
        return jsonify({'error': 'Cần bill_id và payment_method'}), 400

    result, err = payment_service.process_payment(
        bill_id        = data['bill_id'],
        payment_method = data['payment_method'],
        amount_received= data.get('amount_received'),
    )
    if err:
        return jsonify({'error': err}), 400
    return jsonify(result), 200


@payment_bp.route('/bills/<int:bill_id>/failed', methods=['PUT'])
@require_roles('Cashier')
def mark_failed(bill_id):
    """Ghi nhận thanh toán thất bại (không đổi nghiệp vụ, chỉ log)"""
    result, err = payment_service.mark_payment_failed(bill_id)
    if err:
        return jsonify({'error': err}), 400
    return jsonify(result), 200
