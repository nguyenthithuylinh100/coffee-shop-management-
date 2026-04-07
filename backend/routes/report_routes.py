from flask import Blueprint, request, jsonify, g
from database.db import db
from models.report import Report
from models.bill   import Bill
from models.order  import Order
from middleware.auth_middleware import require_roles
from datetime import date

report_bp = Blueprint('reports', __name__)

@report_bp.route('', methods=['GET'])
@require_roles('Manager')
def get_reports():
    reports = Report.query.order_by(Report.createdAt.desc()).all()
    return jsonify([r.to_dict() for r in reports]), 200

@report_bp.route('', methods=['POST'])
@require_roles('Manager')
def generate_report():
    data  = request.get_json()
    if not data:
        return jsonify({'error': 'Request body is required'}), 400
    if not data.get('period_start') or not data.get('period_end'):
        return jsonify({'error': 'period_start and period_end are required'}), 400

    try:
        start = date.fromisoformat(data['period_start'])
        end = date.fromisoformat(data['period_end'])
    except ValueError:
        return jsonify({'error': 'period_start and period_end must be ISO date format (YYYY-MM-DD)'}), 400

    if start > end:
        return jsonify({'error': 'period_start must be before or equal to period_end'}), 400

    employee_id = g.user.get('employee_id')
    if employee_id is None:
        return jsonify({'error': 'Invalid token payload'}), 401

    paid_bills = Bill.query.filter(
        Bill.status == 'Paid',
        Bill.paymentDate >= start,
        Bill.paymentDate <= end,
    ).all()

    total_revenue = sum(float(b.amount) for b in paid_bills)
    total_orders  = sum(len(b.orders) for b in paid_bills)

    report = Report(
        typeReport   = data.get('type_report', f'{start} - {end}'),
        fromDate     = start,
        toDate       = end,
        totalRevenue = total_revenue,
        totalOrders  = total_orders,
        generatedBy  = employee_id,
    )
    db.session.add(report)
    db.session.commit()
    return jsonify(report.to_dict()), 201

@report_bp.route('/summary', methods=['GET'])
@require_roles('Manager')
def daily_summary():
    today = date.today()
    paid_today = Bill.query.filter(
        Bill.status == 'Paid',
        db.func.date(Bill.paymentDate) == today,
    ).all()
    orders_today = Order.query.filter(
        db.func.date(Order.orderDate) == today
    ).count()
    return jsonify({
        'date':             today.isoformat(),
        'revenue_today':    sum(float(b.amount) for b in paid_today),
        'bills_paid_today': len(paid_today),
        'orders_today':     orders_today,
    }), 200
