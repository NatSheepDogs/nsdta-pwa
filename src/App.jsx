import { useState } from 'react'

function App() {
  const [activeTab, setActiveTab] = useState('scores')

  return (
    <div className="flex flex-col h-screen bg-gray-100 max-w-md mx-auto">
      
      {/* Header */}
      <div className="bg-[#2c5f2e] text-white px-4 py-3">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-base font-semibold">National Sheep Dog Trials</h1>
            <p className="text-xs text-green-200">Australian Championships</p>
          </div>
          <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full font-medium">
            ● LIVE
          </span>
        </div>
      </div>

      {/* Tab bar */}
      <div className="bg-[#2c5f2e] flex border-t border-green-700">
        {['scores','watch','radio','schedule','info'].map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 py-2 text-xs capitalize ${
              activeTab === tab
                ? 'text-yellow-300 border-b-2 border-yellow-300'
                : 'text-green-300'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4">
        {activeTab === 'scores' && <div className="text-gray-500 text-sm">Scores coming soon</div>}
        {activeTab === 'watch' && <div className="text-gray-500 text-sm">Watch coming soon</div>}
        {activeTab === 'radio' && <div className="text-gray-500 text-sm">Radio coming soon</div>}
        {activeTab === 'schedule' && <div className="text-gray-500 text-sm">Schedule coming soon</div>}
        {activeTab === 'info' && <div className="text-gray-500 text-sm">Info coming soon</div>}
      </div>

    </div>
  )
}

export default App