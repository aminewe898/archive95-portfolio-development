'use client'

import { useEffect, useState } from 'react'
import { useOs } from '../os-context'

// Date/Time Properties: a live calendar and analogue clock. It reads the visitor's clock; it changes nothing.
export function DateTimeApp({ winId }: { winId: string }) {
  const { t, lang, close } = useOs()
  const [now, setNow] = useState<Date | null>(null)
  const [shift, setShift] = useState(0)
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

  return (
    <div className="dialog-layout datetime">
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
      <p className="datetime-zone">{t('Zona horaria actual', 'Current time zone')}: {Intl.DateTimeFormat().resolvedOptions().timeZone}</p>
      <div className="dialog-actions">
        <button type="button" onClick={() => close(winId)}>{t('Aceptar', 'OK')}</button>
        <button type="button" onClick={() => close(winId)}>{t('Cancelar', 'Cancel')}</button>
      </div>
    </div>
  )
}
