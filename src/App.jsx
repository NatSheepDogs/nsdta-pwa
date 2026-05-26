import { useState, useEffect } from 'react'

const SHEET_ID = '1H8cjA_UCOBlo6pZmJd104y74OnRNThk7c7ZevAY0w8I'

function fetchSheet(sheetName) {
  const url = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:json&sheet=${encodeURIComponent(sheetName)}`
  return fetch(url)
    .then(r => r.text())
    .then(text => {
      const json = JSON.parse(text.substring(47).slice(0, -2))
      return json.table.rows
    })
}

function fetchControlsSheet() {
  const url = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:json&sheet=Controls&range=A1:B20&headers=0`
  return fetch(url)
    .then(r => r.text())
    .then(text => {
      const json = JSON.parse(text.substring(47).slice(0, -2))
      return json.table.rows
    })
}

function parseControls(rows) {
  const data = {}
  rows.forEach(row => {
    const key = row.c[0]?.v
    const val = row.c[1]?.v ?? row.c[1]?.f
    if (key && val !== undefined && val !== null) {
      data[key] = val
    }
  })
  return data
}

function parseOpenDraw(rows) {
  const competitors = []
  rows.forEach((row, i) => {
    if (i === 0) return
    const runNo = row.c[0]?.v
    const name = row.c[1]?.v
    const dog = row.c[2]?.v
    const rego = row.c[3]?.v
    const cls = row.c[4]?.v
    const impScore = row.c[5]?.v
    const openScore = row.c[6]?.v
    if (!name) return
    const score = cls === 'Improver' ? impScore : openScore
    const parsedScore = typeof score === "number" ? score : (score && !isNaN(Number(score)) ? Number(score) : score)
    competitors.push({ runNo, name, dog, rego, cls, score: parsedScore })
  })
  return competitors
}

function parseMaidenDraw(rows) {
  const competitors = []
  rows.forEach((row, i) => {
    if (i < 3) return
    const runNo = row.c[0]?.v
    const name = row.c[1]?.v
    const dog = row.c[2]?.v
    const rego = row.c[3]?.v
    const score = row.c[4]?.v
    if (!name) return
    const parsedScore = typeof score === "number" ? score : (score && !isNaN(Number(score)) ? Number(score) : score)
    competitors.push({ runNo, name, dog, rego, cls: "Maiden", score: parsedScore })
  })
  return competitors
}

function getScoreDisplay(score) {
  if (score === null || score === undefined || score === '') return null
  if (typeof score === 'number') return score.toFixed(1)
  return score
}

function isNumericScore(score) {
  return typeof score === 'number'
}

