# ☕ Coffee Shop Management System

Hệ thống web quản lý quán cà phê đa vai trò — Thu Ngân, Barista, Quản Lý.

**Stack:** Python Flask · SQLAlchemy · SQL Server · React 18 · TailwindCSS · Lucide Icons

---

## Yêu cầu hệ thống

| Thành phần | Phiên bản |
|---|---|
| Python | 3.10+ |
| Node.js | 18+ |
| SQL Server | 2019+ hoặc SQL Server Express |
| ODBC Driver 17 for SQL Server | [Tải tại Microsoft](https://learn.microsoft.com/en-us/sql/connect/odbc/download-odbc-driver-for-sql-server) |

---

## Khởi động nhanh (Windows — 1 lệnh)

Dự án có sẵn script tự động. Chạy từ thư mục gốc:

```bat
start.bat
```

Script sẽ tự động tạo venv, cài dependencies, seed dữ liệu mẫu và mở cả backend lẫn frontend.

> **Mac/Linux:** `chmod +x start.sh && ./start.sh`

---

## Cài đặt thủ công

### Bước 1 — Tạo database SQL Server

Mở SQL Server Management Studio (SSMS) và chạy:

```sql
CREATE DATABASE CoffeeShop;
GO
```

> ⚠️ Tên database là **`CoffeeShop`** (không phải `CoffeeShopDB`).  
> Đây là tên đã được cấu hình sẵn trong `backend/config.py`.

### Bước 2 — Cấu hình kết nối

Mở `backend/config.py`. Mặc định đã cấu hình Windows Authentication với SQL Server Express:

```python
# Cấu hình mặc định — Windows Auth, SQL Server Express
"SERVER=YOUR_PC_NAME\\SQLEXPRESS;"
"DATABASE=CoffeeShop;"
"Trusted_Connection=yes;"
```

Sửa `YOUR_PC_NAME\\SQLEXPRESS` thành tên máy và instance SQL Server của bạn (ví dụ: `THUYLINH\\SQLEXPRESS`).

**Hoặc** dùng SQL Authentication (username/password):

```python
params = urllib.parse.quote_plus(
    "DRIVER={ODBC Driver 17 for SQL Server};"
    "SERVER=localhost;"
    "DATABASE=CoffeeShop;"
    "UID=your_username;"
    "PWD=your_password;"
)
```

### Bước 3 — Chạy Backend

```bash
cd backend

# Tạo và kích hoạt virtual environment
python -m venv venv
venv\Scripts\activate          # Windows
# source venv/bin/activate     # Mac/Linux

# Cài dependencies
pip install -r requirements.txt

# Seed dữ liệu mẫu (bảng + 30 ngày lịch sử + nhân viên + menu + kho)
python seed.py

# Chạy server tại port 5000
python app.py
```

### Bước 4 — Chạy Frontend

Mở terminal **mới**:

```bash
cd frontend
npm install
npm run dev       # Dev server tại http://localhost:3000
```

### Bước 5 — Truy cập ứng dụng

Mở trình duyệt: **http://localhost:3000**

---

## Tài khoản demo

| Role | Username | Password |
|------|----------|----------|
| Manager | `manager` | `manager123` |
| Cashier | `cashier` | `cashier123` |
| Cashier (phụ) | `cashier2` | `cashier123` |
| Barista | `barista` | `barista123` |

> Tài khoản được tạo tự động khi chạy `python seed.py`. `app.py` cũng seed 2 tài khoản cơ bản (manager + cashier) khi khởi động lần đầu nếu DB trống.

---

## Chạy với SQLite (không cần SQL Server)

Nếu chưa có SQL Server, có thể dùng SQLite để test nhanh:

1. Mở `backend/config.py`, đổi `SQLALCHEMY_DATABASE_URI`:
   ```python
   SQLALCHEMY_DATABASE_URI = 'sqlite:///coffee_shop.db'
   ```
2. Xóa (hoặc comment) dòng `pyodbc==5.1.0` trong `requirements.txt`
3. Chạy bình thường như hướng dẫn trên

> ⚠️ SQLite không hỗ trợ SQL Trigger — tính năng tự động đồng bộ kho nguyên liệu sẽ không hoạt động. Phần còn lại hoạt động bình thường.

---

## Cấu trúc dự án

```
project_final/
├── start.bat               ← Khởi động nhanh (Windows)
├── start.sh                ← Khởi động nhanh (Mac/Linux)
│
├── backend/
│   ├── app.py              ← Flask app factory + entry point
│   ├── config.py           ← Cấu hình DB (SQL Server/SQLite), JWT
│   ├── seed.py             ← Dữ liệu mẫu: 4 nhân viên, 10 bàn, menu,
│   │                          kho nguyên liệu, 30 ngày lịch sử order
│   ├── requirements.txt
│   ├── models/             ← SQLAlchemy models (Entity layer)
│   │   ├── employee.py
│   │   ├── table.py
│   │   ├── bill.py
│   │   ├── order.py
│   │   ├── order_item.py
│   │   ├── menu_item.py
│   │   ├── inventory.py    ← Inventory + MenuItemIngredient
│   │   └── report.py
│   ├── services/           ← Business logic (Control layer)
│   │   ├── auth_service.py
│   │   ├── order_service.py
│   │   ├── payment_service.py
│   │   └── inventory_service.py
│   ├── routes/             ← HTTP endpoints (Route → Service)
│   │   ├── auth_routes.py
│   │   ├── order_routes.py
│   │   ├── payment_routes.py
│   │   ├── menu_routes.py
│   │   ├── table_routes.py
│   │   ├── inventory_routes.py
│   │   └── report_routes.py
│   ├── middleware/
│   │   └── auth_middleware.py  ← JWT decode + @require_roles decorator
│   └── database/
│       └── db.py               ← SQLAlchemy instance
│
└── frontend/
    ├── vite.config.js      ← Dev proxy /auth,/orders,... → :5000
    └── src/
        ├── App.jsx          ← Router + ProtectedRoute theo role
        ├── pages/
        │   ├── LoginPage.jsx         ← UC0: Đăng nhập
        │   ├── CashierPage.jsx       ← UC1–UC6: Tạo order, thanh toán
        │   ├── BaristaPage.jsx       ← UC7–UC8: Hàng đợi pha chế
        │   └── ManagerPage.jsx       ← UC9–UC12: Menu, kho, lịch sử, báo cáo
        ├── components/
        │   ├── Navbar.jsx
        │   ├── TableStatus.jsx
        │   ├── MenuDisplay.jsx
        │   ├── OrderPanel.jsx
        │   ├── PaymentPanel.jsx
        │   └── Skeleton.jsx         ← Skeleton loading placeholders
        ├── context/
        │   ├── AuthContext.jsx      ← JWT state, login/logout
        │   └── ToastContext.jsx     ← Global toast notifications
        └── services/
            └── api.js              ← Axios instance + JWT interceptor
```

---

## API Endpoints

### Auth
```
POST  /auth/login              → Đăng nhập, nhận JWT
GET   /auth/me                 → Thông tin user hiện tại
```

### Tables
```
GET   /tables                  → Danh sách bàn + trạng thái (Any role)
POST  /tables                  → Thêm bàn (Manager)
DELETE /tables/:id             → Xóa bàn (Manager)
```

### Menu
```
GET   /menu                    → Menu khả dụng — isAvailable=true (Any role)
GET   /menu/all                → Toàn bộ menu kể cả tạm ngưng (Manager)
POST  /menu                    → Thêm món (Manager)
PUT   /menu/:id                → Sửa / toggle isAvailable (Manager)
DELETE /menu/:id               → Xóa món (Manager)
```

### Orders
```
POST  /orders                          → Tạo order mới (Cashier)
GET   /orders/preparing                → Hàng đợi pha chế (Barista)
GET   /orders/table/:table_id          → Bill + orders hiện tại của bàn (Cashier)
PUT   /orders/:id/complete             → Đánh dấu hoàn thành (Barista)
GET   /orders/history?from=&to=        → Lịch sử order (Manager)
```

### Payment
```
GET   /payment/bills/unpaid            → Bill chờ thanh toán (Cashier)
GET   /payment/bills/history?from=&to= → Lịch sử bill đã TT (Manager)
GET   /payment/bills/:id               → Chi tiết bill (Cashier)
POST  /payment                         → Xử lý thanh toán (Cashier)
PUT   /payment/bills/:id/failed        → Ghi nhận TT thất bại (Cashier)
```

### Inventory
```
GET   /inventory               → Toàn bộ kho nguyên liệu (Manager)
GET   /inventory/alerts        → Nguyên liệu sắp hết (Manager)
POST  /inventory               → Thêm nguyên liệu (Manager)
PUT   /inventory/:id           → Cập nhật số lượng (Manager)
```

### Reports
```
GET   /reports                         → Lịch sử báo cáo đã lưu (Manager)
POST  /reports                         → Tạo và lưu báo cáo (Manager)
GET   /reports/summary                 → KPI hôm nay (Manager)
GET   /reports/revenue/daily?from=&to= → Doanh thu theo ngày (Manager)
GET   /reports/revenue/hourly?from=&to=→ Phân bố theo giờ (Manager)
GET   /reports/top-items?from=&to=     → Món bán chạy (Manager)
GET   /reports/revenue/category?from=&to= → Doanh thu theo danh mục (Manager)
```

---

## Xử lý lỗi phổ biến

**Lỗi kết nối SQL Server:**
```
Error: ('08001', ...)
```
→ Kiểm tra: SQL Server đang chạy, ODBC Driver 17 đã cài, tên server/instance trong `config.py` đúng. Thử bật TCP/IP trong SQL Server Configuration Manager.

**Lỗi tên database không tìm thấy:**
```
Cannot open database "CoffeeShopDB" requested by the login
```
→ README cũ hướng dẫn tạo `CoffeeShopDB` nhưng code dùng `CoffeeShop`. Tạo lại database đúng tên: `CREATE DATABASE CoffeeShop;`

**Lỗi CORS:**
```
Access-Control-Allow-Origin
```
→ Đảm bảo Flask đang chạy ở port 5000. Frontend phải chạy qua `npm run dev` (port 3000) để dùng Vite proxy — không mở trực tiếp file HTML.

**Lỗi JWT expired:**
```json
{"error": "Token expired"}
```
→ Đăng xuất và đăng nhập lại. Token có hiệu lực 8 giờ.

**Frontend không load sau khi sửa code:**
→ Vite hot-reload tự động. Nếu không tự reload, nhấn `Ctrl+C` rồi chạy lại `npm run dev`.

---

## Biến môi trường (Production)

Khi deploy lên server thật, set các biến môi trường thay vì dùng giá trị mặc định:

```bash
export SECRET_KEY="your-secret-key-here"
export JWT_SECRET="your-jwt-secret-here"
export DATABASE_URL="mssql+pyodbc://...your-production-connection-string..."
export CORS_ORIGINS="https://your-domain.com"
```