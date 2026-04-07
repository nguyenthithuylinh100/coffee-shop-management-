from database.db import db
from models.order      import Order
from models.order_item import OrderItem
from models.bill       import Bill
from models.table      import Table
from models.menu_item  import MenuItem
from models.inventory  import Inventory, MenuItemIngredient
from datetime import datetime


def create_order(table_id: int, items: list, employee_id: int):
    """
    UC2 – Create Order

    Logic bàn/bill:
    - Bàn Available  → tạo Bill mới → set bàn = Occupied (trong Python, không phụ thuộc trigger)
    - Bàn Occupied   → tìm Bill Unpaid hiện tại → link Order mới vào đó
    - Không dùng trigger để cập nhật trạng thái bàn vì môi trường dev có thể dùng SQLite
    """
    # 1. Validate table
    table = Table.query.filter_by(tableID=table_id).first()
    if not table:
        return None, 'Không tìm thấy bàn'
    if not items:
        return None, 'Order phải có ít nhất 1 món'

    # 2. Validate menu items
    resolved_items = []
    for item_data in items:
        menu_item = MenuItem.query.get(item_data['menu_item_id'])
        if not menu_item:
            return None, f'Không tìm thấy món #{item_data["menu_item_id"]}'
        if not menu_item.isAvailable:
            return None, f'Món "{menu_item.nameMenuItem}" hiện không khả dụng'
        resolved_items.append((menu_item, item_data))

    # 3. Tìm Bill Unpaid của bàn hoặc tạo mới
    bill = Bill.query.filter_by(tableID=table_id, status='Unpaid').first()
    if not bill:
        # Bàn chưa có bill → tạo mới
        bill = Bill(tableID=table_id, amount=0, status='Unpaid')
        db.session.add(bill)
        db.session.flush()  # lấy billID
        # Cập nhật trạng thái bàn ngay trong Python (không phụ thuộc trigger)
        table.status = 'Occupied'

    # 4. Tạo Order
    order = Order(billID=bill.billID, employeeID=employee_id, status='Preparing')
    db.session.add(order)
    db.session.flush()  # lấy orderID

    # 5. Thêm OrderItems + tính tổng tiền
    order_total = 0
    for menu_item, item_data in resolved_items:
        qty  = max(1, int(item_data.get('quantity', 1)))
        note = item_data.get('note') or None
        oi = OrderItem(
            orderID    = order.orderID,
            menuItemID = menu_item.menuItemID,
            quantity   = qty,
            price      = menu_item.price,
            note       = note,
        )
        db.session.add(oi)
        order_total += float(menu_item.price) * qty

        # Trừ kho thủ công (fallback nếu không có trigger SQL)
        _deduct_inventory(menu_item, qty)

    # 6. Cập nhật Bill.amount
    bill.amount = float(bill.amount) + order_total

    try:
        db.session.commit()
        db.session.refresh(order)
        return order.to_dict(include_items=True), None
    except Exception as e:
        db.session.rollback()
        return None, f'Lỗi lưu order: {str(e)}'


def _deduct_inventory(menu_item: MenuItem, qty: int):
    """
    Trừ kho nguyên liệu và tự động tắt isAvailable nếu hết.
    Hàm này chạy trong cùng session → không commit riêng.
    Nếu DB đã có trigger SQL thực hiện việc này, vẫn an toàn
    vì SQLAlchemy chỉ ghi số liệu đã trừ, trigger sẽ không chạy lại.
    (Với SQL Server có trigger: nên bỏ phần này để tránh double-deduct.
     Với SQLite dev: cần phần này.)
    """
    import os
    # Chỉ trừ kho thủ công khi KHÔNG dùng SQL Server (có trigger)
    db_url = str(db.engine.url)
    if 'mssql' in db_url or 'sqlserver' in db_url.lower():
        return  # SQL Server có trigger, không trừ tay

    for link in menu_item.ingredients:
        inv = link.inventory
        deduct = float(link.quantityUsed) * qty
        new_qty = max(0.0, float(inv.quantity) - deduct)
        inv.quantity = new_qty

        # Tắt isAvailable nếu hết nguyên liệu
        if new_qty <= 0:
            for item_link in inv.menu_item_links:
                item_link.menu_item.isAvailable = False


def get_preparing_orders():
    """UC6 – Danh sách Order đang Preparing, sắp theo thứ tự tạo (cũ nhất lên đầu)"""
    orders = (
        Order.query
        .filter_by(status='Preparing')
        .order_by(Order.orderDate.asc())
        .all()
    )
    return [o.to_dict(include_items=True) for o in orders]


def complete_order(order_id: int):
    """UC7 – Barista đánh dấu Order = Completed"""
    order = Order.query.get(order_id)
    if not order:
        return None, 'Không tìm thấy order'
    if order.status != 'Preparing':
        return None, 'Order không ở trạng thái Preparing'

    order.status = 'Completed'
    try:
        db.session.commit()
        return order.to_dict(), None
    except Exception as e:
        db.session.rollback()
        return None, str(e)
