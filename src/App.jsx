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
    Open: { background: '#e8f4e8', color: '#2c5f2e' },
    Improver: { background: '#e8edfa', color: '#3a4fa8' },
    Maiden: { background: '#eeedfe', color: '#534ab7' },
  }
  const s = styles[cls] || { background: '#f0f0f0', color: '#888' }
  return <span style={{ fontSize: 9, padding: '1px 4px', borderRadius: 3, background: s.background, color: s.color, flexShrink: 0 }}>{cls}</span>
}

function ScoreDisplay({ score }) {
  if (score === null || score === undefined || score === '') return <span style={{ color: '#ccc', fontSize: 11 }}>—</span>
  if (isNumeric(score)) return <span style={{ fontSize: 12, fontWeight: 700, color: '#2c5f2e' }}>{score}</span>
  return <span style={{ fontSize: 11, fontWeight: 600, color: '#c0392b', background: '#fdf0ee', padding: '1px 5px', borderRadius: 4 }}>{score}</span>
}

function SubPill({ label, active, onClick }) {
  return (
    <button onClick={onClick} style={{ border: active ? 'none' : '1px solid #ddd', borderRadius: 12, padding: '3px 10px', fontSize: 11, color: active ? '#fff' : '#555', background: active ? '#2c5f2e' : '#fff', whiteSpace: 'nowrap', cursor: 'pointer' }}>
      {label}
    </button>
  )
}