function ScoreTag({ cls }) {
  const colours = {
    Open: 'bg-green-100 text-green-800',
    Improver: 'bg-blue-100 text-blue-800',
    Maiden: 'bg-purple-100 text-purple-800',
  }
  return (
    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${colours[cls] || 'bg-gray-100 text-gray-600'}`}>
      {cls}
    </span>
  )
}

function RunOrderList({ competitors, currentRun }) {
  const current = competitors.find(c => c.runNo == currentRun)
  const completed = competitors.filter(c => c.runNo != currentRun && (c.score !== null && c.score !== undefined && c.score !== ''))
  const pending = competitors.filter(c => c.runNo != currentRun && (c.score === null || c.score === undefined || c.score === ''))

  return (
    <div>
      {current && (
        <div className="mb-3 bg-yellow-50 border border-yellow-300 rounded-xl p-3">
          <div className="text-xs text-yellow-700 font-medium mb-1">On Course Now — Run {current.runNo}</div>
          <div className="font-semibold text-gray-800">{current.name}</div>
          <div className="text-sm text-gray-500 mb-1">{current.dog}</div>
          <ScoreTag cls={current.cls} />
        </div>
      )}
      {completed.length > 0 && (
        <div className="mb-3">
          <div className="text-xs text-gray-400 uppercase tracking-wide mb-2 px-1">Completed — {completed.length} runs</div>
          {completed.map((c, i) => (
            <div key={i} className="bg-white rounded-xl mb-2 px-3 py-2 flex items-center gap-3 shadow-sm">
              <div className="text-sm text-gray-400 w-6 text-center">{c.runNo}</div>
              <div className="flex-1 min-w-0">
                <div className="font-medium text-gray-800 text-sm truncate">{c.name}</div>
                <div className="text-xs text-gray-400 truncate">{c.dog}</div>
              </div>
              <ScoreTag cls={c.cls} />
              <div className={`text-base font-semibold w-12 text-right ${isNumericScore(c.score) ? 'text-[#2c5f2e]' : 'text-gray-400'}`}>
                {getScoreDisplay(c.score)}
              </div>
            </div>
          ))}
        </div>
      )}
      {pending.length > 0 && (
        <div>
          <div className="text-xs text-gray-400 uppercase tracking-wide mb-2 px-1">Still to run — {pending.length} remaining</div>
          {pending.slice(0, 20).map((c, i) => (
            <div key={i} className="bg-white rounded-xl mb-2 px-3 py-2 flex items-center gap-3 shadow-sm opacity-60">
              <div className="text-sm text-gray-400 w-6 text-center">{c.runNo}</div>
              <div className="flex-1 min-w-0">
                <div className="font-medium text-gray-700 text-sm truncate">{c.name}</div>
                <div className="text-xs text-gray-400 truncate">{c.dog}</div>
              </div>
              <ScoreTag cls={c.cls} />
              <div className="text-sm text-gray-300 w-12 text-right">—</div>
            </div>
          ))}
          {pending.length > 20 && (
            <div className="text-center text-xs text-gray-400 py-2">+ {pending.length - 20} more to run</div>
          )}
        </div>
      )}
    </div>
  )
}

function Leaderboard({ competitors, title, colour }) {
  const scored = competitors
    .filter(c => isNumericScore(c.score))
    .sort((a, b) => b.score - a.score)

  if (scored.length === 0) return (
    <div className="mb-4">
      <div className={`text-xs font-semibold uppercase tracking-wide mb-2 px-1 ${colour}`}>{title}</div>
      <div className="bg-white rounded-xl p-3 text-center text-gray-400 text-sm">No scores yet</div>
    </div>
  )

  return (
    <div className="mb-4">
      <div className={`text-xs font-semibold uppercase tracking-wide mb-2 px-1 ${colour}`}>{title}</div>
      {scored.map((c, i) => {
        const medal = i === 0 ? 'bg-yellow-400' : i === 1 ? 'bg-gray-300' : i === 2 ? 'bg-amber-600' : 'bg-gray-100'
        const medalText = i < 3 ? 'text-white' : 'text-gray-500'
        return (
          <div key={i} className="bg-white rounded-xl mb-2 px-3 py-2 flex items-center gap-3 shadow-sm">
            <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${medal} ${medalText}`}>
              {i + 1}
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-medium text-gray-800 text-sm truncate">{c.name}</div>
              <div className="text-xs text-gray-400 truncate">{c.dog}</div>
            </div>
            <div className="text-base font-semibold text-[#2c5f2e]">{c.score.toFixed(1)}</div>
          </div>
        )
      })}
    </div>
  )
}

