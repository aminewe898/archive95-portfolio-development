'use client'

import { useEffect, useState } from 'react'
import { MenuBar } from '../menu-bar'
import { useOs } from '../os-context'

const SIZE = 9
const MINES = 10

type Cell = { mine: boolean; open: boolean; flag: boolean; count: number }
type State = 'ready' | 'playing' | 'won' | 'lost'

const emptyBoard = (): Cell[] => Array.from({ length: SIZE * SIZE }, () => ({ mine: false, open: false, flag: false, count: 0 }))

const neighbours = (i: number) => {
  const r = Math.floor(i / SIZE)
  const c = i % SIZE
  const out: number[] = []
  for (let dr = -1; dr <= 1; dr++)
    for (let dc = -1; dc <= 1; dc++) {
      if (!dr && !dc) continue
      const nr = r + dr
      const nc = c + dc
      if (nr >= 0 && nr < SIZE && nc >= 0 && nc < SIZE) out.push(nr * SIZE + nc)
    }
  return out
}

function seed(safe: number): Cell[] {
  const board = emptyBoard()
  const forbidden = new Set([safe, ...neighbours(safe)])
  let placed = 0
  while (placed < MINES) {
    const i = Math.floor(Math.random() * board.length)
    if (board[i].mine || forbidden.has(i)) continue
    board[i].mine = true
    placed++
  }
  board.forEach((cell, i) => (cell.count = neighbours(i).filter((n) => board[n].mine).length))
  return board
}

function reveal(board: Cell[], start: number) {
  const stack = [start]
  while (stack.length) {
    const i = stack.pop()!
    const cell = board[i]
    if (cell.open || cell.flag) continue
    cell.open = true
    if (cell.count === 0 && !cell.mine) stack.push(...neighbours(i))
  }
}

export function Minesweeper({ winId }: { winId: string }) {
  const { t, play, close } = useOs()
  const [board, setBoard] = useState<Cell[]>(emptyBoard)
  const [state, setState] = useState<State>('ready')
  const [seconds, setSeconds] = useState(0)
  const [flagMode, setFlagMode] = useState(false)
  const [pressing, setPressing] = useState(false)

  useEffect(() => {
    if (state !== 'playing') return
    const id = window.setInterval(() => setSeconds((s) => Math.min(999, s + 1)), 1000)
    return () => window.clearInterval(id)
  }, [state])

  const reset = () => {
    setBoard(emptyBoard())
    setState('ready')
    setSeconds(0)
  }

  const toggleFlag = (i: number) => {
    if (state === 'won' || state === 'lost' || board[i].open) return
    const next = board.map((c) => ({ ...c }))
    next[i].flag = !next[i].flag
    setBoard(next)
  }

  const openCell = (i: number) => {
    if (state === 'won' || state === 'lost') return
    if (flagMode) return toggleFlag(i)
    let next = state === 'ready' ? seed(i) : board.map((c) => ({ ...c }))
    if (state === 'ready') setState('playing')
    const cell = next[i]
    if (cell.flag) return
    if (cell.open && cell.count > 0) {
      const around = neighbours(i)
      if (around.filter((n) => next[n].flag).length === cell.count) around.forEach((n) => !next[n].flag && reveal(next, n))
    } else reveal(next, i)
    if (next.some((c) => c.open && c.mine)) {
      next = next.map((c) => (c.mine ? { ...c, open: true } : c))
      setState('lost')
      play('boom')
    } else if (next.filter((c) => !c.open).length === MINES) {
      next = next.map((c) => (c.mine ? { ...c, flag: true } : c))
      setState('won')
      play('chord')
    }
    setBoard(next)
  }

  const flags = board.filter((c) => c.flag).length
  const face = state === 'lost' ? '✖' : state === 'won' ? '★' : pressing ? 'o' : '☺'
  const faceLabel = state === 'lost' ? t('Perdiste — nueva partida', 'You lost — new game') : state === 'won' ? t('¡Ganaste! — nueva partida', 'You won! — new game') : t('Nueva partida', 'New game')
  const pad = (n: number) => String(Math.max(-99, n)).padStart(3, '0')

  return (
    <div className="mines">
      <MenuBar
        menus={[
          {
            label: t('Juego', 'Game'),
            items: [
              { label: t('Nuevo', 'New'), shortcut: 'F2', onSelect: reset },
              { label: t('Modo bandera (táctil)', 'Flag mode (touch)'), checked: flagMode, onSelect: () => setFlagMode((f) => !f) },
              'separator',
              { label: t('Salir', 'Exit'), onSelect: () => close(winId) },
            ],
          },
        ]}
      />
      <div className="mines-frame">
        <div className="mines-head">
          <span className="lcd" aria-label={t(`${MINES - flags} minas restantes`, `${MINES - flags} mines left`)}>
            {pad(MINES - flags)}
          </span>
          <button type="button" className="mines-face" onClick={reset} aria-label={faceLabel} title={faceLabel}>
            {face}
          </button>
          <span className="lcd" aria-label={t(`${seconds} segundos`, `${seconds} seconds`)}>
            {pad(seconds)}
          </span>
        </div>
        <div className="mines-grid" role="grid" aria-label="Minesweeper" onPointerDown={() => setPressing(true)} onPointerUp={() => setPressing(false)} onPointerLeave={() => setPressing(false)}>
          {board.map((cell, i) => (
            <button
              key={i}
              type="button"
              role="gridcell"
              className={`mine-cell ${cell.open ? 'is-open' : ''} ${cell.open && cell.mine ? 'is-mine' : ''} n${cell.count}`}
              aria-label={cell.open ? (cell.mine ? t('mina', 'mine') : String(cell.count || t('vacío', 'empty'))) : cell.flag ? t('bandera', 'flagged') : t('cubierta', 'covered')}
              onClick={() => openCell(i)}
              onContextMenu={(e) => {
                e.preventDefault()
                toggleFlag(i)
              }}
            >
              {cell.open ? (cell.mine ? '✹' : cell.count || '') : cell.flag ? '⚑' : ''}
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
