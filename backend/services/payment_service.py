from database.db import db
from models.bill  import Bill
from models.table import Table
from datetime import datetime


def get_unpaid_bills():
    """Danh sách Bill Unpaid kèm chi tiết orders"""
    bills = (
        Bill.query
        .filter_by(status='Unpaid')
        .order_by(Bill.createdAt.asc())
        .all()
    )
    return [b.to_dict(include_orders=True) for b in bills]


def get_bill_detail(bill_id: int):
    bill = Bill.query.get(bill_id)
    if not bill:
        return None, 'Không tìm thấy bill'
    return bill.to_dict(include_orders=True), None


def get_bill_history(from_date: str, to_date: str):
    """UC10 – Lịch sử bill đã thanh toán theo khoảng ngày"""
    try:
        from datetime import date
        start = date.fromisoformat(from_date)
        end   = date.fromisoformat(to_date)
    except ValueError:
        return None, 'Định dạng ngày không hợp lệ (YYYY-MM-DD)'

    bills = (
        Bill.query
        .filter(
            Bill.status == 'Paid',
            db.cast(Bill.paymentDate, db.Date) >= start,
            db.cast(Bill.paymentDate, db.Date) <= end,
        )
        .order_by(Bill.paymentDate.desc())
        .all()
    )
    return [b.to_dict(include_orders=True) for b in bills], None


def process_payment(bill_id: int, payment_method: str, amount_received: float = None):
    """
    UC5 – Thanh toán bill.

    FIX: Cập nhật table.status = 'Available' trực tiếp trong Python
    (không phụ thuộc trigger SQL) để đảm bảo hoạt động cả SQLite và SQL Server.
    """
    bill = Bill.query.get(bill_id)
    if not bill:
        return None, 'Không tìm thấy bill'
    if bill.status == 'Paid':
        return None, 'Bill này đã được thanh toán'
    if bill.status == 'Failed':
        # Cho phép thử lại sau khi Failed
        pass

    # Business rule: only allow payment when all related orders are completed.
    incomplete_orders = [o.orderID for o in bill.orders if o.status != 'Completed']
    if incomplete_orders:
        return None, (
            'Chưa thể thanh toán: còn order đang pha chế '
            f"(#{', #'.join(str(i) for i in incomplete_orders)})."
        )

    # Map tên phương thức từ frontend sang DB value
    method_map = {
        'Cash':    'Cash',
        'QR':      'E-wallet',
        'Card':    'Card',
        'E-wallet':'E-wallet',
    }

    bill.status      = 'Paid'
    bill.method      = method_map.get(payment_method, payment_method)
    # Save local payment time so UI does not appear offset.
    bill.paymentDate = datetime.now()

    # FIX: Cập nhật trạng thái bàn ngay trong Python
    table = Table.query.get(bill.tableID)
    if table:
        table.status = 'Available'

    # Tính tiền thối (chỉ có với tiền mặt)
    change = 0.0
    if payment_method == 'Cash' and amount_received:
        change = round(float(amount_received) - float(bill.amount), 0)

    try:
        db.session.commit()
        result = bill.to_dict()
        result['change'] = change
        return result, None
    except Exception as e:
        db.session.rollback()
        return None, str(e)


def mark_payment_failed(bill_id: int):
    """
    Ghi nhận lần thanh toán thất bại (thẻ từ chối, lỗi POS...).
    Bill vẫn Unpaid về nghiệp vụ nhưng ghi log Failed.
    """
    bill = Bill.query.get(bill_id)
    if not bill or bill.status == 'Paid':
        return None, 'Không hợp lệ'
    bill.status = 'Failed'
    try:
        db.session.commit()
        return bill.to_dict(), None
    except Exception as e:
        db.session.rollback()
        return None, str(e)
