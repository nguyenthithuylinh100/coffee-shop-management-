# ☕ Coffee Shop Management System

## Yêu cầu hệ thống

| Thành phần | Phiên bản |
|---|---|
| Python | 3.10+ |
| Node.js | 18+ |
| SQL Server | 2019+ hoặc SQL Server Express |
| ODBC Driver 17 for SQL Server | (tải tại Microsoft) |

---

## Cài đặt nhanh (Windows)

### Bước 1 — Tạo database SQL Server

Mở SQL Server Management Studio, chạy:

```sql
CREATE DATABASE CoffeeShopDB;
GO
```

### Bước 2 — Cấu hình kết nối

Mở `backend/config.py` và sửa dòng connection string:

```python
SQLALCHEMY_DATABASE_URI = (
    'mssql+pyodbc://YOUR_USERNAME:YOUR_PASSWORD'
    '@localhost/CoffeeShopDB'
    '?driver=ODBC+Driver+17+for+SQL+Server'
)
```

Ví dụ dùng Windows Authentication (không cần username/password):
```python
SQLALCHEMY_DATABASE_URI = (
    'mssql+pyodbc://@localhost/CoffeeShopDB'
    '?driver=ODBC+Driver+17+for+SQL+Server'
    '&trusted_connection=yes'
)
```

### Bước 3 — Chạy Backend

```bash
cd backend

# Tạo virtual environment
python -m venv venv

# Kích hoạt (Windows)
venv\Scripts\activate

# Kích hoạt (Mac/Linux)
source venv/bin/activate

# Cài dependencies
pip install -r requirements.txt

# Tạo bảng và seed dữ liệu mẫu
python seed.py

# Chạy server (port 5000)
python app.py
```

### Bước 4 — Chạy Frontend

Mở terminal MỚI:

```bash
cd frontend

# Cài dependencies
npm install

# Chạy dev server (port 3000)
npm run dev
```

### Bước 5 — Truy cập ứng dụng

Mở trình duyệt: **http://localhost:3000**

---

## Tài khoản mặc định

| Role | Username | Password |
|------|----------|----------|
| Manager | `manager` | `manager123` |
| Cashier | `cashier` | `cashier123` |
| Barista | `barista` | `barista123` |

---

## Chạy với SQLite (không cần SQL Server)

Nếu chưa có SQL Server, có thể dùng SQLite để test nhanh:

1. Mở `backend/config.py`
2. Thay dòng `SQLALCHEMY_DATABASE_URI` thành:
   ```python
   SQLALCHEMY_DATABASE_URI = 'sqlite:///coffee_shop.db'
   ```
3. Xóa dòng `pyodbc==5.1.0` trong `requirements.txt`
4. Chạy bình thường như hướng dẫn trên

---

## Cấu trúc dự án

```
coffee_shop/
├── backend/
│   ├── app.py              ← Flask app factory + entry point
│   ├── config.py           ← Cấu hình DB, JWT
│   ├── seed.py             ← Dữ liệu mẫu
│   ├── requirements.txt
│   ├── models/             ← SQLAlchemy models (Entity layer)
│   ├── services/           ← Business logic (Control layer)
│   ├── routes/             ← HTTP endpoints (Boundary → Control)
│   ├── middleware/         ← JWT + RBAC decorators
│   └── database/           ← db.py (SQLAlchemy instance)
│
└── frontend/
    ├── src/
    │   ├── App.jsx          ← Router + Role guards
    │   ├── pages/
    │   │   ├── LoginPage.jsx
    │   │   ├── CashierPage.jsx   ← UC1, UC2, UC3, UC4, UC5
    │   │   ├── BaristaPage.jsx   ← UC6, UC7
    │   │   └── ManagerPage.jsx   ← UC8, UC9, UC10
    │   ├── components/
    │   │   ├── Navbar.jsx
    │   │   ├── TableStatus.jsx
    │   │   ├── MenuDisplay.jsx
    │   │   ├── OrderPanel.jsx
    │   │   └── PaymentPanel.jsx
    │   ├── context/
    │   │   └── AuthContext.jsx   ← JWT state management
    │   └── services/
    │       └── api.js            ← Axios instance + interceptors
    └── vite.config.js       ← Dev proxy → Flask :5000
```

---

## API Endpoints tóm tắt

```
POST  /auth/login              → Đăng nhập, nhận JWT
GET   /auth/me                 → Thông tin user hiện tại

GET   /tables                  → Danh sách bàn (Cashier)
GET   /menu                    → Menu khả dụng (Cashier)
GET   /menu/all                → Toàn bộ menu (Manager)
POST  /menu                    → Thêm món (Manager)
PUT   /menu/:id                → Sửa/toggle món (Manager)
DELETE /menu/:id               → Xóa món (Manager)

POST  /orders                  → Tạo order mới (Cashier)
GET   /orders/preparing        → Hàng đợi barista (Barista)
PUT   /orders/:id/complete     → Đánh dấu hoàn thành (Barista)

GET   /payment/bills/unpaid    → Bill chờ thanh toán (Cashier)
GET   /payment/bills/:id       → Chi tiết bill (Cashier)
POST  /payment                 → Xử lý thanh toán (Cashier)

GET   /inventory               → Tồn kho (Manager)
POST  /inventory               → Thêm nguyên liệu (Manager)
PUT   /inventory/:id           → Cập nhật tồn kho (Manager)

GET   /reports                 → Lịch sử báo cáo (Manager)
POST  /reports                 → Tạo báo cáo mới (Manager)
GET   /reports/summary         → Thống kê hôm nay (Manager)
```

---

## Xử lý lỗi phổ biến

**Lỗi kết nối SQL Server:**
```
Error: ('08001', ...)
```
→ Kiểm tra SQL Server đang chạy, ODBC Driver đã cài, và connection string đúng.

**Lỗi CORS:**
```
Access-Control-Allow-Origin
```
→ Đảm bảo Flask đang chạy ở port 5000 và frontend dùng Vite proxy (port 3000).

**Lỗi JWT expired:**
```
{"error": "Token expired"}
```
→ Đăng xuất và đăng nhập lại. Token có hiệu lực 8 giờ.
# coffee-shop-management-
