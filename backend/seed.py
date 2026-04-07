"""
Chay mot lan de seed du lieu mau:
  cd backend
  python seed.py
"""
import sys, os
sys.path.insert(0, os.path.dirname(__file__))

from app import create_app
from database.db import db
from models.table    import Table
from models.menu_item import MenuItem
from models.inventory import Inventory, MenuItemIngredient

app = create_app()

with app.app_context():
    # Tables
    if Table.query.count() == 0:
        tables = [Table(tableNumber=i) for i in range(1, 11)]
        db.session.add_all(tables)
        db.session.commit()
        print("Seeded 10 tables")

    # Inventory
    if Inventory.query.count() == 0:
        ingredients = [
            Inventory(nameInventory='Ca phe robusta', quantity=5000, unit='g',     minQuantity=500),
            Inventory(nameInventory='Ca phe arabica', quantity=3000, unit='g',     minQuantity=300),
            Inventory(nameInventory='Sua tuoi',       quantity=10000,unit='ml',    minQuantity=1000),
            Inventory(nameInventory='Sua dac',        quantity=5000, unit='ml',    minQuantity=500),
            Inventory(nameInventory='Duong trang',    quantity=3000, unit='g',     minQuantity=300),
            Inventory(nameInventory='Da vien',        quantity=20000,unit='g',     minQuantity=2000),
            Inventory(nameInventory='Tra xanh matcha',quantity=1000, unit='g',     minQuantity=100),
            Inventory(nameInventory='Tra oolong',     quantity=1000, unit='g',     minQuantity=100),
            Inventory(nameInventory='Cacao bot',      quantity=2000, unit='g',     minQuantity=200),
            Inventory(nameInventory='Kem tuoi',       quantity=3000, unit='ml',    minQuantity=300),
            Inventory(nameInventory='Syrup caramel',  quantity=2000, unit='ml',    minQuantity=200),
            Inventory(nameInventory='Syrup vanilla',  quantity=2000, unit='ml',    minQuantity=200),
            Inventory(nameInventory='Nuoc loc',       quantity=50000,unit='ml',    minQuantity=5000),
            Inventory(nameInventory='Banh mi sandwich',quantity=100, unit='cai',   minQuantity=10),
            Inventory(nameInventory='Croissant',      quantity=80,   unit='cai',   minQuantity=8),
            Inventory(nameInventory='Cheesecake',     quantity=50,   unit='mieng', minQuantity=5),
            Inventory(nameInventory='Tiramisu',       quantity=40,   unit='mieng', minQuantity=4),
        ]
        db.session.add_all(ingredients)
        db.session.commit()
        print("Seeded 17 inventory items")

    # Menu items
    if MenuItem.query.count() == 0:
        menu_data = [
            {'name':'Ca phe den',       'price':25000,'category':'Ca Phe'},
            {'name':'Ca phe sua',       'price':30000,'category':'Ca Phe'},
            {'name':'Cappuccino',       'price':45000,'category':'Ca Phe'},
            {'name':'Latte',            'price':45000,'category':'Ca Phe'},
            {'name':'Americano',        'price':40000,'category':'Ca Phe'},
            {'name':'Caramel Macchiato','price':55000,'category':'Ca Phe'},
            {'name':'Ca phe trung',     'price':40000,'category':'Ca Phe'},
            {'name':'Tra xanh matcha',  'price':45000,'category':'Tra'},
            {'name':'Tra oolong sua',   'price':40000,'category':'Tra'},
            {'name':'Tra dao',          'price':35000,'category':'Tra'},
            {'name':'Chocolate nong',   'price':45000,'category':'Khac'},
            {'name':'Chocolate da',     'price':45000,'category':'Khac'},
            {'name':'Nuoc cam ep',      'price':35000,'category':'Khac'},
            {'name':'Banh mi sandwich', 'price':30000,'category':'Do An'},
            {'name':'Croissant',        'price':25000,'category':'Do An'},
            {'name':'Cheesecake',       'price':45000,'category':'Do An'},
            {'name':'Tiramisu',         'price':50000,'category':'Do An'},
        ]
        for d in menu_data:
            item = MenuItem(nameMenuItem=d['name'], price=d['price'],
                            category=d['category'], isAvailable=True)
            db.session.add(item)
        db.session.commit()
        print("Seeded 17 menu items")

    print("\nSeed complete!")
    print("  manager  / manager123")
    print("  cashier  / cashier123")
    print("  barista  / barista123")
