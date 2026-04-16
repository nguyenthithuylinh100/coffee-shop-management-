import anthropic, requests

TOOLS = [
  {"name": "get_report_summary", "description": "Lấy KPI hôm nay"},
  {"name": "get_inventory_alerts", "description": "Nguyên liệu sắp hết"},
  {"name": "get_top_items", "description": "Món bán chạy"},
  {"name": "get_operations_status", "description": "Trạng thái bàn/order"},
]

def call_tool(name, token):
  API = "http://localhost:5000"
  H = {"Authorization": f"Bearer {token}"}
  if name == "get_report_summary":
    return requests.get(f"{API}/reports/summary", headers=H).json()
  if name == "get_inventory_alerts":
    return requests.get(f"{API}/inventory/alerts", headers=H).json()
  # ... các tool khác tương tự

def chat(message, manager_token):
  client = anthropic.Anthropic()
  response = client.messages.create(
    model="claude-sonnet-4-20250514",
    max_tokens=1024,
    tools=TOOLS,
    messages=[{"role":"user","content":message}]
  )
  # Xử lý tool_use blocks, gọi call_tool(), trả kết quả
Bước 3 — Thêm route backend/routes/ai_routes.py
from flask import Blueprint, request, jsonify, g
from middleware.auth_middleware import require_roles
from agents.orchestrator import chat

ai_bp = Blueprint('ai', __name__)

@ai_bp.route('/chat', methods=['POST'])
@require_roles('Manager')
def ai_chat():
  message = request.get_json().get('message', '')
  token = request.headers.get('Authorization','').replace('Bearer ','')
  reply = chat(message, token)
  return jsonify({"reply": reply}), 200