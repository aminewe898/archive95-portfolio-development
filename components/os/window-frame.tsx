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
  /** Windows 95 default: an outline follows the pointer and the window is redrawn when the button is released. */
  outline?: boolean
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
type Box = { x: number; y: number; w: number; h: number }

export function WindowFrame({ win, title, icon, active, resizable, dialog, blocked = false, outline = true, onFocus, onMinimize, onToggleMaximize, onClose, onCommit, children }: Props) {
  const ref = useRef<HTMLElement>(null)
  const cleanupGesture = useRef<(() => void) | null>(null)
  useEffect(() => () => cleanupGesture.current?.(), [])
  const { t } = useOs()
  const [compact, setCompact] = useState(false)
  const [menu, setMenu] = useState<{ x: number; y: number } | null>(null)
  // Move and Size from the window menu are finished with the arrow keys and Enter.
  const [keyMode, setKeyMode] = useState<'move' | 'size' | null>(null)
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
    if (!menu) return
    const close = (e: PointerEvent) => {
      if (!(e.target as HTMLElement).closest?.('.system-menu, .title-icon')) setMenu(null)
    }
    window.addEventListener('pointerdown', close)
    return () => window.removeEventListener('pointerdown', close)
  }, [menu])
  useEffect(() => { if (!active) { setMenu(null); setKeyMode(null) } }, [active])
  const titleId = `${win.id.replace(/[^a-z0-9]/gi, '-')}-title`

  const isCompact = () => typeof window !== 'undefined' && window.matchMedia('(max-width: 640px)').matches

  // Shared pointer gesture. `paint` shows the pending geometry, on the window itself or on an outline.
  function gesture(start: { x: number; y: number }, change: (dx: number, dy: number) => Box, commit: (box: Box) => void, className?: string) {
    const el = ref.current
    if (!el) return
    cleanupGesture.current?.()
    document.body.classList.add('is-window-gesture')
    if (className) el.classList.add(className)
    const ghost = outline ? document.createElement('div') : null
    if (ghost) {
      ghost.className = 'drag-outline'
      ghost.hidden = true
      el.parentElement?.append(ghost)
    }
    let box: Box = { x: win.x, y: win.y, w: win.w, h: win.h }
    const paint = () => {
      const target = ghost ?? el
      if (ghost) ghost.hidden = false
      target.style.left = `${box.x}px`
      target.style.top = `${box.y}px`
      target.style.width = `${box.w}px`
      target.style.height = `${box.h}px`
    }
    const onMove = (ev: PointerEvent) => {
      box = change(ev.clientX - start.x, ev.clientY - start.y)
      paint()
    }
    const cleanup = () => {
      document.body.classList.remove('is-window-gesture')
      if (className) el.classList.remove(className)
      ghost?.remove()
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', up)
      window.removeEventListener('pointercancel', up)
      cleanupGesture.current = null
    }
    const up = () => {
      cleanup()
      commit(box)
    }
    cleanupGesture.current = cleanup
    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerup', up)
    window.addEventListener('pointercancel', up)
  }

  function startDrag(e: ReactPointerEvent<HTMLDivElement>) {
    if (e.button !== 0 || win.maximized || isCompact()) return
    if ((e.target as HTMLElement).closest('button')) return
    e.preventDefault()
    gesture({ x: e.clientX, y: e.clientY }, (dx, dy) => ({
      x: Math.min(Math.max(win.x + dx, -win.w + 80), window.innerWidth - 60),
      y: Math.min(Math.max(win.y + dy, 0), window.innerHeight - TASKBAR - 22),
      w: win.w,
      h: win.h,
    }), ({ x, y }) => onCommit({ x, y }), outline ? undefined : 'is-dragging')
  }

  function startResize(e: ReactPointerEvent<HTMLElement>, edge: Edge) {
    if (e.button !== 0) return
    e.preventDefault()
    e.stopPropagation()
    const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(value, Math.max(min, max)))
    gesture({ x: e.clientX, y: e.clientY }, (dx, dy) => {
      let { x, y, w, h } = win
      if (edge.includes('e')) w = clamp(win.w + dx, minW, window.innerWidth - win.x)
      if (edge.includes('w')) { w = clamp(win.w - dx, minW, win.x + win.w); x = win.x + win.w - w }
      if (edge.includes('s')) h = clamp(win.h + dy, minH, window.innerHeight - TASKBAR - win.y)
      if (edge.includes('n')) { h = clamp(win.h - dy, minH, win.y + win.h); y = win.y + win.h - h }
      return { x, y, w, h }
    }, (box) => onCommit(box))
  }

  const nudge = (key: string, fine: boolean) => {
    const step = fine ? 4 : 16
    const dx = key === 'ArrowRight' ? step : key === 'ArrowLeft' ? -step : 0
    const dy = key === 'ArrowDown' ? step : key === 'ArrowUp' ? -step : 0
    if (keyMode === 'size') onCommit({ w: Math.max(minW, Math.min(win.w + dx, window.innerWidth - win.x)), h: Math.max(minH, Math.min(win.h + dy, window.innerHeight - TASKBAR - win.y)) })
    else onCommit({ x: Math.max(-win.w + 80, Math.min(window.innerWidth - 60, win.x + dx)), y: Math.max(0, Math.min(window.innerHeight - TASKBAR - 22, win.y + dy)) })
  }

  const choose = (action: () => void) => () => {
    setMenu(null)
    action()
  }
  const canMove = !win.maximized && !compact
  const canSize = resizable && !win.maximized && !compact

  return (
    <section
      ref={ref}
      role="dialog"
      aria-modal={modal}
      tabIndex={-1}
      inert={blocked || compact && !active}
      aria-labelledby={titleId}
      data-win-id={win.id}
      className={`window os-window ${active ? 'is-active' : ''} ${win.maximized ? 'is-maximized' : ''} ${dialog ? 'is-dialog' : ''} ${keyMode ? 'is-keymode' : ''}`}
      style={{ left: win.x, top: win.y, width: win.w, height: win.h, zIndex: dialog ? 5000 + win.z : win.z, display: win.minimized ? 'none' : undefined }}
      onPointerDownCapture={(e) => { onFocus(); if (keyMode && !(e.target as HTMLElement).closest('.system-menu')) setKeyMode(null) }}
      onFocusCapture={onFocus}
      onKeyDownCapture={(e) => {
        if (!keyMode) return
        e.preventDefault()
        e.stopPropagation()
        if (e.key === 'Enter' || e.key === 'Escape') setKeyMode(null)
        else if (e.key.startsWith('Arrow')) nudge(e.key, e.ctrlKey)
      }}
      onKeyDown={(e) => {
        if (e.key === 'Escape' && menu) { e.stopPropagation(); setMenu(null); return }
        if (e.altKey && e.code === 'Space') { e.preventDefault(); setMenu(menu ? null : { x: 3, y: 23 }); return }
        if (e.key === 'Escape' && dialog) onClose()
        if (modal && e.key === 'Tab') {
          const items = Array.from(ref.current?.querySelectorAll<HTMLElement>('button:not(:disabled), input, select, textarea, [tabindex="0"]') ?? [])
          const first = items[0], last = items[items.length - 1]
          if (e.shiftKey && (document.activeElement === first || document.activeElement === ref.current)) { e.preventDefault(); last?.focus() }
          else if (!e.shiftKey && (document.activeElement === last || document.activeElement === ref.current)) { e.preventDefault(); first?.focus() }
        }
      }}
    >
      {canSize && EDGES.map((edge) => <div key={edge} className={`resize-edge resize-${edge}`} aria-hidden="true" onPointerDown={(e) => startResize(e, edge)} />)}
      <div
        tabIndex={0}
        aria-label={t('Mover ventana con Alt y las flechas', 'Move window with Alt and arrow keys')}
        className={`title-bar ${active ? '' : 'inactive'}`}
        onPointerDown={startDrag}
        onDoubleClick={() => resizable && onToggleMaximize()}
        onContextMenu={(e) => {
          // A right click anywhere on the title bar shows the window's pop-up menu.
          e.preventDefault()
          const box = ref.current?.getBoundingClientRect()
          setMenu({ x: Math.max(3, e.clientX - (box?.left ?? 0)), y: Math.max(23, e.clientY - (box?.top ?? 0)) })
        }}
        onKeyDown={(e) => {
          if (!e.altKey || !e.key.startsWith('Arrow') || win.maximized || isCompact()) return
          e.preventDefault(); e.stopPropagation()
          onCommit({ x: Math.max(0, Math.min(window.innerWidth - win.w, win.x + (e.key === 'ArrowRight' ? 16 : e.key === 'ArrowLeft' ? -16 : 0))), y: Math.max(0, Math.min(window.innerHeight - TASKBAR - 30, win.y + (e.key === 'ArrowDown' ? 16 : e.key === 'ArrowUp' ? -16 : 0))) })
        }}
      >
        <div className="title-bar-text" id={titleId}>
          {/* Only primary windows carry an icon; dialogs, property sheets and message boxes do not. */}
          {!dialog && (
            <button type="button" className="title-icon" aria-haspopup="menu" aria-expanded={!!menu} aria-label={t('Menú de la ventana', 'Window menu')} onClick={() => setMenu(menu ? null : { x: 3, y: 23 })} onDoubleClick={(e) => { e.stopPropagation(); onClose() }}>
              <OsIcon name={icon} size={16} />
            </button>
          )}
          <span>{title}</span>
        </div>
        <div className="title-bar-controls">
          {!dialog && <button type="button" data-control="Minimize" aria-label={t('Minimizar', 'Minimize')} data-tip={t('Minimizar', 'Minimize')} onClick={onMinimize} />}
          {!dialog && resizable && <button type="button" data-control={win.maximized ? 'Restore' : 'Maximize'} aria-label={win.maximized ? t('Restaurar', 'Restore') : t('Maximizar', 'Maximize')} data-tip={win.maximized ? t('Restaurar', 'Restore') : t('Maximizar', 'Maximize')} onClick={onToggleMaximize} />}
          <button type="button" data-control="Close" aria-label={t('Cerrar', 'Close')} data-tip={t('Cerrar', 'Close')} onClick={onClose} />
        </div>
      </div>
      {menu && (
        <div className="os-menu system-menu" role="menu" aria-label={t('Menú de la ventana', 'Window menu')} style={{ left: menu.x, top: menu.y }}>
          {!dialog && <button type="button" role="menuitem" disabled={!win.maximized} onClick={choose(onToggleMaximize)}>{t('Restaurar', 'Restore')}</button>}
          <button type="button" role="menuitem" disabled={!canMove} onClick={choose(() => setKeyMode('move'))}>{t('Mover', 'Move')}</button>
          {!dialog && <button type="button" role="menuitem" disabled={!canSize} onClick={choose(() => setKeyMode('size'))}>{t('Tamaño', 'Size')}</button>}
          {!dialog && <button type="button" role="menuitem" onClick={choose(onMinimize)}>{t('Minimizar', 'Minimize')}</button>}
          {!dialog && <button type="button" role="menuitem" disabled={!resizable || win.maximized} onClick={choose(onToggleMaximize)}>{t('Maximizar', 'Maximize')}</button>}
          <hr className="menu-separator" />
          <button type="button" role="menuitem" onClick={choose(onClose)}><b>{t('Cerrar', 'Close')}</b><span className="menu-shortcut">Alt+F4</span></button>
        </div>
      )}
      {keyMode && <p className="keymode-hint" role="status">{keyMode === 'move' ? t('Flechas para mover · Intro para terminar', 'Arrow keys to move · Enter to finish') : t('Flechas para cambiar el tamaño · Intro para terminar', 'Arrow keys to size · Enter to finish')}</p>}
      <div className="window-body os-window-body">{children}</div>
      {canSize && <button type="button" className="resize-grip" data-tip={t('Usa las flechas para cambiar el tamaño', 'Use arrow keys to resize')} aria-label={t('Cambiar tamaño de ventana', 'Resize window')} onPointerDown={(e) => startResize(e, 'se')} onKeyDown={(e) => {
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
