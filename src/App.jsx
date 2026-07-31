import { useState, useEffect, useRef } from 'react'

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
  return rows.slice(0).map(row => {
    const runNo = row.c[0]?.v
    const name = row.c[1]?.v
    const dog = row.c[2]?.v
    const cls = row.c[4]?.v
    const impScore = parseScore(row.c[18]?.v)
    const openScore = parseScore(row.c[19]?.v)
    if (!name || !runNo) return null
    const score = cls === 'Improver' ? impScore : openScore
    return { runNo, name, dog, cls, score }
  }).filter(Boolean)
}

function parseMaidenDraw(rows) {
  return rows.slice(0).map(row => {
    const runNo = row.c[0]?.v
    const name = row.c[1]?.v
    const dog = row.c[2]?.v
    const score = parseScore(row.c[4]?.v)
    if (!name || !runNo) return null
    return { runNo, name, dog, cls: 'Maiden', score }
  }).filter(Boolean)
}

function parseTop20(rows) {
  return rows.slice(4).map(row => {
    const no = row.c[0]?.v
    const name = row.c[1]?.v
    const dog = row.c[2]?.v
    const score1st = parseScore(row.c[3]?.v)
    const scoreTop20 = parseScore(row.c[4]?.v)
    const total = parseScore(row.c[5]?.v)
    const rank = parseScore(row.c[6]?.v)
    const openFinal = row.c[7]?.v
    if (!name) return null
    return { no, name, dog, score1st, scoreTop20, total, rank, openFinal }
  }).filter(Boolean)
}

function parseMaidenFinal(rows) {
  return rows.slice(0).map(row => {
    const no = row.c[0]?.v
    const name = row.c[1]?.v
    const dog = row.c[2]?.v
    const score1st = parseScore(row.c[3]?.v)
    const scoreTop15 = parseScore(row.c[4]?.v)
    const scoreFinal = parseScore(row.c[5]?.v)
    const total = parseScore(row.c[6]?.v)
    const place = parseScore(row.c[7]?.v)
    if (!name) return null
    return { no, name, dog, score1st, scoreTop15, scoreFinal, total, place }
  }).filter(Boolean)
}

function parseImproverFinal(rows) {
  return rows.slice(0).map(row => {
    const no = row.c[0]?.v
    const name = row.c[1]?.v
    const dog = row.c[2]?.v
    const score1st = parseScore(row.c[3]?.v)
    const scoreFinal = parseScore(row.c[4]?.v)
    const total = parseScore(row.c[5]?.v)
    const place = parseScore(row.c[6]?.v)
    if (!name) return null
    return { no, name, dog, score1st, scoreFinal, total, place }
  }).filter(Boolean)
}

function parseOpenFinal(rows) {
  return rows.slice(0).map(row => {
    const no = row.c[0]?.v
    const name = row.c[1]?.v
    const dog = row.c[2]?.v
    const score1st = parseScore(row.c[3]?.v)
    const scoreTop20 = parseScore(row.c[4]?.v)
    const scoreFinal = parseScore(row.c[5]?.v)
    const total = parseScore(row.c[6]?.v)
    const place = parseScore(row.c[7]?.v)
    if (!name) return null
    return { no, name, dog, score1st, scoreTop20, scoreFinal, total, place }
  }).filter(Boolean)
}

function isNumeric(score) { return typeof score === 'number' }

function isScored(score) {
  if (score === null || score === undefined || score === '') return false
  return true
}

function scoreForRanking(score) {
  if (isNumeric(score)) return score
  if (score !== null && score !== undefined && score !== '') return 0
  return null
}

function getRankings(competitors) {
  return [...competitors]
    .filter(c => isScored(c.score))
    .sort((a, b) => {
      const sa = scoreForRanking(a.score) ?? -1
      const sb = scoreForRanking(b.score) ?? -1
      return sb - sa
    })
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
    Open: { background: '#e8edf7', color: '#0D2B5E' },
    Improver: { background: '#e8edfa', color: '#3a4fa8' },
    Maiden: { background: '#eeedfe', color: '#534ab7' },
  }
  const s = styles[cls] || { background: '#f0f0f0', color: '#888' }
  return <span style={{ fontSize: 17, padding: '1px 4px', borderRadius: 3, background: s.background, color: s.color, flexShrink: 0 }}>{cls}</span>
}

function ScoreDisplay({ score }) {
  if (score === null || score === undefined || score === '') return <span style={{ color: '#ccc', fontSize: 17 }}>—</span>
  if (isNumeric(score)) return <span style={{ fontSize: 18, fontWeight: 700, color: '#0D2B5E' }}>{score}</span>
  return <span style={{ fontSize: 17, fontWeight: 600, color: '#c0392b', background: '#fdf0ee', padding: '1px 5px', borderRadius: 4 }}>{score}</span>
}

function SubPill({ label, active, onClick }) {
  return (
    <button onClick={onClick} style={{ border: active ? 'none' : '1px solid #ddd', borderRadius: 12, padding: '3px 10px', fontSize: 17, color: active ? '#fff' : '#555', background: active ? '#0D2B5E' : '#fff', whiteSpace: 'nowrap', cursor: 'pointer' }}>
      {label}
    </button>
  )
}

