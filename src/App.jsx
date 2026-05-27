import { useState, useEffect } from 'react'

const SHEET_ID = '1H8cjA_UCOBlo6pZmJd104y74OnRNThk7c7ZevAY0w8I'

function fetchSheet(sheetName) {
  const url = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:json&sheet=${encodeURIComponent(sheetName)}`
  return fetch(url).then(r => r.text()).then(text => {
    const json = JSON.parse(text.substring(47).slice(0, -2))
    return json.table.rows
  })
}

function fetchControlsSheet() {
  const url = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:json&sheet=Controls&range=A1:B20&headers=0`
  return fetch(url).then(r => r.text()).then(text => {
    const json = JSON.parse(text.substring(47).slice(0, -2))
    return json.table.rows
  })
}

function parseControls(rows) {
  const data = {}
  rows.forEach(row => {
    const key = row.c[0]?.v
    const val = row.c[1]?.v ?? row.c[1]?.f
    if (key && val !== undefined && val !== null) data[key] = val
  })
  return data
}

function parseScore(raw) {
  if (raw === null || raw === undefined || raw === '') return null
  if (typeof raw === 'number') return raw
  if (typeof raw === 'string' && !isNaN(Number(raw)) && raw.trim() !== '') return Number(raw)
  return raw
}

function parseOpenDraw(rows) {
  return rows.slice(1).map(row => {
    const runNo = row.c[0]?.v
    const name = row.c[1]?.v
    const dog = row.c[2]?.v
    const cls = row.c[4]?.v
    const impScore = parseScore(row.c[5]?.v)
    const openScore = parseScore(row.c[6]?.v)
    if (!name) return null
    const score = cls === 'Improver' ? impScore : openScore
    return { runNo, name, dog, cls, score }
  }).filter(Boolean)
}

function parseMaidenDraw(rows) {
  return rows.slice(3).map(row => {
    const runNo = row.c[0]?.v
    const name = row.c[1]?.v
    const dog = row.c[2]?.v
    const score = parseScore(row.c[4]?.v)
    if (!name) return null
    return { runNo, name, dog, cls: 'Maiden', score }
  }).filter(Boolean)
}

function isNumeric(score) { return typeof score === 'number' }

function getRankings(competitors) {
  return [...competitors]
    .filter(c => isNumeric(c.score))
    .sort((a, b) => b.score - a.score)
}

function getCutScore(ranked, n) {
  if (ranked.length <= n) return null
  return ranked[n - 1]?.score ?? null
}

function getPosition(competitor, ranked) {
  if (!isNumeric(competitor.score)) return null
  const rank = ranked.findIndex(r => r.name === competitor.name && r.dog === competitor.dog) + 1
  return rank > 0 ? rank : null
}

function ordinal(n) {
  return n + (n === 1 ? 'st' : n === 2 ? 'nd' : n === 3 ? 'rd' : 'th')
}

function ClassTag({ cls }) {
  const styles = {
    Open: { background: '#e8f4e8', color: '#2c5f2e' },
    Improver: { background: '#e8edfa', color: '#3a4fa8' },
    Maiden: { background: '#eeedfe', color: '#534ab7' },
  }
  const s = styles[cls] || { background: '#f0f0f0', color: '#888' }
  return <span style={{ fontSize: 9, padding: '1px 4px', borderRadius: 3, background: s.background, color: s.color, flexShrink: 0 }}>{cls}</span>
}

function ScoreDisplay({ score }) {
  if (score === null || score === undefined) return <span style={{ color: '#ccc', fontSize: 11 }}>—</span>
  if (isNumeric(score)) return <span style={{ fontSize: 12, fontWeight: 700, color: '#2c5f2e' }}>{score.toFixed(1)}</span>
  return <span style={{ fontSize: 11, color: '#999' }}>{score}</span>
}

