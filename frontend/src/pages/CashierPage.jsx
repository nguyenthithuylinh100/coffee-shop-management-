import { useState, useEffect, useCallback } from 'react'
import Navbar       from '../components/Navbar'
import TableStatus  from '../components/TableStatus'
import MenuDisplay  from '../components/MenuDisplay'
import OrderPanel   from '../components/OrderPanel'
import PaymentPanel from '../components/PaymentPanel'
import api          from '../services/api'

const TAKEAWAY_TABLE = {
  table_id: 0,
  table_number: 'Mang đi',
  status: 'Available',
}

function fmt(n) {
  return new Intl.NumberFormat('vi-VN').format(n) + '₫'
}

function Toast({ toast }) {
  if (!toast) return null
  return (
    <div className={`fixed top-4 right-4 z-50 flex items-center gap-2 px-4 py-3 rounded-2xl shadow-lg text-sm font-semibold animate-bounce-in
      ${toast.type === 'error' ? 'bg-red-600 text-white' : 'bg-emerald-600 text-white'}`}>
      {toast.type === 'error' ? '⚠️' : '✅'} {toast.msg}
    </div>
  )
}

/** Hiển thị danh sách orders đã đặt của bàn đang chọn */
function ExistingOrdersPanel({ tableOrders, loading }) {
  const [collapsed, setCollapsed] = useState(false)

  if (loading) {
    return (
      <div className="card animate-pulse">
        <div className="h-4 bg-gray-200 rounded w-1/3 mb-3"/>
        <div className="space-y-2">
          <div className="h-10 bg-gray-100 rounded-xl"/>
          <div className="h-10 bg-gray-100 rounded-xl"/>
        </div>
      </div>
    )
  }

  if (!tableOrders || !tableOrders.orders || tableOrders.orders.length === 0) return null

  const totalItems = tableOrders.orders.reduce(
    (s, o) => s + (o.items ? o.items.reduce((ss, i) => ss + i.quantity, 0) : 0), 0
  )

  return (
    <div className="card border-l-4 border-orange-400">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-base font-bold text-gray-800">📋 Đơn đã đặt</span>
          <span className="bg-orange-100 text-orange-700 text-xs font-bold px-2 py-0.5 rounded-full">
            {tableOrders.orders.length} order • {totalItems} món
          </span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm font-bold text-amber-700">{fmt(tableOrders.amount)}</span>
          <button
            onClick={() => setCollapsed(c => !c)}
            className="text-gray-400 hover:text-gray-600 text-xs font-medium"
          >
            {collapsed ? 'Mở rộng ▼' : 'Thu gọn ▲'}
          </button>
        </div>
      </div>

      {!collapsed && (
        <div className="space-y-3 max-h-64 overflow-y-auto pr-1">
          {tableOrders.orders.map(order => (
            <div key={order.order_id} className="bg-gray-50 rounded-xl p-3">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-gray-500">Order #{order.order_id}</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${
                    order.status === 'Completed'
                      ? 'bg-emerald-100 text-emerald-700'
                      : 'bg-blue-100 text-blue-700'
                  }`}>
                    {order.status === 'Completed' ? '✅ Hoàn thành' : '⏳ Đang pha'}
                  </span>
                </div>
                <span className="text-xs text-gray-400">
                  {new Date(order.created_at).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
              <div className="space-y-1">
                {order.items && order.items.map((item, idx) => (
                  <div key={idx} className="flex items-start justify-between text-sm">
                    <div className="flex items-start gap-2 flex-1 min-w-0">
                      <span className="bg-white border border-gray-200 text-gray-600 text-xs font-bold min-w-6 h-6 rounded-full flex items-center justify-center shrink-0">
                        {item.quantity}
                      </span>
                      <div className="flex-1 min-w-0">
                        <span className="text-gray-700 font-medium truncate block">{item.name}</span>
                        {item.note && (
                          <span className="text-xs text-amber-600 italic">📝 {item.note}</span>
                        )}
                      </div>
                    </div>
                    <span className="text-xs text-gray-500 font-medium shrink-0 ml-2">
                      {fmt(item.subtotal || item.price * item.quantity)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {!collapsed && (
        <div className="mt-3 pt-2 border-t border-orange-100 flex justify-between items-center">
          <span className="text-xs text-gray-500">Tổng bill hiện tại</span>
          <span className="font-bold text-amber-700">{fmt(tableOrders.amount)}</span>
        </div>
      )}
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
  const [successDialog, setSuccessDialog]   = useState(null)
  const [tableOrders, setTableOrders]   = useState(null)
  const [tableOrdersLoading, setTableOrdersLoading] = useState(false)

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

  const loadTableOrders = useCallback(async (tableId) => {
    if (!tableId) { setTableOrders(null); return }
    if (tableId === TAKEAWAY_TABLE.table_id) {
      setTableOrders(null)
      return
    }
    setTableOrdersLoading(true)
    try {
      const res = await api.get(`/orders/table/${tableId}`)
      setTableOrders(res.data)
    } catch {
      setTableOrders(null)
    } finally {
      setTableOrdersLoading(false)
    }
  }, [])

  useEffect(() => {
    loadTableOrders(selectedTable ? selectedTable.table_id : null)
  }, [selectedTable, loadTableOrders])

  const handleSelectTable = (table) => {
    if (table.status === 'Occupied') {
      setOccupiedDialog(table)
      return
    }
    setSelectedTable(table)
    setOrderItems([])
  }

  const handleOccupiedConfirm = (yes) => {
    if (yes) {
      setSelectedTable(occupiedDialog)
      setOrderItems([])
    }
    setOccupiedDialog(null)
  }

  const handleAddItem = (item) => {
    setOrderItems(prev => {
      const idx = prev.findIndex(i => i.menu_item_id === item.menu_item_id)
      if (idx >= 0) {
        return prev.map((i, n) => n === idx ? { ...i, quantity: i.quantity + 1 } : i)
      }
      return [...prev, { ...item, quantity: 1, note: '' }]
    })
  }

  const handleChangeQty = (idx, qty) => {
    if (qty <= 0) setOrderItems(prev => prev.filter((_, i) => i !== idx))
    else setOrderItems(prev => prev.map((item, i) => i === idx ? { ...item, quantity: qty } : item))
  }
  const handleChangeNote = (idx, note) =>
    setOrderItems(prev => prev.map((item, i) => i === idx ? { ...item, note } : item))
  const handleRemove = (idx) =>
    setOrderItems(prev => prev.filter((_, i) => i !== idx))

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
      setSuccessDialog({
        table:    selectedTable.table_number,
        order_id: res.data.order_id,
        items:    orderItems,
      })
      setOrderItems([])
      loadData()
      loadTableOrders(selectedTable.table_id)
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
            {/* Col 1+2 */}
            <div className="lg:col-span-2 space-y-4">
              <div className="card">
                <div className="mb-3 pb-3 border-b border-gray-100">
                  <button
                    onClick={() => { setSelectedTable(TAKEAWAY_TABLE); setOrderItems([]) }}
                    className={`w-full rounded-xl border-2 px-4 py-2.5 text-left transition-colors ${
                      selectedTable?.table_id === TAKEAWAY_TABLE.table_id
                        ? 'border-amber-500 bg-amber-50'
                        : 'border-sky-200 bg-sky-50 hover:border-sky-400'
                    }`}
                  >
                    <div className="font-semibold text-gray-800">🛍️ Mua về (Mang đi)</div>
                    <div className="text-xs text-gray-500">Không cần chọn bàn trong quán</div>
                  </button>
                </div>
                <TableStatus
                  tables={tables}
                  selectedTableId={selectedTable ? selectedTable.table_id : null}
                  onSelect={handleSelectTable}
                />
              </div>

              {selectedTable ? (
                <>
                  {/* ── Đơn đã đặt của bàn ── */}
                  <ExistingOrdersPanel
                    tableOrders={tableOrders}
                    loading={tableOrdersLoading}
                  />

                  {/* Menu để gọi thêm */}
                  <div className="card">
                    <div className="flex items-center gap-2 mb-4">
                      <span className="bg-amber-100 text-amber-800 text-sm font-bold px-3 py-1 rounded-full">
                        {selectedTable.table_id === TAKEAWAY_TABLE.table_id
                          ? 'Đơn mang đi'
                          : `Bàn ${selectedTable.table_number}`}
                      </span>
                      <span className={selectedTable.status === 'Occupied' ? 'badge-occupied' : 'badge-available'}>
                        {selectedTable.status === 'Occupied' ? 'Đang có khách' : 'Trống'}
                      </span>
                      {tableOrders && tableOrders.orders && tableOrders.orders.length > 0 && (
                        <span className="text-xs text-gray-400 ml-1">
                          • {tableOrders.orders.length} order trước đó
                        </span>
                      )}
                      <button
                        onClick={() => { setSelectedTable(null); setOrderItems([]) }}
                        className="ml-auto text-gray-400 hover:text-gray-600 text-sm"
                      >
                        Đổi bàn ✕
                      </button>
                    </div>
                    <MenuDisplay menuItems={menuItems} onAddItem={handleAddItem} />
                  </div>
                </>
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
              <PaymentPanel
                bills={unpaidBills}
                onPaymentSuccess={loadData}
                onRefresh={loadData}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
