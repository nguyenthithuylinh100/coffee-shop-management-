import os
import urllib


def _csv_env(name: str, default: str):
    raw = os.environ.get(name, default)
    return [item.strip() for item in raw.split(',') if item.strip()]


class Config:
    SECRET_KEY = os.environ.get('SECRET_KEY', 'dev-only-secret-change-me')
    JWT_SECRET = os.environ.get('JWT_SECRET', 'dev-only-jwt-secret-change-me')
    JWT_EXPIRY_HOURS = 8
    CORS_ORIGINS = _csv_env('CORS_ORIGINS', 'http://localhost:3000')

    params = urllib.parse.quote_plus(
        "DRIVER={ODBC Driver 17 for SQL Server};"
                "SERVER=THUYLINH\SQLEXPRESS;"
        "DATABASE=CoffeeShop;"
        "Trusted_Connection=yes;"
        "TrustServerCertificate=yes;"
    )

    SQLALCHEMY_DATABASE_URI = os.environ.get(
        'DATABASE_URL',
        f"mssql+pyodbc:///?odbc_connect={params}"
    )
    SQLALCHEMY_TRACK_MODIFICATIONS = False


class DevelopmentConfig(Config):
    DEBUG = True

class ProductionConfig(Config):
    DEBUG = False
    SECRET_KEY = os.environ.get('SECRET_KEY')
    JWT_SECRET = os.environ.get('JWT_SECRET')
    CORS_ORIGINS = _csv_env('CORS_ORIGINS', '')