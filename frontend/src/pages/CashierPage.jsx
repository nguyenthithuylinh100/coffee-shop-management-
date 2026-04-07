import { useState, useEffect, useCallback } from 'react'
import Navbar       from '../components/Navbar'
import TableStatus  from '../components/TableStatus'
import MenuDisplay  from '../components/MenuDisplay'
import OrderPanel   from '../components/OrderPanel'
import PaymentPanel from '../components/PaymentPanel'
import api          from '../services/api'

function Toast({ toast }) {
  if (!toast) return null
  return (
    <div className={`fixed top-4 right-4 z-50 flex items-center gap-2 px-4 py-3 rounded-2xl shadow-lg text-sm font-semibold animate-bounce-in
      ${toast.type === 'error' ? 'bg-red-600 text-white' : 'bg-emerald-600 text-white'}`}>
      {toast.type === 'error' ? '⚠️' : '✅'} {toast.msg}
    </div>
  )
}

// UC1 + UC2 + UC3 + UC4 + UC5
export default function CashierPage() {
  const [tables, setTables]             = useState([])
  const [menuItems, setMenuItems]       = useState([])
  const [unpaidBills, setUnpaidBills]   = useState([])
  const [selectedTable, setSelectedTable] = useState(null)
  const [orderItems, setOrderItems]     = useState([])
  const [activeTab, setActiveTab]       = useState('order')
  const [confirmLoading, setConfirmLoading] = useState(false)
  const [toast, setToast]               = useState(null)
  const [occupiedDialog, setOccupiedDialog] = useState(null)
  const [successDialog, setSuccessDialog]   = useState(null) // UC2: Thông báo order thành công

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3500)
  }

  const loadData = useCallback(async () => {
    try {
      const [t, m, b] = await Promise.all([
        api.get('/tables'),
        api.get('/menu'),
        api.get('/payment/bills/unpaid'),
      ])
      setTables(t.data)
      setMenuItems(m.data)
      setUnpaidBills(b.data)
    } catch (err) {
      showToast('Không thể tải dữ liệu', 'error')
    }
  }, [])

  useEffect(() => { loadData() }, [loadData])

  // UC1: Cashier chọn bàn → kiểm tra trạng thái
  const handleSelectTable = (table) => {
    if (table.status === 'Occupied') {
      // UC2: Bàn đã có khách → hỏi có muốn gọi thêm không
      setOccupiedDialog(table)
      return
    }
    setSelectedTable(table)
    setOrderItems([])
  }

  const handleOccupiedConfirm = (yes) => {
    if (yes) {
      // Mở Bill hiện tại của bàn – gọi thêm món
      setSelectedTable(occupiedDialog)
      setOrderItems([])
    }
    setOccupiedDialog(null)
  }

  // UC3: Thêm món – nếu đã có thì tăng số lượng
  const handleAddItem = (item) => {
    setOrderItems(prev => {
      const idx = prev.findIndex(i => i.menu_item_id === item.menu_item_id)
      if (idx >= 0) {
        return prev.map((i, n) => n === idx ? { ...i, quantity: i.quantity + 1 } : i)
      }
      return [...prev, { ...item, quantity: 1, note: '' }]
    })
  }

  // UC4: Chỉnh số lượng (0 → xoá)
  const handleChangeQty = (idx, qty) => {
    if (qty <= 0) setOrderItems(prev => prev.filter((_, i) => i !== idx))
    else setOrderItems(prev => prev.map((item, i) => i === idx ? { ...item, quantity: qty } : item))
  }
  const handleChangeNote = (idx, note) =>
    setOrderItems(prev => prev.map((item, i) => i === idx ? { ...item, note } : item))
  const handleRemove = (idx) =>
    setOrderItems(prev => prev.filter((_, i) => i !== idx))

  // UC2: Xác nhận Order
  const handleConfirmOrder = async () => {
    if (!selectedTable || orderItems.length === 0) return
    setConfirmLoading(true)
    try {
      const res = await api.post('/orders', {
        table_id: selectedTable.table_id,
        items: orderItems.map(i => ({
          menu_item_id: i.menu_item_id,
          quantity:     i.quantity,
          note:         i.note || null,
        })),
      })
      // UC2: Thông báo Order thành công → gửi màn hình Barista
      setSuccessDialog({
        table:    selectedTable.table_number,
        order_id: res.data.order_id,
        items:    orderItems,
      })
      setOrderItems([])
      // KHÔNG reset selectedTable – cho phép cashier gọi thêm (vòng lặp UC2)
      loadData()
    } catch (err) {
      showToast(err.response?.data?.error || 'Lỗi tạo order', 'error')
    } finally {
      setConfirmLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Navbar title="Thu Ngân" />
      <Toast toast={toast} />

      {/* UC2 AF2: Dialog bàn đang có khách */}
      {occupiedDialog && (
        <div className="fixed inset-0 bg-black/50 z-40 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6">
            <div className="text-center mb-5">
              <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <span className="text-3xl">🪑</span>
              </div>
              <h3 className="font-bold text-gray-800 text-lg">Bàn {occupiedDialog.table_number} đang có khách</h3>
              <p className="text-sm text-gray-500 mt-1">Bạn có muốn gọi thêm món cho bàn này không?</p>
            </div>
            <div className="flex gap-3">
              <button onClick={() => handleOccupiedConfirm(false)} className="btn-secondary flex-1">
                Chọn bàn khác
              </button>
              <button onClick={() => handleOccupiedConfirm(true)} className="btn-primary flex-1">
                Gọi thêm món
              </button>
            </div>
          </div>
        </div>
      )}

      {/* UC2: Dialog thông báo order thành công */}
      {successDialog && (
        <div className="fixed inset-0 bg-black/50 z-40 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6">
            <div className="text-center mb-4">
              <div className="text-5xl mb-3">🎯</div>
              <h3 className="font-bold text-gray-800 text-lg">Order đã gửi Barista!</h3>
              <p className="text-sm text-gray-500 mt-1">Bàn {successDialog.table} — Order #{successDialog.order_id}</p>
            </div>
            <div className="bg-gray-50 rounded-xl p-3 mb-4">
              {successDialog.items.map((item, i) => (
                <div key={i} className="flex justify-between text-sm py-0.5">
                  <span className="text-gray-700">{item.name}</span>
                  <span className="font-semibold text-gray-600">× {item.quantity}</span>
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <button onClick={() => { setSuccessDialog(null); setSelectedTable(null) }} className="btn-secondary flex-1">
                Chọn bàn mới
              </button>
              <button onClick={() => setSuccessDialog(null)} className="btn-primary flex-1">
                Gọi thêm cho Bàn {successDialog.table}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Tab bar */}
      <div className="bg-white border-b border-gray-100 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 flex gap-1">
          {[
            { key: 'order',   label: '🛒 Tạo Order' },
            { key: 'payment', label: `💰 Thanh Toán${unpaidBills.length > 0 ? ` (${unpaidBills.length})` : ''}` },
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-5 py-3.5 text-sm font-semibold border-b-2 transition-colors ${
                activeTab === tab.key
                  ? 'border-amber-600 text-amber-700'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab.label}
              {tab.key === 'payment' && unpaidBills.length > 0 && (
                <span className="ml-1 bg-red-500 text-white text-xs rounded-full w-4 h-4 inline-flex items-center justify-center">
                  {unpaidBills.length}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 p-4 max-w-7xl mx-auto w-full">
        {activeTab === 'order' ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Col 1+2: Table + Menu */}
            <div className="lg:col-span-2 space-y-4">
              <div className="card">
                <TableStatus
                  tables={tables}
                  selectedTableId={selectedTable?.table_id}
                  onSelect={handleSelectTable}
                />
              </div>

              {selectedTable ? (
                <div className="card">
                  <div className="flex items-center gap-2 mb-4">
                    <span className="bg-amber-100 text-amber-800 text-sm font-bold px-3 py-1 rounded-full">
                      Bàn {selectedTable.table_number}
                    </span>
                    <span className={selectedTable.status === 'Occupied' ? 'badge-occupied' : 'badge-available'}>
                      {selectedTable.status === 'Occupied' ? 'Đang có khách' : 'Trống'}
                    </span>
                    <button
                      onClick={() => { setSelectedTable(null); setOrderItems([]) }}
                      className="ml-auto text-gray-400 hover:text-gray-600 text-sm"
                    >
                      Đổi bàn ✕
                    </button>
                  </div>
                  <MenuDisplay menuItems={menuItems} onAddItem={handleAddItem} />
                </div>
              ) : (
                <div className="card text-center py-14">
                  <div className="text-5xl mb-3 opacity-30">👆</div>
                  <p className="text-gray-400 font-medium">Chọn một bàn để bắt đầu tạo order</p>
                </div>
              )}
            </div>

            {/* Col 3: Order cart */}
            <div className="card flex flex-col" style={{ minHeight: 520 }}>
              {selectedTable ? (
                <OrderPanel
                  orderItems={orderItems}
                  onRemove={handleRemove}
                  onChangeQty={handleChangeQty}
                  onChangeNote={handleChangeNote}
                  onConfirm={handleConfirmOrder}
                  loading={confirmLoading}
                />
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center text-gray-300">
                  <div className="text-5xl mb-3">🛒</div>
                  <p className="text-sm text-gray-400 font-medium">Chọn bàn trước</p>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="max-w-xl mx-auto">
            <div className="card">
              <PaymentPanel bills={unpaidBills} onPaymentSuccess={loadData} />
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
