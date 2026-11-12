'use client'

import { useEffect, useState } from 'react'
import { MenuBar } from '../menu-bar'
import { useOs } from '../os-context'
import { deal, draw, isRed, move, toFoundation, type Card, type Game, type Source, type Target } from '../games/solitaire-engine'

const SUITS = ['♠', '♥', '♦', '♣']
const RANKS = ['', 'A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K']
const same = (a: Source | null, b: Source) => !!a && a.pile === b.pile && ('index' in a ? a.index : -1) === ('index' in b ? b.index : -1) && ('card' in a ? a.card : -1) === ('card' in b ? b.card : -1)

export function SolitaireApp({ winId, suspended = false }: { winId: string; suspended?: boolean }) {
  const { t, close, message, play } = useOs()
  const [game, setGame] = useState<Game | null>(null)
  const [held, setHeld] = useState<Source | null>(null)
  const [seconds, setSeconds] = useState(0)
  const suitNames = [t('picas', 'spades'), t('corazones', 'hearts'), t('diamantes', 'diamonds'), t('tréboles', 'clubs')]
  const name = (card: Card) => `${RANKS[card.rank]} ${t('de', 'of')} ${suitNames[card.suit]}`

  // Shuffle on the client only, so server and browser never disagree about the deal.
  useEffect(() => { setGame(deal()) }, [])
  const running = !!game && !game.won && game.moves > 0 && !suspended
  useEffect(() => {
    if (!running) return
    const timer = window.setInterval(() => setSeconds((s) => s + 1), 1000)
    return () => window.clearInterval(timer)
  }, [running])

  const fresh = () => { setGame(deal()); setHeld(null); setSeconds(0) }
  const commit = (next: Game | null) => {
    setHeld(null)
    if (!next) return play('error')
    setGame(next)
    play('click')
    if (next.won) message({ title: t('Solitario', 'Solitaire'), text: t(`¡Has ganado en ${next.moves} movimientos!`, `You won in ${next.moves} moves!`), kind: 'info' })
  }
  const pick = (source: Source) => setHeld(same(held, source) ? null : source)
  const drop = (target: Target) => game && held && commit(move(game, held, target))
  const send = (source: Source) => game && commit(toFoundation(game, source))

  const face = (card: Card, source: Source, label?: string) => (
    <button
      type="button"
      className={`card ${isRed(card) ? 'is-red' : ''} ${same(held, source) || (held?.pile === 'tableau' && source.pile === 'tableau' && held.index === source.index && source.card > held.card) ? 'is-held' : ''}`}
      aria-label={label ?? name(card)}
      aria-pressed={same(held, source)}
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

  return (
    <div className="app-layout sol" onKeyDown={(e) => { if (e.key === 'F2') { e.preventDefault(); fresh() } if (e.key === 'Escape') setHeld(null) }}>
      <MenuBar
        menus={[
          { label: t('Juego', 'Game'), items: [{ label: t('Repartir', 'Deal'), shortcut: 'F2', onSelect: fresh }, 'separator', { label: t('Salir', 'Exit'), onSelect: () => close(winId) }] },
          { label: t('Ayuda', 'Help'), items: [{ label: t('Cómo jugar', 'How to play'), onSelect: () => message({ title: t('Solitario', 'Solitaire'), text: t('Haz clic en una carta y luego en su destino. Doble clic la envía a su base. En las columnas se alternan colores en orden descendente; solo un rey ocupa una columna vacía.', 'Click a card, then click where it should go. Double-click sends it to its foundation. Columns alternate colours in descending order; only a king may fill an empty column.'), kind: 'info' }) }] },
        ]}
      />
      <div className="sol-table" onClick={() => setHeld(null)}>
        {game && (
          <>
            <div className="sol-top">
              <button type="button" className={`card-slot ${game.stock.length ? 'card-back' : 'is-empty'}`} aria-label={game.stock.length ? t(`Mazo: ${game.stock.length} cartas. Robar`, `Stock: ${game.stock.length} cards. Draw`) : t('Mazo vacío. Reciclar descarte', 'Empty stock. Recycle waste')} onClick={(e) => { e.stopPropagation(); setHeld(null); setGame(draw(game)); play('click') }}>
                {!game.stock.length && <span aria-hidden="true">↻</span>}
              </button>
              <div className="card-slot">{game.waste.length > 0 && face(game.waste[game.waste.length - 1], { pile: 'waste' })}</div>
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
        <p className="status-bar-field status-grow" role="status">{game?.won ? t('¡Has ganado! F2 para repartir de nuevo', 'You won! Press F2 to deal again') : held ? t('Elige dónde colocar la carta', 'Choose where to place the card') : t('Clic para elegir · Doble clic para subir a la base', 'Click to pick · Double-click to send to a foundation')}</p>
        <p className="status-bar-field">{t('Movimientos', 'Moves')}: {game?.moves ?? 0}</p>
        <p className="status-bar-field">{t('Tiempo', 'Time')}: {seconds}</p>
      </div>
    </div>
  )
}
