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
const EDGES = ['n', 's', 'e', 'w', 'ne', 'nw', 'se', 'sw'] as const
type Edge = (typeof EDGES)[number]

export function WindowFrame({ win, title, icon, active, resizable, dialog, blocked = false, onFocus, onMinimize, onToggleMaximize, onClose, onCommit, children }: Props) {
  const ref = useRef<HTMLElement>(null)
  const cleanupGesture = useRef<(() => void) | null>(null)
  useEffect(() => () => cleanupGesture.current?.(), [])
  const { t } = useOs()
  const [compact, setCompact] = useState(false)
  const [systemMenu, setSystemMenu] = useState(false)
  const modal = win.app === 'message' || win.app === 'shutdown'
  const minW = win.app === 'skills' ? 360 : MIN_W
  const minH = win.app === 'skills' ? 270 : MIN_H
  useEffect(() => {
    const media = window.matchMedia('(max-width: 640px)')
    const change = () => setCompact(media.matches)
    change(); media.addEventListener('change', change)
    return () => media.removeEventListener('change', change)
  }, [])
  useEffect(() => {
    if (active && !blocked && !win.minimized && !ref.current?.contains(document.activeElement)) ref.current?.focus()
  }, [active, blocked, win.minimized])
  useEffect(() => {
    if (!systemMenu) return
    const close = (e: PointerEvent) => {
      if (!(e.target as HTMLElement).closest?.('.system-menu, .title-icon')) setSystemMenu(false)
    }
    window.addEventListener('pointerdown', close)
    return () => window.removeEventListener('pointerdown', close)
  }, [systemMenu])
  useEffect(() => { if (!active) setSystemMenu(false) }, [active])
  const titleId = `${win.id.replace(/[^a-z0-9]/gi, '-')}-title`

  const isCompact = () => typeof window !== 'undefined' && window.matchMedia('(max-width: 640px)').matches

  // Shared pointer gesture. Frames inside windows must not swallow the pointer mid-drag.
  function gesture(start: { x: number; y: number }, move: (dx: number, dy: number) => void, commit: () => void, className?: string) {
    const el = ref.current
    if (!el) return
    cleanupGesture.current?.()
    document.body.classList.add('is-window-gesture')
    if (className) el.classList.add(className)
    const onMove = (ev: PointerEvent) => move(ev.clientX - start.x, ev.clientY - start.y)
    const cleanup = () => {
      document.body.classList.remove('is-window-gesture')
      if (className) el.classList.remove(className)
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', up)
      window.removeEventListener('pointercancel', up)
      cleanupGesture.current = null
    }
    const up = () => {
      cleanup()
      commit()
    }
    cleanupGesture.current = cleanup
    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerup', up)
    window.addEventListener('pointercancel', up)
  }

  function startDrag(e: ReactPointerEvent<HTMLDivElement>) {
    if (e.button !== 0 || win.maximized || isCompact()) return
    if ((e.target as HTMLElement).closest('button')) return
    const el = ref.current
    if (!el) return
    e.preventDefault()
    let x = win.x
    let y = win.y
    gesture({ x: e.clientX, y: e.clientY }, (dx, dy) => {
      x = Math.min(Math.max(win.x + dx, -win.w + 80), window.innerWidth - 60)
      y = Math.min(Math.max(win.y + dy, 0), window.innerHeight - TASKBAR - 22)
      el.style.left = `${x}px`
      el.style.top = `${y}px`
    }, () => onCommit({ x, y }), 'is-dragging')
  }

  function startResize(e: ReactPointerEvent<HTMLElement>, edge: Edge) {
    if (e.button !== 0) return
    const el = ref.current
    if (!el) return
    e.preventDefault()
    e.stopPropagation()
    let { x, y, w, h } = win
    const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(value, Math.max(min, max)))
    gesture({ x: e.clientX, y: e.clientY }, (dx, dy) => {
      if (edge.includes('e')) w = clamp(win.w + dx, minW, window.innerWidth - win.x)
      if (edge.includes('w')) { w = clamp(win.w - dx, minW, win.x + win.w); x = win.x + win.w - w }
      if (edge.includes('s')) h = clamp(win.h + dy, minH, window.innerHeight - TASKBAR - win.y)
      if (edge.includes('n')) { h = clamp(win.h - dy, minH, win.y + win.h); y = win.y + win.h - h }
      el.style.left = `${x}px`
      el.style.top = `${y}px`
      el.style.width = `${w}px`
      el.style.height = `${h}px`
    }, () => onCommit({ x, y, w, h }))
  }

  const choose = (action: () => void) => () => {
    setSystemMenu(false)
    action()
  }

  return (
    <section
      ref={ref}
      role="dialog"
      aria-modal={modal}
      tabIndex={-1}
      inert={blocked || compact && !active}
      aria-labelledby={titleId}
      data-win-id={win.id}
      className={`window os-window ${active ? 'is-active' : ''} ${win.maximized ? 'is-maximized' : ''} ${dialog ? 'is-dialog' : ''}`}
      style={{ left: win.x, top: win.y, width: win.w, height: win.h, zIndex: win.z, display: win.minimized ? 'none' : undefined }}
      onPointerDownCapture={onFocus}
      onFocusCapture={onFocus}
      onKeyDown={(e) => {
        if (e.key === 'Escape' && systemMenu) { e.stopPropagation(); setSystemMenu(false); return }
        if (e.key === 'Escape' && dialog) onClose()
        if (modal && e.key === 'Tab') {
          const items = Array.from(ref.current?.querySelectorAll<HTMLElement>('button:not(:disabled), input, select, textarea, [tabindex="0"]') ?? [])
          const first = items[0], last = items[items.length - 1]
          if (e.shiftKey && (document.activeElement === first || document.activeElement === ref.current)) { e.preventDefault(); last?.focus() }
          else if (!e.shiftKey && (document.activeElement === last || document.activeElement === ref.current)) { e.preventDefault(); first?.focus() }
        }
      }}
    >
      {resizable && !win.maximized && EDGES.map((edge) => <div key={edge} className={`resize-edge resize-${edge}`} aria-hidden="true" onPointerDown={(e) => startResize(e, edge)} />)}
      <div tabIndex={0} aria-label={t('Mover ventana con Alt y las flechas', 'Move window with Alt and arrow keys')} onKeyDown={e=>{
        if (!e.altKey || !e.key.startsWith('Arrow') || win.maximized || isCompact()) return
        e.preventDefault(); e.stopPropagation()
        onCommit({x:Math.max(0,Math.min(window.innerWidth-win.w,win.x+(e.key==='ArrowRight'?16:e.key==='ArrowLeft'?-16:0))),y:Math.max(0,Math.min(window.innerHeight-TASKBAR-30,win.y+(e.key==='ArrowDown'?16:e.key==='ArrowUp'?-16:0)))})
      }} className={`title-bar ${active ? '' : 'inactive'}`} onPointerDown={startDrag} onDoubleClick={() => resizable && onToggleMaximize()}>
        <div className="title-bar-text" id={titleId}>
          <button type="button" className="title-icon" aria-haspopup="menu" aria-expanded={systemMenu} aria-label={t('Menú de control', 'Control menu')} onClick={() => setSystemMenu((o) => !o)} onDoubleClick={(e) => { e.stopPropagation(); onClose() }}>
            <OsIcon name={icon} size={16} />
          </button>
          <span>{title}</span>
        </div>
        <div className="title-bar-controls">
          {!dialog && <button type="button" data-control="Minimize" aria-label={t('Minimizar', 'Minimize')} title={t('Minimizar', 'Minimize')} onClick={onMinimize} />}
          {!dialog && resizable && <button type="button" data-control={win.maximized ? 'Restore' : 'Maximize'} aria-label={win.maximized ? t('Restaurar', 'Restore') : t('Maximizar', 'Maximize')} title={win.maximized ? t('Restaurar', 'Restore') : t('Maximizar', 'Maximize')} onClick={onToggleMaximize} />}
          <button type="button" data-control="Close" aria-label={t('Cerrar', 'Close')} title={t('Cerrar', 'Close')} onClick={onClose} />
        </div>
      </div>
      {systemMenu && (
        <div className="os-menu system-menu" role="menu" aria-label={t('Menú de control', 'Control menu')}>
          <button type="button" role="menuitem" disabled={!win.maximized} onClick={choose(onToggleMaximize)}>{t('Restaurar', 'Restore')}</button>
          <button type="button" role="menuitem" disabled={!!dialog} onClick={choose(onMinimize)}>{t('Minimizar', 'Minimize')}</button>
          <button type="button" role="menuitem" disabled={!!dialog || !resizable || win.maximized} onClick={choose(onToggleMaximize)}>{t('Maximizar', 'Maximize')}</button>
          <hr className="menu-separator" />
          <button type="button" role="menuitem" onClick={choose(onClose)}><b>{t('Cerrar', 'Close')}</b></button>
        </div>
      )}
      <div className="window-body os-window-body">{children}</div>
      {resizable && !win.maximized && <button type="button" className="resize-grip" title={t('Usa las flechas para cambiar el tamaño', 'Use arrow keys to resize')} aria-label={t('Cambiar tamaño de ventana', 'Resize window')} onPointerDown={(e) => startResize(e, 'se')} onKeyDown={(e) => {
        const step = e.shiftKey ? 10 : 24
        const width = e.key === 'ArrowRight' ? step : e.key === 'ArrowLeft' ? -step : 0
        const height = e.key === 'ArrowDown' ? step : e.key === 'ArrowUp' ? -step : 0
        if (!width && !height) return
        e.preventDefault()
        e.stopPropagation()
        onCommit({ w: Math.max(minW, Math.min(win.w + width, window.innerWidth - win.x)), h: Math.max(minH, Math.min(win.h + height, window.innerHeight - TASKBAR - win.y)) })
      }} />}
    </section>
  )
}
