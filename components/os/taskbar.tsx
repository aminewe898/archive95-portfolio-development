'use client'

import { useEffect, useRef, useState } from 'react'
import { projectIcon } from './programs'
import { profile, projects } from '@/lib/content'
import { OsIcon, type IconName } from './icons'
import { useOs, type AppId, type OsWindow } from './os-context'

type TaskItem = { win: OsWindow; title: string; icon: IconName }
export type ArrangeKind = 'cascade' | 'tile-h' | 'tile-v' | 'minimize' | 'undo'
type BarMenu = { x: number; taskId?: string } | null

type StartEntry = { label: string; icon: IconName; onSelect?: () => void; children?: StartEntry[] }

function Clock({ lang }: { lang: 'es' | 'en' }) {
  const [now, setNow] = useState<Date | null>(null)
  useEffect(() => {
    setNow(new Date())
    const id = window.setInterval(() => setNow(new Date()), 15000)
    return () => window.clearInterval(id)
  }, [])
  const locale = lang === 'es' ? 'es-ES' : 'en-GB'
  return (
    <time className="tray-clock" dateTime={now?.toISOString()} title={now?.toLocaleDateString(locale, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}>
      {now ? now.toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' }) : '--:--'}
    </time>
  )
}

function StartMenu({ entries, onClose }: { entries: StartEntry[]; onClose: () => void }) {
  const [sub, setSub] = useState<number | null>(null)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    ref.current?.querySelector<HTMLButtonElement>('[role="menuitem"]')?.focus()
  }, [])

  const onKeyDown = (e: React.KeyboardEvent) => {
    const items = Array.from(ref.current?.querySelectorAll<HTMLButtonElement>('[role="menuitem"]') ?? [])
    const i = items.indexOf(document.activeElement as HTMLButtonElement)
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      items[(i + 1) % items.length]?.focus()
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      items[(i - 1 + items.length) % items.length]?.focus()
    } else if (e.key === 'Escape') {
      e.preventDefault()
      ref.current?.closest('.taskbar')?.querySelector<HTMLButtonElement>('.start-button')?.focus()
      onClose()
    } else if (e.key === 'Tab') onClose()
  }

  const renderItem = (entry: StartEntry, index: number, large: boolean) => (
    <div className="start-entry" key={entry.label} onPointerEnter={() => large && setSub(entry.children ? index : null)}>
      <button
        type="button"
        role="menuitem"
        aria-haspopup={entry.children ? 'menu' : undefined}
        aria-expanded={entry.children ? sub === index : undefined}
        className={`start-item ${large ? 'is-large' : ''} ${sub === index && large ? 'is-open' : ''}`}
        onClick={() => {
          if (entry.children) setSub(sub === index ? null : index)
          else {
            entry.onSelect?.()
            onClose()
          }
        }}
        onKeyDown={(e) => {
          if (entry.children && e.key === 'ArrowRight') {
            e.preventDefault()
            setSub(index)
            requestAnimationFrame(() => ref.current?.querySelector<HTMLButtonElement>('.start-submenu [role="menuitem"]')?.focus())
          }
        }}
      >
        <OsIcon name={entry.icon} size={large ? 32 : 16} />
        <span>{entry.label}</span>
        {entry.children && <span className="start-arrow" aria-hidden="true">►</span>}
      </button>
      {entry.children && sub === index && (
        <div className="os-menu start-submenu" role="menu" aria-label={entry.label} onKeyDown={(e) => {
          if (e.key === 'ArrowLeft') {
            e.preventDefault()
            e.stopPropagation()
            e.currentTarget.parentElement?.querySelector<HTMLButtonElement>('.start-item')?.focus()
            setSub(null)
          }
        }}>
          {entry.children.map((child, j) => renderItem(child, j, false))}
        </div>
      )}
    </div>
  )

  return (
    <div className="start-menu" ref={ref} role="menu" aria-label="Start" onKeyDown={onKeyDown}>
      <div className="start-banner" aria-hidden="true">
        <span>
          <b>Archive</b>95
        </span>
      </div>
      <div className="start-items">
        {entries.map((entry, i) =>
          entry.label === '—' ? <hr key={`sep${i}`} className="menu-separator" /> : renderItem(entry, i, true),
        )}
      </div>
    </div>
  )
}

