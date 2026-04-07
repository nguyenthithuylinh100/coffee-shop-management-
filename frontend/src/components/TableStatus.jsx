// UC1: Check Table Status – Thu ngân mở màn hình bàn, chọn bàn cần kiểm tra
export default function TableStatus({ tables, selectedTableId, onSelect }) {
  const available = tables.filter(t => t.status === 'Available').length
  const occupied  = tables.filter(t => t.status === 'Occupied').length

  return (
    <div>
      {/* Summary bar */}
      <div className="flex items-center justify-between mb-3">
        <h2 className="font-bold text-gray-700 text-sm">Chọn Bàn</h2>
        <div className="flex gap-2 text-xs">
          <span className="badge-available">{available} trống</span>
          <span className="badge-occupied">{occupied} có khách</span>
        </div>
      </div>

      {/* Table grid */}
      <div className="grid grid-cols-4 sm:grid-cols-5 gap-2">
        {tables.map(table => {
          const isOccupied = table.status === 'Occupied'
          const isSelected = table.table_id === selectedTableId
          return (
            <button
              key={table.table_id}
              onClick={() => onSelect(table)}
              className={`
                relative flex flex-col items-center justify-center
                p-2 rounded-xl border-2 font-medium text-xs transition-all duration-200
                ${isSelected
                  ? 'border-amber-500 bg-amber-50 shadow-md scale-105'
                  : isOccupied
                    ? 'border-orange-200 bg-orange-50 hover:border-orange-400'
                    : 'border-emerald-200 bg-emerald-50 hover:border-emerald-400 hover:scale-102'
                }
              `}
            >
              {/* Table icon */}
              <div className={`text-xl mb-0.5 ${isOccupied ? 'opacity-100' : 'opacity-80'}`}>
                {isOccupied ? '🪑' : '⬜'}
              </div>
              <div className={`font-bold ${isOccupied ? 'text-orange-700' : 'text-emerald-700'}`}>
                Bàn {table.table_number}
              </div>
              {/* UC1: Hiển thị trạng thái Available / Occupied */}
              <div className={`text-xs mt-0.5 ${isOccupied ? 'text-orange-500' : 'text-emerald-500'}`}>
                {isOccupied ? 'Có khách' : 'Trống'}
              </div>
              {/* Selected indicator */}
              {isSelected && (
                <div className="absolute -top-1.5 -right-1.5 bg-amber-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold shadow">
                  ✓
                </div>
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}