function SubPill({ label, active, onClick }) {
  return (
    <button onClick={onClick} style={{ border: active ? 'none' : '1px solid #ddd', borderRadius: 12, padding: '3px 10px', fontSize: 11, color: active ? '#fff' : '#555', background: active ? '#2c5f2e' : '#fff', whiteSpace: 'nowrap', cursor: 'pointer' }}>
      {label}
    </button>
  )
}

function PendingView({ title }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 40, textAlign: 'center' }}>
      <div style={{ fontSize: 32, marginBottom: 12 }}>🏆</div>
      <div style={{ fontSize: 15, fontWeight: 600, color: '#444', marginBottom: 8 }}>{title}</div>
      <div style={{ fontSize: 13, color: '#aaa', lineHeight: 1.5 }}>This stage has not yet begun. Check back once qualifying is complete.</div>
    </div>
  )
}

function DrawView({ competitors, currentRun, topRankings, topN, label }) {
  const onCourse = competitors.find(c => c.runNo == currentRun)
  const completed = competitors.filter(c => c.runNo != currentRun && (c.score !== null && c.score !== undefined))
  const pending = competitors.filter(c => c.runNo != currentRun && (c.score === null || c.score === undefined))

  return (
    <div>
      {onCourse && (
        <div style={{ background: '#fff8e1', border: '1px solid #f5c842', borderRadius: 10, padding: '8px 10px', marginBottom: 8 }}>
          <div style={{ fontSize: 9, color: '#c08000', fontWeight: 600, marginBottom: 2 }}>On course now — Run {onCourse.runNo}</div>
          <div style={{ fontSize: 13, fontWeight: 700, color: '#222' }}>{onCourse.name}</div>
          <div style={{ fontSize: 11, color: '#888', marginBottom: 4 }}>{onCourse.dog}</div>
          <ClassTag cls={onCourse.cls} />
        </div>
      )}
      {completed.length > 0 && (
        <div style={{ marginBottom: 6 }}>
          <div style={{ fontSize: 10, color: '#aaa', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 }}>Completed — {completed.length} runs</div>
          {completed.map((c, i) => {
            const pos = getPosition(c, topRankings)
            const inTop = pos !== null && pos <= topN
            return (
              <div key={i} style={{ background: '#fff', borderRadius: 8, padding: '5px 8px', marginBottom: 3, display: 'flex', alignItems: 'center', gap: 6 }}>
                <div style={{ fontSize: 10, color: '#aaa', width: 20, textAlign: 'center', flexShrink: 0 }}>{c.runNo}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexWrap: 'wrap' }}>
                    <span style={{ fontSize: 11, fontWeight: 600, color: '#222' }}>{c.name}</span>
                    <ClassTag cls={c.cls} />
                  </div>
                  <div style={{ fontSize: 10, color: '#aaa' }}>{c.dog}</div>
                </div>
                {inTop && (
                  <div style={{ background: '#e8f4e8', color: '#2c5f2e', fontSize: 9, padding: '1px 5px', borderRadius: 4, whiteSpace: 'nowrap', flexShrink: 0 }}>
                    {ordinal(pos)} {label}
                  </div>
                )}
                <div style={{ flexShrink: 0, minWidth: 28, textAlign: 'right' }}><ScoreDisplay score={c.score} /></div>
              </div>
            )
          })}
        </div>
      )}
      {pending.length > 0 && (
        <div>
          <div style={{ fontSize: 10, color: '#aaa', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 }}>Still to run — {pending.length} remaining</div>
          {pending.slice(0, 15).map((c, i) => (
            <div key={i} style={{ background: '#fff', borderRadius: 8, padding: '5px 8px', marginBottom: 3, display: 'flex', alignItems: 'center', gap: 6, opacity: 0.45 }}>
              <div style={{ fontSize: 10, color: '#aaa', width: 20, textAlign: 'center', flexShrink: 0 }}>{c.runNo}</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <span style={{ fontSize: 11, fontWeight: 600, color: '#222' }}>{c.name}</span>
                  <ClassTag cls={c.cls} />
                </div>
                <div style={{ fontSize: 10, color: '#aaa' }}>{c.dog}</div>
              </div>
              <div style={{ fontSize: 10, color: '#ddd' }}>pending</div>
            </div>
          ))}
          {pending.length > 15 && (
            <div style={{ textAlign: 'center', fontSize: 10, color: '#aaa', padding: 6 }}>+ {pending.length - 15} more to run</div>
          )}
        </div>
      )}
    </div>
  )
}

