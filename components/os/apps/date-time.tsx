'use client'

import { useEffect, useState } from 'react'
import { useOs } from '../os-context'

// A stylized world map on a 48 × 20 grid (7.5° of longitude by 9° of latitude per cell).
// Each row lists the runs of land as [first column, last column].
const LAND: [number, number][][] = [
  [[18, 20]],
  [[9, 14], [16, 21], [36, 39]],
  [[2, 5], [6, 15], [17, 21], [26, 47]],
  [[3, 15], [23, 23], [25, 45]],
  [[7, 16], [24, 43]],
  [[8, 14], [23, 29], [30, 40], [42, 42]],
  [[9, 13], [23, 32], [33, 40]],
  [[10, 12], [22, 28], [29, 31], [34, 36], [37, 39]],
  [[12, 13], [22, 29], [34, 34], [37, 38], [40, 40]],
  [[14, 17], [24, 29], [37, 40]],
  [[14, 19], [25, 29], [38, 42], [43, 43]],
  [[14, 19], [25, 29], [30, 30], [40, 43]],
  [[15, 18], [26, 28], [30, 30], [39, 44]],
  [[15, 17], [26, 27], [39, 44]],
  [[15, 16], [46, 46]],
  [[15, 15]],
  [],
  [[4, 44]],
  [[0, 47]],
  [[0, 47]],
]
const COLS = 48
const ROWS = 20

