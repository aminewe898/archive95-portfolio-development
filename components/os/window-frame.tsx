'use client'

import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent, type ReactNode } from 'react'
import { OsIcon, type IconName } from './icons'
import { useOs, type OsWindow } from './os-context'

type Props = {
  win: OsWindow
  title: string
  icon: IconName
  active: boolean
  resizable: boolean
  dialog?: boolean
  blocked?: boolean
  onFocus: () => void
  onMinimize: () => void
  onToggleMaximize: () => void
  onClose: () => void
  onCommit: (patch: Partial<OsWindow>) => void
  children: ReactNode
}

const TASKBAR = 30
const MIN_W = 220
const MIN_H = 140

export function WindowFrame({ win, title, icon, active, resizable, dialog, blocked = false, onFocus, onMinimize, onToggleMaximize, onClose, onCommit, children }: Props) {
  const ref = useRef<HTMLElement>(null)
  const cleanupGesture = useRef<(() => void) | null>(null)
  useEffect(() => () => cleanupGesture.current?.(), [])
  const { t } = useOs()
  const [compact, setCompact] = useState(false)
  const modal = win.app === 'message' || win.app === 'shutdown'
  useEffect(() => {
    const media = window.matchMedia('(max-width: 640px)')
    const change = () => setCompact(media.matches)
    change(); media.addEventListener('change', change)
    return () => media.removeEventListener('change', change)
  }, [])
  useEffect(() => {
    if (active && !blocked && !win.minimized && !ref.current?.contains(document.activeElement)) ref.current?.focus()
  }, [active, blocked, win.minimized])
  const titleId = `${win.id.replace(/[^a-z0-9]/gi, '-')}-title`

  const isCompact = () => typeof window !== 'undefined' && window.matchMedia('(max-width: 640px)').matches

  function startDrag(e: ReactPointerEvent<HTMLDivElement>) {
    if (e.button !== 0 || win.maximized || isCompact()) return
    if ((e.target as HTMLElement).closest('button')) return
    const el = ref.current
    if (!el) return
    cleanupGesture.current?.()
    e.preventDefault()
    const startX = e.clientX
    const startY = e.clientY
    let x = win.x
    let y = win.y
    el.classList.add('is-dragging')
    const move = (ev: PointerEvent) => {
      const maxX = window.innerWidth - 60
      const maxY = window.innerHeight - TASKBAR - 22
      x = Math.min(Math.max(win.x + ev.clientX - startX, -win.w + 80), maxX)
      y = Math.min(Math.max(win.y + ev.clientY - startY, 0), maxY)
      el.style.left = `${x}px`
      el.style.top = `${y}px`
    }
    const cleanup = () => {
      el.classList.remove('is-dragging')
      window.removeEventListener('pointermove', move)
      window.removeEventListener('pointerup', up)
      window.removeEventListener('pointercancel', up)
      cleanupGesture.current = null
    }
    const up = () => {
      cleanup()
      onCommit({ x, y })
    }
    cleanupGesture.current = cleanup
    window.addEventListener('pointermove', move)
    window.addEventListener('pointerup', up)
    window.addEventListener('pointercancel', up)
  }

  function startResize(e: ReactPointerEvent<HTMLButtonElement>) {
    if (e.button !== 0) return
    const el = ref.current
    if (!el) return
    cleanupGesture.current?.()
    e.preventDefault()
    e.stopPropagation()
    const startX = e.clientX
    const startY = e.clientY
    let w = win.w
    let h = win.h
    const minW = win.app === 'skills' ? 360 : MIN_W
    const minH = win.app === 'skills' ? 270 : MIN_H
    const move = (ev: PointerEvent) => {
      w = Math.max(minW, Math.min(win.w + ev.clientX - startX, window.innerWidth - win.x))
      h = Math.max(minH, Math.min(win.h + ev.clientY - startY, window.innerHeight - TASKBAR - win.y))
      el.style.width = `${w}px`
      el.style.height = `${h}px`
    }
    const cleanup = () => {
      window.removeEventListener('pointermove', move)
      window.removeEventListener('pointerup', up)
      window.removeEventListener('pointercancel', up)
      cleanupGesture.current = null
    }
    const up = () => {
      cleanup()
      onCommit({ w, h })
    }
    cleanupGesture.current = cleanup
    window.addEventListener('pointermove', move)
    window.addEventListener('pointerup', up)
    window.addEventListener('pointercancel', up)
  }

  return (
    <section
      ref={ref}
      role="dialog"
      aria-modal={modal}
      tabIndex={-1}
      inert={blocked || compact && !active}
      aria-labelledby={titleId}
      className={`window os-window ${win.maximized ? 'is-maximized' : ''} ${dialog ? 'is-dialog' : ''}`}
      style={{ left: win.x, top: win.y, width: win.w, height: win.h, zIndex: win.z, display: win.minimized ? 'none' : undefined }}
      onPointerDownCapture={onFocus}
      onFocusCapture={onFocus}
      onKeyDown={(e) => {
        if (e.key === 'Escape' && dialog) onClose()
        if (modal && e.key === 'Tab') {
          const items = Array.from(ref.current?.querySelectorAll<HTMLElement>('button:not(:disabled), input, select, textarea, [tabindex="0"]') ?? [])
          const first = items[0], last = items[items.length - 1]
          if (e.shiftKey && (document.activeElement === first || document.activeElement === ref.current)) { e.preventDefault(); last?.focus() }
          else if (!e.shiftKey && (document.activeElement === last || document.activeElement === ref.current)) { e.preventDefault(); first?.focus() }
        }
      }}
    >
      <div tabIndex={0} aria-label={t('Mover ventana con Alt y las flechas', 'Move window with Alt and arrow keys')} onKeyDown={e=>{
        if (!e.altKey || !e.key.startsWith('Arrow') || win.maximized || isCompact()) return
        e.preventDefault(); e.stopPropagation()
        onCommit({x:Math.max(0,Math.min(window.innerWidth-win.w,win.x+(e.key==='ArrowRight'?16:e.key==='ArrowLeft'?-16:0))),y:Math.max(0,Math.min(window.innerHeight-TASKBAR-30,win.y+(e.key==='ArrowDown'?16:e.key==='ArrowUp'?-16:0)))})
      }} className={`title-bar ${active ? '' : 'inactive'}`} onPointerDown={startDrag} onDoubleClick={() => resizable && onToggleMaximize()}>
        <div className="title-bar-text" id={titleId}>
          <OsIcon name={icon} size={16} />
          <span>{title}</span>
        </div>
        <div className="title-bar-controls">
          {!dialog && <button type="button" data-control="Minimize" aria-label={t('Minimizar', 'Minimize')} title={t('Minimizar', 'Minimize')} onClick={onMinimize} />}
          {!dialog && resizable && <button type="button" data-control={win.maximized ? 'Restore' : 'Maximize'} aria-label={win.maximized ? t('Restaurar', 'Restore') : t('Maximizar', 'Maximize')} title={win.maximized ? t('Restaurar', 'Restore') : t('Maximizar', 'Maximize')} onClick={onToggleMaximize} />}
          <button type="button" data-control="Close" aria-label={t('Cerrar', 'Close')} title={t('Cerrar', 'Close')} onClick={onClose} />
        </div>
      </div>
      <div className="window-body os-window-body">{children}</div>
      {resizable && !win.maximized && <button type="button" className="resize-grip" title={t('Usa las flechas para cambiar el tama\u00f1o', 'Use arrow keys to resize')} aria-label={t('Cambiar tamaño de ventana', 'Resize window')} onPointerDown={startResize} onKeyDown={(e) => {
        const step = e.shiftKey ? 10 : 24
        const width = e.key === 'ArrowRight' ? step : e.key === 'ArrowLeft' ? -step : 0
        const height = e.key === 'ArrowDown' ? step : e.key === 'ArrowUp' ? -step : 0
        if (!width && !height) return
        e.preventDefault()
        e.stopPropagation()
        onCommit({ w: Math.max(win.app === 'skills' ? 360 : MIN_W, Math.min(win.w + width, window.innerWidth - win.x)), h: Math.max(win.app === 'skills' ? 270 : MIN_H, Math.min(win.h + height, window.innerHeight - TASKBAR - win.y)) })
      }} />}
    </section>
  )
}
