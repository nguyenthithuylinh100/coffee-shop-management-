import { useMemo } from 'react'

function fmt(n) {
  return new Intl.NumberFormat('vi-VN').format(n) + '₫'
}

// UC3: Add Item to Order – Cashier chọn món từ menu (chỉ món isAvailable=true)
export default function MenuDisplay({ menuItems, onAddItem }) {
  const categories = useMemo(() => {
    const map = {}
    menuItems.forEach(item => {
      const cat = item.category || 'Khác'
      if (!map[cat]) map[cat] = []
      map[cat].push(item)
    })
    return map
  }, [menuItems])

  if (menuItems.length === 0) {
    return (
      <div className="text-center py-10 text-gray-400">
        <div className="text-4xl mb-2">😔</div>
        <p className="text-sm font-medium">Không có món nào khả dụng</p>
        <p className="text-xs mt-1">Vui lòng liên hệ Manager</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {Object.entries(categories).map(([cat, items]) => (
        <div key={cat}>
          <p className="section-title">{cat}</p>
          <div className="grid grid-cols-1 gap-1.5">
            {items.map(item => (
              <button
                key={item.menu_item_id}
                onClick={() => onAddItem(item)}
                className="flex items-center justify-between px-3 py-2.5 bg-gray-50 hover:bg-amber-50 rounded-xl border border-transparent hover:border-amber-200 transition-all duration-150 text-left group"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-800 group-hover:text-amber-800 truncate">
                    {item.name}
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0 ml-2">
                  <span className="text-sm font-bold text-amber-700">{fmt(item.price)}</span>
                  <div className="w-6 h-6 rounded-full bg-amber-100 group-hover:bg-amber-500 flex items-center justify-center transition-colors">
                    <span className="text-amber-600 group-hover:text-white text-base leading-none font-bold">+</span>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