// Date/Time Properties: a live calendar, an analogue clock and the visitor's time zone on a map.
// It reads the visitor's clock; it changes nothing.
export function DateTimeApp({ winId }: { winId: string }) {
  const { t, lang, close } = useOs()
  const [now, setNow] = useState<Date | null>(null)
  const [shift, setShift] = useState(0)
  const [tab, setTab] = useState<'date' | 'zone'>('date')
  useEffect(() => {
    setNow(new Date())
    const timer = window.setInterval(() => setNow(new Date()), 1000)
    return () => window.clearInterval(timer)
  }, [])
  const locale = lang === 'es' ? 'es-ES' : 'en-GB'
  if (!now) return <div className="dialog-layout" />

  const shown = new Date(now.getFullYear(), now.getMonth() + shift, 1)
  const days = new Date(shown.getFullYear(), shown.getMonth() + 1, 0).getDate()
  const lead = (shown.getDay() + 6) % 7 // Monday first
  const cells = [...Array<null>(lead).fill(null), ...Array.from({ length: days }, (_, i) => i + 1)]
  const weekdays = Array.from({ length: 7 }, (_, i) => new Date(2024, 0, i + 1).toLocaleDateString(locale, { weekday: 'narrow' }))
  const hand = (turn: number, length: number, width: number, color = '#000') => {
    const angle = turn * 2 * Math.PI
    return <line x1="50" y1="50" x2={50 + Math.sin(angle) * length} y2={50 - Math.cos(angle) * length} stroke={color} strokeWidth={width} strokeLinecap="square" />
  }
  const seconds = now.getSeconds()
  const minutes = now.getMinutes() + seconds / 60
  const hours = (now.getHours() % 12) + minutes / 60

  const offset = -now.getTimezoneOffset() // minutes east of Greenwich
  const sign = offset < 0 ? '−' : '+'
  const gmt = `GMT${sign}${String(Math.floor(Math.abs(offset) / 60)).padStart(2, '0')}:${String(Math.abs(offset) % 60).padStart(2, '0')}`
  const zone = Intl.DateTimeFormat().resolvedOptions().timeZone
  const band = ((offset / 60) * 15 + 180) / 7.5 // column at the centre of the visitor's zone
  const tabs = [['date', t('Fecha y hora', 'Date & Time')], ['zone', t('Zona horaria', 'Time Zone')]] as const

  return (
    <div className="dialog-layout datetime">
      <menu role="tablist" aria-label={t('Fecha y hora', 'Date/Time')} className="os-tabs" onKeyDown={(e) => {
        if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(e.key)) return
        e.preventDefault()
        const next = e.key === 'Home' ? 'date' : e.key === 'End' ? 'zone' : tab === 'date' ? 'zone' : 'date'
        setTab(next)
        document.getElementById(`${winId}-${next}-tab`)?.focus()
      }}>
        {tabs.map(([id, label]) => (
          <li role="presentation" key={id}>
            <button type="button" role="tab" id={`${winId}-${id}-tab`} aria-controls={`${winId}-panel`} aria-selected={tab === id} tabIndex={tab === id ? 0 : -1} className={`tab-button ${tab === id ? 'is-active' : ''}`} onClick={() => setTab(id)}>{label}</button>
          </li>
        ))}
      </menu>
      <div className="window tab-panel" role="tabpanel" id={`${winId}-panel`} aria-labelledby={`${winId}-${tab}-tab`}>
        {tab === 'date' ? (
          <div className="datetime-panels">
            <fieldset>
              <legend>{t('Fecha', 'Date')}</legend>
              <div className="datetime-month">
                <button type="button" aria-label={t('Mes anterior', 'Previous month')} onClick={() => setShift((s) => s - 1)}>◄</button>
                <b aria-live="polite">{shown.toLocaleDateString(locale, { month: 'long', year: 'numeric' })}</b>
                <button type="button" aria-label={t('Mes siguiente', 'Next month')} onClick={() => setShift((s) => s + 1)}>►</button>
              </div>
              <div className="datetime-grid" role="grid" aria-label={t('Calendario', 'Calendar')}>
                {weekdays.map((d, i) => <span key={`w${i}`} className="datetime-weekday">{d}</span>)}
                {cells.map((day, i) => <span key={i} className={day === now.getDate() && shift === 0 ? 'is-today' : ''}>{day ?? ''}</span>)}
              </div>
            </fieldset>
            <fieldset>
              <legend>{t('Hora', 'Time')}</legend>
              <svg viewBox="0 0 100 100" className="datetime-clock" role="img" aria-label={now.toLocaleTimeString(locale)}>
                {Array.from({ length: 12 }, (_, i) => {
                  const a = (i / 12) * 2 * Math.PI
                  return <rect key={i} x={50 + Math.sin(a) * 42 - 1.5} y={50 - Math.cos(a) * 42 - 1.5} width="3" height="3" fill={i % 3 === 0 ? '#000080' : '#808080'} />
                })}
                {hand(hours / 12, 24, 3)}
                {hand(minutes / 60, 34, 2)}
                {hand(seconds / 60, 38, 1, '#c00000')}
                <circle cx="50" cy="50" r="2" />
              </svg>
              <output className="datetime-digital">{now.toLocaleTimeString(locale)}</output>
            </fieldset>
          </div>
        ) : (
          <div className="datetime-zone-tab">
            <label className="sr-only" htmlFor={`${winId}-zone`}>{t('Zona horaria', 'Time zone')}</label>
            <select id={`${winId}-zone`} disabled defaultValue="here"><option value="here">({gmt}) {zone.replace(/_/g, ' ')}</option></select>
            <svg viewBox={`0 0 ${COLS} ${ROWS}`} className="datetime-map" role="img" aria-label={t(`Mapa del mundo con la franja ${gmt} resaltada`, `World map with the ${gmt} band highlighted`)} preserveAspectRatio="none" shapeRendering="crispEdges">
              <rect width={COLS} height={ROWS} fill="#000080" />
              <rect x={band - 1} y="0" width="2" height={ROWS} fill="#00ffff" opacity="0.35" />
              {LAND.flatMap((runs, row) => runs.map(([from, to]) => {
                const lit = to + 1 > band - 1 && from < band + 1
                return <g key={`${row}-${from}`}>
                  <rect x={from} y={row} width={to - from + 1} height="1" fill="#008000" />
                  {lit && <rect x={Math.max(from, band - 1)} y={row} width={Math.min(to + 1, band + 1) - Math.max(from, band - 1)} height="1" fill="#00ff00" />}
                </g>
              }))}
            </svg>
            <p className="datetime-zone">{t('Tu navegador informa de esta zona horaria. El mapa es una ilustración simplificada.', 'Your browser reports this time zone. The map is a simplified illustration.')}</p>
          </div>
        )}
      </div>
      <div className="dialog-actions">
        <button type="button" onClick={() => close(winId)}>{t('Aceptar', 'OK')}</button>
        <button type="button" onClick={() => close(winId)}>{t('Cancelar', 'Cancel')}</button>
      </div>
    </div>
  )
}
