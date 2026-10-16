'use client'

import { useRef, type PointerEvent as ReactPointerEvent, type ReactNode } from 'react'
import { OsIcon, type IconName } from './icons'
import { useOs, type OsWindow } from './os-context'

type Props = {
  win: OsWindow
  title: string
  icon: IconName
  active: boolean
  resizable: boolean
  dialog?: boolean
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

export function WindowFrame({ win, title, icon, active, resizable, dialog, onFocus, onMinimize, onToggleMaximize, onClose, onCommit, children }: Props) {
  const ref = useRef<HTMLElement>(null)
  const { t } = useOs()
  const titleId = `${win.id.replace(/[^a-z0-9]/gi, '-')}-title`

  const isCompact = () => typeof window !== 'undefined' && window.matchMedia('(max-width: 640px)').matches

  function startDrag(e: ReactPointerEvent<HTMLDivElement>) {
    if (e.button !== 0 || win.maximized || isCompact()) return
    if ((e.target as HTMLElement).closest('button')) return
    const el = ref.current
    if (!el) return
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
    const up = () => {
      el.classList.remove('is-dragging')
      window.removeEventListener('pointermove', move)
      window.removeEventListener('pointerup', up)
      window.removeEventListener('pointercancel', up)
      onCommit({ x, y })
    }
    window.addEventListener('pointermove', move)
    window.addEventListener('pointerup', up)
    window.addEventListener('pointercancel', up)
  }

  function startResize(e: ReactPointerEvent<HTMLDivElement>) {
    if (e.button !== 0) return
    const el = ref.current
    if (!el) return
    e.preventDefault()
    e.stopPropagation()
    const startX = e.clientX
    const startY = e.clientY
    let w = win.w
    let h = win.h
    const move = (ev: PointerEvent) => {
      w = Math.max(MIN_W, Math.min(win.w + ev.clientX - startX, window.innerWidth - win.x))
      h = Math.max(MIN_H, Math.min(win.h + ev.clientY - startY, window.innerHeight - TASKBAR - win.y))
      el.style.width = `${w}px`
      el.style.height = `${h}px`
    }
    const up = () => {
      window.removeEventListener('pointermove', move)
      window.removeEventListener('pointerup', up)
      window.removeEventListener('pointercancel', up)
      onCommit({ w, h })
    }
    window.addEventListener('pointermove', move)
    window.addEventListener('pointerup', up)
    window.addEventListener('pointercancel', up)
  }

  return (
    <section
      ref={ref}
      role="dialog"
      aria-modal="false"
      aria-labelledby={titleId}
      className={`window os-window ${win.maximized ? 'is-maximized' : ''} ${dialog ? 'is-dialog' : ''}`}
      style={{ left: win.x, top: win.y, width: win.w, height: win.h, zIndex: win.z, display: win.minimized ? 'none' : undefined }}
      onPointerDownCapture={onFocus}
      onFocusCapture={onFocus}
      onKeyDown={(e) => {
        if (e.key === 'Escape' && dialog) onClose()
      }}
    >
      <div className={`title-bar ${active ? '' : 'inactive'}`} onPointerDown={startDrag} onDoubleClick={() => resizable && onToggleMaximize()}>
        <div className="title-bar-text" id={titleId}>
          <OsIcon name={icon} size={16} />
          <span>{title}</span>
        </div>
        <div className="title-bar-controls">
          {!dialog && <button type="button" aria-label="Minimize" title={t('Minimizar', 'Minimize')} onClick={onMinimize} />}
          {!dialog && resizable && <button type="button" aria-label={win.maximized ? 'Restore' : 'Maximize'} title={win.maximized ? t('Restaurar', 'Restore') : t('Maximizar', 'Maximize')} onClick={onToggleMaximize} />}
          <button type="button" aria-label="Close" title={t('Cerrar', 'Close')} onClick={onClose} />
        </div>
      </div>
      <div className="window-body os-window-body">{children}</div>
      {resizable && !win.maximized && <div className="resize-grip" onPointerDown={startResize} aria-hidden="true" />}
    </section>
  )
}
