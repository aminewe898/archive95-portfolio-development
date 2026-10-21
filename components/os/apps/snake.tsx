'use client'

import { useCallback, useEffect, useId, useReducer, useRef, useState } from 'react'
import { MenuBar } from '../menu-bar'
import { useOs } from '../os-context'
import { createSnakeGame, snakeReducer, SNAKE_SIZE, type Direction } from '../games/snake-engine'
import { readPreference, writePreference } from '../storage'

export function SnakeGame({ winId, suspended = false }: { winId: string; suspended?: boolean }) {
  const { t, close, play } = useOs()
  const [game, dispatch] = useReducer(snakeReducer, undefined, () => createSnakeGame())
  const [best, setBest] = useState(0)
  const board = useRef<HTMLDivElement>(null)
  const previous = useRef({ score: 0, status: game.status })
  const instructionsId = useId()
  const reset = useCallback(() => {
    dispatch({ type: 'reset', random: Math.random() })
    board.current?.focus()
  }, [])

  useEffect(() => {
    const stored = Number(readPreference('a95-snake-best'))
    if (Number.isFinite(stored) && stored > 0) setBest(Math.floor(stored))
  }, [])
  useEffect(() => {
    if (game.score > best) { setBest(game.score); writePreference('a95-snake-best', String(game.score)) }
  }, [game.score, best])
  useEffect(() => {
    const pause = () => { if (document.hidden) dispatch({ type: 'pause' }) }
    document.addEventListener('visibilitychange', pause)
    pause()
    if (suspended) dispatch({ type: 'pause' })
    return () => document.removeEventListener('visibilitychange', pause)
  }, [suspended])
  useEffect(() => {
    if (game.status !== 'playing' || suspended || document.hidden) return
    const timer = window.setInterval(() => dispatch({ type: 'tick', random: Math.random() }), Math.max(85, 180 - Math.floor(game.score / 50) * 15))
    return () => window.clearInterval(timer)
  }, [game.status, game.score, suspended])
  useEffect(() => {
    if (game.status === 'lost' && previous.current.status !== 'lost') play('boom')
    else if (game.status === 'won' && previous.current.status !== 'won') play('chord')
    else if (game.score > previous.current.score) play('ding')
    previous.current = { score: game.score, status: game.status }
  }, [game.score, game.status, play])

  const ended = game.status === 'lost' || game.status === 'won'
  const status = game.status === 'ready' ? t('Listo para jugar', 'Ready to play')
    : game.status === 'paused' ? t('En pausa', 'Paused')
    : game.status === 'lost' ? t('Fin de la partida', 'Game over')
    : game.status === 'won' ? t('¡Tablero completado!', 'Board complete!')
    : t('En juego', 'Playing')
  const toggle = () => {
    if (ended) reset()
    else dispatch({ type: 'toggle' })
    board.current?.focus()
  }
  const turn = (direction: Direction) => { dispatch({ type: 'turn', direction }); board.current?.focus() }

  return <div className="snake-app" onKeyDown={e => {
    if ((e.target as HTMLElement).closest('input, textarea, select')) return
    if (e.key === 'F2') { e.preventDefault(); reset(); return }
    if ((e.target as HTMLElement).closest('[role="menubar"], [role="menu"]')) return
    if (e.altKey || e.ctrlKey || e.metaKey) return
    const directions: Record<string, Direction> = { ArrowUp: 'up', ArrowDown: 'down', ArrowLeft: 'left', ArrowRight: 'right', w: 'up', s: 'down', a: 'left', d: 'right' }
    const direction = directions[e.key] ?? directions[e.key.toLowerCase()]
    if (direction) { e.preventDefault(); turn(direction) }
    else if (e.key.toLowerCase() === 'p' || e.key === ' ' && e.target === board.current) { e.preventDefault(); if (!e.repeat) toggle() }
  }}>
    <MenuBar menus={[{ label: t('Juego', 'Game'), items: [
      { label: t('Nueva partida', 'New game'), shortcut: 'F2', onSelect: reset },
      { label: t('Pausa', 'Pause'), shortcut: 'P', checked: game.status === 'paused', disabled: game.status === 'ready' || ended, onSelect: () => dispatch({ type: 'toggle' }) },
      'separator', { label: t('Salir', 'Exit'), onSelect: () => close(winId) },
    ] }]} />
    <div className="snake-content">
      <div className="snake-scoreboard">
        <div><span>{t('Puntos', 'Score')}</span><b>{String(game.score).padStart(3, '0')}</b></div>
        <div><span>{t('Récord', 'Best')}</span><b>{String(best).padStart(3, '0')}</b></div>
      </div>
      <div ref={board} tabIndex={0} role="group" className="snake-board" aria-label={t('Tablero de Snake', 'Snake game board')} aria-describedby={instructionsId} style={{ gridTemplateColumns: `repeat(${SNAKE_SIZE}, 1fr)`, gridTemplateRows: `repeat(${SNAKE_SIZE}, 1fr)` }}>
        {game.snake.map((cell, index) => <span key={index} aria-hidden="true" data-direction={index === 0 ? game.direction : undefined} className={`snake-segment ${index === 0 ? 'snake-head' : ''}`} style={{ gridColumn: cell.x + 1, gridRow: cell.y + 1 }} />)}
        {game.food && <span aria-hidden="true" className="snake-food" style={{ gridColumn: game.food.x + 1, gridRow: game.food.y + 1 }} />}
        {game.status !== 'playing' && <div className="snake-overlay" aria-hidden="true"><b>{game.status === 'ready' ? 'SNAKE.EXE' : status}</b><span>{ended ? t('Pulsa Nueva partida para volver a jugar.', 'Choose New game to play again.') : game.status === 'paused' ? t('Pulsa Continuar para seguir.', 'Choose Resume to continue.') : t('Come los bloques rojos. Evita las paredes y tu cola.', 'Eat the red blocks. Avoid the walls and your tail.')}</span></div>}
      </div>
      <div className="snake-actions">
        <button type="button" onClick={toggle}>{ended ? t('Nueva partida', 'New game') : game.status === 'playing' ? t('Pausar', 'Pause') : game.status === 'paused' ? t('Continuar', 'Resume') : t('Jugar', 'Start')}</button>
        <button type="button" onClick={reset}>{t('Reiniciar', 'Restart')}</button>
      </div>
      <div className="snake-dpad" role="group" aria-label={t('Dirección', 'Direction')}>
        <button type="button" className="snake-up" aria-label={t('Arriba', 'Up')} onClick={() => turn('up')}>▲</button>
        <button type="button" aria-label={t('Izquierda', 'Left')} onClick={() => turn('left')}>◀</button>
        <button type="button" aria-label={t('Abajo', 'Down')} onClick={() => turn('down')}>▼</button>
        <button type="button" aria-label={t('Derecha', 'Right')} onClick={() => turn('right')}>▶</button>
      </div>
      <p id={instructionsId} className="snake-instructions">{t('Flechas / WASD: mover · Espacio / P: pausa · F2: nueva partida', 'Arrows / WASD: move · Space / P: pause · F2: new game')}</p>
    </div>
    <div className="status-bar"><p className="status-bar-field status-grow" role="status">{status}</p><p className="status-bar-field">{game.snake.length} / {SNAKE_SIZE * SNAKE_SIZE}</p></div>
  </div>
}
