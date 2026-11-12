'use client'

import { useEffect, useState } from 'react'
import { MenuBar } from '../menu-bar'
import { useOs } from '../os-context'
import { readPreference, writePreference } from '../storage'

// Board sizes of the Windows 95 game: the beginner board was 8 × 8 until later versions made it 9 × 9.
const LEVELS = {
  beginner: { rows: 8, cols: 8, mines: 10 },
  intermediate: { rows: 16, cols: 16, mines: 40 },
  expert: { rows: 16, cols: 30, mines: 99 },
} as const
type Level = keyof typeof LEVELS
type Shape = { rows: number; cols: number; mines: number }
type Cell = { mine: boolean; open: boolean; flag: boolean; mark: boolean; count: number }
type State = 'ready' | 'playing' | 'won' | 'lost'
type Best = Record<Level, number>

const NO_BEST: Best = { beginner: 999, intermediate: 999, expert: 999 }
const emptyBoard = ({ rows, cols }: Shape): Cell[] => Array.from({ length: rows * cols }, () => ({ mine: false, open: false, flag: false, mark: false, count: 0 }))

const neighbours = (i: number, { rows, cols }: Shape) => {
  const r = Math.floor(i / cols)
  const c = i % cols
  const out: number[] = []
  for (let dr = -1; dr <= 1; dr++)
    for (let dc = -1; dc <= 1; dc++) {
      if (!dr && !dc) continue
      const nr = r + dr
      const nc = c + dc
      if (nr >= 0 && nr < rows && nc >= 0 && nc < cols) out.push(nr * cols + nc)
    }
  return out
}

// Mines are placed after the first click, so the first square is always safe.
function seed(safe: number, previous: Cell[], shape: Shape): Cell[] {
  const board = emptyBoard(shape)
  board.forEach((cell, i) => { cell.flag = previous[i].flag; cell.mark = previous[i].mark })
  const forbidden = new Set([safe, ...neighbours(safe, shape)])
  let placed = 0
  while (placed < shape.mines) {
    const i = Math.floor(Math.random() * board.length)
    if (board[i].mine || forbidden.has(i)) continue
    board[i].mine = true
    placed++
  }
  board.forEach((cell, i) => (cell.count = neighbours(i, shape).filter((n) => board[n].mine).length))
  return board
}

function reveal(board: Cell[], start: number, shape: Shape) {
  const stack = [start]
  while (stack.length) {
    const i = stack.pop()!
    const cell = board[i]
    if (cell.open || cell.flag) continue
    cell.open = true
    cell.mark = false
    if (cell.count === 0 && !cell.mine) stack.push(...neighbours(i, shape))
  }
}

const readBest = (): Best => {
  try {
    const stored = JSON.parse(readPreference('a95-mines-best') ?? '{}') as Partial<Best>
    return { ...NO_BEST, ...Object.fromEntries(Object.entries(stored).filter(([k, v]) => k in NO_BEST && Number.isFinite(v))) }
  } catch {
    return NO_BEST
  }
}

