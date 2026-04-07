import { useState, useEffect, useCallback, useRef } from 'react'
import Navbar from '../components/Navbar'
import api    from '../services/api'

const REFRESH_INTERVAL = 15 // giây

function timeAgo(dateStr) {
  const diff = Math.floor((Date.now() - new Date(dateStr)) / 1000)
  if (diff < 60)   return `${diff}s trước`
  if (diff < 3600) return `${Math.floor(diff / 60)}m trước`
  return `${Math.floor(diff / 3600)}h trước`
}

// UC6: View Order List – Barista mở màn hình, hệ thống truy vấn order status=Preparing
// UC7: Update Order Status – Barista pha chế → nhấn Hoàn thành → status=Completed
export default function BaristaPage() {
  const [orders, setOrders]       = useState([])
  const [completing, setCompleting] = useState({})
  const [toast, setToast]         = useState(null)
  const [countdown, setCountdown] = useState(REFRESH_INTERVAL)
  const [lastRefresh, setLastRefresh] = useState(null)
  const intervalRef = useRef(null)

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3000)
  }

  // UC6: Hệ thống truy vấn các Order (status = Preparing)
  const loadOrders = useCallback(async () => {
    try {
      const res = await api.get('/orders/preparing')
      setOrders(res.data)
      setLastRefresh(new Date())
      setCountdown(REFRESH_INTERVAL)
    } catch (err) {
      showToast('Không thể tải danh sách order', 'error')
    }
  }, [])

  // Auto-refresh + countdown
  useEffect(() => {
    loadOrders()
    intervalRef.current = setInterval(() => {
      setCountdown(c => {
        if (c <= 1) { loadOrders(); return REFRESH_INTERVAL }
        return c - 1
      })
    }, 1000)
    return () => clearInterval(intervalRef.current)
  }, [loadOrders])

  // UC7: Barista hoàn thành → Cập nhật trạng thái Order = 'Completed'
  const handleComplete = async (orderId) => {
    setCompleting(prev => ({ ...prev, [orderId]: true }))
    try {
      await api.put(`/orders/${orderId}/complete`)
      showToast(`Order #${orderId} hoàn thành! Thông báo nhân viên phục vụ.`)
      loadOrders()
    } catch (err) {
      showToast(err.response?.data?.error || 'Không cập nhật được', 'error')
    } finally {
      setCompleting(prev => ({ ...prev, [orderId]: false }))
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navbar title="Pha Chế" />

      {/* Toast */}
      {toast && (
        <div className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-2xl shadow-lg text-sm font-semibold
          ${toast.type === 'error' ? 'bg-red-600 text-white' : 'bg-emerald-600 text-white'}`}>
          {toast.type === 'error' ? '⚠️' : '✅'} {toast.msg}
        </div>
      )}

      <div className="p-4 max-w-6xl mx-auto w-full flex-1">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <h2 className="text-lg font-bold text-gray-800">Hàng Đợi Pha Chế</h2>
            {orders.length > 0 && (
              <span className="badge-preparing text-sm px-3 py-1">
                {orders.length} đơn
              </span>
            )}
          </div>
          <div className="flex items-center gap-3">
            {/* Countdown indicator */}
            <div className="hidden sm:flex items-center gap-1.5 text-xs text-gray-400">
              <div className="w-4 h-4 rounded-full border-2 border-gray-200 relative overflow-hidden">
                <div
                  className="absolute bottom-0 left-0 right-0 bg-amber-400 transition-all"
                  style={{ height: `${(countdown / REFRESH_INTERVAL) * 100}%` }}
                />
              </div>
              Làm mới sau {countdown}s
            </div>
            <button onClick={loadOrders} className="btn-secondary text-sm">
              🔄 Làm mới ngay
            </button>
          </div>
        </div>

        {/* UC6: Có order? */}
        {orders.length === 0 ? (
          /* Thông báo "Chưa có đơn hàng" */
          <div className="text-center py-24">
            <div className="text-7xl mb-4 opacity-20">☕</div>
            <h3 className="text-xl font-bold text-gray-400">Chưa có đơn hàng</h3>
            <p className="text-sm text-gray-400 mt-2">
              Tự động làm mới sau {countdown} giây
            </p>
            {lastRefresh && (
              <p className="text-xs text-gray-300 mt-1">
                Cập nhật lần cuối: {lastRefresh.toLocaleTimeString('vi-VN')}
              </p>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
            {orders.map(order => (
              <div key={order.order_id} className="bg-white rounded-2xl border-2 border-blue-100 shadow-sm hover:shadow-md transition-all overflow-hidden">
                {/* Card header */}
                <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-4 py-3 flex justify-between items-start">
                  <div>
                    <p className="font-bold text-xl">Bàn {order.table_number}</p>
                    <p className="text-blue-200 text-xs">Order #{order.order_id}</p>
                  </div>
                  <div className="text-right">
                    <span className="bg-blue-500/60 text-white text-xs px-2 py-0.5 rounded-full">
                      Đang pha
                    </span>
                    <p className="text-blue-200 text-xs mt-1">{timeAgo(order.created_at)}</p>
                  </div>
                </div>

                {/* UC6: Barista xem chi tiết món */}
                <div className="p-4">
                  <div className="space-y-2 mb-4">
                    {order.items?.map((item, idx) => (
                      <div key={idx} className="flex items-start gap-3">
                        <span className="bg-blue-100 text-blue-700 text-sm font-bold min-w-7 h-7 rounded-full flex items-center justify-center shrink-0">
                          {item.quantity}
                        </span>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-gray-800 text-sm">{item.name}</p>
                          {/* UC7 AF1: Ghi chú đặc biệt */}
                          {item.note && (
                            <div className="mt-0.5 inline-flex items-center gap-1 text-xs bg-amber-50 border border-amber-200 text-amber-700 rounded-lg px-2 py-0.5">
                              <span>📝</span> {item.note}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* UC7: Barista nhấn Hoàn thành */}
                  <button
                    onClick={() => handleComplete(order.order_id)}
                    disabled={completing[order.order_id]}
                    className="btn-success w-full flex items-center justify-center gap-2"
                  >
                    {completing[order.order_id] ? (
                      <>
                        <span className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full"/>
                        Đang cập nhật...
                      </>
                    ) : '✅ Hoàn thành'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* UC6: Barista muốn làm mới? */}
        {orders.length > 0 && (
          <p className="text-center text-xs text-gray-400 mt-6">
            Tự động làm mới sau {countdown}s
            {lastRefresh && ` • Cập nhật: ${lastRefresh.toLocaleTimeString('vi-VN')}`}
          </p>
        )}
      </div>
    </div>
  )
}
