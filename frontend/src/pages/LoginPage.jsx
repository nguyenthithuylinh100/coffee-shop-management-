import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

// UC0: Login – mở màn hình → nhập thông tin → đăng nhập → redirect theo role
export default function LoginPage() {
  const [form, setForm]       = useState({ username: '', password: '' })
  const [error, setError]     = useState('')
  const [loading, setLoading] = useState(false)
  const [showPwd, setShowPwd] = useState(false)
  const { login }  = useAuth()
  const navigate   = useNavigate()

  const handleSubmit = async e => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const employee = await login(form.username, form.password)
      const map = { Cashier: '/cashier', Barista: '/barista', Manager: '/manager' }
      navigate(map[employee.role] || '/')
    } catch (err) {
      // UC0: Hiển thị thông báo lỗi khi thông tin sai
      setError(err.response?.data?.error || 'Tên đăng nhập hoặc mật khẩu không đúng')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex">
      {/* Left panel – branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-amber-900 via-amber-800 to-amber-700 flex-col items-center justify-center p-12 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10" style={{backgroundImage:'radial-gradient(circle at 20% 50%, white 1px, transparent 1px), radial-gradient(circle at 80% 20%, white 1px, transparent 1px)', backgroundSize:'60px 60px'}}/>
        <div className="relative text-center text-white">
          <div className="text-8xl mb-6">☕</div>
          <h1 className="text-4xl font-bold mb-3">Coffee Shop</h1>
          <p className="text-amber-200 text-lg">Management System</p>
          <div className="mt-12 space-y-3 text-left">
            {[
              { icon: '🧾', role: 'Thu Ngân', desc: 'Tạo order & thanh toán' },
              { icon: '☕', role: 'Barista',  desc: 'Quản lý pha chế' },
              { icon: '📊', role: 'Quản Lý', desc: 'Menu, kho & báo cáo' },
            ].map(r => (
              <div key={r.role} className="flex items-center gap-3 bg-white/10 rounded-xl px-4 py-3">
                <span className="text-2xl">{r.icon}</span>
                <div>
                  <p className="font-semibold text-white">{r.role}</p>
                  <p className="text-amber-200 text-sm">{r.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right panel – form */}
      <div className="flex-1 flex items-center justify-center p-6 bg-gray-50">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="lg:hidden text-center mb-8">
            <div className="text-5xl mb-2">☕</div>
            <h1 className="text-2xl font-bold text-gray-800">Coffee Shop</h1>
          </div>

          <div className="card shadow-lg p-8">
            <h2 className="text-xl font-bold text-gray-800 mb-1">Đăng nhập</h2>
            <p className="text-gray-500 text-sm mb-6">Vui lòng nhập thông tin tài khoản</p>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Tên đăng nhập
                </label>
                <input
                  type="text"
                  className="input-field"
                  placeholder="Nhập username..."
                  value={form.username}
                  onChange={e => setForm(f => ({ ...f, username: e.target.value }))}
                  autoFocus
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Mật khẩu
                </label>
                <div className="relative">
                  <input
                    type={showPwd ? 'text' : 'password'}
                    className="input-field pr-10"
                    placeholder="Nhập mật khẩu..."
                    value={form.password}
                    onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPwd(v => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-sm"
                  >
                    {showPwd ? '🙈' : '👁'}
                  </button>
                </div>
              </div>

              {/* UC0: Thông báo lỗi */}
              {error && (
                <div className="flex items-start gap-2 bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-3 py-2.5">
                  <span className="mt-0.5 shrink-0">⚠️</span>
                  <span>{error}</span>
                </div>
              )}

              <button
                type="submit"
                className="btn-primary w-full py-3 text-base mt-2"
                disabled={loading}
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="animate-spin inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full"/>
                    Đang đăng nhập...
                  </span>
                ) : 'Đăng nhập'}
              </button>
            </form>
          </div>

          {/* Demo accounts */}
          <div className="mt-4 p-4 bg-amber-50 border border-amber-100 rounded-2xl">
            <p className="text-xs font-bold text-amber-800 mb-2">Tài khoản demo:</p>
            <div className="grid grid-cols-3 gap-2">
              {[
                { user: 'manager',  pwd: 'manager123',  label: 'Quản Lý' },
                { user: 'cashier',  pwd: 'cashier123',  label: 'Thu Ngân' },
                { user: 'barista',  pwd: 'barista123',  label: 'Barista' },
              ].map(a => (
                <button
                  key={a.user}
                  type="button"
                  onClick={() => setForm({ username: a.user, password: a.pwd })}
                  className="text-center bg-white rounded-xl border border-amber-200 px-2 py-2 hover:bg-amber-50 transition-colors"
                >
                  <p className="text-xs font-bold text-amber-800">{a.label}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{a.user}</p>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
