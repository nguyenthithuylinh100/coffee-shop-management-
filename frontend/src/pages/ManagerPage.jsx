import { useState, useEffect, useMemo } from 'react'
import Navbar from '../components/Navbar'
import api    from '../services/api'

function fmt(n) {
  return new Intl.NumberFormat('vi-VN').format(n) + '₫'
}

function Toast({ msg }) {
  if (!msg) return null
  return (
    <div className="fixed top-4 right-4 z-50 bg-gray-900 text-white text-sm font-semibold
                    px-4 py-2.5 rounded-2xl shadow-xl animate-pulse">
      {msg}
    </div>
  )
}

// Ô tìm kiếm dùng chung
function SearchBox({ value, onChange, placeholder = 'Tìm kiếm...' }) {
  return (
    <div className="relative">
      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">🔍</span>
      <input
        type="text"
        className="input-field pl-8 pr-3"
        placeholder={placeholder}
        value={value}
        onChange={e => onChange(e.target.value)}
      />
    </div>
  )
}

// ══════════════════════════════════════════════════════════
//  UC8: Manage Menu
// ══════════════════════════════════════════════════════════
function MenuTab() {
  const [items, setItems]           = useState([])
  const [search, setSearch]         = useState('')
  const [filterCat, setFilterCat]   = useState('all')    // 'all' | category name
  const [filterAvail, setFilterAvail] = useState('all')  // 'all' | 'available' | 'unavailable'
  const [form, setForm]             = useState({ name: '', price: '', category: '', is_available: true })
  const [editing, setEditing]       = useState(null)
  const [showForm, setShowForm]     = useState(false)
  const [errors, setErrors]         = useState({})
  const [toast, setToast]           = useState('')

  const load = async () => { const r = await api.get('/menu/all'); setItems(r.data) }
  useEffect(() => { load() }, [])
  const showToast = msg => { setToast(msg); setTimeout(() => setToast(''), 3000) }

  // Tất cả category từ dữ liệu
  const allCategories = useMemo(() => [...new Set(items.map(i => i.category || 'Khác'))], [items])

  // Lọc + tìm kiếm
  const filtered = useMemo(() => {
    return items.filter(item => {
      const matchSearch = !search ||
        item.name.toLowerCase().includes(search.toLowerCase()) ||
        (item.category || '').toLowerCase().includes(search.toLowerCase())
      const matchCat = filterCat === 'all' || (item.category || 'Khác') === filterCat
      const matchAvail =
        filterAvail === 'all' ||
        (filterAvail === 'available'   &&  item.is_available) ||
        (filterAvail === 'unavailable' && !item.is_available)
      return matchSearch && matchCat && matchAvail
    })
  }, [items, search, filterCat, filterAvail])

  // Nhóm theo category sau khi filter
  const grouped = useMemo(() => {
    const map = {}
    filtered.forEach(item => {
      const cat = item.category || 'Khác'
      if (!map[cat]) map[cat] = []
      map[cat].push(item)
    })
    return map
  }, [filtered])

  const validate = () => {
    const e = {}
    if (!form.name.trim())        e.name  = 'Tên món không được trống'
    if (!form.price || +form.price <= 0) e.price = 'Giá phải lớn hơn 0'
    setErrors(e)
    return !Object.keys(e).length
  }

  const handleSubmit = async ev => {
    ev.preventDefault()
    if (!validate()) return
    try {
      if (editing) {
        await api.put(`/menu/${editing}`, { ...form, price: parseFloat(form.price) })
        showToast('✅ Cập nhật món thành công')
        setEditing(null)
      } else {
        await api.post('/menu', { ...form, price: parseFloat(form.price) })
        showToast('✅ Thêm món mới thành công')
      }
      setForm({ name: '', price: '', category: '', is_available: true })
      setErrors({})
      setShowForm(false)
      load()
    } catch (err) {
      showToast('❌ ' + (err.response?.data?.error || 'Lỗi'))
    }
  }

  const handleEdit = item => {
    setForm({ name: item.name, price: item.price, category: item.category || '', is_available: item.is_available })
    setEditing(item.menu_item_id)
    setErrors({})
    setShowForm(true)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleToggle = async item => {
    await api.put(`/menu/${item.menu_item_id}`, { is_available: !item.is_available })
    showToast(item.is_available ? `⏸ "${item.name}" tạm ngưng` : `▶ "${item.name}" đã mở lại`)
    load()
  }

  const handleDelete = async id => {
    if (!confirm('Xác nhận xoá món này?')) return
    await api.delete(`/menu/${id}`)
    showToast('🗑 Đã xoá')
    load()
  }

  return (
    <div>
      <Toast msg={toast} />

      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-bold text-gray-800">
          Menu
          <span className="ml-2 text-sm font-normal text-gray-400">
            ({filtered.length}/{items.length} món)
          </span>
        </h2>
        <button
          onClick={() => {
            setShowForm(!showForm)
            setEditing(null)
            setErrors({})
            setForm({ name: '', price: '', category: '', is_available: true })
          }}
          className="btn-primary text-sm"
        >
          {showForm ? '✕ Đóng' : '+ Thêm món'}
        </button>
      </div>

      {/* Form thêm/sửa */}
      {showForm && (
        <div className="card mb-4 border-2 border-amber-200">
          <h3 className="font-bold text-gray-800 mb-4">
            {editing ? '✏️ Sửa món' : '➕ Thêm món mới'}
          </h3>
          <form onSubmit={handleSubmit} className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-gray-600 mb-1 block">Tên món *</label>
                <input
                  className={`input-field ${errors.name ? 'border-red-400' : ''}`}
                  value={form.name}
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  placeholder="VD: Cà phê đen"
                />
                {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-600 mb-1 block">Giá (VNĐ) *</label>
                <input
                  type="number" min="0" step="1000"
                  className={`input-field ${errors.price ? 'border-red-400' : ''}`}
                  value={form.price}
                  onChange={e => setForm(f => ({ ...f, price: e.target.value }))}
                  placeholder="VD: 30000"
                />
                {errors.price && <p className="text-red-500 text-xs mt-1">{errors.price}</p>}
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-600 mb-1 block">Danh mục</label>
                <input
                  className="input-field" list="cats-suggest"
                  value={form.category}
                  onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
                  placeholder="Cà Phê, Trà, Đồ Ăn..."
                />
                <datalist id="cats-suggest">
                  {allCategories.map(c => <option key={c} value={c} />)}
                </datalist>
              </div>
              <div className="flex items-center gap-2 pt-5">
                <input
                  type="checkbox" id="avail-check"
                  checked={form.is_available}
                  onChange={e => setForm(f => ({ ...f, is_available: e.target.checked }))}
                  className="w-4 h-4 accent-amber-600"
                />
                <label htmlFor="avail-check" className="text-sm text-gray-700 font-medium">
                  Đang bán
                </label>
              </div>
            </div>
            <div className="flex gap-2 pt-1">
              <button type="button" onClick={() => { setShowForm(false); setEditing(null) }} className="btn-secondary flex-1">Hủy</button>
              <button type="submit" className="btn-primary flex-1">{editing ? 'Lưu thay đổi' : 'Thêm mới'}</button>
            </div>
          </form>
        </div>
      )}

      {/* ── Thanh tìm kiếm & lọc ── */}
      <div className="flex flex-wrap gap-2 mb-4">
        {/* Tìm kiếm */}
        <div className="flex-1 min-w-[200px]">
          <SearchBox
            value={search}
            onChange={setSearch}
            placeholder="Tìm tên món, danh mục..."
          />
        </div>

        {/* Lọc theo danh mục */}
        <select
          className="input-field w-auto min-w-[130px]"
          value={filterCat}
          onChange={e => setFilterCat(e.target.value)}
        >
          <option value="all">Tất cả danh mục</option>
          {allCategories.map(cat => (
            <option key={cat} value={cat}>{cat}</option>
          ))}
        </select>

        {/* Lọc theo trạng thái */}
        <div className="flex rounded-xl overflow-hidden border border-gray-200 text-sm">
          {[
            { key: 'all',          label: 'Tất cả' },
            { key: 'available',    label: '✅ Đang bán' },
            { key: 'unavailable',  label: '⏸ Tạm ngưng' },
          ].map(f => (
            <button
              key={f.key}
              onClick={() => setFilterAvail(f.key)}
              className={`px-3 py-2 font-medium transition-colors border-r last:border-r-0 border-gray-200 ${
                filterAvail === f.key
                  ? 'bg-amber-600 text-white'
                  : 'bg-white text-gray-600 hover:bg-gray-50'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Kết quả tìm kiếm */}
      {filtered.length === 0 ? (
        <div className="text-center py-10 text-gray-400">
          <div className="text-4xl mb-2">🔍</div>
          <p className="font-medium">Không tìm thấy món nào</p>
          <button onClick={() => { setSearch(''); setFilterCat('all'); setFilterAvail('all') }}
            className="text-amber-600 text-sm mt-2 hover:underline">
            Xoá bộ lọc
          </button>
        </div>
      ) : (
        Object.entries(grouped).map(([cat, catItems]) => (
          <div key={cat} className="mb-5">
            <div className="flex items-center gap-2 mb-2">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">{cat}</p>
              <span className="text-xs text-gray-300">({catItems.length})</span>
            </div>
            <div className="space-y-2">
              {catItems.map(item => (
                <div
                  key={item.menu_item_id}
                  className={`card flex items-center gap-3 transition-opacity ${!item.is_available ? 'opacity-50' : ''}`}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-semibold text-gray-800">{item.name}</p>
                      <span className={
                        item.is_available
                          ? 'bg-emerald-100 text-emerald-700 text-xs font-semibold px-2 py-0.5 rounded-full'
                          : 'bg-red-100 text-red-700 text-xs font-semibold px-2 py-0.5 rounded-full'
                      }>
                        {item.is_available ? 'Đang bán' : 'Tạm ngưng'}
                      </span>
                    </div>
                    <p className="text-sm font-bold text-amber-700 mt-0.5">{fmt(item.price)}</p>
                  </div>
                  <div className="flex gap-1.5 shrink-0 flex-wrap justify-end">
                    <button
                      onClick={() => handleToggle(item)}
                      className={`text-xs py-1.5 px-3 rounded-lg border font-semibold transition-colors ${
                        item.is_available
                          ? 'border-orange-200 text-orange-700 hover:bg-orange-50'
                          : 'border-emerald-200 text-emerald-700 hover:bg-emerald-50'
                      }`}
                    >
                      {item.is_available ? '⏸ Ngưng' : '▶ Mở lại'}
                    </button>
                    <button onClick={() => handleEdit(item)} className="btn-secondary text-xs py-1.5 px-3">✏️ Sửa</button>
                    <button onClick={() => handleDelete(item.menu_item_id)} className="btn-danger text-xs py-1.5 px-3">🗑</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))
      )}
    </div>
  )
}

// ══════════════════════════════════════════════════════════
//  UC9: Manage Inventory
// ══════════════════════════════════════════════════════════
function InventoryTab() {
  const [items, setItems]       = useState([])
  const [search, setSearch]     = useState('')
  const [filterStatus, setFilterStatus] = useState('all') // 'all' | 'low' | 'ok'
  const [inputs, setInputs]     = useState({})  // { id: { value, mode } }
  const [form, setForm]         = useState({ ingredient_name: '', quantity: '', unit: '', min_quantity: '' })
  const [showForm, setShowForm] = useState(false)
  const [toast, setToast]       = useState('')

  const load = async () => { const r = await api.get('/inventory'); setItems(r.data) }
  useEffect(() => { load() }, [])
  const showToast = msg => { setToast(msg); setTimeout(() => setToast(''), 3000) }

  // Lọc + tìm kiếm kho
  const filtered = useMemo(() => {
    return items.filter(item => {
      const matchSearch = !search ||
        item.ingredient_name.toLowerCase().includes(search.toLowerCase()) ||
        (item.unit || '').toLowerCase().includes(search.toLowerCase())
      const matchStatus =
        filterStatus === 'all' ||
        (filterStatus === 'low' &&  item.is_low) ||
        (filterStatus === 'ok'  && !item.is_low)
      return matchSearch && matchStatus
    })
  }, [items, search, filterStatus])

  const lowCount = items.filter(i => i.is_low).length

  const handleUpdate = async (item) => {
    const inp = inputs[item.inventory_id]
    if (!inp || inp.value === '') return
    const val = parseFloat(inp.value)
    if (isNaN(val) || val < 0) { showToast('❌ Số lượng không hợp lệ'); return }
    // add = cộng dồn, set = ghi đè
    const newQty = inp.mode === 'add' ? item.quantity + val : val
    try {
      await api.put(`/inventory/${item.inventory_id}`, { quantity: newQty })
      showToast(inp.mode === 'add'
        ? `✅ Nhập thêm ${val} ${item.unit} → Tồn mới: ${newQty} ${item.unit}`
        : `✅ Điều chỉnh tồn kho → ${newQty} ${item.unit}`)
      setInputs(prev => { const n = { ...prev }; delete n[item.inventory_id]; return n })
      load()
    } catch (err) {
      showToast('❌ ' + (err.response?.data?.error || 'Lỗi'))
    }
  }

  const handleCreate = async e => {
    e.preventDefault()
    try {
      await api.post('/inventory', {
        ...form,
        quantity:     parseFloat(form.quantity),
        min_quantity: parseFloat(form.min_quantity || 0),
      })
      setForm({ ingredient_name: '', quantity: '', unit: '', min_quantity: '' })
      setShowForm(false)
      showToast('✅ Thêm nguyên liệu thành công')
      load()
    } catch (err) {
      showToast('❌ ' + (err.response?.data?.error || 'Lỗi'))
    }
  }

  return (
    <div>
      <Toast msg={toast} />

      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <h2 className="font-bold text-gray-800">
            Kho Nguyên Liệu
            <span className="ml-2 text-sm font-normal text-gray-400">
              ({filtered.length}/{items.length})
            </span>
          </h2>
          {lowCount > 0 && (
            <span className="bg-red-100 text-red-700 text-xs font-bold px-2.5 py-0.5 rounded-full">
              ⚠ {lowCount} sắp hết
            </span>
          )}
        </div>
        <button onClick={() => setShowForm(!showForm)} className="btn-primary text-sm">
          {showForm ? '✕ Đóng' : '+ Thêm nguyên liệu'}
        </button>
      </div>

      {/* Form thêm nguyên liệu */}
      {showForm && (
        <form onSubmit={handleCreate} className="card mb-4 border-2 border-amber-200">
          <h3 className="font-bold text-gray-800 mb-3">Thêm nguyên liệu mới</h3>
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <label className="text-xs font-semibold text-gray-600 mb-1 block">Tên nguyên liệu *</label>
              <input className="input-field" value={form.ingredient_name}
                onChange={e => setForm(f => ({ ...f, ingredient_name: e.target.value }))} required />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-600 mb-1 block">Số lượng ban đầu</label>
              <input type="number" min="0" className="input-field" value={form.quantity}
                onChange={e => setForm(f => ({ ...f, quantity: e.target.value }))} required />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-600 mb-1 block">Đơn vị</label>
              <input className="input-field" list="units-suggest" placeholder="g, ml, cái..."
                value={form.unit} onChange={e => setForm(f => ({ ...f, unit: e.target.value }))} />
              <datalist id="units-suggest">
                {['g', 'kg', 'ml', 'l', 'cái', 'miếng', 'hộp'].map(u => <option key={u} value={u} />)}
              </datalist>
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-600 mb-1 block">Ngưỡng cảnh báo</label>
              <input type="number" min="0" className="input-field" value={form.min_quantity}
                onChange={e => setForm(f => ({ ...f, min_quantity: e.target.value }))} />
            </div>
          </div>
          <div className="flex gap-2 mt-3">
            <button type="button" onClick={() => setShowForm(false)} className="btn-secondary flex-1">Hủy</button>
            <button type="submit" className="btn-primary flex-1">Thêm mới</button>
          </div>
        </form>
      )}

      {/* ── Tìm kiếm & lọc kho ── */}
      <div className="flex flex-wrap gap-2 mb-4">
        <div className="flex-1 min-w-[200px]">
          <SearchBox
            value={search}
            onChange={setSearch}
            placeholder="Tìm nguyên liệu, đơn vị..."
          />
        </div>
        <div className="flex rounded-xl overflow-hidden border border-gray-200 text-sm">
          {[
            { key: 'all', label: 'Tất cả' },
            { key: 'low', label: `⚠ Sắp hết (${lowCount})` },
            { key: 'ok',  label: '✅ Bình thường' },
          ].map(f => (
            <button
              key={f.key}
              onClick={() => setFilterStatus(f.key)}
              className={`px-3 py-2 font-medium transition-colors border-r last:border-r-0 border-gray-200 ${
                filterStatus === f.key
                  ? 'bg-amber-600 text-white'
                  : 'bg-white text-gray-600 hover:bg-gray-50'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Danh sách */}
      {filtered.length === 0 ? (
        <div className="text-center py-10 text-gray-400">
          <div className="text-4xl mb-2">🔍</div>
          <p className="font-medium">Không tìm thấy nguyên liệu nào</p>
          <button onClick={() => { setSearch(''); setFilterStatus('all') }}
            className="text-amber-600 text-sm mt-2 hover:underline">Xoá bộ lọc</button>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map(item => {
            const inp   = inputs[item.inventory_id]
            const pct   = item.min_quantity > 0
              ? Math.min(100, Math.round((item.quantity / (item.min_quantity * 2)) * 100))
              : 100

            return (
              <div key={item.inventory_id} className={`card ${item.is_low ? 'border-red-200 bg-red-50' : ''}`}>
                <div className="flex items-start gap-3">
                  {/* Thông tin nguyên liệu */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-semibold text-gray-800">{item.ingredient_name}</p>
                      {item.is_low && (
                        <span className="bg-red-100 text-red-700 text-xs font-bold px-2 py-0.5 rounded-full">
                          ⚠ Sắp hết
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <p className={`text-sm font-bold ${item.is_low ? 'text-red-600' : 'text-gray-700'}`}>
                        {item.quantity} {item.unit}
                      </p>
                      <span className="text-xs text-gray-400">
                        / ngưỡng: {item.min_quantity} {item.unit}
                      </span>
                    </div>
                    {/* Progress bar tồn kho */}
                    <div className="mt-1.5 h-1.5 bg-gray-200 rounded-full overflow-hidden w-36">
                      <div
                        className={`h-full rounded-full transition-all ${item.is_low ? 'bg-red-400' : 'bg-emerald-400'}`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>

                  {/* Nhập hàng / điều chỉnh */}
                  <div className="flex flex-col gap-1.5 shrink-0">
                    {/* Toggle mode */}
                    <div className="flex rounded-xl overflow-hidden border border-gray-200 text-xs">
                      <button
                        onClick={() => setInputs(p => ({
                          ...p,
                          [item.inventory_id]: { value: p[item.inventory_id]?.value || '', mode: 'add' }
                        }))}
                        className={`px-2.5 py-1.5 font-semibold transition-colors ${
                          !inp || inp.mode === 'add'
                            ? 'bg-amber-600 text-white'
                            : 'bg-white text-gray-600 hover:bg-gray-50'
                        }`}
                      >
                        + Nhập hàng
                      </button>
                      <button
                        onClick={() => setInputs(p => ({
                          ...p,
                          [item.inventory_id]: { value: p[item.inventory_id]?.value || '', mode: 'set' }
                        }))}
                        className={`px-2.5 py-1.5 font-semibold transition-colors border-l border-gray-200 ${
                          inp?.mode === 'set'
                            ? 'bg-blue-600 text-white'
                            : 'bg-white text-gray-600 hover:bg-gray-50'
                        }`}
                      >
                        = Điều chỉnh
                      </button>
                    </div>

                    {/* Input + nút lưu */}
                    <div className="flex gap-1.5">
                      <input
                        type="number" min="0"
                        className="w-20 border border-gray-200 rounded-lg px-2 py-1.5 text-sm
                                   focus:outline-none focus:ring-2 focus:ring-amber-400"
                        placeholder={inp?.mode === 'set' ? 'Số mới' : 'Số thêm'}
                        value={inp?.value ?? ''}
                        onChange={e => setInputs(p => ({
                          ...p,
                          [item.inventory_id]: { mode: p[item.inventory_id]?.mode || 'add', value: e.target.value }
                        }))}
                        onKeyDown={e => e.key === 'Enter' && handleUpdate(item)}
                      />
                      <button
                        onClick={() => handleUpdate(item)}
                        disabled={!inp?.value}
                        className="btn-primary text-xs py-1.5 px-2.5 disabled:opacity-40"
                      >
                        Lưu
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

// ══════════════════════════════════════════════════════════
//  UC10: View Order History
// ══════════════════════════════════════════════════════════
function OrderHistoryTab() {
  const [bills, setBills]       = useState([])
  const [loading, setLoading]   = useState(false)
  const [searched, setSearched] = useState(false)
  const [search, setSearch]     = useState('')
  const [form, setForm]         = useState({ from: '', to: '' })
  const [selected, setSelected] = useState(null)

  const today = new Date().toISOString().split('T')[0]

  const handleSearch = async e => {
    e?.preventDefault()
    setLoading(true)
    setSearched(false)
    setSelected(null)
    try {
      const res = await api.get(`/payment/bills/history?from=${form.from}&to=${form.to}`)
      setBills(res.data)
    } catch {
      setBills([])
    } finally {
      setLoading(false)
      setSearched(true)
    }
  }

  const filtered = useMemo(() => {
    if (!search) return bills
    const q = search.toLowerCase()
    return bills.filter(b =>
      String(b.table_number).includes(q) ||
      String(b.bill_id).includes(q) ||
      (b.method || '').toLowerCase().includes(q)
    )
  }, [bills, search])

  const totalRevenue = filtered.reduce((s, b) => s + b.amount, 0)

  return (
    <div>
      <h2 className="font-bold text-gray-800 mb-4">Lịch Sử Đơn Hàng</h2>

      {/* Bộ lọc ngày */}
      <form onSubmit={handleSearch} className="card mb-4 border-amber-200">
        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">
          Chọn khoảng thời gian
        </p>
        <div className="grid grid-cols-2 gap-3 mb-3">
          <div>
            <label className="text-xs font-semibold text-gray-600 mb-1 block">Từ ngày</label>
            <input type="date" className="input-field" value={form.from} max={today}
              onChange={e => setForm(f => ({ ...f, from: e.target.value }))} required />
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-600 mb-1 block">Đến ngày</label>
            <input type="date" className="input-field" value={form.to} max={today}
              onChange={e => setForm(f => ({ ...f, to: e.target.value }))} required />
          </div>
        </div>
        <div className="flex gap-2 flex-wrap">
          {[
            { label: 'Hôm nay',
              from: today, to: today },
            { label: '7 ngày',
              from: new Date(Date.now() - 6*864e5).toISOString().split('T')[0], to: today },
            { label: '30 ngày',
              from: new Date(Date.now() - 29*864e5).toISOString().split('T')[0], to: today },
          ].map(p => (
            <button key={p.label} type="button"
              onClick={() => { setForm({ from: p.from, to: p.to }) }}
              className="btn-ghost text-xs py-1 px-3 border border-gray-200 rounded-lg">
              {p.label}
            </button>
          ))}
          <button type="submit" className="btn-primary text-sm ml-auto" disabled={loading}>
            {loading ? '...' : '🔍 Tìm kiếm'}
          </button>
        </div>
      </form>

      {searched && (
        bills.length === 0 ? (
          <div className="text-center py-10 text-gray-400">
            <div className="text-4xl mb-2">📭</div>
            <p className="font-medium">Không có đơn hàng trong khoảng thời gian này</p>
          </div>
        ) : (
          <div>
            {/* Tóm tắt */}
            <div className="grid grid-cols-3 gap-3 mb-4">
              <div className="card text-center">
                <p className="text-2xl font-bold text-blue-700">{filtered.length}</p>
                <p className="text-xs text-gray-500">Hóa đơn</p>
              </div>
              <div className="card text-center col-span-2">
                <p className="text-2xl font-bold text-amber-700">{fmt(totalRevenue)}</p>
                <p className="text-xs text-gray-500">Tổng doanh thu</p>
              </div>
            </div>

            {/* Tìm kiếm trong kết quả */}
            <div className="mb-3">
              <SearchBox
                value={search}
                onChange={setSearch}
                placeholder="Tìm theo bàn, bill ID, phương thức..."
              />
            </div>

            <div className="space-y-2">
              {filtered.map(bill => (
                <button key={bill.bill_id}
                  onClick={() => setSelected(selected?.bill_id === bill.bill_id ? null : bill)}
                  className="card-hover w-full text-left">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-semibold text-gray-800">
                        Bàn {bill.table_number} &nbsp;—&nbsp; Bill #{bill.bill_id}
                      </p>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {bill.payment_date
                          ? new Date(bill.payment_date).toLocaleString('vi-VN')
                          : ''}&nbsp;•&nbsp;
                        {bill.method === 'Cash' ? '💵 Tiền mặt'
                          : bill.method === 'E-wallet' ? '📱 Chuyển khoản'
                          : '💳 Thẻ'}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-amber-700">{fmt(bill.amount)}</p>
                      <span className="bg-emerald-100 text-emerald-700 text-xs font-semibold px-2 py-0.5 rounded-full">
                        Đã TT
                      </span>
                    </div>
                  </div>
                  {selected?.bill_id === bill.bill_id && (
                    <div className="mt-3 pt-3 border-t border-gray-100 text-left">
                      {bill.orders?.map(order => (
                        <div key={order.order_id} className="mb-2">
                          <p className="text-xs font-bold text-gray-400 mb-1">Order #{order.order_id}</p>
                          {order.items?.map(item => (
                            <div key={item.order_item_id} className="flex justify-between text-sm text-gray-600 py-0.5">
                              <span>{item.name} × {item.quantity}</span>
                              <span>{fmt(item.subtotal)}</span>
                            </div>
                          ))}
                        </div>
                      ))}
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>
        )
      )}
    </div>
  )
}

// ══════════════════════════════════════════════════════════
//  UC11: View Report
// ══════════════════════════════════════════════════════════
function ReportsTab() {
  const today = new Date().toISOString().split('T')[0]
  const month1 = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0]

  const [summary, setSummary]   = useState(null)
  const [daily, setDaily]       = useState([])
  const [hourly, setHourly]     = useState([])
  const [topItems, setTopItems] = useState([])
  const [catRev, setCatRev]     = useState([])
  const [form, setForm]         = useState({ from: month1, to: today })
  const [loading, setLoading]   = useState(false)
  const [reports, setReports]   = useState([])
  const [genForm, setGenForm]   = useState({ type_report:'', period_start: month1, period_end: today })
  const [toast, setToast]       = useState('')

  const showToast = m => { setToast(m); setTimeout(() => setToast(''), 3000) }

  const loadAll = async (f = form) => {
    setLoading(true)
    try {
      const qs = `?from=${f.from}&to=${f.to}`
      const [s, d, h, t, c, r] = await Promise.all([
        api.get('/reports/summary'),
        api.get(`/reports/revenue/daily${qs}`),
        api.get(`/reports/revenue/hourly${qs}`),
        api.get(`/reports/top-items${qs}&limit=8`),
        api.get(`/reports/revenue/category${qs}`),
        api.get('/reports'),
      ])
      setSummary(s.data); setDaily(d.data); setHourly(h.data)
      setTopItems(t.data); setCatRev(c.data); setReports(r.data)
    } catch(err) { showToast('❌ Lỗi tải báo cáo') }
    finally { setLoading(false) }
  }

  useEffect(() => { loadAll() }, [])

  const handleGenerate = async e => {
    e.preventDefault()
    try {
      await api.post('/reports', genForm)
      showToast('✅ Đã tạo báo cáo'); loadAll()
    } catch(err) { showToast('❌ ' + (err.response?.data?.error || 'Lỗi')) }
  }

  // Simple bar chart using divs
  const BarChart = ({ data, labelKey, valueKey, color='bg-amber-500', formatVal=v=>v }) => {
    const max = Math.max(...data.map(d=>d[valueKey]), 1)
    return (
      <div className="space-y-1.5">
        {data.map((d, i) => (
          <div key={i} className="flex items-center gap-2">
            <span className="text-xs text-gray-500 w-16 shrink-0 text-right">{d[labelKey]}</span>
            <div className="flex-1 bg-gray-100 rounded-full h-5 overflow-hidden">
              <div className={`h-full ${color} rounded-full flex items-center justify-end pr-1 transition-all`}
                style={{ width:`${Math.max(2,(d[valueKey]/max)*100)}%` }}>
                <span className="text-xs text-white font-semibold truncate">{formatVal(d[valueKey])}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    )
  }

  const totalRevenue = daily.reduce((s,d)=>s+d.revenue,0)
  const totalOrders  = daily.reduce((s,d)=>s+d.bills,0)
  const peakHour     = hourly.reduce((a,b)=>b.orders>a.orders?b:a, {hour:0,orders:0})

  return (
    <div>
      <Toast msg={toast} />
      <h2 className="font-bold text-gray-800 mb-4">Báo Cáo & Thống Kê</h2>

      {/* Today summary */}
      {summary && (
        <div className="grid grid-cols-3 gap-3 mb-6">
          {[
            { label:'Doanh thu hôm nay', v:fmt(summary.revenue_today), icon:'💰', c:'text-amber-700' },
            { label:'Bill đã TT hôm nay', v:summary.bills_paid_today,  icon:'🧾', c:'text-blue-700'  },
            { label:'Orders hôm nay',     v:summary.orders_today,       icon:'📋', c:'text-emerald-700' },
          ].map(s=>(
            <div key={s.label} className="card text-center">
              <div className="text-xl mb-1">{s.icon}</div>
              <p className={`text-xl font-bold ${s.c}`}>{s.v}</p>
              <p className="text-xs text-gray-500 mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>
      )}

      {/* Date range filter */}
      <div className="card mb-6 border-amber-200">
        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Chọn kỳ phân tích</p>
        <div className="grid grid-cols-2 gap-3 mb-3">
          <div>
            <label className="text-xs font-semibold text-gray-600 mb-1 block">Từ ngày</label>
            <input type="date" className="input-field" value={form.from} max={today}
              onChange={e => setForm(f=>({...f,from:e.target.value}))} />
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-600 mb-1 block">Đến ngày</label>
            <input type="date" className="input-field" value={form.to} max={today}
              onChange={e => setForm(f=>({...f,to:e.target.value}))} />
          </div>
        </div>
        <div className="flex gap-2 flex-wrap">
          {[
            { label:'Tháng này', from:month1, to:today },
            { label:'7 ngày',   from:new Date(Date.now()-6*864e5).toISOString().split('T')[0], to:today },
            { label:'30 ngày',  from:new Date(Date.now()-29*864e5).toISOString().split('T')[0], to:today },
          ].map(p=>(
            <button key={p.label} type="button"
              onClick={() => { setForm({from:p.from,to:p.to}); loadAll({from:p.from,to:p.to}) }}
              className="btn-ghost text-xs py-1 px-3 border border-gray-200 rounded-lg">{p.label}</button>
          ))}
          <button onClick={() => loadAll(form)} disabled={loading}
            className="btn-primary text-sm ml-auto">{loading?'⏳ Đang tải...':'📊 Xem báo cáo'}</button>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-10 text-gray-400">⏳ Đang tải dữ liệu...</div>
      ) : (
        <div className="space-y-6">

          {/* Period summary */}
          {daily.length > 0 && (
            <div className="grid grid-cols-3 gap-3">
              <div className="card text-center">
                <p className="text-xl font-bold text-amber-700">{fmt(totalRevenue)}</p>
                <p className="text-xs text-gray-500">Tổng doanh thu</p>
              </div>
              <div className="card text-center">
                <p className="text-xl font-bold text-blue-700">{totalOrders}</p>
                <p className="text-xs text-gray-500">Tổng bill</p>
              </div>
              <div className="card text-center">
                <p className="text-xl font-bold text-emerald-700">{peakHour.label||`${peakHour.hour}:00`}</p>
                <p className="text-xs text-gray-500">Giờ cao điểm</p>
              </div>
            </div>
          )}

          {/* Daily revenue chart */}
          {daily.length > 0 && (
            <div className="card">
              <h3 className="font-bold text-gray-800 mb-4">📈 Doanh thu theo ngày</h3>
              <BarChart data={daily} labelKey="day" valueKey="revenue"
                color="bg-amber-500" formatVal={v=>fmt(v)} />
            </div>
          )}

          {/* Two-col: top items + category */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {topItems.length > 0 && (
              <div className="card">
                <h3 className="font-bold text-gray-800 mb-4">🏆 Món bán chạy</h3>
                <BarChart data={topItems} labelKey="name" valueKey="qty_sold"
                  color="bg-blue-500" formatVal={v=>`${v} ly`} />
              </div>
            )}

            {catRev.length > 0 && (
              <div className="card">
                <h3 className="font-bold text-gray-800 mb-4">📂 Doanh thu theo danh mục</h3>
                <div className="space-y-2">
                  {catRev.map((c,i) => (
                    <div key={i} className="flex justify-between items-center py-1.5 border-b border-gray-100 last:border-0">
                      <div>
                        <p className="text-sm font-semibold text-gray-800">{c.category}</p>
                        <p className="text-xs text-gray-500">{c.qty_sold} phần</p>
                      </div>
                      <p className="font-bold text-amber-700 text-sm">{fmt(c.revenue)}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Peak time chart */}
          {hourly.length > 0 && (
            <div className="card">
              <h3 className="font-bold text-gray-800 mb-4">⏰ Giờ cao điểm</h3>
              <BarChart data={hourly} labelKey="label" valueKey="orders"
                color="bg-emerald-500" formatVal={v=>`${v} đơn`} />
            </div>
          )}

          {/* No data message */}
          {daily.length === 0 && topItems.length === 0 && (
            <div className="text-center py-10 text-gray-400 card">
              <div className="text-4xl mb-2">📊</div>
              <p className="font-medium">Chưa có dữ liệu trong khoảng thời gian này</p>
              <p className="text-xs mt-1">Hãy chọn khoảng thời gian khác hoặc tạo thêm đơn hàng</p>
            </div>
          )}
        </div>
      )}

      {/* Generate & save report */}
      <div className="card mt-6 border-amber-200">
        <h3 className="font-bold text-gray-800 mb-3">💾 Tạo & Lưu Báo Cáo</h3>
        <form onSubmit={handleGenerate} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-gray-600 mb-1 block">Từ ngày</label>
              <input type="date" className="input-field" value={genForm.period_start} max={today}
                onChange={e=>setGenForm(f=>({...f,period_start:e.target.value}))} required />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-600 mb-1 block">Đến ngày</label>
              <input type="date" className="input-field" value={genForm.period_end} max={today}
                onChange={e=>setGenForm(f=>({...f,period_end:e.target.value}))} required />
            </div>
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-600 mb-1 block">Tên báo cáo</label>
            <input className="input-field" value={genForm.type_report}
              onChange={e=>setGenForm(f=>({...f,type_report:e.target.value}))}
              placeholder="VD: Tháng 4/2026" required />
          </div>
          <button type="submit" className="btn-primary w-full">💾 Lưu báo cáo</button>
        </form>
      </div>

      {/* Saved reports list */}
      {reports.length > 0 && (
        <div className="mt-4">
          <h3 className="font-bold text-gray-700 mb-2">Báo cáo đã lưu</h3>
          <div className="space-y-2">
            {reports.map(r=>(
              <div key={r.report_id} className="card flex justify-between items-center">
                <div>
                  <p className="font-semibold text-gray-800">{r.type_report}</p>
                  <p className="text-xs text-gray-500">
                    {new Date(r.period_start).toLocaleDateString('vi-VN')} →{' '}
                    {new Date(r.period_end).toLocaleDateString('vi-VN')} •{' '}
                    Tạo {new Date(r.created_at).toLocaleString('vi-VN')}
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <p className="font-bold text-amber-700">{fmt(r.total_revenue)}</p>
                  <p className="text-xs text-gray-500">{r.total_orders} orders</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// ══════════════════════════════════════════════════════════
//  ManagerPage container
// ══════════════════════════════════════════════════════════
export default function ManagerPage() {
  const [activeTab, setActiveTab] = useState('menu')

  const tabs = [
    { key: 'menu',     label: '🍽 Menu' },
    { key: 'inventory',label: '📦 Kho' },
    { key: 'history',  label: '🕐 Lịch Sử' },
    { key: 'reports',  label: '📊 Báo Cáo' },
  ]

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navbar title="Quản Lý" />

      <div className="bg-white border-b border-gray-100 shadow-sm">
        <div className="max-w-5xl mx-auto px-4 flex overflow-x-auto">
          {tabs.map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-5 py-3.5 text-sm font-semibold whitespace-nowrap border-b-2 transition-colors ${
                activeTab === tab.key
                  ? 'border-amber-600 text-amber-700'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 p-4 max-w-5xl mx-auto w-full">
        {activeTab === 'menu'      && <MenuTab />}
        {activeTab === 'inventory' && <InventoryTab />}
        {activeTab === 'history'   && <OrderHistoryTab />}
        {activeTab === 'reports'   && <ReportsTab />}
      </div>
    </div>
  )
}