function DrawView({ competitors, currentRun, topRankings, topN, label, impRankings, currentState, otherDrawRunner }) {
  const onCourse = competitors.find(c => c.runNo == currentRun)
  const completed = competitors.filter(c => c.runNo != currentRun && isScored(c.score))
  const pending = competitors.filter(c => c.runNo != currentRun && !isScored(c.score))

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
      {!onCourse && otherDrawRunner && (
        <div style={{ background: '#f0f4ff', border: '1px solid #c5d0f5', borderRadius: 10, padding: '8px 10px', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ fontSize: 18, flexShrink: 0 }}>&#128065;</div>
          <div>
            <div style={{ fontSize: 9, color: '#3a4fa8', fontWeight: 600, marginBottom: 2 }}>Open/Improver draw underway</div>
            <div style={{ fontSize: 12, color: '#3a4fa8', fontWeight: 500 }}>Run {otherDrawRunner.runNo} — {otherDrawRunner.name}</div>
            <div style={{ fontSize: 10, color: '#7a8fd4' }}>{otherDrawRunner.dog}</div>
          </div>
        </div>
      )}
      {!onCourse && !otherDrawRunner && currentState && (
        <div style={{ background: '#f0f4ff', border: '1px solid #c5d0f5', borderRadius: 10, padding: '8px 10px', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ fontSize: 18, flexShrink: 0 }}>&#9208;</div>
          <div style={{ fontSize: 12, color: '#3a4fa8', fontWeight: 500 }}>{currentState}</div>
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
                <div style={{ display: 'flex', gap: 3, flexShrink: 0, flexWrap: 'wrap', justifyContent: 'flex-end', alignItems: 'center' }}>
                  {inTop && (
                    <div style={{ background: '#e8f4e8', color: '#2c5f2e', fontSize: 9, padding: '1px 5px', borderRadius: 4, whiteSpace: 'nowrap' }}>
                      {ordinal(pos)} {label}
                    </div>
                  )}
                  {impRankings && c.cls === 'Improver' && (() => {
                    const impPos = getPosition(c, impRankings)
                    return impPos !== null && impPos <= 5 ? (
                      <div style={{ background: '#e8edfa', color: '#3a4fa8', fontSize: 9, padding: '1px 5px', borderRadius: 4, whiteSpace: 'nowrap' }}>
                        {ordinal(impPos)} Imp
                      </div>
                    ) : null
                  })()}
                  <div style={{ textAlign: 'right' }}>
                    <ScoreDisplay score={c.score} />
                    {pos !== null && (
                      <div style={{ fontSize: 9, color: '#aaa', textAlign: 'right' }}>{ordinal(pos)}</div>
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
        {title} · {ranked.length} scored{cutScore !== null ? ` · cut at ${cutScore}` : ''}
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
          <span style={{ fontSize: 13, fontWeight: 700, color: '#2c5f2e' }}>{c.score}</span>
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
              <span style={{ fontSize: 13, fontWeight: 700, color: '#aaa' }}>{c.score}</span>
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

function FinalsView({ competitors, title, scoreLabel, columns }) {
  if (!competitors || competitors.length === 0) return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 40, textAlign: 'center' }}>
      <div style={{ fontSize: 32, marginBottom: 12 }}>🏆</div>
      <div style={{ fontSize: 15, fontWeight: 600, color: '#444', marginBottom: 8 }}>{title}</div>
      <div style={{ fontSize: 13, color: '#aaa', lineHeight: 1.5 }}>This stage has not yet begun.</div>
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
      <div style={{ fontSize: 10, color: '#aaa', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6 }}>
        {title} · {sorted.length} competitors · {scoreLabel}
      </div>
      {sorted.map((c, i) => {
        const rank = isNumeric(c.place) ? c.place : i + 1
        const isChampion = allScored && isNumeric(c.total) && c.total === championTotal
        return (
          <div key={i} style={{ background: isChampion ? '#fffbea' : '#fff', borderRadius: 8, padding: '6px 8px', marginBottom: 4, border: isChampion ? '1px solid #f5c842' : 'none' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
              <div style={{ width: 20, height: 20, borderRadius: '50%', background: isChampion ? '#f5c842' : '#f0f0f0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 700, color: isChampion ? '#7a5c00' : '#555', flexShrink: 0 }}>{rank}</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                  <span style={{ fontSize: 12, fontWeight: 600, color: '#222' }}>{c.name}</span>
                  {isChampion && (
                    <span style={{ fontSize: 9, fontWeight: 700, background: '#f5c842', color: '#7a5c00', padding: '2px 7px', borderRadius: 10, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                      🏆 Champion
                    </span>
                  )}
                </div>
                <div style={{ fontSize: 10, color: '#aaa' }}>{c.dog}</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: isChampion ? '#c08000' : '#2c5f2e' }}>{isNumeric(c.total) ? c.total : '—'}</div>
                <div style={{ fontSize: 9, color: '#aaa' }}>total</div>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 6, paddingLeft: 28 }}>
              {columns.map(col => (
                <div key={col.key} style={{ background: '#f5f5f3', borderRadius: 4, padding: '2px 6px', fontSize: 9, color: '#666' }}>
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
      <div style={{ fontSize: 15, fontWeight: 600, color: '#444', marginBottom: 8 }}>Top 20</div>
      <div style={{ fontSize: 13, color: '#aaa', lineHeight: 1.5 }}>This stage has not yet begun.</div>
    </div>
  )

  const sorted = [...competitors].sort((a, b) => {
    if (isNumeric(a.total) && isNumeric(b.total)) return b.total - a.total
    if (isNumeric(a.rank) && isNumeric(b.rank)) return a.rank - b.rank
    return 0
  })

  return (
    <div>
      <div style={{ fontSize: 10, color: '#aaa', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6 }}>
        Top 20 · {sorted.length} competitors · 1st run + Top 20 score
      </div>
      {sorted.map((c, i) => {
        const rank = isNumeric(c.rank) ? c.rank : i + 1
        const inFinal = c.openFinal
        return (
          <div key={i} style={{ background: '#fff', borderRadius: 8, padding: '6px 8px', marginBottom: 4, border: inFinal ? '1px solid #f5c842' : 'none' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
              <div style={{ width: 20, height: 20, borderRadius: '50%', background: '#f0f0f0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 700, color: '#555', flexShrink: 0 }}>{rank}</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <span style={{ fontSize: 12, fontWeight: 600, color: '#222' }}>{c.name}</span>
                  {inFinal && <span style={{ fontSize: 9, background: '#fff8e1', color: '#c08000', padding: '1px 4px', borderRadius: 4 }}>Open Final</span>}
                </div>
                <div style={{ fontSize: 10, color: '#aaa' }}>{c.dog}</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: '#2c5f2e' }}>{isNumeric(c.total) ? c.total : '—'}</div>
                <div style={{ fontSize: 9, color: '#aaa' }}>total</div>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 6, paddingLeft: 28 }}>
              <div style={{ background: '#f5f5f3', borderRadius: 4, padding: '2px 6px', fontSize: 9, color: '#666' }}>
                <span style={{ color: '#aaa' }}>1st: </span><span style={{ fontWeight: 600 }}>{isNumeric(c.score1st) ? c.score1st : '—'}</span>
              </div>
              <div style={{ background: '#f5f5f3', borderRadius: 4, padding: '2px 6px', fontSize: 9, color: '#666' }}>
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
        <p style={{ fontSize: 13, color: '#888', lineHeight: 1.5 }}>
          {loadError ? 'Could not load questions.' : 'Choose your level and test your knowledge!'}
        </p>
      </div>
      <p style={{ fontSize: 12, fontWeight: 600, color: '#555', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 10 }}>Choose your difficulty</p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 20 }}>
        {LEVELS.map(l => (
          <button key={l.key} onClick={() => setDifficulty(l.key)}
            style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 16px', border: difficulty === l.key ? '2px solid #2c5f2e' : '1px solid #ddd', borderRadius: 10, background: difficulty === l.key ? '#e8f4e8' : '#fff', cursor: 'pointer', textAlign: 'left' }}>
            <div style={{ fontSize: 28, flexShrink: 0 }}>{l.icon}</div>
            <div>
              <div style={{ fontSize: 15, fontWeight: 700, color: difficulty === l.key ? '#2c5f2e' : '#222' }}>{l.name}</div>
              <div style={{ fontSize: 12, color: '#888', marginTop: 2 }}>{l.desc}</div>
            </div>
          </button>
        ))}
      </div>
      <button onClick={startQuiz} disabled={!difficulty || allQuestions.length === 0 || loadError}
        style={{ width: '100%', background: '#2c5f2e', color: '#fff', border: 'none', borderRadius: 24, padding: '13px', fontSize: 15, fontWeight: 600, cursor: !difficulty ? 'not-allowed' : 'pointer', opacity: !difficulty || allQuestions.length === 0 ? 0.5 : 1 }}>
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
          <div style={{ fontSize: 52, fontWeight: 700, color: '#2c5f2e', lineHeight: 1 }}>{score}<span style={{ fontSize: 20, color: '#aaa' }}>/10</span></div>
          <div style={{ fontSize: 18, fontWeight: 700, color: '#222', margin: '8px 0 4px' }}>{label}</div>
          <div style={{ fontSize: 13, color: '#888' }}>{sub}</div>
        </div>
        <div style={{ marginBottom: 16 }}>
          {answers.map(({ q, chosen, correct }, i) => (
            <div key={i} style={{ display: 'flex', gap: 10, padding: '10px 12px', background: correct ? '#e8f4e8' : '#fdf0ee', borderRadius: 8, marginBottom: 6 }}>
              <div style={{ fontSize: 16, flexShrink: 0 }}>{correct ? '✅' : '❌'}</div>
              <div>
                <div style={{ fontSize: 12, fontWeight: 600, color: '#444', marginBottom: 2 }}>{q.question}</div>
                {!correct && <div style={{ fontSize: 11, color: '#a32d2d' }}>Your answer: {q.options[chosen]}</div>}
                {!correct && <div style={{ fontSize: 11, color: '#2c5f2e' }}>Correct: {q.options[q.correctAnswer]}</div>}
              </div>
            </div>
          ))}
        </div>
        <button onClick={() => { setPhase('start'); setDifficulty(null) }}
          style={{ width: '100%', background: '#2c5f2e', color: '#fff', border: 'none', borderRadius: 24, padding: '13px', fontSize: 15, fontWeight: 600, cursor: 'pointer' }}>
          Play Again
        </button>
      </div>
    )
  }

  const q = questions[current]
  return (
    <div style={{ padding: '12px 14px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
        <span style={{ fontSize: 11, color: '#aaa' }}>Question {current + 1} of 10</span>
        <span style={{ fontSize: 11, background: '#fff8e1', color: '#c08000', padding: '2px 8px', borderRadius: 10 }}>{q.category}</span>
      </div>
      <div style={{ background: '#f5f3ee', borderRadius: 4, height: 6, marginBottom: 14, overflow: 'hidden' }}>
        <div style={{ height: '100%', background: '#f5c842', borderRadius: 4, width: `${((current + 1) / 10) * 100}%`, transition: 'width 0.4s' }} />
      </div>
      <div style={{ background: '#fff', borderRadius: 10, padding: '14px', marginBottom: 14, boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
        <p style={{ fontSize: 15, fontWeight: 600, color: '#222', lineHeight: 1.5 }}>{q.question}</p>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 14 }}>
        {q.options.map((opt, i) => {
          let bg = '#fff', border = '1px solid #ddd', color = '#333', letterBg = '#eee', letterColor = '#666'
          if (answered) {
            if (i === q.correctAnswer) { bg = '#e8f4e8'; border = '1px solid #2c5f2e'; color = '#2c5f2e'; letterBg = '#2c5f2e'; letterColor = '#fff' }
            else if (i === selected) { bg = '#fdf0ee'; border = '1px solid #e74c3c'; color = '#e74c3c'; letterBg = '#e74c3c'; letterColor = '#fff' }
            else { bg = '#fafafa'; color = '#ccc'; border = '1px solid #eee' }
          }
          return (
            <button key={i} onClick={() => handleAnswer(i)} disabled={answered}
              style={{ background: bg, border, borderRadius: 8, padding: '10px 12px', fontSize: 14, color, textAlign: 'left', cursor: answered ? 'default' : 'pointer', display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ width: 28, height: 28, borderRadius: '50%', background: letterBg, color: letterColor, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 600, flexShrink: 0 }}>{letters[i]}</span>
              {opt}
            </button>
          )
        })}
      </div>
      {answered && (
        <div style={{ background: '#e8f0fd', borderLeft: '3px solid #2c5f2e', borderRadius: '0 8px 8px 0', padding: '10px 12px', marginBottom: 14 }}>
          <p style={{ fontSize: 12, color: '#333', lineHeight: 1.5 }}>{q.explanation}</p>
        </div>
      )}
      {answered && (
        <button onClick={next} style={{ width: '100%', background: '#2c5f2e', color: '#fff', border: 'none', borderRadius: 24, padding: '12px', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>
          {current + 1 >= questions.length ? 'See my results' : 'Next question'}
        </button>
      )}
      <div style={{ display: 'flex', gap: 4, marginTop: 14, justifyContent: 'center' }}>
        {Array.from({ length: 10 }).map((_, i) => (
          <div key={i} style={{ width: 8, height: 8, borderRadius: '50%', background: i < current ? '#2c5f2e' : i === current ? '#f5c842' : '#ddd' }} />
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
        <div style={{ background: '#fdf0ee', border: '1px solid #f09595', borderRadius: 8, padding: '10px 14px', marginBottom: 12, textAlign: 'center', fontSize: 15, fontWeight: 600, color: '#a32d2d' }}>
          ⚠ Disqualified — trial ended
        </div>
      )}

      <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #eee', padding: '16px', textAlign: 'center', marginBottom: 12 }}>
        <div style={{ fontSize: 80, fontWeight: 700, lineHeight: 1, color: disqualified ? '#a32d2d' : '#2c5f2e', letterSpacing: -1 }}>
          {disqualified ? 'DQ' : Math.max(score, 0)}
        </div>
        <div style={{ fontSize: 12, color: '#aaa', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12 }}>Current score</div>
        <div style={{ display: 'flex', justifyContent: 'center', gap: 32, borderTop: '1px solid #eee', paddingTop: 12 }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 24, fontWeight: 700 }}>{totalDeducted}</div>
            <div style={{ fontSize: 11, color: '#aaa', textTransform: 'uppercase' }}>Deducted</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 24, fontWeight: 700 }}>{faultCount}</div>
            <div style={{ fontSize: 11, color: '#aaa', textTransform: 'uppercase' }}>Faults</div>
          </div>
        </div>
      </div>

      <p style={{ fontSize: 11, color: '#aaa', textTransform: 'uppercase', letterSpacing: 1, textAlign: 'center', marginBottom: 8 }}>Deduct points</p>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 6, marginBottom: 12 }}>
        {[1,2,3,4,5].map(pts => (
          <button key={pts} onClick={() => deduct(pts)} disabled={disqualified}
            style={{ background: '#fff', border: '1px solid #ddd', borderRadius: 8, padding: '12px 4px', cursor: disqualified ? 'not-allowed' : 'pointer', opacity: disqualified ? 0.35 : 1, textAlign: 'center' }}>
            <div style={{ fontSize: 28, fontWeight: 700, color: '#a32d2d', lineHeight: 1 }}>−{pts}</div>
            <div style={{ fontSize: 11, color: '#aaa', marginTop: 2 }}>pt{pts > 1 ? 's' : ''}</div>
          </button>
        ))}
      </div>

      <div style={{ borderTop: '1px solid #eee', margin: '0 0 12px' }} />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginBottom: 12 }}>
        {obsConfig.map(obs => (
          <button key={obs.key} onClick={() => obstacleNotCompleted(obs.key, obs.pts, obs.label)}
            disabled={disqualified || obstacles[obs.key]}
            style={{ background: '#fff', border: '1px solid #ddd', borderRadius: 8, padding: '10px 6px', cursor: (disqualified || obstacles[obs.key]) ? 'not-allowed' : 'pointer', opacity: (disqualified || obstacles[obs.key]) ? 0.35 : 1, textAlign: 'center', textDecoration: obstacles[obs.key] ? 'line-through' : 'none' }}>
            <div style={{ fontSize: 14, fontWeight: 600, color: '#333', marginBottom: 4 }}>{obs.label}</div>
            <div style={{ fontSize: 24, fontWeight: 700, color: '#ba7517' }}>−{obs.pts}</div>
            <div style={{ fontSize: 11, color: '#aaa', marginTop: 2 }}>not completed</div>
          </button>
        ))}
      </div>

      <button onClick={disqualify} disabled={disqualified}
        style={{ width: '100%', background: '#fff', border: '1px solid #f09595', borderRadius: 8, padding: '12px', fontSize: 16, fontWeight: 600, color: '#a32d2d', cursor: disqualified ? 'not-allowed' : 'pointer', opacity: disqualified ? 0.35 : 1, marginBottom: 12 }}>
        Disqualify (DQ)
      </button>

      <div style={{ borderTop: '1px solid #eee', margin: '0 0 12px' }} />
      <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
        <button onClick={undoLast} disabled={log.length === 0}
          style={{ flex: 1, background: 'none', border: '1px solid #ddd', borderRadius: 8, padding: '10px', fontSize: 14, color: '#888', cursor: log.length === 0 ? 'not-allowed' : 'pointer', opacity: log.length === 0 ? 0.35 : 1 }}>
          ↩ Undo last
        </button>
        <button onClick={reset}
          style={{ flex: 1, background: 'none', border: '1px solid #ddd', borderRadius: 8, padding: '10px', fontSize: 14, color: '#888', cursor: 'pointer' }}>
          ↺ New trial
        </button>
      </div>

      {log.length > 0 && (
        <>
          <p style={{ fontSize: 11, color: '#aaa', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 }}>Fault log</p>
          <div style={{ border: '1px solid #eee', borderRadius: 8, overflow: 'hidden', maxHeight: 200, overflowY: 'auto' }}>
            {[...log].reverse().map((entry, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 12px', fontSize: 14, borderBottom: '1px solid #f5f5f5', background: i % 2 === 0 ? '#fff' : '#fafafa' }}>
                <span style={{ color: '#aaa', minWidth: 24, fontSize: 12 }}>{log.length - i}</span>
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
      <p style={{ fontSize: 14, color: '#888', lineHeight: 1.6 }}>{message}</p>
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
        <div style={{ fontSize: 13, color: '#555', lineHeight: 1.5 }}>
          <span style={{ background: '#e74c3c', color: '#fff', fontSize: 10, padding: '2px 6px', borderRadius: 8, fontWeight: 600, marginRight: 6 }}>● LIVE</span>
          National Sheep Dog Trials — Live Stream
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
      <p style={{ fontSize: 14, color: '#888', lineHeight: 1.6 }}>{message}</p>
    </div>
  )

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 40, textAlign: 'center' }}>
      <img src="/RDN Logo.png" alt="Radio Dog National" style={{ width: 140, height: 140, objectFit: 'contain', marginBottom: 16 }} />
      <h2 style={{ fontSize: 17, fontWeight: 700, color: '#222', marginBottom: 4 }}>Radio Dog National</h2>
      <p style={{ fontSize: 13, color: '#888', marginBottom: 28 }}>Live commentary and event coverage</p>
      <button onClick={togglePlay}
        style={{ width: 80, height: 80, borderRadius: '50%', background: isPlaying ? '#e74c3c' : '#2c5f2e', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
        <span style={{ fontSize: 32, color: '#fff' }}>{isPlaying ? '⏸' : '▶'}</span>
      </button>
      <div style={{ fontSize: 13, color: isPlaying ? '#e74c3c' : '#aaa', fontWeight: isPlaying ? 600 : 400 }}>
        {isPlaying ? '● On air' : 'Tap to listen'}
      </div>
      {isPlaying && (
        <p style={{ fontSize: 12, color: '#aaa', marginTop: 12 }}>Audio continues playing while you browse the app</p>
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
  const [top20, setTop20] = useState([])
  const [maidenFinal, setMaidenFinal] = useState([])
  const [improverFinal, setImproverFinal] = useState([])
  const [openFinal, setOpenFinal] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('draw')
  const [drawSub, setDrawSub] = useState('open')
  const [lbSub, setLbSub] = useState('maiden15')
  const [mediaSub, setMediaSub] = useState('watch')
  const [funSub, setFunSub] = useState('quiz')
  const [lastUpdated, setLastUpdated] = useState(null)

  useEffect(() => {
    fetchAll()
    const interval = setInterval(fetchAll, 30000)
    return () => clearInterval(interval)
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
    { id: 'maiden15', label: 'Maiden Top 15' },
    { id: 'top20', label: 'Open Top 20' },
    { id: 'maidenfinal', label: 'Maiden Final' },
    { id: 'impfinal', label: 'Improver Final' },
    { id: 'openfinal', label: 'Open Final' },
  ]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', background: '#f5f5f3', maxWidth: 480, margin: '0 auto' }}>

      <div style={{ background: '#2c5f2e', color: '#fff', padding: '8px 14px 6px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 2 }}>
          <img src="/NSDTA-logo.png" alt="NSDTA Logo" style={{ height: 36, width: 'auto', flexShrink: 0 }} />
          <div>
            <div style={{ fontSize: 14, fontWeight: 700 }}>National Sheep Dog Trials</div>
            <div style={{ fontSize: 10, color: '#a8d5a2' }}>{controls?.current_day || 'Australian Championships'}</div>
          </div>
        </div>
        {controls?.ticker_message && (
          <div style={{ overflow: 'hidden', width: '100%' }}>
            <div style={{ display: 'inline-block', whiteSpace: 'nowrap', animation: 'ticker 25s linear infinite', fontSize: 10, color: '#f5c842', fontWeight: 500 }}>
              {controls.ticker_message}&nbsp;&nbsp;&nbsp;·&nbsp;&nbsp;&nbsp;{controls.ticker_message}
            </div>
          </div>
        )}
      </div>

      <div style={{ background: '#2c5f2e', display: 'flex', borderTop: '1px solid #3d7a3f' }}>
        {navItems.map(item => (
          <button key={item.id} onClick={() => setActiveTab(item.id)}
            style={{ flex: 1, padding: '7px 0 5px', fontSize: 13, color: activeTab === item.id ? '#f5c842' : '#a8d5a2', background: 'none', border: 'none', borderBottom: activeTab === item.id ? '2px solid #f5c842' : '2px solid transparent', cursor: 'pointer', fontWeight: activeTab === item.id ? 600 : 400 }}>
            {item.label}
          </button>
        ))}
      </div>

      {lastUpdated && (activeTab === 'draw' || activeTab === 'rank') && (
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
            </div>
            <div style={{ flex: 1, overflowY: 'auto' }}>
              {mediaSub === 'watch' && <WatchScreen controls={controls} />}
              {mediaSub === 'listen' && <ListenScreen controls={controls} />}
            </div>
          </>
        )}

        {activeTab === 'fun' && (
          <>
            <div style={{ display: 'flex', gap: 6, padding: '6px 10px', background: '#fff', borderBottom: '1px solid #eee' }}>
              <SubPill label="Quiz" active={funSub === 'quiz'} onClick={() => setFunSub('quiz')} />
              <SubPill label="Scorer" active={funSub === 'scorer'} onClick={() => setFunSub('scorer')} />
            </div>
            <div style={{ flex: 1, overflowY: 'auto' }}>
              {funSub === 'quiz' && <QuizView />}
              {funSub === 'scorer' && <ScorerView />}
            </div>
          </>
        )}

        {activeTab === 'info' && (
          <div style={{ flex: 1, overflowY: 'auto', padding: '16px' }}>
            <img src="/How the National Works.png" alt="How the National Sheep Dog Trial works" style={{ width: '100%', borderRadius: 8, marginBottom: 20 }} />
            <a href="https://nationalsheepdogtrials.org.au" target="_blank" rel="noreferrer"
              style={{ display: 'block', background: '#2c5f2e', color: '#fff', textAlign: 'center', padding: '12px 24px', borderRadius: 24, fontSize: 14, fontWeight: 600, textDecoration: 'none' }}>
              Visit our website
            </a>
          </div>
        )}

      </div>
    </div>
  )
}

export default App