export function Minesweeper({ winId }: { winId: string }) {
  const { t, play, close, message, resizeWindow } = useOs()
  const [level, setLevel] = useState<Level>('beginner')
  const shape = LEVELS[level]
  const [board, setBoard] = useState<Cell[]>(() => emptyBoard(LEVELS.beginner))
  const [state, setState] = useState<State>('ready')
  const [seconds, setSeconds] = useState(0)
  const [flagMode, setFlagMode] = useState(false)
  const [marks, setMarks] = useState(true)
  const [pressing, setPressing] = useState(false)
  const [best, setBest] = useState<Best>(NO_BEST)
  useEffect(() => { setBest(readBest()) }, [])

  useEffect(() => {
    if (state !== 'playing') return
    const id = window.setInterval(() => setSeconds((s) => Math.min(999, s + 1)), 1000)
    return () => window.clearInterval(id)
  }, [state])

  const names: Record<Level, string> = { beginner: t('Principiante', 'Beginner'), intermediate: t('Intermedio', 'Intermediate'), expert: t('Experto', 'Expert') }
  const reset = (next: Level = level) => {
    setBoard(emptyBoard(LEVELS[next]))
    setState('ready')
    setSeconds(0)
  }
  const choose = (next: Level) => {
    setLevel(next)
    reset(next)
    resizeWindow(winId, LEVELS[next].cols * 16 + 52, LEVELS[next].rows * 16 + 148)
  }
  const showBest = (times: Best = best) => message({ title: t('Mejores tiempos', 'Best Times'), text: (Object.keys(LEVELS) as Level[]).map((l) => `${names[l]}: ${times[l]} ${t('segundos', 'seconds')}`).join('\n'), kind: 'info' })

  // Right click cycles flag → question mark → nothing, as in the original when Marks (?) is on.
  const toggleFlag = (i: number) => {
    if (state === 'won' || state === 'lost' || board[i].open) return
    const next = board.map((c) => ({ ...c }))
    const cell = next[i]
    if (cell.flag) { cell.flag = false; cell.mark = marks }
    else if (cell.mark) cell.mark = false
    else cell.flag = true
    setBoard(next)
  }

  const openCell = (i: number) => {
    if (state === 'won' || state === 'lost') return
    if (flagMode) return toggleFlag(i)
    if (board[i].flag) return
    let next = state === 'ready' ? seed(i, board, shape) : board.map((c) => ({ ...c }))
    if (state === 'ready') setState('playing')
    const cell = next[i]
    if (cell.flag) return
    if (cell.open && cell.count > 0) {
      // Chording: a satisfied number opens the rest of its neighbours.
      const around = neighbours(i, shape)
      if (around.filter((n) => next[n].flag).length === cell.count) around.forEach((n) => !next[n].flag && reveal(next, n, shape))
    } else reveal(next, i, shape)
    if (next.some((c) => c.open && c.mine)) {
      next = next.map((c) => (c.mine ? { ...c, open: true } : c))
      setState('lost')
      play('boom')
    } else if (next.filter((c) => !c.open).length === shape.mines) {
      next = next.map((c) => (c.mine ? { ...c, flag: true, mark: false } : c))
      setState('won')
      play('chord')
      if (seconds < best[level]) {
        const times = { ...best, [level]: seconds }
        setBest(times)
        writePreference('a95-mines-best', JSON.stringify(times))
        showBest(times)
      }
    }
    setBoard(next)
  }

  const flags = board.filter((c) => c.flag).length
  const face = state === 'lost' ? '✖' : state === 'won' ? '★' : pressing ? 'o' : '☺'
  const faceLabel = state === 'lost' ? t('Perdiste — nueva partida', 'You lost — new game') : state === 'won' ? t('¡Ganaste! — nueva partida', 'You won! — new game') : t('Nueva partida', 'New game')
  const pad = (n: number) => String(Math.max(-99, n)).padStart(3, '0')

  return (
    <div className="mines" onKeyDown={(e) => { if (e.key === 'F2') { e.preventDefault(); reset() } }}>
      <MenuBar
        menus={[
          {
            label: t('Juego', 'Game'),
            items: [
              { label: t('Nuevo', 'New'), shortcut: 'F2', onSelect: () => reset() },
              'separator',
              ...(Object.keys(LEVELS) as Level[]).map((l) => ({ label: names[l], checked: level === l, onSelect: () => choose(l) })),
              'separator' as const,
              { label: t('Marcas (?)', 'Marks (?)'), checked: marks, onSelect: () => setMarks((m) => !m) },
              { label: t('Modo bandera (táctil)', 'Flag mode (touch)'), checked: flagMode, onSelect: () => setFlagMode((f) => !f) },
              'separator' as const,
              { label: t('Mejores tiempos…', 'Best Times…'), onSelect: () => showBest() },
              'separator' as const,
              { label: t('Salir', 'Exit'), onSelect: () => close(winId) },
            ],
          },
        ]}
      />
      <div className="mines-frame">
        <div className="mines-head">
          <span className="lcd" aria-label={t(`${shape.mines - flags} minas restantes`, `${shape.mines - flags} mines left`)}>
            {pad(shape.mines - flags)}
          </span>
          <button type="button" className="mines-face" onClick={() => reset()} aria-label={faceLabel} title={faceLabel}>
            {face}
          </button>
          <span className="lcd" aria-label={t(`${seconds} segundos`, `${seconds} seconds`)}>
            {pad(seconds)}
          </span>
        </div>
        <div className="mines-grid" style={{ '--cols': shape.cols, '--rows': shape.rows } as React.CSSProperties} role="grid" aria-label={`${t('Buscaminas', 'Minesweeper')} — ${names[level]}`} onPointerDown={() => setPressing(true)} onPointerUp={() => setPressing(false)} onPointerLeave={() => setPressing(false)}>
          {board.map((cell, i) => (
            <button
              key={i}
              type="button"
              role="gridcell"
              className={`mine-cell ${cell.open ? 'is-open' : ''} ${cell.open && cell.mine ? 'is-mine' : ''} n${cell.count}`}
              aria-label={cell.open ? (cell.mine ? t('mina', 'mine') : String(cell.count || t('vacío', 'empty'))) : cell.flag ? t('bandera', 'flagged') : cell.mark ? t('marca de duda', 'question mark') : t('cubierta', 'covered')}
              onClick={() => openCell(i)}
              onContextMenu={(e) => {
                e.preventDefault()
                toggleFlag(i)
              }}
            >
              {cell.open ? (cell.mine ? '✹' : cell.count || '') : cell.flag ? '⚑' : cell.mark ? '?' : ''}
            </button>
          ))}
        </div>
      </div>
      <label className="mines-flag field-row">
        <input type="checkbox" checked={flagMode} onChange={(e) => setFlagMode(e.target.checked)} />
        <span>{t('Modo bandera', 'Flag mode')}</span>
      </label>
    </div>
  )
}
