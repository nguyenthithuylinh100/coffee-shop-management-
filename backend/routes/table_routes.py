from flask import Blueprint, request, jsonify
from database.db import db
from models.table import Table
from middleware.auth_middleware import require_auth, require_roles

table_bp = Blueprint('tables', __name__)

@table_bp.route('', methods=['GET'])
@require_auth
def get_tables():
    tables = Table.query.order_by(Table.tableNumber).all()
    return jsonify([t.to_dict() for t in tables]), 200

@table_bp.route('', methods=['POST'])
@require_roles('Manager')
def create_table():
    data = request.get_json()
    if not data or data.get('table_number') is None:
        return jsonify({'error': 'table_number is required'}), 400

    table = Table(tableNumber=data['table_number'])
    db.session.add(table)
    db.session.commit()
    return jsonify(table.to_dict()), 201

@table_bp.route('/<int:table_id>', methods=['DELETE'])
@require_roles('Manager')
def delete_table(table_id):
    table = Table.query.get_or_404(table_id)
    db.session.delete(table)
    db.session.commit()
    return jsonify({'message': 'Deleted'}), 200
