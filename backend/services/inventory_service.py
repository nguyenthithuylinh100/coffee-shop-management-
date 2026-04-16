from database.db import db
from models.inventory import Inventory
from datetime import datetime


def get_all_inventory():
    return [i.to_dict() for i in Inventory.query.all()]


def update_inventory(inventory_id: int, quantity: float):
    """UC9 – Manager nhap them kho. Trigger SQL tu dong bat lai isAvailable."""
    inv = Inventory.query.get(inventory_id)
    if not inv:
        return None, 'Inventory item not found'
    inv.quantity  = quantity
    inv.updatedAt = datetime.utcnow()
    try:
        db.session.commit()
        return inv.to_dict(), None
    except Exception as e:
        db.session.rollback()
        return None, str(e)


def create_inventory(ingredient_name, quantity, unit, min_quantity):
    inv = Inventory(
        nameInventory = ingredient_name,
        quantity      = quantity,
        unit          = unit,
        minQuantity   = min_quantity,
    )
    db.session.add(inv)
    try:
        db.session.commit()
        return inv.to_dict(), None
    except Exception as e:
        db.session.rollback()
        return None, str(e)


def get_low_stock_alerts():
    items = Inventory.query.all()
    return [i.to_dict() for i in items if float(i.quantity) <= float(i.minQuantity)]