function ScoresScreen({ openDraw, maidenDraw, controls }) {
  const [competition, setCompetition] = useState('open')
  const [view, setView] = useState('leaderboard')

  const currentRunOpen = controls?.current_run_open
  const currentRunMaiden = controls?.current_run_maiden

  return (
    <div>
      <div className="flex gap-2 mb-3">
        {['open', 'maiden'].map(c => (
          <button key={c} onClick={() => setCompetition(c)}
            className={`flex-1 py-1.5 rounded-full text-xs font-medium ${competition === c ? 'bg-[#2c5f2e] text-white' : 'bg-white text-gray-600 border border-gray-200'}`}>
            {c === 'open' ? 'Open & Improver' : 'Maiden'}
          </button>
        ))}
      </div>
      <div className="flex gap-2 mb-4">
        {['leaderboard', 'runorder'].map(v => (
          <button key={v} onClick={() => setView(v)}
            className={`flex-1 py-1.5 rounded-full text-xs font-medium ${view === v ? 'bg-[#2c5f2e] text-white' : 'bg-white text-gray-600 border border-gray-200'}`}>
            {v === 'leaderboard' ? 'Leaderboard' : 'Run Order'}
          </button>
        ))}
      </div>
      {view === 'leaderboard' && competition === 'open' && (
        <div>
          <Leaderboard competitors={openDraw.filter(c => c.cls === 'Open')} title="Open" colour="text-green-700" />
          <Leaderboard competitors={openDraw.filter(c => c.cls === 'Improver')} title="Improver" colour="text-blue-700" />
        </div>
      )}
      {view === 'leaderboard' && competition === 'maiden' && (
        <Leaderboard competitors={maidenDraw} title="Maiden" colour="text-purple-700" />
      )}
      {view === 'runorder' && competition === 'open' && (
        <RunOrderList competitors={openDraw} currentRun={currentRunOpen} />
      )}
      {view === 'runorder' && competition === 'maiden' && (
        <RunOrderList competitors={maidenDraw} currentRun={currentRunMaiden} />
      )}
    </div>
  )
}

function App() {
  const [controls, setControls] = useState(null)
  const [openDraw, setOpenDraw] = useState([])
  const [maidenDraw, setMaidenDraw] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('scores')
  const [lastUpdated, setLastUpdated] = useState(null)

  useEffect(() => {
    fetchAll()
    const interval = setInterval(fetchAll, 30000)
    return () => clearInterval(interval)
  }, [])

  async function fetchAll() {
    try {
      const [controlRows, openRows, maidenRows] = await Promise.all([
        fetchControlsSheet(),
        fetchSheet('Open Draw'),
        fetchSheet('Maiden Draw'),
      ])
      const parsed = parseControls(controlRows)
      console.log('Controls data:', parsed)
      setControls(parsed)
      setOpenDraw(parseOpenDraw(openRows))
      setMaidenDraw(parseMaidenDraw(maidenRows))
      setLastUpdated(new Date().toLocaleTimeString())
    } catch (e) {
      console.error('Fetch error', e)
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
            <p className="text-xs text-green-200">{controls?.current_day || 'Australian Championships'}</p>
          </div>
          <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full font-medium">LIVE</span>
        </div>
      </div>
      <div className="bg-[#2c5f2e] flex border-t border-green-700">
        {['scores','watch','radio','schedule','info'].map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)}
            className={`flex-1 py-2 text-xs capitalize ${activeTab === tab ? 'text-yellow-300 border-b-2 border-yellow-300' : 'text-green-300'}`}>
            {tab}
          </button>
        ))}
      </div>
      <div className="flex-1 overflow-y-auto p-3">
        {activeTab === 'scores' && (
          <div>
            {lastUpdated && <div className="text-xs text-gray-400 text-right mb-2">Updated {lastUpdated}</div>}
            <ScoresScreen openDraw={openDraw} maidenDraw={maidenDraw} controls={controls} />
          </div>
        )}
        {activeTab === 'watch' && <div className="text-gray-500 text-sm p-2">Watch coming soon</div>}
        {activeTab === 'radio' && <div className="text-gray-500 text-sm p-2">Radio coming soon</div>}
        {activeTab === 'schedule' && <div className="text-gray-500 text-sm p-2">Schedule coming soon</div>}
        {activeTab === 'info' && <div className="text-gray-500 text-sm p-2">Info coming soon</div>}
      </div>
    </div>
  )
}

export default App
