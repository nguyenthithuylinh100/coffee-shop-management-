import { useEffect, useState } from 'react'
import api from '../services/api'

function fmt(n) {
  return new Intl.NumberFormat('vi-VN').format(n) + '₫'
}

// UC5: Process Payment
// Luồng: Thu ngân yêu cầu → Hiển thị phương thức → Chọn phương thức →
//   [Tiền mặt] Nhận tiền → Đủ? → Ghi nhận / Báo thiếu
//   [Chuyển khoản] Hiển thị QR → Nhận được tiền? → Ghi nhận / Thất bại
//   [Thẻ/POS] Quẹt thẻ → Kết quả? → Ghi nhận / Báo lỗi thẻ
// → Trạng thái == Thành công? → Cập nhật DB → In hóa đơn → Giao hóa đơn

export default function PaymentPanel({ bills, onPaymentSuccess, onRefresh }) {
  const [selectedBill, setSelectedBill] = useState(null)
  const [step, setStep]                 = useState('select') // select | method | cash | qr | card | done | failed
  const [method, setMethod]             = useState(null)
  const [cashReceived, setCashReceived] = useState('')
  const [loading, setLoading]           = useState(false)
  const [refreshing, setRefreshing]     = useState(false)
  const [failReason, setFailReason]     = useState('')
  const [doneData, setDoneData]         = useState(null)

  const getOrderProgress = (bill) => {
    const orders = bill?.orders || []
    const total = orders.length
    const completed = orders.filter(o => o.status === 'Completed').length
    const pending = total - completed
    return { total, completed, pending, allCompleted: pending === 0 }
  }

  const reset = () => {
    setSelectedBill(null); setStep('select'); setMethod(null)
    setCashReceived(''); setFailReason(''); setDoneData(null)
  }

  // Chọn bill → bước chọn phương thức
  const handleSelectBill = (bill) => {
    setSelectedBill(bill)
    setStep('method')
    setMethod(null)
    setCashReceived('')
    setFailReason('')
  }

  // Chọn phương thức → vào nhánh tương ứng
  const handleSelectMethod = (m) => {
    setMethod(m)
    if (m === 'Cash')      setStep('cash')
    else if (m === 'QR')   setStep('qr')
    else if (m === 'Card') setStep('card')
  }

  // Gọi API thanh toán chung
  const doPayment = async (extraPayload = {}) => {
    setLoading(true)
    try {
      const res = await api.post('/payment', {
        bill_id:        selectedBill.bill_id,
        payment_method: method === 'QR' ? 'E-wallet' : method,
        ...extraPayload,
      })
      setDoneData(res.data)
      setStep('done')
      onPaymentSuccess()
    } catch (err) {
      setFailReason(err.response?.data?.error || 'Giao dịch thất bại')
      setStep('failed')
    } finally {
      setLoading(false)
    }
  }

  const change = method === 'Cash' && cashReceived && selectedBill
    ? parseFloat(cashReceived) - selectedBill.amount
    : null

  const selectedProgress = selectedBill ? getOrderProgress(selectedBill) : null

  // Keep selected bill status in sync after refresh/polling.
  useEffect(() => {
    if (!selectedBill) return
    const latest = bills.find(b => b.bill_id === selectedBill.bill_id)
    if (!latest) {
      reset()
      return
    }
    setSelectedBill(latest)
  }, [bills, selectedBill])

  // Poll unpaid bills periodically so cashier sees barista completion sooner.
  useEffect(() => {
    if (!onRefresh) return undefined
    const id = setInterval(() => {
      onRefresh()
    }, 10000)
    return () => clearInterval(id)
  }, [onRefresh])

  const handleRefresh = async () => {
    if (!onRefresh) return
    setRefreshing(true)
    try {
      await onRefresh()
    } finally {
      setRefreshing(false)
    }
  }

  /* ─────────────── STEP: select bill ─────────────── */
  if (step === 'select') return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-bold text-gray-800">Chọn Bill cần thanh toán</h3>
        <button onClick={handleRefresh} className="btn-ghost text-xs" disabled={refreshing}>
          {refreshing ? 'Đang làm mới...' : '🔄 Làm mới trạng thái'}
        </button>
      </div>
      {bills.length === 0 ? (
        <div className="text-center py-10 text-gray-400">
          <div className="text-4xl mb-2">🎉</div>
          <p className="text-sm font-medium">Không có bill nào chờ thanh toán</p>
        </div>
      ) : (
        <div className="space-y-2">
          {bills.map(bill => {
            const progress = getOrderProgress(bill)
            return (
            <button
              key={bill.bill_id}
              onClick={() => handleSelectBill(bill)}
              className="card-hover w-full text-left"
            >
              <div className="flex justify-between items-center">
                <div>
                  <p className="font-bold text-gray-800">Bàn {bill.table_number}</p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {bill.orders?.length || 0} order • Mở lúc {bill.created_at ? new Date(bill.created_at).toLocaleTimeString('vi-VN', {hour:'2-digit',minute:'2-digit'}) : ''}
                  </p>
                  <p className={`text-xs mt-1 font-medium ${progress.allCompleted ? 'text-emerald-600' : 'text-orange-600'}`}>
                    {progress.completed}/{progress.total} order đã hoàn thành
                    {progress.pending > 0 ? ` • còn ${progress.pending} đang pha` : ''}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-amber-700 text-lg">{fmt(bill.amount)}</p>
                  <span className="badge-unpaid">Chưa thanh toán</span>
                </div>
              </div>
            </button>
            )
          })}
        </div>
      )}
    </div>
  )

  /* ─────────────── STEP: choose method ─────────────── */
  if (step === 'method') return (
    <div>
      <div className="flex items-center gap-2 mb-4">
        <button onClick={reset} className="btn-ghost p-1 text-sm">← Quay lại</button>
        <h3 className="font-bold text-gray-800">Bàn {selectedBill.table_number} — {fmt(selectedBill.amount)}</h3>
      </div>

      {/* Bill summary */}
      <div className="bg-gray-50 rounded-xl p-3 mb-4 max-h-48 overflow-y-auto">
        {selectedProgress && (
          <div className={`mb-3 rounded-xl px-3 py-2 text-xs font-medium border ${
            selectedProgress.allCompleted
              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
              : 'bg-orange-50 text-orange-700 border-orange-200'
          }`}>
            {selectedProgress.allCompleted
              ? `✅ Tất cả ${selectedProgress.total} order đã hoàn thành, có thể thanh toán`
              : `⏳ Mới hoàn thành ${selectedProgress.completed}/${selectedProgress.total} order. Vui lòng đợi Barista hoàn tất trước khi thanh toán`}
          </div>
        )}
        {selectedBill.orders?.map(order => (
          <div key={order.order_id} className="mb-2 last:mb-0">
            <p className="text-xs font-bold text-gray-400 mb-1 flex items-center gap-2">
              <span>Order #{order.order_id}</span>
              <span className={`px-2 py-0.5 rounded-full text-[10px] ${
                order.status === 'Completed'
                  ? 'bg-emerald-100 text-emerald-700'
                  : 'bg-blue-100 text-blue-700'
              }`}>
                {order.status === 'Completed' ? 'Đã xong' : 'Đang pha'}
              </span>
            </p>
            {order.items?.map(item => (
              <div key={item.order_item_id} className="flex justify-between text-sm py-0.5">
                <span className="text-gray-700">{item.name} × {item.quantity}</span>
                <span className="text-gray-500 font-medium">{fmt(item.subtotal)}</span>
              </div>
            ))}
          </div>
        ))}
        <div className="divider"/>
        <div className="flex justify-between font-bold">
          <span>Tổng cộng</span>
          <span className="text-amber-700">{fmt(selectedBill.amount)}</span>
        </div>
      </div>

      {/* Hiển thị phương thức thanh toán */}
      <p className="section-title">Chọn phương thức thanh toán</p>
      <div className="grid grid-cols-3 gap-3">
        {[
          { key: 'Cash', icon: '💵', label: 'Tiền mặt' },
          { key: 'QR',   icon: '📱', label: 'Chuyển khoản QR' },
          { key: 'Card', icon: '💳', label: 'Thẻ / POS' },
        ].map(m => (
          <button
            key={m.key}
            onClick={() => handleSelectMethod(m.key)}
            disabled={!selectedProgress?.allCompleted}
            className="flex flex-col items-center gap-2 p-4 rounded-2xl border-2 border-gray-200 hover:border-amber-400 hover:bg-amber-50 transition-all"
          >
            <span className="text-3xl">{m.icon}</span>
            <span className="text-xs font-semibold text-gray-700 text-center">{m.label}</span>
          </button>
        ))}
      </div>
      {!selectedProgress?.allCompleted && (
        <p className="text-xs text-orange-600 mt-3 text-center">
          Chưa thể thanh toán vì vẫn còn order đang pha chế.
        </p>
      )}
    </div>
  )

  /* ─────────────── STEP: cash payment ─────────────── */
  if (step === 'cash') return (
    <div>
      <div className="flex items-center gap-2 mb-4">
        <button onClick={() => setStep('method')} className="btn-ghost p-1 text-sm">← Quay lại</button>
        <h3 className="font-bold text-gray-800">💵 Thanh toán tiền mặt</h3>
      </div>
      <div className="bg-amber-50 rounded-xl p-4 mb-4 text-center">
        <p className="text-sm text-gray-600 mb-1">Số tiền cần thu</p>
        <p className="text-3xl font-bold text-amber-700">{fmt(selectedBill.amount)}</p>
      </div>
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-1.5">Tiền khách đưa (VND)</label>
        <input
          type="number"
          className="input-field text-lg font-bold text-center"
          placeholder="Nhập số tiền..."
          value={cashReceived}
          onChange={e => setCashReceived(e.target.value)}
          min={0}
          step="1000"
          autoFocus
        />
        {change !== null && change >= 0 && (
          <div className="mt-2 bg-emerald-50 border border-emerald-200 rounded-xl px-3 py-2 text-center">
            <p className="text-xs text-gray-500">Tiền thối lại</p>
            <p className="text-xl font-bold text-emerald-700">{fmt(change)}</p>
          </div>
        )}
        {change !== null && change < 0 && (
          <div className="mt-2 bg-red-50 border border-red-200 rounded-xl px-3 py-2 text-center">
            <p className="text-sm text-red-600 font-medium">⚠ Tiền không đủ ({fmt(Math.abs(change))} thiếu)</p>
          </div>
        )}
      </div>
      <div className="flex gap-2">
        <button onClick={() => setStep('method')} className="btn-secondary flex-1">Hủy</button>
        <button
          onClick={() => doPayment({ amount_received: parseFloat(cashReceived) })}
          disabled={loading || !cashReceived || change < 0}
          className="btn-success flex-1"
        >
          {loading ? <span className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full inline-block"/> : '✅ Xác nhận đã thu'}
        </button>
      </div>
    </div>
  )

  /* ─────────────── STEP: QR payment ─────────────── */
  if (step === 'qr') return (
    <div>
      <div className="flex items-center gap-2 mb-4">
        <button onClick={() => setStep('method')} className="btn-ghost p-1 text-sm">← Quay lại</button>
        <h3 className="font-bold text-gray-800">📱 Chuyển khoản QR</h3>
      </div>
      <div className="text-center mb-4">
        {/* QR placeholder */}
        <div className="w-40 h-40 bg-gray-100 border-2 border-dashed border-gray-300 rounded-2xl mx-auto flex items-center justify-center">
          <div className="text-center">
            <p className="text-3xl mb-1">📱</p>
            <p className="text-xs text-gray-500">QR Code</p>
          </div>
        </div>
        <p className="mt-3 text-2xl font-bold text-amber-700">{fmt(selectedBill.amount)}</p>
        <p className="text-xs text-gray-500 mt-1">Yêu cầu khách quét mã và xác nhận</p>
      </div>
      <div className="flex gap-2">
        <button onClick={() => { setFailReason('Giao dịch bị hủy/lỗi'); setStep('failed') }} className="btn-secondary flex-1">
          Hủy / Lỗi
        </button>
        <button onClick={() => doPayment()} disabled={loading} className="btn-success flex-1">
          {loading ? <span className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full inline-block"/> : '✅ Đã nhận được tiền'}
        </button>
      </div>
    </div>
  )

  /* ─────────────── STEP: card/POS payment ─────────────── */
  if (step === 'card') return (
    <div>
      <div className="flex items-center gap-2 mb-4">
        <button onClick={() => setStep('method')} className="btn-ghost p-1 text-sm">← Quay lại</button>
        <h3 className="font-bold text-gray-800">💳 Quẹt thẻ / POS</h3>
      </div>
      <div className="bg-blue-50 border border-blue-100 rounded-2xl p-6 text-center mb-4">
        <p className="text-4xl mb-3">💳</p>
        <p className="text-sm text-gray-600 mb-1">Yêu cầu khách quẹt thẻ tại máy POS</p>
        <p className="text-2xl font-bold text-blue-700">{fmt(selectedBill.amount)}</p>
      </div>
      <div className="flex gap-2">
        <button
          onClick={() => { setFailReason('Thẻ bị từ chối hoặc lỗi kết nối POS'); setStep('failed') }}
          className="btn-secondary flex-1"
        >
          ❌ Thẻ lỗi / Từ chối
        </button>
        <button onClick={() => doPayment()} disabled={loading} className="btn-success flex-1">
          {loading ? <span className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full inline-block"/> : '✅ Giao dịch thành công'}
        </button>
      </div>
    </div>
  )

  /* ─────────────── STEP: failed → yêu cầu chọn lại ─────────────── */
  if (step === 'failed') return (
    <div className="text-center py-6">
      <div className="text-5xl mb-3">❌</div>
      <h3 className="font-bold text-gray-800 text-lg mb-1">Giao dịch thất bại</h3>
      <p className="text-sm text-gray-500 mb-2">{failReason}</p>
      <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-2 mb-6 text-sm text-red-700">
        Trạng thái Bill đã được ghi nhận là <strong>Thất bại</strong>
      </div>
      <div className="flex gap-2">
        <button onClick={reset} className="btn-secondary flex-1">Chọn Bill khác</button>
        {/* Yêu cầu chọn lại phương thức theo sơ đồ activity */}
        <button onClick={() => setStep('method')} className="btn-warning flex-1">
          🔄 Thử lại / Đổi phương thức
        </button>
      </div>
    </div>
  )

  /* ─────────────── STEP: done ─────────────── */
  if (step === 'done') return (
    <div className="text-center py-6">
      <div className="text-6xl mb-3">🎉</div>
      <h3 className="font-bold text-gray-800 text-xl mb-1">Thanh toán thành công!</h3>
      <p className="text-gray-500 text-sm mb-4">
        Bàn {selectedBill?.table_number} đã được giải phóng
      </p>
      {method === 'Cash' && doneData?.change > 0 && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-2xl px-6 py-4 mb-4">
          <p className="text-sm text-gray-600">Tiền thối lại cho khách</p>
          <p className="text-3xl font-bold text-emerald-700">{fmt(doneData.change)}</p>
        </div>
      )}
      {/* In hóa đơn */}
      <div className="bg-gray-50 rounded-2xl px-4 py-3 mb-4 text-sm text-gray-600 flex items-center gap-2 justify-center">
        <span>🖨️</span>
        <span>Hóa đơn đã được lưu — nhấn In để in cho khách</span>
      </div>
      <div className="flex gap-2">
        <button onClick={reset} className="btn-primary flex-1">✓ Hoàn tất</button>
        <button className="btn-secondary flex-1" onClick={() => window.print()}>🖨️ In hóa đơn</button>
      </div>
    </div>
  )

  return null
}
