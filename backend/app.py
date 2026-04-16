from flask import Flask
from flask_cors import CORS
from flasgger import Swagger
from database.db import db
from config import DevelopmentConfig


def create_app(config=DevelopmentConfig):
    app = Flask(__name__)
    app.config.from_object(config)

    if not app.config.get('SECRET_KEY') or not app.config.get('JWT_SECRET'):
        raise RuntimeError('SECRET_KEY and JWT_SECRET must be set')

    cors_origins = app.config.get('CORS_ORIGINS') or []
    CORS(app, resources={r"/*": {"origins": cors_origins}})
    db.init_app(app)

    # Initialize Swagger
    app.config['SWAGGER'] = {
        'title': 'Coffee Shop Management API',
        'uiversion': 3
    }
    
    swagger_template = {
        "swagger": "2.0",
        "info": {
            "title": "Coffee Shop Management API",
            "description": "API Documentation",
            "version": "1.0.0"
        },
        "securityDefinitions": {
            "BearerAuth": {
                "type": "apiKey",
                "name": "Authorization",
                "in": "header",
                "description": "Add token exactly as: Bearer <your_token>"
            }
        },
        "security": [
            {
                "BearerAuth": []
            }
        ]
    }

    # Import models
    from models import employee, table, bill, order, order_item, menu_item, inventory, menu_item_ingredient

    # Import blueprints
    from routes.auth_routes import auth_bp
    from routes.order_routes import order_bp
    from routes.payment_routes import payment_bp
    from routes.menu_routes import menu_bp
    from routes.table_routes import table_bp
    from routes.inventory_routes import inventory_bp
    from routes.report_routes import report_bp

    # Register
    app.register_blueprint(auth_bp, url_prefix='/auth')
    app.register_blueprint(order_bp, url_prefix='/orders')
    app.register_blueprint(payment_bp, url_prefix='/payment')
    app.register_blueprint(menu_bp, url_prefix='/menu')
    app.register_blueprint(table_bp, url_prefix='/tables')
    app.register_blueprint(inventory_bp, url_prefix='/inventory')
    app.register_blueprint(report_bp, url_prefix='/reports')

    Swagger(app, template=swagger_template)

    # Init DB
    with app.app_context():
        db.create_all()
        _seed_initial_data()

    return app


def _seed_initial_data():
    from models.employee import Employee
    import bcrypt

    if Employee.query.count() == 0:
        raw_data = [
            {'name': 'Nguyen Minh Quan', 'user': 'manager', 'role': 'Manager', 'pw': 'manager123'},
            {'name': 'Tran Thi Lan', 'user': 'cashier', 'role': 'Cashier', 'pw': 'cashier123'}
        ]

        for item in raw_data:
            hashed_pw = bcrypt.hashpw(
                item['pw'].encode('utf-8'),
                bcrypt.gensalt()
            ).decode('utf-8')

            emp = Employee(
                name=item['name'],
                username=item['user'],
                role=item['role'],
                password_hash=hashed_pw,
                status='Active'
            )

            db.session.add(emp)

        db.session.commit()
        print("✅ Seeded users successfully!")


if __name__ == '__main__':
    app = create_app()
    app.run(debug=app.config.get('DEBUG', False), port=5000)