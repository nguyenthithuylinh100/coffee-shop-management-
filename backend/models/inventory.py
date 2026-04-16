from database.db import db
from datetime import datetime

class Inventory(db.Model):
    __tablename__ = 'Inventory'         # khop SQL v3

    inventoryID   = db.Column('inventoryID',   db.Integer,        primary_key=True, autoincrement=True)
    nameInventory = db.Column('nameInventory', db.String(100),    nullable=False)
    quantity      = db.Column('quantity',      db.Numeric(10, 2), nullable=False, default=0)
    unit          = db.Column('unit',          db.String(20),     nullable=True)
    minQuantity   = db.Column('minQuantity',   db.Numeric(10, 2), nullable=False, default=0)
    updatedAt     = db.Column('updatedAt',     db.DateTime,       default=datetime.utcnow)

    menu_item_links = db.relationship('MenuItemIngredient', back_populates='inventory')

    def to_dict(self):
        qty = float(self.quantity)
        min_qty = float(self.minQuantity)
        return {
            'inventory_id':    self.inventoryID,
            'ingredient_name': self.nameInventory,
            'quantity':        qty,
            'unit':            self.unit,
            'min_quantity':    min_qty,
            'is_low':          qty <= min_qty,
        }


class MenuItemIngredient(db.Model):
    __tablename__ = 'MenuItemIngredient'  # khop SQL v3

    menuItemID   = db.Column('menuItemID',   db.Integer,        db.ForeignKey('MenuItem.menuItemID'),  primary_key=True)
    inventoryID  = db.Column('inventoryID',  db.Integer,        db.ForeignKey('Inventory.inventoryID'), primary_key=True)
    quantityUsed = db.Column('quantityUsed', db.Numeric(10, 3), nullable=False)

    menu_item = db.relationship('MenuItem',   back_populates='ingredients')
    inventory = db.relationship('Inventory',  back_populates='menu_item_links')

    def to_dict(self):
        return {
            'inventory_id':    self.inventoryID,
            'ingredient_name': self.inventory.nameInventory if self.inventory else None,
            'quantity_used':   float(self.quantityUsed),
            'unit':            self.inventory.unit if self.inventory else None,
        }