export function Taskbar({ tasks, activeId, onTask, onArrange, onMinimize }: { tasks: TaskItem[]; activeId: string | null; onTask: (id: string) => void; onArrange: (kind: ArrangeKind) => void; onMinimize: (id: string) => void }) {
  const os = useOs()
  const { t, lang } = os
  const [volumeOpen, setVolumeOpen] = useState(false)
  const [startOpen, setStartOpen] = useState(false)
  const [barMenu, setBarMenu] = useState<BarMenu>(null)
  const [begun, setBegun] = useState(false)
  const barRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!startOpen && !volumeOpen && !barMenu) return
    const close = (e: PointerEvent) => {
      if (!barRef.current?.contains(e.target as Node)) { setStartOpen(false); setVolumeOpen(false) }
      if (!(e.target as HTMLElement).closest?.('.taskbar-menu')) setBarMenu(null)
    }
    window.addEventListener('pointerdown', close)
    return () => window.removeEventListener('pointerdown', close)
  }, [startOpen, volumeOpen, barMenu])

  const go = (app: AppId, arg?: string) => () => os.open(app, arg)
  const entries: StartEntry[] = [
    {
      label: t('Programas', 'Programs'),
      icon: 'folder',
      children: [
        { label: t('Explorador de proyectos', 'Project Explorer'), icon: 'explorer', onSelect: go('projects') },
        { label: 'Internet Explorer', icon: 'ie', onSelect: go('ie') },
        { label: 'MS-DOS Prompt', icon: 'dos', onSelect: go('terminal') },
        { label: 'Outlook Express', icon: 'mail', onSelect: go('mail') },
        { label: t('Bloc de notas', 'Notepad'), icon: 'notepad', onSelect: go('notepad') },
        { label: 'Paint', icon: 'paint', onSelect: go('paint') },
        { label: t('Calculadora', 'Calculator'), icon: 'calc', onSelect: go('calc') },
        { label: t('Solitario', 'Solitaire'), icon: 'sol', onSelect: go('sol') },
        { label: t('Buscaminas', 'Minesweeper'), icon: 'mines', onSelect: go('mines') },
        { label: 'Snake', icon: 'snake', onSelect: go('snake') },
        { label: 'GitHub ↗', icon: 'globe', onSelect: () => window.open(profile.github, '_blank', 'noopener') },
      ],
    },
    {
      label: t('Documentos', 'Documents'),
      icon: 'file',
      children: [
        ...projects.map((p) => ({ label: p.name[lang], icon: projectIcon(p.slug), onSelect: go('project', p.slug) })),
        { label: 'RESUME.DOC', icon: 'doc', onSelect: go('resume') },
      ],
    },
    {
      label: t('Configuración', 'Settings'),
      icon: 'settings',
      children: [
        { label: t('Panel de control', 'Control Panel'), icon: 'settings', onSelect: go('skills') },
        { label: t('Pantalla', 'Display'), icon: 'desktop', onSelect: go('display') },
        { label: t('Fecha y hora', 'Date/Time'), icon: 'clock', onSelect: go('datetime') },
        { label: t('Cerrar programa…', 'Close Program…'), icon: 'taskman', onSelect: go('taskman') },
        { label: lang === 'es' ? 'Switch to English' : 'Cambiar a español', icon: 'globe', onSelect: () => os.setLang(lang === 'es' ? 'en' : 'es') },
        { label: os.soundOn ? t('Silenciar sonidos', 'Mute sounds') : t('Activar sonidos', 'Enable sounds'), icon: 'speaker', onSelect: () => os.setSoundOn(!os.soundOn) },
      ],
    },
    { label: t('Buscar…', 'Find…'), icon: 'find', onSelect: go('find') },
    { label: t('Ayuda', 'Help'), icon: 'help', onSelect: go('welcome') },
    { label: t('Ejecutar…', 'Run…'), icon: 'run', onSelect: go('run') },
    { label: '—', icon: 'file' },
    { label: t('Apagar…', 'Shut Down…'), icon: 'power', onSelect: go('shutdown') },
  ]

  return (
    <div className="taskbar" ref={barRef} onContextMenu={(e) => {
      if ((e.target as HTMLElement).closest('.start-menu, .volume-popup, .taskbar-menu, input')) return
      e.preventDefault()
      setStartOpen(false)
      const taskId = (e.target as HTMLElement).closest<HTMLElement>('[data-task-id]')?.dataset.taskId
      setBarMenu({ x: Math.max(2, Math.min(e.clientX, window.innerWidth - 210)), taskId })
    }}>
      {barMenu && (() => {
        const task = tasks.find((item) => item.win.id === barMenu.taskId)
        const pick = (action: () => void) => () => { setBarMenu(null); action() }
        return (
          <div className="os-menu taskbar-menu" role="menu" style={{ left: barMenu.x }} onKeyDown={(e) => e.key === 'Escape' && setBarMenu(null)}>
            {task ? <>
              <button type="button" role="menuitem" onClick={pick(() => onTask(task.win.id))} disabled={!task.win.minimized && activeId === task.win.id}>{t('Restaurar', 'Restore')}</button>
              <button type="button" role="menuitem" onClick={pick(() => onMinimize(task.win.id))} disabled={task.win.minimized}>{t('Minimizar', 'Minimize')}</button>
              <hr className="menu-separator" />
              <button type="button" role="menuitem" onClick={pick(() => os.close(task.win.id))}><b>{t('Cerrar', 'Close')}</b></button>
            </> : <>
              <button type="button" role="menuitem" onClick={pick(() => onArrange('cascade'))}>{t('Cascada', 'Cascade')}</button>
              <button type="button" role="menuitem" onClick={pick(() => onArrange('tile-h'))}>{t('Mosaico horizontal', 'Tile Horizontally')}</button>
              <button type="button" role="menuitem" onClick={pick(() => onArrange('tile-v'))}>{t('Mosaico vertical', 'Tile Vertically')}</button>
              <hr className="menu-separator" />
              <button type="button" role="menuitem" onClick={pick(() => onArrange('minimize'))}>{t('Minimizar todas las ventanas', 'Minimize All Windows')}</button>
              <button type="button" role="menuitem" onClick={pick(() => onArrange('undo'))}>{t('Deshacer Minimizar todo', 'Undo Minimize All')}</button>
              <hr className="menu-separator" />
              <button type="button" role="menuitem" onClick={pick(() => os.open('datetime'))}>{t('Ajustar fecha y hora', 'Adjust Date/Time')}</button>
              <button type="button" role="menuitem" onClick={pick(() => os.open('taskman'))}>{t('Cerrar programa…', 'Close Program…')}</button>
              <button type="button" role="menuitem" onClick={pick(() => os.open('display'))}>{t('Propiedades', 'Properties')}</button>
            </>}
          </div>
        )
      })()}
      {startOpen && <StartMenu entries={entries} onClose={() => setStartOpen(false)} />}
      <button
        type="button"
        className={`start-button ${startOpen ? 'is-pressed' : ''}`}
        aria-haspopup="menu"
        aria-expanded={startOpen}
        onClick={() => {
          os.play('click')
          setBegun(true)
          setStartOpen((o) => !o)
        }}
      >
        <OsIcon name="logo" size={16} />
        <b>{t('Inicio', 'Start')}</b>
      </button>
      <span className="taskbar-divider" aria-hidden="true" />
      {!begun && tasks.length === 0 && !startOpen && <span className="begin-hint" aria-hidden="true">◄ {t('Haz clic aquí para empezar', 'Click here to begin')}</span>}
      <nav className="task-list" aria-label={t('Ventanas abiertas', 'Open windows')}>
        {tasks.map(({ win, title, icon }) => (
          <button key={win.id} type="button" data-task-id={win.id} className={`task-button ${activeId === win.id && !win.minimized ? 'is-pressed' : ''}`} aria-label={title} aria-pressed={activeId === win.id && !win.minimized} onClick={() => onTask(win.id)} title={title}>
            <OsIcon name={icon} size={16} />
            <span>{title}</span>
          </button>
        ))}
      </nav>
      <div className="tray">
        {volumeOpen && <div className="volume-popup" role="group" aria-label={t('Controles de sonido', 'Sound controls')} onKeyDown={e=>{if(e.key==='Escape'){setVolumeOpen(false);barRef.current?.querySelector<HTMLButtonElement>('[data-tray="sound"]')?.focus()}}}>
          <b>{t('Volumen del sistema', 'System volume')}</b>
          <label>{Math.round(os.volume*100)}%<input aria-label={t('Volumen', 'Volume')} type="range" min="0" max="100" value={Math.round(os.volume*100)} onChange={e=>os.setVolume(Number(e.target.value)/100)}/></label>
          <button aria-pressed={!os.soundOn} onClick={()=>os.setSoundOn(!os.soundOn)}>{os.soundOn?t('Silenciar', 'Mute'):t('Activar sonido', 'Unmute')}</button>
          <button disabled={!os.soundOn || os.volume===0} onClick={()=>os.play('ding')}>{t('Probar', 'Test sound')}</button>
        </div>}
        <button type="button" className="tray-button" onClick={() => os.setLang(lang === 'es' ? 'en' : 'es')} aria-label={lang === 'es' ? 'ES — Switch to English' : 'EN — Cambiar a español'} title={lang === 'es' ? 'Switch to English' : 'Cambiar a español'}>
          {lang.toUpperCase()}
        </button>
        <button type="button" className={`tray-button ${os.soundOn ? '' : 'is-muted'}`} data-tray="sound" onClick={() => setVolumeOpen(v=>!v)} aria-label={t('Controles de sonido', 'Sound controls')} aria-expanded={volumeOpen} title={os.soundOn ? t('Volumen', 'Volume') : t('Silenciado', 'Muted')}>
          <OsIcon name="speaker" size={16} />
        </button>
        <button type="button" className="tray-button tray-clock-button" onDoubleClick={() => os.open('datetime')} onKeyDown={(e) => e.key === 'Enter' && os.open('datetime')}>
          <Clock lang={lang} />
        </button>
      </div>
    </div>
  )
}
