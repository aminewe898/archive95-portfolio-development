'use client'

import { useEffect, useRef, useState } from 'react'
import { MenuBar } from '../menu-bar'
import { useOs } from '../os-context'
import { readPreference, writePreference } from '../storage'
import { canRecycle, deal, draw, isRed, move, tick, toFoundation, winBonus, type Card, type Game, type Rules, type Scoring, type Source, type Target } from '../games/solitaire-engine'

const SUITS = ['♠', '♥', '♦', '♣']
const RANKS = ['', 'A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K']
const BACKS = ['weave', 'crimson', 'forest', 'sunset'] as const
type Back = (typeof BACKS)[number]
const same = (a: Source | null, b: Source) => !!a && a.pile === b.pile && ('index' in a ? a.index : -1) === ('index' in b ? b.index : -1) && ('card' in a ? a.card : -1) === ('card' in b ? b.card : -1)

export function SolitaireApp({ winId, suspended = false }: { winId: string; suspended?: boolean }) {
  const { t, close, message, play } = useOs()
  const [rules, setRules] = useState<Rules>({ draw: 1, scoring: 'standard' })
  const [timed, setTimed] = useState(true)
  const [back, setBack] = useState<Back>('weave')
  const [game, setGame] = useState<Game | null>(null)
  const [previous, setPrevious] = useState<Game | null>(null)
  const [held, setHeld] = useState<Source | null>(null)
  const [seconds, setSeconds] = useState(0)
  const [bonus, setBonus] = useState(0)
  const tableRef = useRef<HTMLDivElement>(null)
  const suitNames = [t('picas', 'spades'), t('corazones', 'hearts'), t('diamantes', 'diamonds'), t('tréboles', 'clubs')]
  const name = (card: Card) => `${RANKS[card.rank]} ${t('de', 'of')} ${suitNames[card.suit]}`

  // Shuffle on the client only, so server and browser never disagree about the deal.
  useEffect(() => {
    const stored = readPreference('a95-sol')
    let start: Rules = { draw: 1, scoring: 'standard' }
    try {
      const saved = JSON.parse(stored ?? '{}') as Partial<Rules & { timed: boolean; back: Back }>
      start = { draw: saved.draw === 3 ? 3 : 1, scoring: saved.scoring === 'vegas' || saved.scoring === 'none' ? saved.scoring : 'standard' }
      if (saved.timed === false) setTimed(false)
      if (saved.back && BACKS.includes(saved.back)) setBack(saved.back)
    } catch { /* Keep the defaults. */ }
    setRules(start)
    setGame(deal(Math.random, start))
  }, [])
  const remember = (next: Partial<Rules & { timed: boolean; back: Back }>) => writePreference('a95-sol', JSON.stringify({ ...rules, timed, back, ...next }))

  const running = !!game && !game.won && game.moves > 0 && timed && !suspended
  useEffect(() => {
    if (!running) return
    const timer = window.setInterval(() => setSeconds((s) => s + 1), 1000)
    return () => window.clearInterval(timer)
  }, [running])
  useEffect(() => {
    if (timed && seconds > 0) setGame((g) => (g ? tick(g, seconds, rules) : g))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [seconds])

  const fresh = (next: Rules = rules) => { setGame(deal(Math.random, next)); setPrevious(null); setHeld(null); setSeconds(0); setBonus(0) }
  // Changing how cards are drawn or scored starts a new game, as it does in the original.
  const change = (next: Rules) => { setRules(next); remember(next); fresh(next) }
  const commit = (next: Game | null) => {
    setHeld(null)
    if (!next || next === game) return play('error')
    setPrevious(game)
    setGame(next)
    play('click')
    if (next.won) {
      const extra = timed ? winBonus(seconds, rules) : 0
      setBonus(extra)
      play('chord')
      const total = next.score + extra
      message({ title: t('Solitario', 'Solitaire'), text: rules.scoring === 'none' ? t(`¡Has ganado en ${next.moves} movimientos!`, `You won in ${next.moves} moves!`) : rules.scoring === 'vegas' ? t(`¡Has ganado! Saldo: ${total} $`, `You won! Balance: $${total}`) : t(`¡Has ganado! Puntuación: ${total}${extra ? ` (incluye ${extra} de bonificación por tiempo)` : ''}`, `You won! Score: ${total}${extra ? ` (includes a ${extra} time bonus)` : ''}`), kind: 'info' })
    }
  }
  const undo = () => { if (previous && game && !game.won) { setGame({ ...previous, score: game.score }); setPrevious(null); setHeld(null) } }
  const pick = (source: Source) => setHeld(same(held, source) ? null : source)
  const drop = (target: Target) => game && held && commit(move(game, held, target, rules))
  const send = (source: Source) => game && commit(toFoundation(game, source, rules))

  // The win: cards leave the foundations and bounce across the table, leaving trails.
  const won = !!game?.won
  useEffect(() => {
    const table = tableRef.current
    if (!won || !table || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const canvas = document.createElement('canvas')
    canvas.className = 'sol-win'
    canvas.width = table.clientWidth
    canvas.height = table.clientHeight
    table.append(canvas)
    const ctx = canvas.getContext('2d')
    const slots = Array.from(table.querySelectorAll<HTMLElement>('.is-foundation'))
    const origin = table.getBoundingClientRect()
    const w = slots[0]?.offsetWidth ?? 64
    const h = slots[0]?.offsetHeight ?? 88
    let frame = 0
    let launched = 0
    let active: { x: number; y: number; vx: number; vy: number; suit: number; rank: number } | null = null
    const step = () => {
      if (!ctx) return
      if (!active) {
        if (launched >= 52) return
        const suit = launched % 4
        const box = slots[suit]?.getBoundingClientRect()
        active = { x: (box?.left ?? origin.left) - origin.left, y: (box?.top ?? origin.top) - origin.top, vx: (Math.random() * 4 + 2) * (Math.random() < 0.5 ? -1 : 1), vy: -Math.random() * 6, suit, rank: 13 - Math.floor(launched / 4) }
        launched++
      }
      const c = active
      c.x += c.vx
      c.y += c.vy
      c.vy += 0.6
      if (c.y + h > canvas.height) { c.y = canvas.height - h; c.vy *= -0.82 }
      ctx.fillStyle = '#fff'
      ctx.fillRect(c.x, c.y, w, h)
      ctx.strokeStyle = '#000'
      ctx.strokeRect(c.x + 0.5, c.y + 0.5, w - 1, h - 1)
      ctx.fillStyle = c.suit === 1 || c.suit === 2 ? '#d00000' : '#000'
      ctx.font = 'bold 13px Arial'
      ctx.fillText(RANKS[c.rank], c.x + 4, c.y + 14)
      ctx.font = '26px Arial'
      ctx.fillText(SUITS[c.suit], c.x + w / 2 - 9, c.y + h / 2 + 12)
      if (c.x + w < 0 || c.x > canvas.width) active = null
      frame = requestAnimationFrame(step)
    }
    frame = requestAnimationFrame(step)
    return () => { cancelAnimationFrame(frame); canvas.remove() }
  }, [won])

  const face = (card: Card, source: Source, playable = true) => (
    <button
      type="button"
      className={`card ${isRed(card) ? 'is-red' : ''} ${same(held, source) || (held?.pile === 'tableau' && source.pile === 'tableau' && held.index === source.index && source.card > held.card) ? 'is-held' : ''}`}
      aria-label={name(card)}
      aria-pressed={same(held, source)}
      disabled={!playable}
      onClick={(e) => {
        e.stopPropagation()
        if (held && !same(held, source) && source.pile !== 'waste') {
          if (!(held.pile === source.pile && 'index' in held && held.index === source.index)) return drop({ pile: source.pile, index: source.index })
        }
        pick(source)
      }}
      onDoubleClick={(e) => { e.stopPropagation(); send(source) }}
    >
      <span className="card-corner">{RANKS[card.rank]}<br />{SUITS[card.suit]}</span>
      <span className="card-pip" aria-hidden="true">{SUITS[card.suit]}</span>
    </button>
  )

  const scoring: [Scoring, string][] = [['standard', t('Puntuación estándar', 'Standard scoring')], ['vegas', t('Puntuación Vegas', 'Vegas scoring')], ['none', t('Sin puntuación', 'No scoring')]]
  const backNames: Record<Back, string> = { weave: t('Trama azul', 'Blue weave'), crimson: t('Carmesí', 'Crimson'), forest: t('Bosque', 'Forest'), sunset: t('Atardecer', 'Sunset') }
  const total = (game?.score ?? 0) + bonus
  const wasteShown = game ? game.waste.slice(rules.draw === 3 ? -3 : -1) : []
  const stockLabel = !game ? '' : game.stock.length ? t(`Mazo: ${game.stock.length} cartas. Robar`, `Stock: ${game.stock.length} cards. Draw`) : canRecycle(game, rules) ? t('Mazo vacío. Reciclar descarte', 'Empty stock. Recycle waste') : t('Mazo vacío. No quedan pasadas', 'Empty stock. No passes left')

  return (
    <div className={`app-layout sol back-${back}`} onKeyDown={(e) => {
      if (e.key === 'F2') { e.preventDefault(); fresh() }
      if (e.key === 'Escape') setHeld(null)
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') { e.preventDefault(); undo() }
    }}>
      <MenuBar
        menus={[
          {
            label: t('Juego', 'Game'),
            items: [
              { label: t('Repartir', 'Deal'), shortcut: 'F2', onSelect: () => fresh() },
              { label: t('Deshacer', 'Undo'), shortcut: 'Ctrl+Z', disabled: !previous || won, onSelect: undo },
              'separator',
              { label: t('Robar una', 'Draw One'), checked: rules.draw === 1, onSelect: () => change({ ...rules, draw: 1 }) },
              { label: t('Robar tres', 'Draw Three'), checked: rules.draw === 3, onSelect: () => change({ ...rules, draw: 3 }) },
              'separator',
              ...scoring.map(([id, label]) => ({ label, checked: rules.scoring === id, onSelect: () => change({ ...rules, scoring: id }) })),
              { label: t('Partida cronometrada', 'Timed game'), checked: timed, onSelect: () => { setTimed(!timed); remember({ timed: !timed }); fresh() } },
              'separator' as const,
              { label: t('Salir', 'Exit'), onSelect: () => close(winId) },
            ],
          },
          { label: t('Baraja', 'Deck'), items: BACKS.map((id) => ({ label: backNames[id], checked: back === id, onSelect: () => { setBack(id); remember({ back: id }) } })) },
          { label: t('Ayuda', 'Help'), items: [{ label: t('Cómo jugar', 'How to play'), onSelect: () => message({ title: t('Solitario', 'Solitaire'), text: t('Haz clic en una carta y luego en su destino. Doble clic la envía a su base. En las columnas se alternan colores en orden descendente; solo un rey ocupa una columna vacía.\n\nEstándar: 10 puntos por carta en una base, 5 del mazo a una columna, 5 por destapar una carta, −15 al bajar de una base. Vegas: empiezas con −52 $ y cada carta en una base paga 5 $.', 'Click a card, then click where it should go. Double-click sends it to its foundation. Columns alternate colours in descending order; only a king may fill an empty column.\n\nStandard: 10 points per card on a foundation, 5 from the deck to a column, 5 for turning a card over, −15 for taking one back. Vegas: you start at −$52 and each card on a foundation pays $5.'), kind: 'info' }) }] },
        ]}
      />
      <div className="sol-table" ref={tableRef} onClick={() => setHeld(null)}>
        {game && (
          <>
            <div className="sol-top">
              <button type="button" className={`card-slot ${game.stock.length ? 'card-back' : 'is-empty'}`} aria-label={stockLabel} data-tip={stockLabel} onClick={(e) => { e.stopPropagation(); commit(draw(game, rules)) }}>
                {!game.stock.length && <span aria-hidden="true">{canRecycle(game, rules) ? '↻' : '✕'}</span>}
              </button>
              <div className={`card-slot sol-waste ${rules.draw === 3 ? 'is-fanned' : ''}`}>
                {wasteShown.map((card, i) => <div key={`${card.suit}-${card.rank}`} className="sol-fan" style={{ '--fan': i } as React.CSSProperties}>{face(card, { pile: 'waste' }, i === wasteShown.length - 1)}</div>)}
              </div>
              <span className="sol-gap" />
              {game.foundations.map((pile, index) => (
                <div key={index} className="card-slot is-foundation" onClick={(e) => { e.stopPropagation(); drop({ pile: 'foundation', index }) }}>
                  {pile.length ? face(pile[pile.length - 1], { pile: 'foundation', index }) : <button type="button" className="card-target" aria-label={t(`Base ${index + 1} vacía`, `Empty foundation ${index + 1}`)} onClick={(e) => { e.stopPropagation(); drop({ pile: 'foundation', index }) }} />}
                </div>
              ))}
            </div>
            <div className="sol-columns">
              {game.tableau.map((pile, index) => (
                <div key={index} className="sol-column" onClick={(e) => { e.stopPropagation(); drop({ pile: 'tableau', index }) }}>
                  {pile.length === 0 && <button type="button" className="card-slot card-target" aria-label={t(`Columna ${index + 1} vacía`, `Empty column ${index + 1}`)} onClick={(e) => { e.stopPropagation(); drop({ pile: 'tableau', index }) }} />}
                  {pile.map((card, i) => (
                    <div key={`${card.suit}-${card.rank}`} className={`sol-stacked ${card.up ? 'is-up' : ''}`}>
                      {card.up ? face(card, { pile: 'tableau', index, card: i }) : <span className="card card-back" aria-label={t('Carta boca abajo', 'Face-down card')} role="img" />}
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </>
        )}
      </div>
      <div className="status-bar">
        <p className="status-bar-field status-grow" role="status">{won ? t('¡Has ganado! F2 para repartir de nuevo', 'You won! Press F2 to deal again') : held ? t('Elige dónde colocar la carta', 'Choose where to place the card') : t('Clic para elegir · Doble clic para subir a la base', 'Click to pick · Double-click to send to a foundation')}</p>
        {rules.scoring !== 'none' && <p className="status-bar-field">{rules.scoring === 'vegas' ? `${t('Saldo', 'Balance')}: ${total < 0 ? '−' : ''}$${Math.abs(total)}` : `${t('Puntos', 'Score')}: ${total}`}</p>}
        {timed && <p className="status-bar-field">{t('Tiempo', 'Time')}: {seconds}</p>}
      </div>
    </div>
  )
}