function LeaderboardView({ competitors, title, filterCls, topN }) {
  const filtered = filterCls ? competitors.filter(c => c.cls === filterCls) : competitors
  const ranked = getRankings(filtered)
  const cutScore = getCutScore(ranked, topN)
  const inCut = ranked.slice(0, topN)
  const belowCut = ranked.slice(topN)

  if (ranked.length === 0) return (
    <div style={{ background: '#fff', borderRadius: 10, padding: 16, textAlign: 'center', color: '#aaa', fontSize: 13 }}>No scores yet</div>
  )

  return (
    <div>
      <div style={{ fontSize: 10, color: '#aaa', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6 }}>
        {title} · {ranked.length} scored{cutScore !== null ? ` · cut at ${cutScore.toFixed(1)}` : ''}
      </div>
      {inCut.map((c, i) => (
        <div key={i} style={{ background: '#fff', borderRadius: 8, padding: '6px 8px', marginBottom: 3, display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 20, height: 20, borderRadius: '50%', background: '#f0f0f0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 700, color: '#555', flexShrink: 0 }}>{i + 1}</div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <span style={{ fontSize: 12, fontWeight: 600, color: '#222' }}>{c.name}</span>
              {filterCls === null && <ClassTag cls={c.cls} />}
            </div>
            <div style={{ fontSize: 10, color: '#aaa' }}>{c.dog}</div>
          </div>
          <span style={{ fontSize: 13, fontWeight: 700, color: '#2c5f2e' }}>{c.score.toFixed(1)}</span>
        </div>
      ))}
      {belowCut.length > 0 && (
        <>
          <div style={{ borderTop: '1px dashed #ddd', margin: '6px 0' }}>
            <span style={{ fontSize: 9, color: '#bbb' }}>below cut</span>
          </div>
          {belowCut.slice(0, 5).map((c, i) => (
            <div key={i} style={{ background: '#fff', borderRadius: 8, padding: '5px 8px', marginBottom: 3, display: 'flex', alignItems: 'center', gap: 8, opacity: 0.55 }}>
              <div style={{ width: 20, height: 20, borderRadius: '50%', background: '#f5f5f5', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, color: '#aaa', flexShrink: 0 }}>{topN + i + 1}</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <span style={{ fontSize: 12, fontWeight: 600, color: '#555' }}>{c.name}</span>
                  {filterCls === null && <ClassTag cls={c.cls} />}
                </div>
                <div style={{ fontSize: 10, color: '#bbb' }}>{c.dog}</div>
              </div>
              <span style={{ fontSize: 13, fontWeight: 700, color: '#aaa' }}>{c.score.toFixed(1)}</span>
            </div>
          ))}
          {belowCut.length > 5 && (
            <div style={{ textAlign: 'center', fontSize: 10, color: '#aaa', padding: 4 }}>+ {belowCut.length - 5} more below cut</div>
          )}
        </>
      )}
    </div>
  )
}

const tickerStyle = document.createElement('style')
tickerStyle.textContent = '@keyframes ticker { 0% { transform: translateX(0); } 100% { transform: translateX(-50%); } }'
if (!document.getElementById('ticker-style')) { tickerStyle.id = 'ticker-style'; document.head.appendChild(tickerStyle) }

function App() {
  const [controls, setControls] = useState(null)
  const [openDraw, setOpenDraw] = useState([])
  const [maidenDraw, setMaidenDraw] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('draw')
  const [drawSub, setDrawSub] = useState('open')
  const [lbSub, setLbSub] = useState('top20')
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
      setControls(parseControls(controlRows))
      setOpenDraw(parseOpenDraw(openRows))
      setMaidenDraw(parseMaidenDraw(maidenRows))
      setLastUpdated(new Date().toLocaleTimeString())
    } catch (e) {
      console.error('Fetch error', e)
    } finally {
      setLoading(false)
    }
  }

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: '#2c5f2e' }}>
      <div style={{ textAlign: 'center', color: '#fff' }}>
        <div style={{ fontSize: 40, marginBottom: 12 }}>🐑</div>
        <div style={{ fontSize: 16 }}>Loading...</div>
      </div>
    </div>
  )

  const status = controls?.trial_status || 'off_season'

  if (status === 'off_season') return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh', background: '#2c5f2e', padding: '0 32px', textAlign: 'center' }}>
      <div style={{ fontSize: 48, marginBottom: 20 }}>🐑</div>
      <h1 style={{ color: '#fff', fontSize: 22, fontWeight: 600, marginBottom: 12 }}>National Sheep Dog Trials</h1>
      <p style={{ color: '#a8d5a2', fontSize: 15, lineHeight: 1.6, marginBottom: 28 }}>{controls?.off_season_message || 'See you at the next event!'}</p>
      <a href={controls?.off_season_url || 'https://nationalsheepdogtrials.org.au'} target="_blank" rel="noreferrer" style={{ background: '#fff', color: '#2c5f2e', fontWeight: 600, padding: '10px 24px', borderRadius: 24, fontSize: 14, textDecoration: 'none' }}>Visit our website</a>
    </div>
  )

  if (status === 'paused') return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh', background: '#2c5f2e', padding: '0 32px', textAlign: 'center' }}>
      <div style={{ fontSize: 48, marginBottom: 20 }}>🌙</div>
      <h1 style={{ color: '#fff', fontSize: 22, fontWeight: 600, marginBottom: 12 }}>National Sheep Dog Trials</h1>
      <p style={{ color: '#a8d5a2', fontSize: 15, lineHeight: 1.6, marginBottom: 28 }}>{controls?.paused_message || 'Competition has paused for the day.'}</p>
      <a href={controls?.off_season_url || 'https://nationalsheepdogtrials.org.au'} target="_blank" rel="noreferrer" style={{ background: '#fff', color: '#2c5f2e', fontWeight: 600, padding: '10px 24px', borderRadius: 24, fontSize: 14, textDecoration: 'none' }}>Visit our website</a>
    </div>
  )

  const openRankings = getRankings(openDraw)
  const impRankings = getRankings(openDraw.filter(c => c.cls === 'Improver'))
  const maidenRankings = getRankings(maidenDraw)
  const currentRunOpen = controls?.current_run_open
  const currentRunMaiden = controls?.current_run_maiden

  const navItems = [
    { id: 'draw', label: 'Draw' },
    { id: 'leaderboards', label: 'Leaderboards' },
    { id: 'watch', label: 'Watch' },
    { id: 'listen', label: 'Listen' },
    { id: 'info', label: 'Info' },
  ]

  const lbPills = [
    { id: 'top20', label: 'Open Top 20' },
    { id: 'imp5', label: 'Improver Top 5' },
    { id: 'maiden15', label: 'Maiden Top 15' },
    { id: 'openfinal', label: 'Open Final' },
    { id: 'impfinal', label: 'Improver Final' },
    { id: 'maidenfinal', label: 'Maiden Final' },
  ]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', background: '#f5f5f3', maxWidth: 480, margin: '0 auto' }}>

      <div style={{ background: '#2c5f2e', color: '#fff', padding: '10px 14px 6px' }}>
        <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 2 }}>National Sheep Dog Trials</div>
        <div style={{ fontSize: 10, color: '#a8d5a2', marginBottom: 4 }}>{controls?.current_day || 'Australian Championships'}</div>
        {controls?.ticker_message && (
          <div style={{ overflow: 'hidden', width: '100%' }}>
            <div style={{
              display: 'inline-block',
              whiteSpace: 'nowrap',
              animation: 'ticker 25s linear infinite',
              fontSize: 10,
              color: '#f5c842',
              fontWeight: 500,
            }}>
              {controls.ticker_message}&nbsp;&nbsp;&nbsp;·&nbsp;&nbsp;&nbsp;{controls.ticker_message}
            </div>
          </div>
        )}
      </div>

      <div style={{ background: '#2c5f2e', display: 'flex', borderTop: '1px solid #3d7a3f' }}>
        {navItems.map(item => (
          <button key={item.id} onClick={() => setActiveTab(item.id)}
            style={{ flex: 1, padding: '7px 0 5px', fontSize: 10, color: activeTab === item.id ? '#f5c842' : '#a8d5a2', background: 'none', border: 'none', borderBottom: activeTab === item.id ? '2px solid #f5c842' : '2px solid transparent', cursor: 'pointer', fontWeight: activeTab === item.id ? 600 : 400 }}>
            {item.label}
          </button>
        ))}
      </div>

      {lastUpdated && (activeTab === 'draw' || activeTab === 'leaderboards') && (
        <div style={{ textAlign: 'right', fontSize: 10, color: '#aaa', padding: '3px 10px 0' }}>Updated {lastUpdated}</div>
      )}

      <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>

        {activeTab === 'draw' && (
          <>
            <div style={{ display: 'flex', gap: 6, padding: '6px 10px', background: '#fff', borderBottom: '1px solid #eee' }}>
              <SubPill label="Open/Improver" active={drawSub === 'open'} onClick={() => setDrawSub('open')} />
              <SubPill label="Maiden" active={drawSub === 'maiden'} onClick={() => setDrawSub('maiden')} />
            </div>
            <div style={{ flex: 1, overflowY: 'auto', padding: '8px 10px' }}>
              {drawSub === 'open' && <DrawView competitors={openDraw} currentRun={currentRunOpen} topRankings={openRankings} topN={20} label="Top 20" />}
              {drawSub === 'maiden' && <DrawView competitors={maidenDraw} currentRun={currentRunMaiden} topRankings={maidenRankings} topN={15} label="Top 15" />}
            </div>
          </>
        )}

        {activeTab === 'leaderboards' && (
          <>
            <div style={{ display: 'flex', gap: 6, padding: '6px 10px', background: '#fff', borderBottom: '1px solid #eee', overflowX: 'auto' }}>
              {lbPills.map(p => (
                <SubPill key={p.id} label={p.label} active={lbSub === p.id} onClick={() => setLbSub(p.id)} />
              ))}
            </div>
            <div style={{ flex: 1, overflowY: 'auto', padding: '8px 10px' }}>
              {lbSub === 'top20' && <LeaderboardView competitors={openDraw} title="Open Top 20" filterCls={null} topN={20} />}
              {lbSub === 'imp5' && <LeaderboardView competitors={openDraw} title="Improver Top 5" filterCls="Improver" topN={5} />}
              {lbSub === 'maiden15' && <LeaderboardView competitors={maidenDraw} title="Maiden Top 15" filterCls={null} topN={15} />}
              {lbSub === 'openfinal' && <PendingView title="Open Final" />}
              {lbSub === 'impfinal' && <PendingView title="Improver Final" />}
              {lbSub === 'maidenfinal' && <PendingView title="Maiden Final" />}
            </div>
          </>
        )}

        {activeTab === 'watch' && <div style={{ padding: 16, color: '#aaa', fontSize: 14 }}>Watch coming soon</div>}
        {activeTab === 'listen' && <div style={{ padding: 16, color: '#aaa', fontSize: 14 }}>Radio coming soon</div>}
        {activeTab === 'info' && <div style={{ padding: 16, color: '#aaa', fontSize: 14 }}>Info coming soon</div>}

      </div>
    </div>
  )
}

export default App


