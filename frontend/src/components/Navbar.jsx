import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { useNavigate } from 'react-router-dom'

const ROLE_CONFIG = {
  Cashier: { bg: 'from-blue-700 to-blue-800',   icon: '🧾', label: 'Thu Ngân' },
  Barista: { bg: 'from-emerald-700 to-emerald-800', icon: '☕', label: 'Pha Chế' },
  Manager: { bg: 'from-amber-800 to-amber-900',  icon: '📊', label: 'Quản Lý' },
}

export default function Navbar({ title, rightContent }) {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [showMenu, setShowMenu] = useState(false)
  const cfg = ROLE_CONFIG[user?.role] || ROLE_CONFIG.Manager

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <nav className={`bg-gradient-to-r ${cfg.bg} text-white px-4 py-0 shadow-md relative z-30`}>
      <div className="max-w-7xl mx-auto flex items-center justify-between h-14">
        {/* Left: brand + title */}
        <div className="flex items-center gap-3">
          <span className="text-2xl">{cfg.icon}</span>
          <div className="leading-tight">
            <div className="font-bold text-sm sm:text-base">Coffee Shop</div>
            <div className="text-xs opacity-70">{title}</div>
          </div>
        </div>

        {/* Center: extra content (tabs etc.) */}
        {rightContent && <div className="flex-1 mx-4 hidden sm:block">{rightContent}</div>}

        {/* Right: user info + logout */}
        <div className="flex items-center gap-2 relative">
          <div className="hidden sm:block text-right leading-tight">
            <p className="text-sm font-semibold">{user?.name}</p>
            <p className="text-xs opacity-70">{cfg.label}</p>
          </div>
          <button
            onClick={() => setShowMenu(v => !v)}
            className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors font-bold text-sm"
          >
            {user?.name?.[0]?.toUpperCase() || '?'}
          </button>
          {showMenu && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setShowMenu(false)}/>
              <div className="absolute right-0 top-10 z-50 bg-white rounded-2xl shadow-xl border border-gray-100 min-w-[160px] overflow-hidden">
                <div className="px-4 py-3 border-b border-gray-100">
                  <p className="font-semibold text-gray-800 text-sm">{user?.name}</p>
                  <p className="text-xs text-gray-500">{cfg.label}</p>
                </div>
                <button
                  onClick={handleLogout}
                  className="w-full text-left px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2 transition-colors"
                >
                  <span>🚪</span> Đăng xuất
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </nav>
  )
}