function DrawView({ competitors, currentRun, topRankings, topN, label, impRankings, currentState, otherDrawRunner }) {
  const [search, setSearch] = useState('')

  const filtered = search.trim()
    ? competitors.filter(c =>
        c.name?.toLowerCase().includes(search.toLowerCase()) ||
        c.dog?.toLowerCase().includes(search.toLowerCase())
      )
    : competitors

  const onCourse = !search.trim() ? competitors.find(c => c.runNo == currentRun) : null
  const completed = filtered.filter(c => c.runNo != currentRun && isScored(c.score))
  const pending = filtered.filter(c => c.runNo != currentRun && !isScored(c.score))

  return (
    <div>
      <div style={{ marginBottom: 10 }}>
        <input
          type="text"
          placeholder="Search competitor or dog name..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ width: '100%', padding: '10px 14px', borderRadius: 24, border: '1px solid #ddd', fontSize: 15, outline: 'none', boxSizing: 'border-box', background: '#fff' }}
        />
        {search.trim() && (
          <button onClick={() => setSearch('')}
            style={{ position: 'absolute', right: 24, marginTop: -34, background: 'none', border: 'none', fontSize: 16, color: '#aaa', cursor: 'pointer' }}>
            ✕
          </button>
        )}
      </div>
      {onCourse && (
        <div style={{ background: '#fff8e1', border: '1px solid #f5c842', borderRadius: 10, padding: '8px 10px', marginBottom: 8 }}>
          <div style={{ fontSize: 17, color: '#c08000', fontWeight: 600, marginBottom: 2 }}>On course now — Run {onCourse.runNo}</div>
          <div style={{ fontSize: 17, fontWeight: 700, color: '#222' }}>{onCourse.name}</div>
          <div style={{ fontSize: 17, color: '#888', marginBottom: 4 }}>{onCourse.dog}</div>
          <ClassTag cls={onCourse.cls} />
        </div>
      )}
      {!onCourse && otherDrawRunner && (
        <div style={{ background: '#f0f4ff', border: '1px solid #c5d0f5', borderRadius: 10, padding: '8px 10px', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ fontSize: 18, flexShrink: 0 }}>&#128065;</div>
          <div>
            <div style={{ fontSize: 17, color: '#3a4fa8', fontWeight: 600, marginBottom: 2 }}>Open/Improver draw underway</div>
            <div style={{ fontSize: 18, color: '#3a4fa8', fontWeight: 500 }}>Run {otherDrawRunner.runNo} — {otherDrawRunner.name}</div>
            <div style={{ fontSize: 18, color: '#7a8fd4' }}>{otherDrawRunner.dog}</div>
          </div>
        </div>
      )}
      {!onCourse && !otherDrawRunner && currentState && (
        <div style={{ background: '#f0f4ff', border: '1px solid #c5d0f5', borderRadius: 10, padding: '8px 10px', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ fontSize: 18, flexShrink: 0 }}>&#9208;</div>
          <div style={{ fontSize: 18, color: '#3a4fa8', fontWeight: 500 }}>{currentState}</div>
        </div>
      )}
      {completed.length > 0 && (
        <div style={{ marginBottom: 6 }}>
          <div style={{ fontSize: 18, color: '#aaa', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 }}>Completed — {completed.length} runs</div>
          {completed.map((c, i) => {
            const pos = getPosition(c, topRankings)
            const inTop = pos !== null && pos <= topN
            return (
              <div key={i} style={{ background: '#fff', borderRadius: 8, padding: '8px 10px', marginBottom: 4, display: 'flex', alignItems: 'center', gap: 6 }}>
                <div style={{ fontSize: 18, color: '#aaa', width: 20, textAlign: 'center', flexShrink: 0 }}>{c.runNo}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexWrap: 'wrap' }}>
                    <span style={{ fontSize: 17, fontWeight: 600, color: '#222' }}>{c.name}</span>
                    <ClassTag cls={c.cls} />
                  </div>
                  <div style={{ fontSize: 18, color: '#aaa' }}>{c.dog}</div>
                </div>
                <div style={{ display: 'flex', gap: 3, flexShrink: 0, flexWrap: 'wrap', justifyContent: 'flex-end', alignItems: 'center' }}>
                  {inTop && (
                    <div style={{ background: '#e8edf7', color: '#0D2B5E', fontSize: 17, padding: '1px 5px', borderRadius: 4, whiteSpace: 'nowrap' }}>
                      {ordinal(pos)} {label}
                    </div>
                  )}
                  {impRankings && c.cls === 'Improver' && (() => {
                    const impPos = getPosition(c, impRankings)
                    return impPos !== null && impPos <= 5 ? (
                      <div style={{ background: '#e8edfa', color: '#3a4fa8', fontSize: 17, padding: '1px 5px', borderRadius: 4, whiteSpace: 'nowrap' }}>
                        {ordinal(impPos)} Imp
                      </div>
                    ) : null
                  })()}
                  <div style={{ textAlign: 'right' }}>
                    <ScoreDisplay score={c.score} />
                    {pos !== null && (
                      <div style={{ fontSize: 17, color: '#aaa', textAlign: 'right' }}>{ordinal(pos)}</div>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
      {pending.length > 0 && (
        <div>
          <div style={{ fontSize: 18, color: '#aaa', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 }}>Still to run — {pending.length} remaining</div>
          {pending.slice(0, 15).map((c, i) => (
            <div key={i} style={{ background: '#fff', borderRadius: 8, padding: '8px 10px', marginBottom: 4, display: 'flex', alignItems: 'center', gap: 6, opacity: 0.45 }}>
              <div style={{ fontSize: 18, color: '#aaa', width: 20, textAlign: 'center', flexShrink: 0 }}>{c.runNo}</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <span style={{ fontSize: 17, fontWeight: 600, color: '#222' }}>{c.name}</span>
                  <ClassTag cls={c.cls} />
                </div>
                <div style={{ fontSize: 18, color: '#aaa' }}>{c.dog}</div>
              </div>
              <div style={{ fontSize: 18, color: '#ddd' }}>pending</div>
            </div>
          ))}
          {pending.length > 15 && (
            <div style={{ textAlign: 'center', fontSize: 18, color: '#aaa', padding: 6 }}>+ {pending.length - 15} more to run</div>
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
    <div style={{ background: '#fff', borderRadius: 10, padding: 16, textAlign: 'center', color: '#aaa', fontSize: 17 }}>No scores yet</div>
  )

  return (
    <div>
      <div style={{ fontSize: 18, color: '#aaa', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6 }}>
        {title} · {ranked.length} scored{cutScore !== null ? ` · cut at ${cutScore}` : ''}
      </div>
      {inCut.map((c, i) => (
        <div key={i} style={{ background: '#fff', borderRadius: 8, padding: '6px 8px', marginBottom: 3, display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 20, height: 20, borderRadius: '50%', background: '#f0f0f0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, fontWeight: 700, color: '#555', flexShrink: 0 }}>{i + 1}</div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <span style={{ fontSize: 18, fontWeight: 600, color: '#222' }}>{c.name}</span>
              {filterCls === null && <ClassTag cls={c.cls} />}
            </div>
            <div style={{ fontSize: 18, color: '#aaa' }}>{c.dog}</div>
          </div>
          <span style={{ fontSize: 17, fontWeight: 700, color: '#0D2B5E' }}>{c.score}</span>
        </div>
      ))}
      {belowCut.length > 0 && (
        <>
          <div style={{ borderTop: '1px dashed #ddd', margin: '6px 0' }}>
            <span style={{ fontSize: 17, color: '#bbb' }}>below cut</span>
          </div>
          {belowCut.slice(0, 5).map((c, i) => (
            <div key={i} style={{ background: '#fff', borderRadius: 8, padding: '5px 8px', marginBottom: 3, display: 'flex', alignItems: 'center', gap: 8, opacity: 0.55 }}>
              <div style={{ width: 20, height: 20, borderRadius: '50%', background: '#f5f5f5', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, color: '#aaa', flexShrink: 0 }}>{topN + i + 1}</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <span style={{ fontSize: 18, fontWeight: 600, color: '#555' }}>{c.name}</span>
                  {filterCls === null && <ClassTag cls={c.cls} />}
                </div>
                <div style={{ fontSize: 18, color: '#bbb' }}>{c.dog}</div>
              </div>
              <span style={{ fontSize: 17, fontWeight: 700, color: '#aaa' }}>{c.score}</span>
            </div>
          ))}
          {belowCut.length > 5 && (
            <div style={{ textAlign: 'center', fontSize: 18, color: '#aaa', padding: 4 }}>+ {belowCut.length - 5} more below cut</div>
          )}
        </>
      )}
    </div>
  )
}

function FinalsView({ competitors, title, scoreLabel, columns }) {
  if (!competitors || competitors.length === 0) return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 40, textAlign: 'center' }}>
      <div style={{ fontSize: 32, marginBottom: 12 }}>🏆</div>
      <div style={{ fontSize: 17, fontWeight: 600, color: '#444', marginBottom: 8 }}>{title}</div>
      <div style={{ fontSize: 17, color: '#aaa', lineHeight: 1.5 }}>This stage has not yet begun.</div>
    </div>
  )

  const sorted = [...competitors].sort((a, b) => {
    if (isNumeric(a.total) && isNumeric(b.total)) return b.total - a.total
    if (isNumeric(a.place) && isNumeric(b.place)) return a.place - b.place
    return 0
  })

  const allScored = sorted.every(c => isNumeric(c.total))
  const maxTotal = allScored ? Math.max(...sorted.map(c => c.total)) : null
  const championTotal = allScored ? maxTotal : null

  return (
    <div>
      <div style={{ fontSize: 18, color: '#aaa', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6 }}>
        {title} · {sorted.length} competitors · {scoreLabel}
      </div>
      {sorted.map((c, i) => {
        const rank = isNumeric(c.place) ? c.place : i + 1
        const isChampion = allScored && isNumeric(c.total) && c.total === championTotal
        return (
          <div key={i} style={{ background: isChampion ? '#fffbea' : '#fff', borderRadius: 8, padding: '6px 8px', marginBottom: 4, border: isChampion ? '1px solid #f5c842' : 'none' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
              <div style={{ width: 20, height: 20, borderRadius: '50%', background: isChampion ? '#f5c842' : '#f0f0f0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, fontWeight: 700, color: isChampion ? '#7a5c00' : '#555', flexShrink: 0 }}>{rank}</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                  <span style={{ fontSize: 18, fontWeight: 600, color: '#222' }}>{c.name}</span>
                  {isChampion && (
                    <span style={{ fontSize: 17, fontWeight: 700, background: '#f5c842', color: '#7a5c00', padding: '2px 7px', borderRadius: 10, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                      🏆 Champion
                    </span>
                  )}
                </div>
                <div style={{ fontSize: 18, color: '#aaa' }}>{c.dog}</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: 18, fontWeight: 700, color: isChampion ? '#c08000' : '#0D2B5E' }}>{isNumeric(c.total) ? c.total : '—'}</div>
                <div style={{ fontSize: 17, color: '#aaa' }}>total</div>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 6, paddingLeft: 28 }}>
              {columns.map(col => (
                <div key={col.key} style={{ background: '#f5f5f3', borderRadius: 4, padding: '2px 6px', fontSize: 17, color: '#666' }}>
                  <span style={{ color: '#aaa' }}>{col.label}: </span>
                  <span style={{ fontWeight: 600 }}>{isNumeric(c[col.key]) ? c[col.key] : (c[col.key] || '—')}</span>
                </div>
              ))}
            </div>
          </div>
        )
      })}
    </div>
  )
}

function Top20View({ competitors }) {
  if (!competitors || competitors.length === 0) return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 40, textAlign: 'center' }}>
      <div style={{ fontSize: 32, marginBottom: 12 }}>🏆</div>
      <div style={{ fontSize: 17, fontWeight: 600, color: '#444', marginBottom: 8 }}>Top 20</div>
      <div style={{ fontSize: 17, color: '#aaa', lineHeight: 1.5 }}>This stage has not yet begun.</div>
    </div>
  )

  const sorted = [...competitors].sort((a, b) => {
    if (isNumeric(a.total) && isNumeric(b.total)) return b.total - a.total
    if (isNumeric(a.rank) && isNumeric(b.rank)) return a.rank - b.rank
    return 0
  })

  return (
    <div>
      <div style={{ fontSize: 18, color: '#aaa', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6 }}>
        Top 20 · {sorted.length} competitors · 1st run + Top 20 score
      </div>
      {sorted.map((c, i) => {
        const rank = isNumeric(c.rank) ? c.rank : i + 1
        const inFinal = c.openFinal
        return (
          <div key={i} style={{ background: '#fff', borderRadius: 8, padding: '6px 8px', marginBottom: 4, border: inFinal ? '1px solid #f5c842' : 'none' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
              <div style={{ width: 20, height: 20, borderRadius: '50%', background: '#f0f0f0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, fontWeight: 700, color: '#555', flexShrink: 0 }}>{rank}</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <span style={{ fontSize: 18, fontWeight: 600, color: '#222' }}>{c.name}</span>
                  {inFinal && <span style={{ fontSize: 17, background: '#fff8e1', color: '#c08000', padding: '1px 4px', borderRadius: 4 }}>Open Final</span>}
                </div>
                <div style={{ fontSize: 18, color: '#aaa' }}>{c.dog}</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: 18, fontWeight: 700, color: '#0D2B5E' }}>{isNumeric(c.total) ? c.total : '—'}</div>
                <div style={{ fontSize: 17, color: '#aaa' }}>total</div>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 6, paddingLeft: 28 }}>
              <div style={{ background: '#f5f5f3', borderRadius: 4, padding: '2px 6px', fontSize: 17, color: '#666' }}>
                <span style={{ color: '#aaa' }}>1st: </span><span style={{ fontWeight: 600 }}>{isNumeric(c.score1st) ? c.score1st : '—'}</span>
              </div>
              <div style={{ background: '#f5f5f3', borderRadius: 4, padding: '2px 6px', fontSize: 17, color: '#666' }}>
                <span style={{ color: '#aaa' }}>Top 20: </span><span style={{ fontWeight: 600 }}>{isNumeric(c.scoreTop20) ? c.scoreTop20 : (c.scoreTop20 || '—')}</span>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}

function shuffleArray(arr) {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

// ─── QUIZ COMPONENT ──────────────────────────────────────────────────────────
const LEVELS = [
  { key: 'Easy', name: 'Novice', icon: '🌱', desc: 'Easy questions — great for beginners' },
  { key: 'Medium', name: 'Handler', icon: '🐕', desc: 'Medium — you know your way around' },
  { key: 'Hard', name: 'Champion', icon: '🏆', desc: 'Hard — trial expert territory' },
]

function QuizView() {
  const [phase, setPhase] = useState('start')
  const [questions, setQuestions] = useState([])
  const [allQuestions, setAllQuestions] = useState([])
  const [difficulty, setDifficulty] = useState(null)
  const [current, setCurrent] = useState(0)
  const [selected, setSelected] = useState(null)
  const [score, setScore] = useState(0)
  const [answered, setAnswered] = useState(false)
  const [answers, setAnswers] = useState([])
  const [loadError, setLoadError] = useState(false)

  useEffect(() => {
    fetch('/questions.json')
      .then(r => r.json())
      .then(data => setAllQuestions(data))
      .catch(() => setLoadError(true))
  }, [])

  function startQuiz() {
    if (!difficulty || allQuestions.length === 0) return
    let pool = allQuestions.filter(q => q.difficulty === difficulty)
    if (pool.length < 10) {
      const extras = shuffleArray(allQuestions.filter(q => q.difficulty !== difficulty))
      pool = [...pool, ...extras.slice(0, 10 - pool.length)]
    }
    setQuestions(shuffleArray(pool).slice(0, 10))
    setCurrent(0)
    setSelected(null)
    setScore(0)
    setAnswers([])
    setAnswered(false)
    setPhase('quiz')
  }

  function handleAnswer(idx) {
    if (answered) return
    setSelected(idx)
    setAnswered(true)
    const q = questions[current]
    const correct = idx === q.correctAnswer
    if (correct) setScore(s => s + 1)
    setAnswers(a => [...a, { q, chosen: idx, correct }])
  }

  function next() {
    if (current + 1 >= questions.length) {
      setPhase('result')
    } else {
      setCurrent(c => c + 1)
      setSelected(null)
      setAnswered(false)
    }
  }

  const letters = ['A', 'B', 'C', 'D']

  if (phase === 'start') return (
    <div style={{ padding: '20px 16px' }}>
      <div style={{ textAlign: 'center', marginBottom: 20 }}>
        <div style={{ fontSize: 40, marginBottom: 8 }}>🧠</div>
        <h2 style={{ fontSize: 18, fontWeight: 700, color: '#222', marginBottom: 4 }}>Sheep Dog Trial Quiz</h2>
        <p style={{ fontSize: 17, color: '#888', lineHeight: 1.5 }}>
          {loadError ? 'Could not load questions.' : 'Choose your level and test your knowledge!'}
        </p>
      </div>
      <p style={{ fontSize: 18, fontWeight: 600, color: '#555', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 10 }}>Choose your difficulty</p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 20 }}>
        {LEVELS.map(l => (
          <button key={l.key} onClick={() => setDifficulty(l.key)}
            style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 16px', border: difficulty === l.key ? '2px solid #0D2B5E' : '1px solid #ddd', borderRadius: 10, background: difficulty === l.key ? '#e8edf7' : '#fff', cursor: 'pointer', textAlign: 'left' }}>
            <div style={{ fontSize: 28, flexShrink: 0 }}>{l.icon}</div>
            <div>
              <div style={{ fontSize: 17, fontWeight: 700, color: difficulty === l.key ? '#0D2B5E' : '#222' }}>{l.name}</div>
              <div style={{ fontSize: 18, color: '#888', marginTop: 2 }}>{l.desc}</div>
            </div>
          </button>
        ))}
      </div>
      <button onClick={startQuiz} disabled={!difficulty || allQuestions.length === 0 || loadError}
        style={{ width: '100%', background: '#0D2B5E', color: '#fff', border: 'none', borderRadius: 24, padding: '13px', fontSize: 17, fontWeight: 600, cursor: !difficulty ? 'not-allowed' : 'pointer', opacity: !difficulty || allQuestions.length === 0 ? 0.5 : 1 }}>
        {allQuestions.length === 0 && !loadError ? 'Loading...' : difficulty ? 'Start Quiz' : 'Select a level to begin'}
      </button>
    </div>
  )

  if (phase === 'result') {
    const pct = score / 10
    const label = pct === 1 ? '🏆 Perfect score!' : pct >= 0.8 ? '🐕 Outstanding!' : pct >= 0.6 ? '👍 Solid effort' : pct >= 0.4 ? '🌱 Room to grow' : '🐑 The sheep got away...'
    const sub = pct === 1 ? "You're a true trialling champion." : pct >= 0.8 ? 'You clearly know the sport well.' : pct >= 0.6 ? 'Good foundation — keep learning!' : pct >= 0.4 ? 'Read up on the rules and try again.' : "Have another crack — you'll do better!"
    return (
      <div style={{ padding: '20px 16px' }}>
        <div style={{ textAlign: 'center', marginBottom: 20 }}>
          <div style={{ fontSize: 52, fontWeight: 700, color: '#0D2B5E', lineHeight: 1 }}>{score}<span style={{ fontSize: 20, color: '#aaa' }}>/10</span></div>
          <div style={{ fontSize: 18, fontWeight: 700, color: '#222', margin: '8px 0 4px' }}>{label}</div>
          <div style={{ fontSize: 17, color: '#888' }}>{sub}</div>
        </div>
        <div style={{ marginBottom: 16 }}>
          {answers.map(({ q, chosen, correct }, i) => (
            <div key={i} style={{ display: 'flex', gap: 10, padding: '10px 12px', background: correct ? '#e8edf7' : '#fdf0ee', borderRadius: 8, marginBottom: 6 }}>
              <div style={{ fontSize: 18, flexShrink: 0 }}>{correct ? '✅' : '❌'}</div>
              <div>
                <div style={{ fontSize: 18, fontWeight: 600, color: '#444', marginBottom: 2 }}>{q.question}</div>
                {!correct && <div style={{ fontSize: 17, color: '#a32d2d' }}>Your answer: {q.options[chosen]}</div>}
                {!correct && <div style={{ fontSize: 17, color: '#0D2B5E' }}>Correct: {q.options[q.correctAnswer]}</div>}
              </div>
            </div>
          ))}
        </div>
        <button onClick={() => { setPhase('start'); setDifficulty(null) }}
          style={{ width: '100%', background: '#0D2B5E', color: '#fff', border: 'none', borderRadius: 24, padding: '13px', fontSize: 17, fontWeight: 600, cursor: 'pointer' }}>
          Play Again
        </button>
      </div>
    )
  }

  const q = questions[current]
  return (
    <div style={{ padding: '12px 14px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
        <span style={{ fontSize: 17, color: '#aaa' }}>Question {current + 1} of 10</span>
        <span style={{ fontSize: 17, background: '#fff8e1', color: '#c08000', padding: '2px 8px', borderRadius: 10 }}>{q.category}</span>
      </div>
      <div style={{ background: '#f5f3ee', borderRadius: 4, height: 6, marginBottom: 14, overflow: 'hidden' }}>
        <div style={{ height: '100%', background: '#f5c842', borderRadius: 4, width: `${((current + 1) / 10) * 100}%`, transition: 'width 0.4s' }} />
      </div>
      <div style={{ background: '#fff', borderRadius: 10, padding: '14px', marginBottom: 14, boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
        <p style={{ fontSize: 17, fontWeight: 600, color: '#222', lineHeight: 1.5 }}>{q.question}</p>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 14 }}>
        {q.options.map((opt, i) => {
          let bg = '#fff', border = '1px solid #ddd', color = '#333', letterBg = '#eee', letterColor = '#666'
          if (answered) {
            if (i === q.correctAnswer) { bg = '#e8edf7'; border = '1px solid #0D2B5E'; color = '#0D2B5E'; letterBg = '#0D2B5E'; letterColor = '#fff' }
            else if (i === selected) { bg = '#fdf0ee'; border = '1px solid #e74c3c'; color = '#e74c3c'; letterBg = '#e74c3c'; letterColor = '#fff' }
            else { bg = '#fafafa'; color = '#ccc'; border = '1px solid #eee' }
          }
          return (
            <button key={i} onClick={() => handleAnswer(i)} disabled={answered}
              style={{ background: bg, border, borderRadius: 8, padding: '10px 12px', fontSize: 18, color, textAlign: 'left', cursor: answered ? 'default' : 'pointer', display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ width: 28, height: 28, borderRadius: '50%', background: letterBg, color: letterColor, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 17, fontWeight: 600, flexShrink: 0 }}>{letters[i]}</span>
              {opt}
            </button>
          )
        })}
      </div>
      {answered && (
        <div style={{ background: '#e8f0fd', borderLeft: '3px solid #0D2B5E', borderRadius: '0 8px 8px 0', padding: '10px 12px', marginBottom: 14 }}>
          <p style={{ fontSize: 18, color: '#333', lineHeight: 1.5 }}>{q.explanation}</p>
        </div>
      )}
      {answered && (
        <button onClick={next} style={{ width: '100%', background: '#0D2B5E', color: '#fff', border: 'none', borderRadius: 24, padding: '12px', fontSize: 18, fontWeight: 600, cursor: 'pointer' }}>
          {current + 1 >= questions.length ? 'See my results' : 'Next question'}
        </button>
      )}
      <div style={{ display: 'flex', gap: 4, marginTop: 14, justifyContent: 'center' }}>
        {Array.from({ length: 10 }).map((_, i) => (
          <div key={i} style={{ width: 8, height: 8, borderRadius: '50%', background: i < current ? '#0D2B5E' : i === current ? '#f5c842' : '#ddd' }} />
        ))}
      </div>
    </div>
  )
}

function ScorerView() {
  const [score, setScore] = useState(100)
  const [totalDeducted, setTotalDeducted] = useState(0)
  const [faultCount, setFaultCount] = useState(0)
  const [log, setLog] = useState([])
  const [disqualified, setDisqualified] = useState(false)
  const [obstacles, setObstacles] = useState({ race: false, bridge: false, pen: false })

  function deduct(pts) {
    if (disqualified) return
    setScore(s => Math.max(s - pts, 0))
    setTotalDeducted(d => d + pts)
    setFaultCount(f => f + 1)
    setLog(l => [...l, { pts, dq: false, obstacle: false }])
  }

  function obstacleNotCompleted(key, pts, label) {
    if (disqualified || obstacles[key]) return
    setObstacles(o => ({ ...o, [key]: true }))
    setScore(s => Math.max(s - pts, 0))
    setTotalDeducted(d => d + pts)
    setFaultCount(f => f + 1)
    setLog(l => [...l, { pts, dq: false, obstacle: true, key, label }])
  }

  function disqualify() {
    if (disqualified) return
    setDisqualified(true)
    setLog(l => [...l, { pts: 0, dq: true }])
  }

  function undoLast() {
    if (log.length === 0) return
    const last = log[log.length - 1]
    setLog(l => l.slice(0, -1))
    if (last.dq) {
      setDisqualified(false)
    } else if (last.obstacle) {
      setObstacles(o => ({ ...o, [last.key]: false }))
      setScore(s => s + last.pts)
      setTotalDeducted(d => d - last.pts)
      setFaultCount(f => f - 1)
    } else {
      setScore(s => s + last.pts)
      setTotalDeducted(d => d - last.pts)
      setFaultCount(f => f - 1)
    }
  }

  function reset() {
    setScore(100); setTotalDeducted(0); setFaultCount(0)
    setLog([]); setDisqualified(false)
    setObstacles({ race: false, bridge: false, pen: false })
  }

  const obsConfig = [
    { key: 'race', label: 'Race', pts: 7 },
    { key: 'bridge', label: 'Bridge', pts: 8 },
    { key: 'pen', label: 'Pen', pts: 10 },
  ]

  return (
    <div style={{ padding: '12px 14px' }}>
      {disqualified && (
        <div style={{ background: '#fdf0ee', border: '1px solid #f09595', borderRadius: 8, padding: '10px 14px', marginBottom: 12, textAlign: 'center', fontSize: 17, fontWeight: 600, color: '#a32d2d' }}>
          ⚠ Disqualified — trial ended
        </div>
      )}

      <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #eee', padding: '16px', textAlign: 'center', marginBottom: 12 }}>
        <div style={{ fontSize: 80, fontWeight: 700, lineHeight: 1, color: disqualified ? '#a32d2d' : '#0D2B5E', letterSpacing: -1 }}>
          {disqualified ? 'DQ' : Math.max(score, 0)}
        </div>
        <div style={{ fontSize: 18, color: '#aaa', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12 }}>Current score</div>
        <div style={{ display: 'flex', justifyContent: 'center', gap: 32, borderTop: '1px solid #eee', paddingTop: 12 }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 24, fontWeight: 700 }}>{totalDeducted}</div>
            <div style={{ fontSize: 17, color: '#aaa', textTransform: 'uppercase' }}>Deducted</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 24, fontWeight: 700 }}>{faultCount}</div>
            <div style={{ fontSize: 17, color: '#aaa', textTransform: 'uppercase' }}>Faults</div>
          </div>
        </div>
      </div>

      <p style={{ fontSize: 17, color: '#aaa', textTransform: 'uppercase', letterSpacing: 1, textAlign: 'center', marginBottom: 8 }}>Deduct points</p>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 6, marginBottom: 12 }}>
        {[1,2,3,4,5].map(pts => (
          <button key={pts} onClick={() => deduct(pts)} disabled={disqualified}
            style={{ background: '#fff', border: '1px solid #ddd', borderRadius: 8, padding: '12px 4px', cursor: disqualified ? 'not-allowed' : 'pointer', opacity: disqualified ? 0.35 : 1, textAlign: 'center' }}>
            <div style={{ fontSize: 28, fontWeight: 700, color: '#a32d2d', lineHeight: 1 }}>−{pts}</div>
            <div style={{ fontSize: 17, color: '#aaa', marginTop: 2 }}>pt{pts > 1 ? 's' : ''}</div>
          </button>
        ))}
      </div>

      <div style={{ borderTop: '1px solid #eee', margin: '0 0 12px' }} />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginBottom: 12 }}>
        {obsConfig.map(obs => (
          <button key={obs.key} onClick={() => obstacleNotCompleted(obs.key, obs.pts, obs.label)}
            disabled={disqualified || obstacles[obs.key]}
            style={{ background: '#fff', border: '1px solid #ddd', borderRadius: 8, padding: '10px 6px', cursor: (disqualified || obstacles[obs.key]) ? 'not-allowed' : 'pointer', opacity: (disqualified || obstacles[obs.key]) ? 0.35 : 1, textAlign: 'center', textDecoration: obstacles[obs.key] ? 'line-through' : 'none' }}>
            <div style={{ fontSize: 18, fontWeight: 600, color: '#333', marginBottom: 4 }}>{obs.label}</div>
            <div style={{ fontSize: 24, fontWeight: 700, color: '#ba7517' }}>−{obs.pts}</div>
            <div style={{ fontSize: 17, color: '#aaa', marginTop: 2 }}>not completed</div>
          </button>
        ))}
      </div>

      <button onClick={disqualify} disabled={disqualified}
        style={{ width: '100%', background: '#fff', border: '1px solid #f09595', borderRadius: 8, padding: '12px', fontSize: 18, fontWeight: 600, color: '#a32d2d', cursor: disqualified ? 'not-allowed' : 'pointer', opacity: disqualified ? 0.35 : 1, marginBottom: 12 }}>
        Disqualify (DQ)
      </button>

      <div style={{ borderTop: '1px solid #eee', margin: '0 0 12px' }} />
      <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
        <button onClick={undoLast} disabled={log.length === 0}
          style={{ flex: 1, background: 'none', border: '1px solid #ddd', borderRadius: 8, padding: '10px', fontSize: 18, color: '#888', cursor: log.length === 0 ? 'not-allowed' : 'pointer', opacity: log.length === 0 ? 0.35 : 1 }}>
          ↩ Undo last
        </button>
        <button onClick={reset}
          style={{ flex: 1, background: 'none', border: '1px solid #ddd', borderRadius: 8, padding: '10px', fontSize: 18, color: '#888', cursor: 'pointer' }}>
          ↺ New trial
        </button>
      </div>

      {log.length > 0 && (
        <>
          <p style={{ fontSize: 17, color: '#aaa', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 }}>Fault log</p>
          <div style={{ border: '1px solid #eee', borderRadius: 8, overflow: 'hidden', maxHeight: 200, overflowY: 'auto' }}>
            {[...log].reverse().map((entry, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 12px', fontSize: 18, borderBottom: '1px solid #f5f5f5', background: i % 2 === 0 ? '#fff' : '#fafafa' }}>
                <span style={{ color: '#aaa', minWidth: 24, fontSize: 18 }}>{log.length - i}</span>
                <span style={{ flex: 1 }}>{entry.dq ? 'Disqualified' : entry.obstacle ? `${entry.label} not completed` : 'Fault'}</span>
                <span style={{ fontWeight: 600, color: '#a32d2d' }}>{entry.dq ? 'DQ' : `−${entry.pts}`}</span>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}


// ─── WATCH SCREEN ─────────────────────────────────────────────────────────────
function WatchScreen({ controls }) {
  const url = controls?.video_url
  const message = controls?.video_message || 'Live video is not currently available.'

  if (!url) return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 40, textAlign: 'center' }}>
      <div style={{ fontSize: 48, marginBottom: 16 }}>📺</div>
      <h2 style={{ fontSize: 17, fontWeight: 700, color: '#222', marginBottom: 8 }}>Live Video</h2>
      <p style={{ fontSize: 18, color: '#888', lineHeight: 1.6 }}>{message}</p>
    </div>
  )

  // Handle YouTube URLs - convert to embed format
  let embedUrl = url
  const ytMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/live\/)([a-zA-Z0-9_-]+)/)
  if (ytMatch) {
    embedUrl = `https://www.youtube.com/embed/${ytMatch[1]}?autoplay=1`
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ position: 'relative', width: '100%', paddingTop: '56.25%', background: '#000' }}>
        <iframe
          src={embedUrl}
          style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', border: 'none' }}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      </div>
      <div style={{ padding: '12px 16px' }}>
        <div style={{ fontSize: 17, color: '#555', lineHeight: 1.5 }}>
          <span style={{ background: '#e74c3c', color: '#fff', fontSize: 18, padding: '2px 6px', borderRadius: 8, fontWeight: 600, marginRight: 6 }}>● LIVE</span>
          National Sheep Dog Trial Championships — Live Stream
        </div>
      </div>
    </div>
  )
}

// ─── LISTEN SCREEN ────────────────────────────────────────────────────────────
function ListenScreen({ controls }) {
  const url = controls?.audio_url
  const message = controls?.audio_message || 'Radio Dog National is not currently broadcasting.'
  const playing = useRef(null)
  const [isPlaying, setIsPlaying] = useState(false)

  function togglePlay() {
    if (!url) return
    if (!playing.current) {
      playing.current = new Audio(url)
      playing.current.play()
      setIsPlaying(true)
      playing.current.onended = () => setIsPlaying(false)
    } else if (isPlaying) {
      playing.current.pause()
      setIsPlaying(false)
    } else {
      playing.current.play()
      setIsPlaying(true)
    }
  }

  useEffect(() => {
    return () => {
      if (playing.current) {
        playing.current.pause()
        playing.current = null
      }
    }
  }, [])

  if (!url) return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 40, textAlign: 'center' }}>
      <img src="/RDN Logo.png" alt="Radio Dog National" style={{ width: 140, height: 140, objectFit: 'contain', marginBottom: 16 }} />
      <h2 style={{ fontSize: 17, fontWeight: 700, color: '#222', marginBottom: 8 }}>Radio Dog National</h2>
      <p style={{ fontSize: 18, color: '#888', lineHeight: 1.6 }}>{message}</p>
    </div>
  )

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 40, textAlign: 'center' }}>
      <img src="/RDN Logo.png" alt="Radio Dog National" style={{ width: 140, height: 140, objectFit: 'contain', marginBottom: 16 }} />
      <h2 style={{ fontSize: 17, fontWeight: 700, color: '#222', marginBottom: 4 }}>Radio Dog National</h2>
      <p style={{ fontSize: 17, color: '#888', marginBottom: 28 }}>Live commentary and event coverage</p>
      <button onClick={togglePlay}
        style={{ width: 80, height: 80, borderRadius: '50%', background: isPlaying ? '#e74c3c' : '#0D2B5E', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
        <span style={{ fontSize: 32, color: '#fff' }}>{isPlaying ? '⏸' : '▶'}</span>
      </button>
      <div style={{ fontSize: 17, color: isPlaying ? '#e74c3c' : '#aaa', fontWeight: isPlaying ? 600 : 400 }}>
        {isPlaying ? '● On air' : 'Tap to listen'}
      </div>
      {isPlaying && (
        <p style={{ fontSize: 18, color: '#aaa', marginTop: 12 }}>Audio continues playing while you browse the app</p>
      )}
    </div>
  )
}

// ─── WHAT KIND OF SHEEPDOG ARE YOU ───────────────────────────────────────────

const DOG_QUESTIONS = [
  {
    q: "It's early morning. What are you doing?",
    options: [
      { text: "Already up, running circuits around the yard", bc: 1, k: 3, m: 0 },
      { text: "Up and ready, methodically planning the day", bc: 3, k: 1, m: 0 },
      { text: "Still in bed. It's early.", bc: 0, k: 0, m: 3 },
      { text: "Up but need coffee first", bc: 1, k: 1, m: 2 },
    ]
  },
  {
    q: "How do you approach a new task at work?",
    options: [
      { text: "Dive straight in with full intensity", bc: 1, k: 3, m: 0 },
      { text: "Study it carefully, then execute perfectly", bc: 3, k: 1, m: 0 },
      { text: "See if someone else will do it", bc: 0, k: 0, m: 3 },
      { text: "Give it a go and figure it out as you go", bc: 1, k: 2, m: 1 },
    ]
  },
  {
    q: "Your idea of a perfect weekend is:",
    options: [
      { text: "Competing in something — anything", bc: 2, k: 3, m: 0 },
      { text: "A long focused project done perfectly", bc: 3, k: 1, m: 0 },
      { text: "Napping and snacks", bc: 0, k: 0, m: 3 },
      { text: "Socialising with friends and family", bc: 1, k: 1, m: 2 },
    ]
  },
  {
    q: "How do you handle stress?",
    options: [
      { text: "Channel it into energy and keep moving", bc: 1, k: 3, m: 0 },
      { text: "Analyse the problem and solve it systematically", bc: 3, k: 1, m: 0 },
      { text: "Eat something nice and have a lie down", bc: 0, k: 0, m: 3 },
      { text: "Talk it through with someone", bc: 1, k: 0, m: 2 },
    ]
  },
  {
    q: "Someone gives you a complicated set of instructions. You:",
    options: [
      { text: "Start immediately — work it out as you go", bc: 0, k: 3, m: 1 },
      { text: "Read them three times before doing anything", bc: 3, k: 0, m: 0 },
      { text: "Ask someone to explain it simply", bc: 0, k: 0, m: 3 },
      { text: "Skim them and hope for the best", bc: 1, k: 1, m: 2 },
    ]
  },
  {
    q: "How would your friends describe you?",
    options: [
      { text: "Intense and driven", bc: 2, k: 3, m: 0 },
      { text: "Precise and reliable", bc: 3, k: 1, m: 0 },
      { text: "Lovable and laid-back", bc: 0, k: 0, m: 3 },
      { text: "Enthusiastic and social", bc: 1, k: 2, m: 1 },
    ]
  },
  {
    q: "Your approach to exercise:",
    options: [
      { text: "Run until you can't — then run more", bc: 1, k: 3, m: 0 },
      { text: "Structured training with clear goals", bc: 3, k: 1, m: 0 },
      { text: "Does walking to the fridge count?", bc: 0, k: 0, m: 3 },
      { text: "Social sport — it's about the fun", bc: 1, k: 1, m: 2 },
    ]
  },
  {
    q: "You see something that needs fixing. You:",
    options: [
      { text: "Fix it immediately without being asked", bc: 2, k: 3, m: 0 },
      { text: "Research the best solution then fix it properly", bc: 3, k: 1, m: 0 },
      { text: "Hope someone else notices", bc: 0, k: 0, m: 3 },
      { text: "Mention it to someone who can fix it", bc: 0, k: 1, m: 2 },
    ]
  },
  {
    q: "When you make eye contact with someone, it's:",
    options: [
      { text: "Intense and unblinking — you mean business", bc: 3, k: 1, m: 0 },
      { text: "Direct and confident", bc: 1, k: 3, m: 0 },
      { text: "Friendly and soft", bc: 0, k: 0, m: 3 },
      { text: "Depends on the mood", bc: 1, k: 1, m: 2 },
    ]
  },
  {
    q: "Your relationship with rules is:",
    options: [
      { text: "Rules are useful but you'll bend them if needed", bc: 1, k: 3, m: 0 },
      { text: "Rules exist for good reason — follow them precisely", bc: 3, k: 0, m: 0 },
      { text: "What rules?", bc: 0, k: 1, m: 3 },
      { text: "Follow the spirit of the rule, not the letter", bc: 1, k: 1, m: 2 },
    ]
  },
  {
    q: "In a team, you naturally:",
    options: [
      { text: "Take charge and drive things forward", bc: 1, k: 3, m: 0 },
      { text: "Plan, coordinate and make sure it's done right", bc: 3, k: 1, m: 0 },
      { text: "Keep morale up and bring the snacks", bc: 0, k: 0, m: 3 },
      { text: "Adapt to whatever role is needed", bc: 1, k: 1, m: 2 },
    ]
  },
  {
    q: "How do you feel about repetitive tasks?",
    options: [
      { text: "Fine if they're physical — you love the rhythm", bc: 1, k: 3, m: 0 },
      { text: "Fine if they're done perfectly every time", bc: 3, k: 1, m: 0 },
      { text: "Absolutely not", bc: 0, k: 0, m: 3 },
      { text: "OK in short bursts", bc: 1, k: 1, m: 2 },
    ]
  },
  {
    q: "Someone is moving too slowly. You:",
    options: [
      { text: "Dart around them to get things moving", bc: 1, k: 3, m: 0 },
      { text: "Patiently wait but internally recalculate", bc: 3, k: 0, m: 0 },
      { text: "Slow down to match their pace — no rush", bc: 0, k: 0, m: 3 },
      { text: "Politely encourage them to speed up", bc: 1, k: 1, m: 2 },
    ]
  },
  {
    q: "Your natural movement style is:",
    options: [
      { text: "Fast, agile, always on the move", bc: 1, k: 3, m: 0 },
      { text: "Deliberate, precise, economical", bc: 3, k: 1, m: 0 },
      { text: "Slow and comfortable", bc: 0, k: 0, m: 3 },
      { text: "Energetic when motivated", bc: 1, k: 2, m: 1 },
    ]
  },
  {
    q: "Your ideal working environment:",
    options: [
      { text: "Outdoors, physical, fast-paced", bc: 1, k: 3, m: 0 },
      { text: "Structured, clear goals, high standards", bc: 3, k: 1, m: 0 },
      { text: "Comfortable, relaxed, near food", bc: 0, k: 0, m: 3 },
      { text: "Flexible, social, varied", bc: 1, k: 1, m: 2 },
    ]
  },
  {
    q: "When you're bored you:",
    options: [
      { text: "Create your own entertainment — usually chaotic", bc: 1, k: 3, m: 0 },
      { text: "Find something productive to do", bc: 3, k: 1, m: 0 },
      { text: "Sleep", bc: 0, k: 0, m: 3 },
      { text: "Look for someone to hang out with", bc: 0, k: 1, m: 2 },
    ]
  },
  {
    q: "Your greatest strength is:",
    options: [
      { text: "Boundless energy and tenacity", bc: 1, k: 3, m: 0 },
      { text: "Intelligence and precision", bc: 3, k: 1, m: 0 },
      { text: "Making everyone feel welcome", bc: 0, k: 0, m: 3 },
      { text: "Adaptability", bc: 1, k: 1, m: 2 },
    ]
  },
  {
    q: "At a party you are:",
    options: [
      { text: "Herding everyone into groups whether they like it or not", bc: 1, k: 3, m: 0 },
      { text: "Quietly observing, then making your move", bc: 3, k: 1, m: 0 },
      { text: "At the food table", bc: 0, k: 0, m: 3 },
      { text: "Talking to everyone, having a great time", bc: 1, k: 1, m: 2 },
    ]
  },
  {
    q: "How do you react to a challenge?",
    options: [
      { text: "Attack it head on with everything you've got", bc: 1, k: 3, m: 0 },
      { text: "Assess it carefully then execute", bc: 3, k: 1, m: 0 },
      { text: "Hope it goes away", bc: 0, k: 0, m: 3 },
      { text: "Ask for help and tackle it together", bc: 0, k: 1, m: 2 },
    ]
  },
  {
    q: "Finally — what do sheep think of you?",
    options: [
      { text: "They respect you and do exactly as you say", bc: 3, k: 1, m: 0 },
      { text: "They're slightly terrified but it works", bc: 1, k: 3, m: 0 },
      { text: "They have no idea you exist", bc: 0, k: 0, m: 3 },
      { text: "Mixed reviews", bc: 1, k: 1, m: 2 },
    ]
  },
]

const DOG_PROFILES = {
  bc: {
    name: 'Border Collie',
    emoji: '🐕',
    tagline: 'The Perfectionist',
    description: "You are precise, intelligent and methodical. You don't just want to do the job — you want to do it perfectly. You plan before you act, you notice every detail, and you hold yourself to incredibly high standards. People trust you completely because you never let them down. You might occasionally overthink things, but the results speak for themselves. At a sheep dog trial, you'd be the dog that makes it look effortless — because you've thought about every step in advance.",
    folder: 'border-collie',
    count: 2,
    prefix: 'bc-',
  },
  k: {
    name: 'Kelpie',
    emoji: '🦮',
    tagline: 'The Powerhouse',
    description: "You are pure energy and determination. Where others slow down, you speed up. You thrive on physical challenge, love being outdoors, and never stop until the job is done. You're bold, confident and occasionally intimidating — but always effective. People rely on you when things need to happen fast. You might not always follow the plan exactly, but you get results. At a sheep dog trial, you'd be the dog that has the sheep moving before anyone else has blinked.",
    folder: 'kelpie',
    count: 2,
    prefix: 'k-',
  },
  m: {
    name: 'Lovable Mutt',
    emoji: '🐶',
    tagline: 'The Heart of the Pack',
    description: "You might not be herding any sheep today — and that's perfectly fine with you. You are warm, social, easy-going and universally loved. People gravitate toward you because you make everything more fun. You're not worried about being the best — you're too busy enjoying the moment. At a sheep dog trial, you'd be the dog that everyone at the fence wants to pat, and you'd be absolutely delighted about that.",
    folder: 'mutt',
    count: 2,
    prefix: 'm-',
  },
}

function DogQuizView() {
  const [phase, setPhase] = useState('intro')
  const [current, setCurrent] = useState(0)
  const [scores, setScores] = useState({ bc: 0, k: 0, m: 0 })
  const [result, setResult] = useState(null)
  const [imgNum, setImgNum] = useState(1)
  const [selected, setSelected] = useState(null)
  const [sharing, setSharing] = useState(false)
  const [activeQuestions, setActiveQuestions] = useState(DOG_QUESTIONS.slice(0, 10))

  async function shareResult() {
    if (!result) return
    const profile = DOG_PROFILES[result]
    const appUrl = window.location.origin + '?fun=dogquiz'
    const text = `🐾 I just found out I'm a ${profile.name} at the National Sheep Dog Trial Championships in Hall Village, Canberra!\n\nAre you a Border Collie, Kelpie or Lovable Mutt? Find out 👇\n${appUrl}\n\n#NationalSheepdogTrial #NSDTA2027`

    try {
      setSharing(true)
      const imgSrc = `/dogs/${profile.folder}/${profile.prefix}${String(imgNum).padStart(3, '0')}.png`
      const response = await fetch(imgSrc)
      const blob = await response.blob()
      const file = new File([blob], `${profile.folder}.png`, { type: 'image/png' })

      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({ text, files: [file] })
      } else if (navigator.share) {
        await navigator.share({ text })
      } else {
        await navigator.clipboard.writeText(text)
        alert('Copied to clipboard — paste it anywhere to share!')
      }
    } catch (e) {
      if (e.name !== 'AbortError') {
        try {
          await navigator.clipboard.writeText(text)
          alert('Copied to clipboard — paste it anywhere to share!')
        } catch {
          alert('Could not share — try copying the link manually.')
        }
      }
    } finally {
      setSharing(false)
    }
  }

  function start() {
    setCurrent(0)
    setScores({ bc: 0, k: 0, m: 0 })
    setResult(null)
    setSelected(null)
    setActiveQuestions(shuffleArray(DOG_QUESTIONS).slice(0, 10))
    setPhase('quiz')
  }

  function answer(opt) {
    if (selected !== null) return
    setSelected(opt)
    const newScores = {
      bc: scores.bc + opt.bc,
      k: scores.k + opt.k,
      m: scores.m + opt.m,
    }
    setScores(newScores)
    setTimeout(() => {
      if (current + 1 >= activeQuestions.length) {
        const winner = Object.entries(newScores).sort((a, b) => b[1] - a[1])[0][0]
        const profile = DOG_PROFILES[winner]
        const num = Math.floor(Math.random() * profile.count) + 1
        setImgNum(num)
        setResult(winner)
        setPhase('result')
      } else {
        setCurrent(c => c + 1)
        setSelected(null)
      }
    }, 600)
  }

  if (phase === 'intro') return (
    <div style={{ padding: '24px 16px', textAlign: 'center' }}>
      <div style={{ fontSize: 52, marginBottom: 12 }}>🐾</div>
      <h2 style={{ fontSize: 20, fontWeight: 700, color: '#222', marginBottom: 8 }}>What Kind of Sheep Dog Are You?</h2>
      <p style={{ fontSize: 18, color: '#888', lineHeight: 1.6, marginBottom: 12 }}>10 questions. One of three results. Are you a Border Collie, a Kelpie, or a Lovable Mutt?</p>
      <div style={{ display: 'flex', justifyContent: 'center', gap: 16, marginBottom: 28 }}>
        {Object.values(DOG_PROFILES).map(p => (
          <div key={p.name} style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 28 }}>{p.emoji}</div>
            <div style={{ fontSize: 17, color: '#888', marginTop: 2 }}>{p.name}</div>
          </div>
        ))}
      </div>
      <button onClick={start} style={{ background: '#0D2B5E', color: '#fff', border: 'none', borderRadius: 24, padding: '13px 32px', fontSize: 17, fontWeight: 600, cursor: 'pointer' }}>
        Find out!
      </button>
    </div>
  )

  if (phase === 'result') {
    const profile = DOG_PROFILES[result]
    const imgSrc = `/dogs/${profile.folder}/${profile.prefix}${String(imgNum).padStart(3, '0')}.png`
    return (
      <div style={{ padding: '16px' }}>
        <div style={{ textAlign: 'center', marginBottom: 16 }}>
          <div style={{ fontSize: 17, color: '#aaa', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 }}>You are a...</div>
          <div style={{ fontSize: 28, fontWeight: 700, color: '#0D2B5E', marginBottom: 2 }}>{profile.name}</div>
          <div style={{ fontSize: 17, color: '#c08000', fontWeight: 600, marginBottom: 12 }}>{profile.tagline}</div>
        </div>
        <img
          src={imgSrc}
          alt={profile.name}
          style={{ width: '100%', borderRadius: 12, marginBottom: 14, maxHeight: 280, objectFit: 'cover' }}
          onError={e => { e.target.style.display = 'none' }}
        />
        <div style={{ background: '#f5f5f3', borderRadius: 10, padding: '14px', marginBottom: 16 }}>
          <p style={{ fontSize: 18, color: '#444', lineHeight: 1.7 }}>{profile.description}</p>
        </div>
        <button onClick={shareResult} disabled={sharing}
          style={{ width: '100%', background: '#1877f2', color: '#fff', border: 'none', borderRadius: 24, padding: '13px', fontSize: 17, fontWeight: 600, cursor: 'pointer', marginBottom: 10, opacity: sharing ? 0.7 : 1 }}>
          {sharing ? 'Preparing...' : '📤 Share my result'}
        </button>
        <button onClick={() => setPhase('intro')} style={{ width: '100%', background: '#0D2B5E', color: '#fff', border: 'none', borderRadius: 24, padding: '13px', fontSize: 17, fontWeight: 600, cursor: 'pointer' }}>
          Try again
        </button>
      </div>
    )
  }

  const q = activeQuestions[current]
  return (
    <div style={{ padding: '12px 14px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
        <span style={{ fontSize: 17, color: '#aaa' }}>Question {current + 1} of 10</span>
        <span style={{ fontSize: 17, color: '#0D2B5E', fontWeight: 600 }}>🐾</span>
      </div>
      <div style={{ background: '#f5f3ee', borderRadius: 4, height: 6, marginBottom: 14, overflow: 'hidden' }}>
        <div style={{ height: '100%', background: '#0D2B5E', borderRadius: 4, width: `${((current + 1) / 10) * 100}%`, transition: 'width 0.4s' }} />
      </div>
      <div style={{ background: '#fff', borderRadius: 10, padding: '14px', marginBottom: 14, boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
        <p style={{ fontSize: 18, fontWeight: 600, color: '#222', lineHeight: 1.5 }}>{q.q}</p>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {q.options.map((opt, i) => {
          const isSelected = selected === opt
          return (
            <button key={i} onClick={() => answer(opt)}
              disabled={selected !== null}
              style={{ background: isSelected ? '#e8edf7' : '#fff', border: isSelected ? '2px solid #0D2B5E' : '1px solid #ddd', borderRadius: 10, padding: '12px 14px', fontSize: 18, color: '#333', textAlign: 'left', cursor: selected !== null ? 'default' : 'pointer', transition: 'all 0.2s' }}>
              {opt.text}
            </button>
          )
        })}
      </div>
    </div>
  )
}


// ─── PHOTOS SCREEN ────────────────────────────────────────────────────────────
function PhotosScreen({ controls }) {
  const [photos, setPhotos] = useState([])
  const [current, setCurrent] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  useEffect(() => {
    const setId = controls?.flickr_set_id
    const userId = controls?.flickr_user_id
    if (!setId || !userId) { setError(true); setLoading(false); return }
    const url = `https://www.flickr.com/services/feeds/photoset.gne?set=${setId}&nsid=${encodeURIComponent(userId)}&lang=en-us&format=json&jsoncallback=flickrCallback`
    window.flickrCallback = (data) => {
      if (data && data.items) {
        setPhotos(data.items)
      } else {
        setError(true)
      }
      setLoading(false)
    }
    const script = document.createElement('script')
    script.src = url
    script.onerror = () => { setError(true); setLoading(false) }
    document.head.appendChild(script)
    return () => {
      try { document.head.removeChild(script) } catch(e) {}
      delete window.flickrCallback
    }
  }, [])

  function prev() { setCurrent(c => (c - 1 + photos.length) % photos.length) }
  function next() { setCurrent(c => (c + 1) % photos.length) }

  if (loading) return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 40, textAlign: "center" }}>
      <div style={{ fontSize: 40, marginBottom: 16 }}>📷</div>
      <div style={{ fontSize: 15, color: "#aaa" }}>Loading photos...</div>
    </div>
  )

  if (error || photos.length === 0) return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 40, textAlign: "center" }}>
      <div style={{ fontSize: 40, marginBottom: 16 }}>📷</div>
      <div style={{ fontSize: 15, color: "#aaa" }}>Photos not available right now.</div>
      <a href="https://www.flickr.com/photos/200033545@N06/albums/72177720332033414/" target="_blank" rel="noreferrer"
        style={{ marginTop: 16, color: "#0D2B5E", fontSize: 14, fontWeight: 600 }}>View on Flickr →</a>
    </div>
  )

  const photo = photos[current]
  const imgUrl = photo.media.m.replace("_m.jpg", "_b.jpg")

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      <div style={{ position: "relative", flex: 1, background: "#000", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden" }}>
        <img key={current} src={imgUrl} alt={photo.title}
          style={{ maxWidth: "100%", maxHeight: "100%", objectFit: "contain" }} />
        <button onClick={prev} style={{ position: "absolute", left: 8, top: "50%", transform: "translateY(-50%)", background: "rgba(0,0,0,0.5)", border: "none", borderRadius: "50%", width: 44, height: 44, color: "#fff", fontSize: 24, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>‹</button>
        <button onClick={next} style={{ position: "absolute", right: 8, top: "50%", transform: "translateY(-50%)", background: "rgba(0,0,0,0.5)", border: "none", borderRadius: "50%", width: 44, height: 44, color: "#fff", fontSize: 24, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>›</button>
      </div>
      <div style={{ background: "#fff", padding: "10px 16px", borderTop: "1px solid #eee" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: "#222", flex: 1, marginRight: 12 }}>{photo.title || "NSDT 2026"}</div>
          <div style={{ fontSize: 13, color: "#aaa", flexShrink: 0 }}>{current + 1} / {photos.length}</div>
        </div>
        <div style={{ display: "flex", gap: 6, overflowX: "auto", paddingBottom: 4 }}>
          {photos.slice(Math.max(0, current - 3), current + 5).map((p, i) => {
            const idx = Math.max(0, current - 3) + i
            return (
              <img key={idx} src={p.media.m} alt="" onClick={() => setCurrent(idx)}
                style={{ width: 56, height: 56, objectFit: "cover", borderRadius: 6, flexShrink: 0, cursor: "pointer", border: idx === current ? "2px solid #0D2B5E" : "2px solid transparent", opacity: idx === current ? 1 : 0.6 }} />
            )
          })}
        </div>
      </div>
    </div>
  )
}


// ─── ELIZA CHAT ──────────────────────────────────────────────────────────────

const ELIZA_KNOWLEDGE = `# Eliza's Knowledge Base — National Sheep Dog Trial Championships
*This document is used to train Eliza, the AI assistant for the NSDTA app.*

---

## What is the National Sheep Dog Trial Championships?

The National Sheep Dog Trial Championships is Australia's premier sheep dog trialling event, held annually in March at the Hall Showgrounds, 21 Gladstone Street, Hall Village — a small rural village about 20 minutes north of Canberra city centre.

The event tests the ability of a dog, its handler and three sheep to work together to complete a course of obstacles within a time limit. It is a sport that traces back over 150 years — the first sheep dog trial in the world was held at Forbes, NSW in 1870.

The National has been running since 1943, making it one of Australia's longest-running animal sport events. It started as a single-day fundraiser at Manuka Oval in Canberra during World War II, organised by George Westcott to raise money for the Legacy organisation. The first event was officially opened by Prime Minister John Curtin and attracted 3,000 spectators. It has grown from that one-day event into a seven-day championship attracting hundreds of the country's best working dogs and handlers from every state and New Zealand.

The sport is genuinely inclusive — men, women, young and old compete on exactly equal terms. It is one of the few sports where age and gender make no difference to eligibility.

---

## The Duke of Gloucester Sash

The Duke of Gloucester Sash is the most prestigious award in Australian sheep dog trialling, presented to the National Open Champion.

After attending the 1944 Championships, His Royal Highness Prince Henry, Duke of Gloucester — who was then serving as Governor-General of Australia — donated the Sash for competition at a National Championship to be held annually in Canberra. It was formally presented in 1945.

The Sash is 5 feet long and 9 inches wide, hand embroidered on royal blue velvet, carrying the Royal Coat of Arms with gold fringing. It was designed by Miss Peggy Forrest and made by Messrs. H. Schiess & Sons Pty Ltd of Sydney.

The Duke was the younger brother of King George VI and uncle of Queen Elizabeth II. The original Sash is now preserved and replica sashes are presented to winners.

In 1975, Her Majesty Queen Elizabeth II granted permission for the Association to offer a trophy bearing her name — "The Queen's Trophy" — making the National the only sheep dog trial association in the world with both a Royal Sash and a Queen's Trophy.

The Open Champion also receives $5,000 prize money and a portrait of the winning dog by artist Linda Dening.

---

## The Competition Classes

There are three competition classes:

**Maiden** — for dogs that have not yet won a Maiden or Novice trial. This is the entry level class, designed for dogs newer to competition.

**Improver** — for dogs that have won at Maiden or Novice level but have not yet won an Open trial. These are experienced dogs developing their skills toward the highest level.

**Open** — the highest level, open to all dogs regardless of experience. Open dogs compete for the Duke of Gloucester Sash and the title of National Open Champion.

Open and Improver dogs run on the same course on the same days and are intermingled in the draw. Maiden dogs run on a separate course. The Improver class was introduced in 1973.

---

## How the Competition Works

### The Draw
The draw determines the order in which dogs run. There are typically around 120 runs in the Open/Improver draw and around 80 in the Maiden draw, spread across the week.

### Scoring
Every run starts at 100 points. The judge watches carefully and deducts points for faults throughout the run. A score of 90 or above is considered excellent. Scores in the 80s are solid. Below 70 is generally not competitive.

The judge is looking for calm, quiet, controlled work — a dog that moves sheep smoothly and precisely with minimal commands.

### Non-completion codes
- **R** — Retired: the handler chose to stop the run early
- **X** — Eliminated: a rule breach ended the run
- **SCR** — Scratched: the dog was withdrawn before running
- **DQ** — Disqualified

### The Finals

**Maiden Top 15** — the 15 best Maiden scores from the qualifying round progress to the Maiden Top 15 run, then to the Maiden Final. The Maiden Final total score is: 1st run + Top 15 run + Final run.

**Improver Final** — the top 5 Improver scores from the qualifying round progress to the Improver Final. The total score is: 1st run + Final run.

**CopRice National Top 20** — the top 20 combined scores from Open and Improver qualifying progress to the Top 20 run, held on Sunday morning. The top 5 of those then progress to the Open Final.

**Open Final** — the top 5 from the Top 20 compete in the Open Final on Sunday afternoon. The total score is: 1st run + Top 20 run + Final run.

The first 4 dogs in the Maiden Final are given free entry into the Improver Trial and may be entered in the Open Trial. If entered in the Open, these dogs are eligible for the Top 20. The Maiden Champion may join the Open as an Improver.

---

## The Course and Obstacles

A handler and their dog work three sheep around a series of obstacles within a 15-minute time limit. The course includes:

**Cast** — the dog runs out wide to gather the sheep without disturbing them. A good cast gives the sheep plenty of room.

**Lift** — the dog's first controlled movement of the sheep after the cast. A good lift is calm and steady.

**Fetch** — the dog brings the sheep to the handler along the ideal line. Points are deducted when sheep drift off line.

**Drive** — the dog moves sheep away from the handler through a series of obstacles. This tests the dog's ability to work at a distance.

**Race** — a narrow fenced corridor that the sheep must pass through. Tests precise control as the gap is tight.

**Bridge** — sheep must walk across an elevated platform. Tests calm handling as sheep can be reluctant to cross.

**Pen** — sheep must enter an enclosure. This is a close-control test and often where runs are won or lost.

**Crossing** — a fault that occurs when the dog passes between the handler and the sheep. It is penalised by the judge.

**Gripping** — a dog biting the sheep. This is penalised and can result in elimination.

---

## The Champion of Champions

The Champion of Champions is a special event held on Saturday afternoon. It brings together the State and Commonwealth champions from the previous year to compete against each other. It is a highlight of the week for experienced trialling followers as it showcases some of the very best dogs in current Australian trialling.

---

## The Dogs

The two main breeds in Australian sheep dog trialling are the **Border Collie** and the **Kelpie**.

**Border Collies** are known for their intense eye contact (called "eye") and methodical, precise style. They tend to work sheep with calm authority.

**Kelpies** are known for their energy, speed and boldness. They are tireless workers and often more suited to the harsh conditions of Australian farming.

Both breeds are highly intelligent working dogs. Some handlers run dogs of mixed breeding. The choice of breed often comes down to personal preference and the type of country the handler farms.

Working sheepdogs have a natural instinct to herd that is bred into them over generations. Handlers can usually tell by the time a dog is two and a half years old whether it has the instinct and finesse for trialling. Dogs that don't make the cut as trial dogs often remain as working farm dogs or become family pets.

The genetics of the dog play a big role — disposition and drive are often passed down through bloodlines.

---

## Venue and Atmosphere

The event is held at Hall Showgrounds, 21 Gladstone Street, Hall Village — a small rural village about 20 minutes north of Canberra.

The atmosphere is relaxed and family friendly. There is food available including the famous scones with jam and cream. Dogs on leads are welcome throughout the spectator areas.

Entry is free on Tuesday so that everyone can come. The best viewing is from the arena perimeter which is fully accessible at ground level. Trialling may start as early as 7am and not later than 9am, with the best action typically from 9am to 4pm.

Spectators can watch from the car if they have disability or mobility needs — cars with disability passengers may drive to the arena perimeter.

---

## Frequently Asked Questions

**How long does each run take?**
Up to 15 minutes, though many runs finish sooner.

**How many dogs compete?**
Around 120 runs in the Open/Improver draw and around 80 in the Maiden draw across the week.

**Can I bring my dog?**
Yes — dogs on leads are welcome throughout the spectator areas.

**Is there food?**
Yes — scones with jam and cream are a highlight, plus other food options in the pavilion.

**Is it suitable for children?**
Very much so. It is a relaxed, open-air event with plenty to watch. Entry is free for children under 16.

**How much does it cost?**
- Adult day entry: $10 per day
- Children 15 and under: free
- All-trial pass (entry for all 7 days): $30
- Programs: $5
- Tuesday is free entry for everyone
- Tickets can be purchased at the gate (cash or eftpos accepted) or online via EventBrite
- You can leave and re-enter on the same day

**What should I look for when watching?**
Watch how quietly and calmly the dog moves the sheep. The best runs look almost effortless — the sheep move smoothly with minimal commands. Soft whistling from the handler guides the dog. The closer the sheep stay to the ideal line through the course, the better the score.

**Why do some dogs stare at the sheep?**
That intense stare is called "eye" — it is a natural trait particularly strong in Border Collies. A dog with strong eye uses it to hold the sheep's attention and control their movement without needing to physically chase them.

**What happens if a dog bites a sheep?**
Gripping (biting) is penalised and can result in elimination from the run.

---

## History Highlights

- **1870** — First sheep dog trial in the world held at Forbes, NSW
- **1943** — First National Championship held at Manuka Oval, Canberra, organised by George Westcott to raise funds for Legacy. Opened by Prime Minister John Curtin.
- **1944** — Duke and Duchess of Gloucester attend. Duke announces donation of the Sash.
- **1945** — First official National Championship. Duke of Gloucester Sash awarded for the first time.
- **1946-1952** — The "Kelpie era" dominated by Johnny, a black and tan Kelpie who won 5 National Championships and was never defeated on the National ground.
- **1951** — All Australian states and New Zealand represented for the first time. Queen Elizabeth II (then Princess) sends congratulations.
- **1964** — Trials move from Manuka Oval to the new National Showground (now Hall Showgrounds).
- **1970** — Queen Elizabeth II and the Duke of Edinburgh attend and present trophies — the first time members of the Royal Family officially attended a sheep dog trial in Australia.
- **1946-1952** — The Kelpie Era. "Johnny", a beautiful black and tan Kelpie by "Warragul" from "Scarlet O'Hara", bred by C.L. Walker of Tenterfield NSW and owned and worked by Athol Butler of "Kanimbla", Moree NSW, won the first of his five National Championships in 1946. Johnny became a household name wherever sheep dog men gathered. He was never defeated on the National Trial ground and on one occasion scored the maximum 100 points. In his final win at the 1951 championship, Johnny tore his flank on barbed wire before his run — the vet stood by to insert 8 stitches after the trial ended. Johnny died in 1959 at the age of 17. George Westcott, the founder of the National, stated that Johnny was easily the best sheep dog that ever worked in a National Sheep Dog Trial Championship.

**Johnny's National record:**
- 1946: 90 + 90 = 180 points (Judge M.A. McLeod)
- 1947: 94 + 88 = 182 points (Judge R. Coleman Noakes)
- 1948: 93 + 90 = 183 points (Judge A.D. Anson)
- 1951: 97 + 95 = 192 points (Judge J. Batson)
- 1952: 97 + 100 = 197 points (Judge R. Coleman Noakes)

Johnny averaged 93.75 points per run and improved his score every year. In 1950 he did not compete — kelpie supremacy was maintained that year by "Curley", owned by C.W. Butt of Illabo NSW, who scored 173 points to win the first championship conducted by the newly formed National Sheep Dog Trial Association.

- **1973** — First National Improvers Championship held.
- **1975** — Queen Elizabeth II grants permission for "The Queen's Trophy" to be offered for competition.

---

## About Eliza

Eliza is a fictional working sheepdog who loves the National and knows everything about sheep dog trialling. She is friendly, enthusiastic and knowledgeable. She answers questions about the trial, the competition, the venue, the dogs and the history of the event. If someone asks about something outside her area of knowledge she says something like "That's a bit outside my paddock! Ask me about the National and I'll be happy to help 🐑"

---

## Detailed Trial Rules (for accurate answers)

### Points Breakdown
- General work: 65 points
- Race: 7 points
- Bridge: 8 points
- Pen: 20 points
- **Total: 100 points**

A dog that fails to negotiate any obstacle cannot score more than 50 points.

### Time Limit
All Open Championship trials are 15 minutes. The trial commences as soon as the judge signals to release the sheep.

### The Course
- Sheep are released from one end and the dog casts out to gather them
- Sheep must be pulled into a delivery area 16 metres square
- After delivery, sheep must be kept within 8 metres of the worker
- Sheep must be carried on the worker's right hand side around winding pegs and through obstacles
- The race (narrow corridor) is 8 metres wide

### Handler Rules
- The handler must stand in a 1 metre circle at each obstacle, 3 metres from the wings
- The handler must not leave the circle before all sheep are clear of the obstacle or they will be disqualified
- The handler may use a cane not exceeding 46 centimetres in length
- The handler must not touch the dog during the trial — doing so results in disqualification
- Commands may be hand signals, stick signals, verbal directions or whistles

### Crossing
Any dog crossing between the handler and the sheep at any time during the trial will be disqualified.

### Gripping (biting)
If a dog bites a sheep aggressively or viciously without provocation it will be disqualified. However, a dog will not be disqualified if it bites the fore part of a sheep that is stuck, or bites a sheep on the hindquarters when the sheep is jammed on the bridge.

### The Pen
The pen is worth 20 points — the most of any single obstacle. All three sheep must be penned and held until the handler shuts the gate. The trial terminates when the gate is closed.

### Dog Status
- **Novice/Maiden dog**: has not won an affiliated novice trial
- **Improver dog**: has won a novice trial but nothing better
- A dog breaks its status by winning at the next level up — it cannot go back

### Disqualification
A dog can be disqualified for: crossing between handler and sheep, handler touching the dog, a dog breaking before the bell and making contact with sheep, aggressive biting of sheep, or leaving the arena out of control.

---

## Key Facts (from 2025 Governor-General Briefing)

- In 2025 the National attracted more than 80 competitors from across Australia
- Competitors brought more than 300 dogs
- The event is made possible by a team of nearly 100 volunteers, many from the local community
- The National has been held in Hall Village since 1978 (previously at Manuka Oval and then the old National Showground)
- The Governor-General of Australia presents the Duke of Gloucester Sash at the award ceremony on Sunday afternoon
- The award ceremony is held in the Hall Pavilion
- The President of the National Sheep Dog Trial Association is Sarah Sydrych
- The Vice President is Eileen Moriarty
- The event runs from approximately 2pm to 4:15pm on the final Sunday for the Open Final and award ceremony

---

## Why Sheep Dog Trials Are Run

The first competitive sheep dog trials were held in Wales. The purpose then — and now — is to bring together owners and breeders to share knowledge about the breeding, training, feeding, care and development of their dogs.

Present-day showground trials have evolved to display and publicise the tasks dogs undertake on stations, farms and droving roads. The three-sheep format used in arena trials is particularly demanding — three sheep are the most difficult number to work, but more practical than large numbers on a small ground.

The sport is not just about competition. It demonstrates the extraordinary ability of working dogs that are essential to the Australian pastoral industry.

---

## 2026 Event Details (83rd National)

**Dates:** 9–15 March 2026
**Venue:** Hall Village Showground, Gladstone St, Hall Village ACT 2619
**This is the 83rd National Sheep Dog Trial Championships**

### Major Sponsor
CopRice — the CopRice National Top 20 is named in their honour.

### Major Supporter
ACT Government

### Contact
- Email: natsheepdogtrials@gmail.com
- Website: nationalsheepdogtrials.org.au
- Facebook: facebook.com/NatSheepDogTrialACT
- Instagram: instagram.com/national_sheepdog_trials

### 2026 Judges
**Open/Improver Championship Judge: Jenny Atherton**
Jenny and her husband Ken run a farming operation at Tarwonga in the southwest of Western Australia, raising Dohne and composite sheep alongside cropping. With 20 years of sheepdog trialling experience, Jenny has been an open judge for the past 10 years.

**Maiden Championship Judge: Simon Leaning**
Simon has judged nationally and internationally for over two decades since 2000, including the Supreme Novice at Northam WA, Hawkesbury NSW, and the Australian Yard Championships. He represents Western Australia in the Interstate Challenge. His home-bred dog Marionvale Di is the current WA Arena Dog of the Year. Simon runs kelpies and border collies and conducts training schools across Australia and internationally.

---

## 2026 Prizes

### National Open Champion
- 1st: $5,000, the Queen's Trophy, portrait of the winning dog by artist Linda Dening, a framed replica of the Duke of Gloucester Sash, and the Greg Prince Memorial Watch
- 2nd: $1,500 and sash
- 3rd: $800 and sash
- 4th: $600 and sash
- 5th: $500 and sash
- 6th: $400 and sash
- Top 20 Finalists: $100

### Champion of Champions
$1,000 and sash

### National Improver Champion
- 1st: $1,000, sash and trophy
- 2nd: $600 and sash
- 3rd: $400 and sash
- 4th: $200 and sash
- 5th: $100 and sash

### National Maiden Champion
- 1st: $2,000, The New Zealand High Commission Shield, Sash and Trophy
- 2nd: $800 and sash
- 3rd: $600 and sash
- 4th: $300 and sash
- 5th: $200 and sash
- 6th: $100 and sash

### Additional Daily Prizes
Each day Monday to Saturday, the highest scoring run in both Open/Improver and Maiden receives a prize.

### Memorial Awards
- **George Westcott Memorial Award** — $50 and Sash for the highest scoring dog in the first round of the National Maiden Championship
- **Charlie Cover Award** — $50 and Sash for the highest scoring dog in the first round of the National Improver Championship
- **National First Time Award** — $50 and Sash for the highest score by a first-time National competitor
- **Mellissa Gillard Memorial Shield** — $50 and Sash for the highest scoring competitor working their own bred dog

---

## The Duke of Gloucester Sash — Additional Detail

The Sash is 25cm wide and 115cm long — a unique, velvet, hand embroidered piece. The embroidered coat of arms is from the Royal House of Windsor. Over the years the velvet has faded to a beautiful antique brown but the original colour was royal purple.

The first presentation of a replica of the original Sash happened in 2019. The replica has been restored to what would have been the original colour, and the size halved for practical reasons. The reproduction is a photographic art print on archival photo art paper, mounted and framed with a brass plaque presenting the name of the winner.

Queen Elizabeth II and the Duke of Edinburgh attended the National Sheepdog Trial Championships on Saturday 26 April 1970 and witnessed the Finals competition. The Queen presented the Sash to the winner Mr Bob Ross and his dog Yulong Russ.

---

## Understanding Sheepdog Trialling — The Art

The art of sheepdog trialling is for the dog, under the directions and control of the handler, to balance three allotted sheep between FIGHT and FLIGHT.

A handler's aim is to establish presence as early as possible, generally by applying and releasing pressure — the dog moves carefully towards the sheep and then moves away when the sheep respond. If successful, the sheep will accept the dog as a non-threatening control.

The major judging consideration is the relationship between where the sheep ARE as opposed to where they OUGHT TO BE. At any given time there is a specific place the sheep ought to be, and if they are not there, points will be deducted.

If time expires before the course is completed, a score is still available. Each obstacle has a points value awarded as the obstacle is completed.

### The Course in Detail
Three randomly selected sheep are released from the far end of the ground, positioned approximately 20 metres from the fence. When the judge is satisfied they are reasonably placed, the trial starts.

The dog is then CAST — the initial runout, which may go left or right. When the dog reaches the Point of Balance (a position from which the sheep can be moved directly towards the handler), the judge draws an imaginary 8-metre corridor to the handler. To retain maximum points, the sheep must remain within this corridor until delivered to the handler.

From there the course is clearly marked. The handler walks on the LEFT hand side of the 8-metre corridor. The course takes a left turn at the first WINDING PEG. Sheep must pass to the right of the second WINDING PEG, travelling anticlockwise.

At each obstacle the handler takes a marked position 3 metres from the edge of the obstacle and must not move until all sheep have cleared.

---

## The Trial Sheep

The sheep used at the National are not just any sheep — they are high quality, carefully selected animals. In 2026 the sheep were supplied by Neil and Vicki Carey of "Kashmir", Wee Jasper — super-fine wool merino sheep at the top of the super-fine wool industry. Competitors are asked to treat all stock with utmost care.

---

## Hall Village

Hall Village is the proud home of the National Sheepdog Trial Championships. It is a small, friendly country village on the edge of Canberra.

The very first Canberra Show was held at the Hall Village Showground in 1927, before it moved to its current home many years later.

Hall is a heritage precinct — the Hall Village Precinct was entered on the ACT Heritage Register in 2001, protecting its historic buildings, rural character and Aboriginal heritage values.

### Hall Rotary
Hall Rotary has been part of the village since 1989. It runs the Capital Region Farmers Market at EPIC. Each year about $300,000 is donated to projects supporting young people, local community groups, environmental causes and international programs. The Sheep Dog Trials benefit greatly from Rotary volunteers.

### Hall Men's Shed
Around 80 members meet to work on projects and enjoy each other's company. Men's Shed members help set up equipment, build and fix things, and help the event run smoothly.

### Hall Village Heritage Centre
Collects and looks after photos, stories and objects from the Hall-Ginninderra district.

---

## Scholarship Program and Youth

The NSDTA Scholarship Program supports young people under 30 who are passionate about three sheep trialling. Each successful applicant can receive up to $1,000 per year plus mentoring from experienced triallers. In 2025, more than 20 young handlers were helped. Applications close 31 March 2026.

Each year regional schools are invited to visit the National so students can see top handlers and dogs at work and receive instruction on herding. In 2026, schools from Jindabyne, Crookwell, Goulburn and Karabar attended.

---

## Spectator Tips

- **Please ONLY clap and cheer when the gate to the pen is SHUT** — noise during a run can disturb the sheep and affect the dog's work
- Food, coffee and scones are available each day, with a wider selection on Friday, Saturday and Sunday
- Tuesday is FREE ENTRY DAY
- On Tuesday, spectators can walk the course with an experienced trialler
- On Wednesday and Thursday, spectators can walk the course or watch a sheep demonstration
- The Welcome BBQ for competitors and families is held on Tuesday evening (BYO cutlery, plates, glass and drinks)
- The Dogs' Dinner and CopRice Top 20 presentation is on Saturday evening
- The movie 'Oddball' is screened on Friday evening for competitors and families

---

## Volunteers

The National is run by nearly 100 volunteers, many from the local Hall community. Volunteers are the heart of the event — without them it simply could not happen.

### What volunteers do
Volunteer roles include welcoming people at the gates, catering (feeding our audience is a big job!), managing the sheep at the "let out" end of the course, first aid, marketing, photography, and many more behind-the-scenes roles. The photography team is particularly special — they capture images throughout the week and put together a "Top Shots" selection each day, which you can see in the app or on the screen in the Pavilion.

### Experience required
None at all — everyone is welcome. Volunteers are usually paired with someone experienced so they can learn on the job.

### Flexibility
There is a lot of flexibility. Volunteers can work as little as one shift, and many choose to work for a few days. There is no requirement to commit to the full week.

### Volunteer perks
Volunteers receive a shirt, free entry to the event, and are well fed — they are part of the family.

### How to sign up
Email natsheepdogtrials@gmail.com and the friendly volunteer coordinator will be in touch.

---

## Sponsors and Supporters

### CopRice — Major Sponsor
CopRice is an Australian working dog food brand and the major sponsor of the National. The Top 20 is named the "CopRice National Top 20" in their honour.

CopRice makes premium nutrition specifically for working dogs — the elite endurance athletes of the paddock. Their working dog range is made with Australian meat as the number one ingredient, plus 100% Australian-grown brown rice, antioxidants, omega 3, 6 and 9 for healthy coats and energy, glucosamine for joint health, and yucca as a prebiotic for gut health. Their formulas are high in fat and protein to fuel demanding workloads — exactly what sheep dog trial competitors need from their dogs.

CopRice is a perfect fit for the National — a brand built around working dogs sponsoring Australia's most prestigious working dog event.

Website: coprice.com.au

### Collagenie — Valued Supporter
Collagenie is the world's first certified organic collagen peptide supplement designed specifically for pets. 100% Australian-made and vet-endorsed, Collagenie was founded by Fiona Dobbrick and is produced using a custom freeze-drying process that preserves bioactive peptides without toxic chemicals, pesticides, antibiotics, GMOs or artificial preservatives.

Their range includes Joint & Mobility, Skin & Coat, and Whole Body Boost — unflavoured powders that can be added to wet or dry food. For working dogs like kelpies and border collies that put their joints through daily wear and tear, collagen supplementation can support joint flexibility, mobility and coat condition.

National competitor Bill Davidson is a Collagenie supporter, saying "I view my dogs as canine athletes and I believe the better you can look after them, the better their performance will be."

Website: collagenie.com.au/workingdogs

### ACT Government — Major Supporter
The ACT Government provides major support for the National, recognising it as an important cultural and community event for the nation's capital region.

### Other Event Supporters
The National is also supported by a wonderful community of local businesses and organisations including Barlens (event hire), Hall Men's Shed, Hall Fire Brigade, Hall Pony Club, Linda Dening (artist who paints the winning dog portrait), Kynefin, Riverbourne Distillery, Canberra Stockfeeds, Daughters of Hall, Hall Village Post Office and Gift Store, and the Hall & District Collectors Club.

---

## Past Open Final Results

Dogs qualify for the Open Final through their scores in the qualifying round and the CopRice National Top 20. A handler can have more than one dog qualify — in 2021 Mick Hudson had four dogs in the final. You don't enter the final, you earn your place.

### 2026 Open Final — Champion: Ken Atherton & Ramulam Prickles (276)
| Place | Competitor | Dog | 1st | Top 20 | Final | Total |
|---|---|---|---|---|---|---|
| 1 | Ken Atherton | Ramulam Prickles | 97 | 98 | 81 | 276 |
| 2 | Scott Smith | MGH Gem | 95 | 93 | 85 | 273 |
| 3 | Bill Davidson | Grassvalley Flake | 89 | 96 | 87 | 272 |
| 4 | Simon Leaning | Marionvale Di | 95 | 86 | 89 | 270 |
| 5 | Tegan Perry | Bredbo Razz | 93 | 91 | 85 | 269 |
| 6 | Scott Smith | Wynella Pink | 90 | 92 | 83 | 265 |

### 2025 Open Final — Champion: Scott Smith & MGH Gem (285)
| Place | Competitor | Dog | 1st | Top 20 | Final | Total |
|---|---|---|---|---|---|---|
| 1 | Scott Smith | MGH Gem | 95 | 96 | 94 | 285 |
| 2 | Mick Hudson | MGH Rabbit | 93 | 99 | 91 | 283 |
| 3 | Les Eveleigh | Hiltons Major | 89 | 97 | 90 | 276 |
| 4 | Gary White | White's Chrissie | 94 | 93 | 87 | 274 |
| 5 | Doug Taylor | MGH Tara | 94 | 92 | 72 | 258 |
| 6 | Charlie Knight | Camara Spark | 92 | 97 | X | 189 |

### 2024 Open Final — Champion: Scott Smith & Wynella Pink (264)
Note: In 2024 there was no separate Top 20 run — the 1st Score column is the combined 1st round and Top 20 score.
| Place | Competitor | Dog | Combined Score | Final | Total |
|---|---|---|---|---|---|
| 1 | Scott Smith | Wynella Pink | 174 | 90 | 264 |
| 2 | Stefan Cross | Echo Park Lady | 175 | 83 | 258 |
| 3 | Dave Lacey | Brandshatch Tusker | 173 | 76 | 249 |
| 4 | Tony Elliott | OK Indiana Buckles | 174 | 74 | 248 |
| 4 | Billy Davidson | Grassvalley Flake | 171 | 77 | 248 |
| 6 | Stefan Cross | Echo Park Bazza | 170 | 72 | 242 |

### 2023 Open Final — Champion: Mick Hudson & MGH Rabbit (288)
| Place | Competitor | Dog | 1st | Top 20 | Final | Total |
|---|---|---|---|---|---|---|
| 1 | Mick Hudson | MGH Rabbit | 97 | 96 | 95 | 288 |
| 2 | John Perry | Bredbo Ash | 88 | 95 | 95 | 278 |
| 3 | Pip Flower | Flowers' Fang | 91 | 95 | 83 | 269 |
| 3 | Pip Flower | Flowers' Hurricane | 95 | 93 | 81 | 269 |
| 5 | Leigh Foster | Me Mate Shirley | 90 | 93 | 81 | 264 |
| 6 | Bill Davidson | Grassvalley Flake | 96 | 90 | X | 186 |

### 2022 Open Final — Champion: John Perry & Bredbo Ash (273)
| Place | Competitor | Dog | 1st | Top 20 | Final | Total |
|---|---|---|---|---|---|---|
| 1 | John Perry | Bredbo Ash | 91 | 87 | 95 | 273 |
| 2 | Mick Hudson | Echo Park Mel | 86 | 90 | 95 | 271 |
| 3 | John Perry | Deltio Gem | 82 | 93 | 91 | 266 |
| 4 | Paul Elliott | Elliotts Brisket | 91 | 87 | 81 | 259 |
| 5 | Barry Knight | Fiesta Jane | 82 | 94 | 81 | 257 |
| 6 | Pip Flower | Flowers Hurricane | 80 | 97 | 41 | 218 |

### 2021 Open Final — Champion: Tony Elliott & Gundagai Frosty (366)
Note: 2021 included a run-off round. Mick Hudson had four dogs qualify for the final.
| Place | Competitor | Dog | 1st | Top 20 | Final | Run Off | Total |
|---|---|---|---|---|---|---|---|
| 1 | Tony Elliott | Gundagai Frosty | 95 | 95 | 91 | 85 | 366 |
| 2 | Mick Hudson | MGH Tri | 97 | 90 | 94 | 76 | 357 |
| 3 | Mick Hudson | Ritchies Finn | 98 | 92 | 79 | 0 | 269 |
| 4 | Linda Dening | Windeyer Bobby | 93 | 92 | 76 | 0 | 261 |
| 5 | Mick Hudson | Echo Park Mel | 96 | 91 | 68 | 0 | 255 |
| 6 | Mick Hudson | Marong Debbie | 95 | 97 | 0 | 0 | 192 |
| 7 | Pip Hudson | Rocky Sky | 96 | 89 | 0 | 0 | 185 |

### 2020 Open Final — Champion: Bill Davidson & Z.O.Z Roger (252)
| Place | Competitor | Dog | 1st | Top 20 | Final | Total |
|---|---|---|---|---|---|---|
| 1 | Bill Davidson | Z.O.Z Roger | 83 | 82 | 87 | 252 |
| 2 | Mick Hudson | MGH Cat | 94 | 84 | 68 | 246 |
| 3 | Mick Hudson | Echo Park Mel | 87 | 78 | 79 | 244 |
| 4 | John Perry | Bocco Raffa | 92 | 75 | 74 | 241 |
| 5 | Geoff Gibson | Smiley's JT | 87 | 79 | 69 | 235 |
| 6 | Barry Paton | Dodge's Sting | 87 | 85 | 0 | 172 |
| 7 | Mick Hudson | MGH Rosie | 89 | 84 | 0 | 173 |

### Notable champions and patterns
- **Scott Smith** won back-to-back in 2024 and 2025 and was runner-up in 2026
- **Ken Atherton** won the 2026 title with Ramulam Prickles scoring 276
- **Mick Hudson** has been the most dominant competitor across the period — winning in 2020, 2023, and consistently placing with multiple dogs
- **Bill Davidson** won in 2020 and has been a finalist across multiple years with different dogs
- **John Perry** won in 2022 with two different dogs in the same final
- **Tony Elliott** won in 2021 with Gundagai Frosty
- A score of 0 in the Final means the dog did not complete the final run
- X means the dog was eliminated during that run
---

## George Westcott and the Founding of the National

George Westcott was the founder and long-serving honorary secretary of the National Sheep Dog Trial Association. In 1927 he and R.G. Casey were the first public servants to be moved to Canberra from Melbourne, attached to the Prime Minister's Department under Mr Bruce.

In 1943 Legacy was looking for ways to raise funds for the families of fallen soldiers and asked Westcott for help. He remembered seeing Joe Moses's father working a dog at the Kyabram show and decided to run sheep dog trials. The venue was to be Manuka Oval — the Department of the Interior was dubious about sheep damaging the surface, but Westcott assured them he had seen sheep on Sydney Cricket Ground at least 20 times without damage, and permission was granted.

The first show was a great success. The Duke of Gloucester attended and was so enchanted by the display that he offered the Sash to be presented annually.

---

## Johnny — Additional Detail

George Westcott's personal view, written in his notes, was that Johnny was a master of positioning — so well could he judge the working distance to use on any three sheep that it was at times suspected that trained sheep had been served up to him. Seldom were his sheep out of a walk or an inch off course.

The newspaper article from 1970 (the year Queen Elizabeth attended) described Johnny as "a border collie-kelpie cross" — though the history document describes him as a kelpie. Westcott himself described Johnny: "He appeared to be a placid type of dog. He gained the confidence of the sheep and as soon as he had them under his control he just walked at their heels and they were at his will. If they fanned out, he would spread his front legs and rock from side to side until they bunched. He was an incredible dog."

---

## The 1970 Royal Visit

Queen Elizabeth II and the Duke of Edinburgh attended the National Sheep Dog Trial Championships on Saturday 26 April 1970. Police expected 30,000 people — the finals usually attracted four or five thousand. The visit involved everything from extra flags to a carpeted lavatory.

The Queen presented the Duke of Gloucester Sash to the winner Mr Bob Ross and his dog Yulong Russ. At approximately 4:15pm Her Majesty presented the two main trophies.

In 1970, 292 sheepdogs competed — a record at the time, breaking the 1964 record by 52 dogs.

---

## Why We Hold Sheep Dog Trials — George Westcott's Words

Written by George Westcott, Honorary Secretary, 1963:

"Well may we ask, why do we hold sheepdog trials? A true bred, well trained, well handled sheep dog, working 3 sheep in an oval is certainly a fascinating spectacle. But that is not all. It is a grand occasion when sheepmen meet at a given City or Town to enter into competitive but friendly competition with their sheepdogs.

To have one's own dog declared the winner of a major trial seems to be the great ambition of all sheepmen. Therefore the keen desire to succeed means the better breeding and handling of the working sheep dog. This in itself is of great benefit to the pastoral industry as the progeny of these working champions is readily available to sheep owners.

The trial course as laid out with gate, race, bridge and pen, represents the obstacles the sheep dog comes up against daily in his work on the farm. The cast, lift and draw represent the muster and delivery of the sheep."

---

## The National in the World Context

The National Sheep Dog Trial Championships is the world's largest sheep dog trial. In 1970, 292 dogs competed. George Westcott confirmed this was not just said for the sake of saying something — it was a genuine claim backed by the numbers. Today hundreds of dogs compete across the week.

In 1967, competitor Allan Miller went to Montreal Expo to give a trials demonstration for Australia, taking two border collies. Sheep at Expo spotted something in the stands and chased the spectators — one of the biggest laughs of the day.

---

## Judging — What the Judge Looks For

From George Westcott's 1963 notes on judging:

The judge looks firstly for a good keen working dog. Steadiness is essential so the dog may keep on good terms with the sheep and have good command over them. The good dog must work in a position that best suits steady and quiet handling of the particular sheep.

The dog must possess a high degree of anticipation — being quickly manoeuvred to any position to keep sheep on course and block a breakaway. The best position when sheep are being drawn to the worker is directly behind them.

Key qualities in a trial dog:
- **Position** — perhaps the most important point. Always in the correct spot to handle the sheep
- **Force** — the ability to move sheep when needed
- **Hold and block** — preventing sheep from breaking away at obstacles
- **Anticipation** — reading what the sheep will do before they do it
- **Steadiness** — working quietly so sheep accept the dog

The judge must never judge a dog by breed, conformation or colour of coat. Working ability alone is the sole requirement.

Turn tail (when the dog takes its eyes off the sheep and turns around) is generally a fault, penalised up to 2 points — but is sometimes correct work, such as when sheep charge at the dog and he must swing around to regain position.

Clapping (continual sitting and getting up) is bad style and usually means the handler is using it to maintain control rather than the dog working naturally. The good dog works on its feet.

Barking, unless called upon for stuck sheep, is undesirable and should be well penalised.
`

const ELIZA_SYSTEM = `You are Eliza, a knowledgeable and friendly working sheepdog who loves the National Sheep Dog Trial Championships. You answer questions from spectators, visitors and competitors about the National — the competition, the dogs, the history, the venue, the rules, the schedule, the prizes, the sponsors and everything else about the event.

Your personality:
- Warm, enthusiastic and knowledgeable
- You speak in first person as Eliza the dog, but you are not silly about it — you are helpful and informative first, playful second
- You use occasional sheep dog references naturally but don't overdo it
- You keep answers concise and easy to read on a phone screen
- You use the knowledge base below to answer accurately
- If someone asks something outside your knowledge, you say something like "That is a bit outside my paddock! Ask me anything about the National and I will do my best to help 🐑"
- You NEVER make up facts — only use what is in the knowledge base
- You do not discuss politics, other events, or topics unrelated to the National and sheep dog trialling

Here is your knowledge base:

${ELIZA_KNOWLEDGE}`

function ElizaView() {
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: "Woof! I'm Eliza 🐾 — your guide to the National Sheep Dog Trial Championships. Ask me anything about the competition, the dogs, the venue, the history or how everything works. What would you like to know?"
    }
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const messagesEndRef = useRef(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function send() {
    const text = input.trim()
    if (!text || loading) return

    const newMessages = [...messages, { role: 'user', content: text }]
    setMessages(newMessages)
    setInput('')
    setLoading(true)

    try {
      const response = await fetch('/.netlify/functions/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'claude-haiku-4-5-20251001',
          max_tokens: 1000,
          system: ELIZA_SYSTEM,
          messages: newMessages.map(m => ({ role: m.role, content: m.content }))
        })
      })
      const data = await response.json()
      const reply = data.content?.[0]?.text || "I am having a bit of trouble right now — try again in a moment 🐑"
      setMessages(prev => [...prev, { role: 'assistant', content: reply }])
    } catch (e) {
      setMessages(prev => [...prev, { role: 'assistant', content: "Something went wrong on my end — give me a moment and try again 🐑" }])
    } finally {
      setLoading(false)
    }
  }

  function handleKey(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      send()
    }
  }

  const suggestions = [
    "How does scoring work?",
    "What is the Duke of Gloucester Sash?",
    "What is the difference between Open, Improver and Maiden?",
    "How do I volunteer?",
  ]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>

      {/* Messages */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '12px 14px' }}>

        {/* Suggestions shown only at start */}
        {messages.length === 1 && (
          <div style={{ marginBottom: 12 }}>
            <div style={{ fontSize: 11, color: '#aaa', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.5 }}>Try asking...</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {suggestions.map((s, i) => (
                <button key={i} onClick={() => { setInput(s); }} style={{ background: '#f0f3fa', border: '1px solid #dde3f0', borderRadius: 20, padding: '7px 14px', fontSize: 13, color: '#0D2B5E', textAlign: 'left', cursor: 'pointer', fontWeight: 500 }}>
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((m, i) => (
          <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 12, flexDirection: m.role === 'user' ? 'row-reverse' : 'row' }}>
            {m.role === 'assistant' && (
              <div style={{ width: 32, height: 32, borderRadius: '50%', background: '#0D2B5E', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, flexShrink: 0 }}>🐾</div>
            )}
            <div style={{
              maxWidth: '80%',
              background: m.role === 'user' ? '#0D2B5E' : '#fff',
              color: m.role === 'user' ? '#fff' : '#222',
              borderRadius: m.role === 'user' ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
              padding: '10px 14px',
              fontSize: 14,
              lineHeight: 1.6,
              boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
              whiteSpace: 'pre-wrap',
            }}>
              {m.content}
            </div>
          </div>
        ))}

        {loading && (
          <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
            <div style={{ width: 32, height: 32, borderRadius: '50%', background: '#0D2B5E', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, flexShrink: 0 }}>🐾</div>
            <div style={{ background: '#fff', borderRadius: '18px 18px 18px 4px', padding: '10px 14px', boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}>
              <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                {[0,1,2].map(i => (
                  <div key={i} style={{ width: 6, height: 6, borderRadius: '50%', background: '#aaa', animation: `bounce 1.2s ${i * 0.2}s infinite` }} />
                ))}
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div style={{ padding: '8px 12px 12px', background: '#fff', borderTop: '1px solid #eee' }}>
        <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end' }}>
          <textarea
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKey}
            placeholder="Ask Eliza anything..."
            rows={1}
            style={{ flex: 1, border: '1px solid #ddd', borderRadius: 20, padding: '10px 16px', fontSize: 14, resize: 'none', outline: 'none', fontFamily: 'inherit', lineHeight: 1.4, maxHeight: 80, overflowY: 'auto' }}
          />
          <button onClick={send} disabled={!input.trim() || loading}
            style={{ width: 40, height: 40, borderRadius: '50%', background: input.trim() && !loading ? '#0D2B5E' : '#ddd', border: 'none', cursor: input.trim() && !loading ? 'pointer' : 'default', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: 18 }}>
            ➤
          </button>
        </div>
        <div style={{ fontSize: 10, color: '#ccc', textAlign: 'center', marginTop: 6 }}>Powered by AI · Eliza may make mistakes</div>
      </div>

    </div>
  )
}

const tickerStyle = document.createElement('style')
tickerStyle.textContent = '@keyframes ticker { 0% { transform: translateX(0); } 100% { transform: translateX(-50%); } } @keyframes bounce { 0%, 80%, 100% { transform: translateY(0); } 40% { transform: translateY(-6px); } }'
if (!document.getElementById('ticker-style')) { tickerStyle.id = 'ticker-style'; document.head.appendChild(tickerStyle) }

function App() {
  const [controls, setControls] = useState(null)
  const [openDraw, setOpenDraw] = useState([])
  const [maidenDraw, setMaidenDraw] = useState([])
  const [top20, setTop20] = useState([])
  const [maidenFinal, setMaidenFinal] = useState([])
  const [improverFinal, setImproverFinal] = useState([])
  const [openFinal, setOpenFinal] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('draw')
  const [drawSub, setDrawSub] = useState('open')
  const [lbSub, setLbSub] = useState('top20')
  const [mediaSub, setMediaSub] = useState('watch')
  const [funSub, setFunSub] = useState('eliza')
  const [lastUpdated, setLastUpdated] = useState(null)

  useEffect(() => {
    fetchAll()
    const interval = setInterval(fetchAll, 30000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    if (params.get('fun') === 'dogquiz') {
      setActiveTab('fun')
      setFunSub('dogquiz')
    }
  }, [])

  async function fetchAll() {
    try {
      const [controlRows, openRows, maidenRows, top20Rows, maidenFinalRows, improverFinalRows, openFinalRows] = await Promise.all([
        fetchControlsSheet(),
        fetchSheet('Open Draw'),
        fetchSheet('Maiden Draw'),
        fetchSheet('Top 20'),
        fetchSheet('Maiden Final'),
        fetchSheet('Improver Final'),
        fetchSheet('Open Final'),
      ])
      setControls(parseControls(controlRows))
      setOpenDraw(parseOpenDraw(openRows))
      setMaidenDraw(parseMaidenDraw(maidenRows))
      setTop20(parseTop20(top20Rows))
      setMaidenFinal(parseMaidenFinal(maidenFinalRows))
      setImproverFinal(parseImproverFinal(improverFinalRows))
      setOpenFinal(parseOpenFinal(openFinalRows))
      setLastUpdated(new Date().toLocaleTimeString())
    } catch (e) {
      console.error('Fetch error', e)
    } finally {
      setLoading(false)
    }
  }

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: '#0D2B5E' }}>
      <div style={{ textAlign: 'center', color: '#fff' }}>
        <div style={{ fontSize: 40, marginBottom: 12 }}>🐑</div>
        <div style={{ fontSize: 18 }}>Loading...</div>
      </div>
    </div>
  )

  const status = controls?.trial_status || 'off_season'

  if (status === 'off_season') return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh', background: '#0D2B5E', padding: '0 32px', textAlign: 'center' }}>
      <div style={{ fontSize: 48, marginBottom: 20 }}>🐑</div>
      <h1 style={{ color: '#fff', fontSize: 22, fontWeight: 600, marginBottom: 12 }}>National Sheep Dog Trial Championships</h1>
      <p style={{ color: '#c8d8f8', fontSize: 17, lineHeight: 1.6, marginBottom: 28 }}>{controls?.off_season_message || 'See you at the next event!'}</p>
      <a href={controls?.off_season_url || 'https://nationalsheepdogtrials.org.au'} target="_blank" rel="noreferrer" style={{ background: '#fff', color: '#0D2B5E', fontWeight: 600, padding: '10px 24px', borderRadius: 24, fontSize: 18, textDecoration: 'none' }}>Visit our website</a>
    </div>
  )

  if (status === 'paused') return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh', background: '#0D2B5E', padding: '0 32px', textAlign: 'center' }}>
      <div style={{ fontSize: 48, marginBottom: 20 }}>🌙</div>
      <h1 style={{ color: '#fff', fontSize: 22, fontWeight: 600, marginBottom: 12 }}>National Sheep Dog Trial Championships</h1>
      <p style={{ color: '#c8d8f8', fontSize: 17, lineHeight: 1.6, marginBottom: 28 }}>{controls?.paused_message || 'Competition has paused for the day.'}</p>
      <a href={controls?.off_season_url || 'https://nationalsheepdogtrials.org.au'} target="_blank" rel="noreferrer" style={{ background: '#fff', color: '#0D2B5E', fontWeight: 600, padding: '10px 24px', borderRadius: 24, fontSize: 18, textDecoration: 'none' }}>Visit our website</a>
    </div>
  )

  const openRankings = getRankings(openDraw)
  const impRankings = getRankings(openDraw.filter(c => c.cls === 'Improver'))
  const maidenRankings = getRankings(maidenDraw)

  const currentRunRaw = controls?.current_run || ''
  const currentRunParts = String(currentRunRaw).trim().split(' ')
  const currentRunNo = currentRunParts[0] && currentRunParts[0] !== '0' ? currentRunParts[0] : null
  const currentRunDraw = (currentRunParts[1] || '').toLowerCase()
  const currentRunOpen = currentRunDraw === 'open' ? currentRunNo : null
  const currentRunMaiden = currentRunDraw === 'maiden' ? currentRunNo : null
  const currentState = controls?.current_state || null

  const navItems = [
    { id: 'draw', label: 'Draw' },
    { id: 'rank', label: 'Leaderboards' },
    { id: 'media', label: 'Media' },
    { id: 'fun', label: 'Fun' },
    { id: 'info', label: 'Info' },
  ]

  const lbPills = [
    { id: 'top20', label: 'Open Top 20' },
    { id: 'maiden15', label: 'Maiden Top 15' },
    { id: 'maidenfinal', label: 'Maiden Final' },
    { id: 'impfinal', label: 'Improver Final' },
    { id: 'openfinal', label: 'Open Final' },
  ]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', background: '#f5f5f3', maxWidth: 480, margin: '0 auto' }}>

      <div style={{ background: '#0D2B5E', color: '#fff', padding: '8px 14px 6px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 2 }}>
          <img src="/NSDTA-logo.png" alt="NSDTA Logo" style={{ height: 56, width: 'auto', flexShrink: 0 }} />
          <div>
            <div style={{ fontSize: 18, fontWeight: 700 }}>National Sheep Dog Trial Championships</div>
          </div>
        </div>
        {controls?.ticker_message && (
          <div style={{ overflow: 'hidden', width: '100%' }}>
            <div style={{ display: 'inline-block', whiteSpace: 'nowrap', animation: 'ticker 25s linear infinite', fontSize: 18, color: '#f5c842', fontWeight: 500 }}>
              {controls.ticker_message}&nbsp;&nbsp;&nbsp;·&nbsp;&nbsp;&nbsp;{controls.ticker_message}
            </div>
          </div>
        )}
      </div>

      <div style={{ background: '#0D2B5E', display: 'flex', borderTop: '1px solid #1A3F7A' }}>
        {navItems.map(item => (
          <button key={item.id} onClick={() => setActiveTab(item.id)}
            style={{ flex: 1, padding: '7px 0 5px', fontSize: 17, color: activeTab === item.id ? '#f5c842' : '#c8d8f8', background: 'none', border: 'none', borderBottom: activeTab === item.id ? '2px solid #f5c842' : '2px solid transparent', cursor: 'pointer', fontWeight: activeTab === item.id ? 600 : 400 }}>
            {item.label}
          </button>
        ))}
      </div>

      {lastUpdated && (activeTab === 'draw' || activeTab === 'rank') && (
        <div style={{ textAlign: 'right', fontSize: 18, color: '#aaa', padding: '3px 10px 0' }}>Updated {lastUpdated}</div>
      )}

      <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>

        {activeTab === 'draw' && (
          <>
            <div style={{ display: 'flex', gap: 6, padding: '6px 10px', background: '#fff', borderBottom: '1px solid #eee' }}>
              <SubPill label="Open/Improver" active={drawSub === 'open'} onClick={() => setDrawSub('open')} />
              <SubPill label="Maiden" active={drawSub === 'maiden'} onClick={() => setDrawSub('maiden')} />
            </div>
            <div style={{ flex: 1, overflowY: 'auto', padding: '8px 10px' }}>
              {drawSub === 'open' && <DrawView competitors={openDraw} currentRun={currentRunOpen} topRankings={openRankings} topN={20} label="Top 20" impRankings={impRankings} currentState={currentState} />}
              {drawSub === 'maiden' && <DrawView competitors={maidenDraw} currentRun={currentRunMaiden} topRankings={maidenRankings} topN={15} label="Top 15" currentState={currentState} otherDrawRunner={currentRunOpen ? openDraw.find(c => c.runNo == currentRunOpen) : null} />}
            </div>
          </>
        )}

        {activeTab === 'rank' && (
          <>
            <div style={{ display: 'flex', gap: 6, padding: '6px 10px', background: '#fff', borderBottom: '1px solid #eee', overflowX: 'auto' }}>
              {lbPills.map(p => (
                <SubPill key={p.id} label={p.label} active={lbSub === p.id} onClick={() => setLbSub(p.id)} />
              ))}
            </div>
            <div style={{ flex: 1, overflowY: 'auto', padding: '8px 10px' }}>
              {lbSub === 'top20' && <Top20View competitors={top20} />}
              {lbSub === 'maiden15' && <LeaderboardView competitors={maidenDraw} title="Maiden Top 15" filterCls={null} topN={15} />}
              {lbSub === 'openfinal' && <FinalsView competitors={openFinal} title="Open Final" scoreLabel="1st + Top 20 + final" columns={[{key:'score1st',label:'1st'},{key:'scoreTop20',label:'Top 20'},{key:'scoreFinal',label:'Final'}]} />}
              {lbSub === 'impfinal' && <FinalsView competitors={improverFinal} title="Improver Final" scoreLabel="1st + final" columns={[{key:'score1st',label:'1st'},{key:'scoreFinal',label:'Final'}]} />}
              {lbSub === 'maidenfinal' && <FinalsView competitors={maidenFinal} title="Maiden Final" scoreLabel="1st + Top 15 + final" columns={[{key:'score1st',label:'1st'},{key:'scoreTop15',label:'Top 15'},{key:'scoreFinal',label:'Final'}]} />}
            </div>
          </>
        )}

        {activeTab === 'media' && (
          <>
            <div style={{ display: 'flex', gap: 6, padding: '6px 10px', background: '#fff', borderBottom: '1px solid #eee' }}>
              <SubPill label="Watch" active={mediaSub === 'watch'} onClick={() => setMediaSub('watch')} />
              <SubPill label="Listen" active={mediaSub === 'listen'} onClick={() => setMediaSub('listen')} />
              <SubPill label="Photos" active={mediaSub === 'photos'} onClick={() => setMediaSub('photos')} />
            </div>
            <div style={{ flex: 1, overflowY: 'auto' }}>
              {mediaSub === 'watch' && <WatchScreen controls={controls} />}
              {mediaSub === 'listen' && <ListenScreen controls={controls} />}
              {mediaSub === 'photos' && <PhotosScreen controls={controls} />}
            </div>
          </>
        )}

        {activeTab === 'fun' && (
          <>
            <div style={{ display: 'flex', gap: 6, padding: '6px 10px', background: '#fff', borderBottom: '1px solid #eee' }}>
              <SubPill label="Ask Eliza" active={funSub === 'eliza'} onClick={() => setFunSub('eliza')} />
              <SubPill label="Quiz" active={funSub === 'quiz'} onClick={() => setFunSub('quiz')} />
              <SubPill label="What dog?" active={funSub === 'dogquiz'} onClick={() => setFunSub('dogquiz')} />
              <SubPill label="Scorer" active={funSub === 'scorer'} onClick={() => setFunSub('scorer')} />
            </div>
            <div style={{ flex: 1, overflowY: 'auto' }}>
              {funSub === 'eliza' && <ElizaView />}
              {funSub === 'quiz' && <QuizView />}
              {funSub === 'dogquiz' && <DogQuizView />}
              {funSub === 'scorer' && <ScorerView />}
            </div>
          </>
        )}

        {activeTab === 'info' && (
          <div style={{ flex: 1, overflowY: 'auto', padding: '16px' }}>
            <img src="/How the National Works.png" alt="How the National Sheep Dog Trial works" style={{ width: '100%', borderRadius: 8, marginBottom: 20 }} />
            <div style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 16, fontWeight: 700, color: '#0D2B5E', marginBottom: 10 }}>Event Schedule</div>
              <div style={{ borderRadius: 10, overflow: 'hidden', border: '1px solid #e0e0e0' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr 1.5fr', background: '#0D2B5E', color: '#fff' }}>
                  <div style={{ padding: '8px 10px', fontSize: 13, fontWeight: 600 }}>Day</div>
                  <div style={{ padding: '8px 10px', fontSize: 13, fontWeight: 600, borderLeft: '1px solid rgba(255,255,255,0.2)' }}>Morning</div>
                  <div style={{ padding: '8px 10px', fontSize: 13, fontWeight: 600, borderLeft: '1px solid rgba(255,255,255,0.2)' }}>Afternoon</div>
                </div>
                {[
                  ['Monday', 'Open & Improver Championship', 'Maiden Championship'],
                  ['Tuesday', 'Open & Improver Championship', 'Maiden Championship'],
                  ['Wednesday', 'Open & Improver Championship', 'Maiden Championship'],
                  ['Thursday', 'Open & Improver Championship', 'Maiden Championship'],
                  ['Friday', 'Open & Improver Championship', 'Maiden Top 15 and Maiden Final'],
                  ['Saturday', 'Open & Improver Championship', 'Champion of Champions, followed by the Improver Final'],
                  ['Sunday', 'CopRice National Top 20', 'Open Final, followed by the Award Ceremony'],
                ].map(([day, morning, afternoon], i) => (
                  <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr 1.5fr', background: i % 2 === 0 ? '#fff' : '#f5f7fc', borderTop: '1px solid #e0e0e0' }}>
                    <div style={{ padding: '8px 10px', fontSize: 13, fontWeight: 600, color: '#0D2B5E' }}>{day}</div>
                    <div style={{ padding: '8px 10px', fontSize: 12, color: '#444', borderLeft: '1px solid #e0e0e0', lineHeight: 1.5 }}>{morning}</div>
                    <div style={{ padding: '8px 10px', fontSize: 12, color: '#444', borderLeft: '1px solid #e0e0e0', lineHeight: 1.5 }}>{afternoon}</div>
                  </div>
                ))}
              </div>
            </div>
            <div style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 16, fontWeight: 700, color: '#0D2B5E', marginBottom: 10 }}>Venue Map</div>
              <img src="/NSDTA-Map.png" alt="NSDTA Venue Map" style={{ width: '100%', borderRadius: 8, marginBottom: 20 }} />
            </div>

            <div style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 16, fontWeight: 700, color: '#0D2B5E', marginBottom: 12 }}>Accessibility</div>
              {[
                { icon: '🅿️', title: 'Disability Parking', text: 'Available through the main gate. Follow signs on Victoria Street. Cars with disability passengers may drive to the arena perimeter — excellent viewing from your car or set up chairs right beside.' },
                { icon: '👁️', title: 'Ground-Level Viewing', text: 'The entire arena perimeter is at ground level — ideal for wheelchair users, pram pushers, and anyone with reduced mobility. No stairs or elevated platforms required.' },
                { icon: '🚻', title: 'Accessible Facilities', text: 'Accessible toilets and undercover respite in the central pavilion, with ground-level entry and ramp access.' },
                { icon: '🐕', title: 'Assistance & Pet Dogs Welcome', text: 'Service dogs, assistance animals, and pet dogs on leads are welcome throughout spectator and pavilion areas.' },
                { icon: '🤫', title: 'First Aid & Quiet Room', text: 'A dedicated first aid room also serves as a quiet room — a calm, low-stimulation space for anyone needing a break from crowds and noise.' },
                { icon: "🎪", title: "Kids Activity Marquee", text: "A childrens activity area keeps young ones engaged throughout the day." },
                { icon: '🎫', title: 'Free Entry Tuesday', text: 'Entry is free on the Tuesday of trial week.' },
                { icon: '🚌', title: 'Aged Care Visits', text: 'Buses carrying aged care residents enter free Tuesday to Friday. Volunteers visit the bus with a dog and chat with residents about the trial — bringing the event to those unable to leave the vehicle.' },
                { icon: '🏫', title: 'School Visits', text: 'Regional schools visit on weekdays — students receive lunch and learn about sheep dog trialling, introducing young people from surrounding areas to the sport.' },
                { icon: '👕', title: 'Volunteer Help', text: 'Friendly volunteers in blue shirts and name tags are available throughout the event — ask them for directions, accessibility assistance, or help understanding the competition.' },
              ].map((item, i) => (
                <div key={i} style={{ display: 'flex', gap: 12, padding: '10px 0', borderBottom: i < 9 ? '1px solid #eee' : 'none' }}>
                  <div style={{ fontSize: 24, flexShrink: 0, width: 32, textAlign: 'center' }}>{item.icon}</div>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 600, color: '#0D2B5E', marginBottom: 3 }}>{item.title}</div>
                    <div style={{ fontSize: 13, color: '#555', lineHeight: 1.5 }}>{item.text}</div>
                  </div>
                </div>
              ))}
            </div>

            <a href="https://nationalsheepdogtrials.org.au" target="_blank" rel="noreferrer"
              style={{ display: 'block', background: '#0D2B5E', color: '#fff', textAlign: 'center', padding: '12px 24px', borderRadius: 24, fontSize: 18, fontWeight: 600, textDecoration: 'none' }}>
              Visit our website
            </a>
          </div>
        )}

      </div>
    </div>
  )
}

export default App











