import { useState, useEffect } from 'react'

const SHEET_ID = '1H8cjA_UCOBlo6pZmJd104y74OnRNThk7c7ZevAY0w8I'
const CONTROLS_URL = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:json&sheet=Controls`

function App() {
  const [controls, setControls] = useState(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('scores')

  useEffect(() => {
    fetchControls()
    const interval = setInterval(fetchControls, 30000)
    return () => clearInterval(interval)
  }, [])

  async function fetchControls() {
    try {
      const res = await fetch(CONTROLS_URL)
      const text = await res.text()
      const json = JSON.parse(text.substring(47).slice(0, -2))
      const rows = json.table.rows
      const data = {}
      rows.forEach(row => {
        if (row.c[0]?.v && row.c[1]?.v) {
          data[row.c[0].v] = row.c[1].v
        }
      })
      setControls(data)
    } catch (e) {
      console.error('Failed to fetch controls', e)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-[#2c5f2e]">
        <div className="text-white text-center">
          <div className="text-4xl mb-4">🐑</div>
          <div className="text-lg font-medium">Loading...</div>
        </div>
      </div>
    )
  }

  const status = controls?.trial_status || 'off_season'

  if (status === 'off_season') {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-[#2c5f2e] px-8 text-center">
        <div className="text-5xl mb-6">🐑</div>
        <h1 className="text-white text-2xl font-semibold mb-4">National Sheep Dog Trials</h1>
        <p className="text-green-200 text-base leading-relaxed mb-8">
          {controls?.off_season_message || 'See you at the next event!'}
        </p>
        <a href={controls?.off_season_url || 'https://nationalsheepdogtrials.org.au'} target="_blank" rel="noreferrer" className="bg-white text-[#2c5f2e] font-medium px-6 py-3 rounded-full text-sm">
          Visit our website
        </a>
      </div>
    )
  }

  if (status === 'paused') {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-[#2c5f2e] px-8 text-center">
        <div className="text-5xl mb-6">🌙</div>
        <h1 className="text-white text-2xl font-semibold mb-4">National Sheep Dog Trials</h1>
        <p className="text-green-200 text-base leading-relaxed mb-8">
          {controls?.paused_message || 'Competition has paused for the day.'}
        </p>
        <a href={controls?.off_season_url || 'https://nationalsheepdogtrials.org.au'} target="_blank" rel="noreferrer" className="bg-white text-[#2c5f2e] font-medium px-6 py-3 rounded-full text-sm">
          Visit our website
        </a>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-screen bg-gray-100 max-w-md mx-auto">
      <div className="bg-[#2c5f2e] text-white px-4 py-3">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-base font-semibold">National Sheep Dog Trials</h1>
            <p className="text-xs text-green-200">Australian Championships</p>
          </div>
          <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full font-medium">LIVE</span>
        </div>
      </div>
      <div className="bg-[#2c5f2e] flex border-t border-green-700">
        {['scores','watch','radio','schedule','info'].map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)} className={`flex-1 py-2 text-xs capitalize ${activeTab === tab ? 'text-yellow-300 border-b-2 border-yellow-300' : 'text-green-300'}`}>
            {tab}
          </button>
        ))}
      </div>
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
