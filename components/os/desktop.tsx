'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { homePath, profile, projectPath, projects, type Lang } from '@/lib/content'
import { AboutApp } from './apps/about'
import { MailApp } from './apps/mail'
import { Minesweeper } from './apps/minesweeper'
import { NotepadApp } from './apps/notepad'
import { ProjectViewer } from './apps/project'
import { ProjectsExplorer, RecycleBin } from './apps/explorer'
import { ResumeApp } from './apps/resume'
import { SkillsApp } from './apps/skills'
import { DisplayProperties, MessageBox, RunDialog, ShutdownDialog, wallpaperOptions } from './apps/system-dialogs'
import { TerminalApp } from './apps/terminal'
import { WelcomeApp } from './apps/welcome'
import { BootScreen, OffScreen, Screensaver } from './boot'
import { OsIcon, type IconName } from './icons'
import { OsContext, windowId, type AppId, type MessageSpec, type OsApi, type OsWindow, type Wallpaper } from './os-context'
import { projectFile } from './programs'
import { playSound, type SoundName } from './sound'
import { Taskbar } from './taskbar'
import { useOpenGesture } from './use-open-gesture'
import { WindowFrame as WindowFrameLazy } from './window-frame'

const TASKBAR = 30
const IDLE_MS = 120_000

const sizes: Record<AppId, [number, number]> = {
  welcome: [520, 340],
  about: [470, 430],
  projects: [580, 390],
  project: [700, 540],
  resume: [660, 560],
  mail: [540, 440],
  terminal: [620, 390],
  mines: [196, 292],
  notepad: [500, 400],
  recycle: [500, 330],
  skills: [560, 440],
  display: [400, 430],
  run: [390, 196],
  shutdown: [370, 206],
  message: [400, 170],
}

const dialogs = new Set<AppId>(['run', 'shutdown', 'message', 'display', 'about'])
const fixedSize = new Set<AppId>([...dialogs, 'mines', 'welcome'])
const singletons = new Set<AppId>(['project', 'mail'])

type DesktopIcon = { id: string; label: string; icon: IconName; app: AppId; arg?: string }

type ContextMenuState = { x: number; y: number } | null

export function Desktop({ lang: initialLang, initial }: { lang: Lang; initial?: { app: AppId; arg?: string } }) {
  const [lang, setLangState] = useState<Lang>(initialLang)
  const [windows, setWindows] = useState<OsWindow[]>([])
  const [wallpaper, setWallpaperState] = useState<Wallpaper>('clouds')
  const [soundOn, setSoundOnState] = useState(true)
  const [phase, setPhase] = useState<'desktop' | 'boot' | 'off'>('desktop')
  const [saver, setSaver] = useState(false)
  const [recycleEmptied, setRecycleEmptied] = useState(false)
  const [selectedIcon, setSelectedIcon] = useState<string | null>(null)
  const [iconOffsets, setIconOffsets] = useState<Record<string, { x: number; y: number }>>({})
  const [menu, setMenu] = useState<ContextMenuState>(null)
  const [viewportH, setViewportH] = useState(720)
  const zRef = useRef(10)
  const cascade = useRef(0)
  const msgSeq = useRef(0)
  const soundRef = useRef(soundOn)
  soundRef.current = soundOn

  const t = useCallback((es: string, en: string) => (lang === 'es' ? es : en), [lang])
  const play = useCallback((name: SoundName) => soundRef.current && playSound(name), [])

  const topWindow = useMemo(() => windows.filter((w) => !w.minimized).sort((a, b) => b.z - a.z)[0], [windows])
  const activeId = topWindow?.id ?? null

  const focus = useCallback((id: string) => {
    setWindows((list) => {
      const target = list.find((w) => w.id === id)
      if (!target) return list
      const top = Math.max(...list.map((w) => w.z))
      if (target.z === top && !target.minimized) return list
      zRef.current = top + 1
      return list.map((w) => (w.id === id ? { ...w, z: zRef.current, minimized: false } : w))
    })
  }, [])

  const spawn = useCallback(
    (app: AppId, arg?: string, message?: MessageSpec) => {
      setWindows((list) => {
        const id = app === 'message' ? `message:${++msgSeq.current}` : singletons.has(app) ? app : windowId(app, arg)
        const existing = list.find((w) => w.id === id)
        zRef.current += 1
        if (existing) return list.map((w) => (w.id === id ? { ...w, arg, z: zRef.current, minimized: false } : w))
        const W = window.innerWidth
        const H = window.innerHeight - TASKBAR
        const [dw, dh] = sizes[app]
        const w = Math.min(dw, W - 8)
        const h = Math.min(dh, H - 8)
        const centered = dialogs.has(app) || app === 'welcome'
        const step = centered ? 0 : (cascade.current++ % 6) * 26
        const x = Math.max(4, Math.min(W - w - 4, centered ? (W - w) / 2 : Math.max(108, (W - w) / 2 - 80) + step))
        const y = Math.max(4, Math.min(H - h - 4, centered ? (H - h) / 2.4 : 28 + step))
        return [...list, { id, app, arg, message, x, y, w, h, z: zRef.current, minimized: false, maximized: false }]
      })
    },
    [],
  )

  const open = useCallback(
    (app: AppId, arg?: string) => {
      play('open')
      spawn(app, arg)
      setMenu(null)
    },
    [play, spawn],
  )

  const close = useCallback((id: string) => setWindows((list) => list.filter((w) => w.id !== id)), [])
  const patch = useCallback((id: string, p: Partial<OsWindow>) => setWindows((list) => list.map((w) => (w.id === id ? { ...w, ...p } : w))), [])

  const message = useCallback(
    (spec: MessageSpec) => {
      play(spec.kind === 'warning' ? 'error' : 'ding')
      spawn('message', undefined, spec)
    },
    [play, spawn],
  )

  const setLang = useCallback((next: Lang) => {
    setLangState(next)
    document.documentElement.lang = next
  }, [])

  const setWallpaper = useCallback((w: Wallpaper) => {
    setWallpaperState(w)
    localStorage.setItem('a95-wallpaper', w)
  }, [])

  const setSoundOn = useCallback((on: boolean) => {
    setSoundOnState(on)
    localStorage.setItem('a95-sound', on ? 'on' : 'off')
  }, [])

  const openWelcome = useCallback(() => {
    if (localStorage.getItem('a95-welcome') !== 'off') spawn('welcome')
  }, [spawn])

  const power = useCallback((mode: 'off' | 'restart') => {
    setWindows([])
    setPhase(mode === 'off' ? 'off' : 'boot')
  }, [])

  const finishBoot = useCallback(() => {
    sessionStorage.setItem('a95-booted', '1')
    setPhase('desktop')
    play('chord')
    openWelcome()
  }, [openWelcome, play])

  useEffect(() => {
    const storedWall = localStorage.getItem('a95-wallpaper') as Wallpaper | null
    if (storedWall && wallpaperOptions.some((o) => o.id === storedWall)) setWallpaperState(storedWall)
    if (localStorage.getItem('a95-sound') === 'off') setSoundOnState(false)
    setViewportH(window.innerHeight)
    const onResize = () => setViewportH(window.innerHeight)
    window.addEventListener('resize', onResize)

    if (initial) spawn(initial.app, initial.arg)
    else if (!sessionStorage.getItem('a95-booted')) setPhase('boot')
    else openWelcome()
    return () => window.removeEventListener('resize', onResize)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (phase !== 'desktop') return
    let timer = window.setTimeout(() => setSaver(true), IDLE_MS)
    const reset = () => {
      window.clearTimeout(timer)
      timer = window.setTimeout(() => setSaver(true), IDLE_MS)
    }
    const events = ['pointermove', 'pointerdown', 'keydown', 'wheel'] as const
    events.forEach((e) => window.addEventListener(e, reset, { passive: true }))
    return () => {
      window.clearTimeout(timer)
      events.forEach((e) => window.removeEventListener(e, reset))
    }
  }, [phase])

  useEffect(() => {
    const project = topWindow?.app === 'project' ? topWindow.arg : undefined
    const target = project ? projectPath(lang, project) : homePath(lang)
    if (window.location.pathname !== target) window.history.replaceState(null, '', target)
    const name = project ? projects.find((p) => p.slug === project)?.name[lang] : undefined
    document.title = name ? `${name} — ${profile.name}` : `${profile.name} — Archive95`
  }, [topWindow?.app, topWindow?.arg, lang])

  useEffect(() => {
    if (!menu) return
    const closeMenu = () => setMenu(null)
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && closeMenu()
    window.addEventListener('pointerdown', closeMenu)
    window.addEventListener('keydown', onKey)
    window.addEventListener('blur', closeMenu)
    return () => {
      window.removeEventListener('pointerdown', closeMenu)
      window.removeEventListener('keydown', onKey)
      window.removeEventListener('blur', closeMenu)
    }
  }, [menu])

  const api: OsApi = useMemo(
    () => ({
      lang,
      t,
      open,
      close,
      message,
      wallpaper,
      setWallpaper,
      soundOn,
      setSoundOn,
      play,
      setLang,
      power,
      startScreensaver: () => setSaver(true),
      recycleEmptied,
      emptyRecycle: () => {
        play('boom')
        setRecycleEmptied(true)
      },
    }),
    [lang, t, open, close, message, wallpaper, setWallpaper, soundOn, setSoundOn, play, setLang, power, recycleEmptied],
  )

  const icons: DesktopIcon[] = [
    { id: 'about', label: t('Mi PC', 'My Computer'), icon: 'computer', app: 'about' },
    { id: 'projects', label: t('Proyectos', 'Projects'), icon: 'folder', app: 'projects' },
    { id: 'relay', label: 'RELAY.EXE', icon: 'automation', app: 'project', arg: 'relay' },
    { id: 'resume', label: 'RESUME.DOC', icon: 'doc', app: 'resume' },
    { id: 'mail', label: t('Bandeja de entrada', 'Inbox'), icon: 'mail', app: 'mail' },
    { id: 'terminal', label: 'MS-DOS Prompt', icon: 'dos', app: 'terminal' },
    { id: 'readme', label: 'README.TXT', icon: 'notepad', app: 'notepad' },
    { id: 'skills', label: t('Panel de control', 'Control Panel'), icon: 'settings', app: 'skills' },
    { id: 'mines', label: t('Buscaminas', 'Minesweeper'), icon: 'mines', app: 'mines' },
    { id: 'recycle', label: t('Papelera', 'Recycle Bin'), icon: recycleEmptied ? 'recycleEmpty' : 'recycleFull', app: 'recycle' },
  ]

  const meta = (w: OsWindow): { title: string; icon: IconName } => {
    switch (w.app) {
      case 'welcome':
        return { title: t('Bienvenida', 'Welcome'), icon: 'help' }
      case 'about':
        return { title: t('Propiedades del sistema', 'System Properties'), icon: 'computer' }
      case 'projects':
        return { title: t('Proyectos', 'Projects'), icon: 'folderOpen' }
      case 'project': {
        const p = projects.find((x) => x.slug === w.arg)
        return { title: `${projectFile(w.arg ?? '')} — ${p?.name[lang] ?? ''}`, icon: w.arg === 'relay' ? 'automation' : 'doc' }
      }
      case 'resume':
        return { title: 'RESUME.DOC — WordPad', icon: 'doc' }
      case 'mail':
        return { title: `${t('Mensaje nuevo', 'New Message')} — Outlook Express`, icon: 'mail' }
      case 'terminal':
        return { title: 'MS-DOS Prompt', icon: 'dos' }
      case 'mines':
        return { title: t('Buscaminas', 'Minesweeper'), icon: 'mines' }
      case 'notepad':
        return { title: w.arg?.startsWith('new') ? t('Sin título — Bloc de notas', 'Untitled — Notepad') : `README.TXT — ${t('Bloc de notas', 'Notepad')}`, icon: 'notepad' }
      case 'recycle':
        return { title: t('Papelera de reciclaje', 'Recycle Bin'), icon: recycleEmptied ? 'recycleEmpty' : 'recycleFull' }
      case 'skills':
        return { title: t('Panel de control', 'Control Panel'), icon: 'settings' }
      case 'display':
        return { title: t('Propiedades de Pantalla', 'Display Properties'), icon: 'desktop' }
      case 'run':
        return { title: t('Ejecutar', 'Run'), icon: 'run' }
      case 'shutdown':
        return { title: t('Apagar Archive95', 'Shut Down Archive95'), icon: 'power' }
      case 'message':
        return { title: w.message?.title ?? 'Archive95', icon: 'info' }
    }
  }

  const renderApp = (w: OsWindow) => {
    switch (w.app) {
      case 'welcome':
        return <WelcomeApp winId={w.id} />
      case 'about':
        return <AboutApp winId={w.id} />
      case 'projects':
        return <ProjectsExplorer winId={w.id} />
      case 'project':
        return <ProjectViewer key={w.arg} slug={w.arg ?? 'relay'} winId={w.id} />
      case 'resume':
        return <ResumeApp winId={w.id} />
      case 'mail':
        return <MailApp key={w.arg ?? 'none'} topic={w.arg} winId={w.id} />
      case 'terminal':
        return <TerminalApp winId={w.id} />
      case 'mines':
        return <Minesweeper winId={w.id} />
      case 'notepad':
        return <NotepadApp blank={w.arg?.startsWith('new')} winId={w.id} />
      case 'recycle':
        return <RecycleBin winId={w.id} />
      case 'skills':
        return <SkillsApp />
      case 'display':
        return <DisplayProperties winId={w.id} />
      case 'run':
        return <RunDialog winId={w.id} />
      case 'shutdown':
        return <ShutdownDialog winId={w.id} />
      case 'message':
        return w.message ? <MessageBox spec={w.message} winId={w.id} /> : null
    }
  }

  const ordered = [...windows].sort((a, b) => a.z - b.z)
  const tasks = windows.filter((w) => w.app !== 'message').map((w) => ({ win: w, ...meta(w) }))

  return (
    <OsContext.Provider value={api}>
      <div className={`os-root wallpaper-${wallpaper}`} lang={lang}>
        <div className="sr-only">
          <h1>
            {profile.name} — {profile.role[lang]}
          </h1>
          <p>{t('Portfolio interactivo con forma de escritorio Windows 95.', 'Interactive portfolio presented as a Windows 95 desktop.')}</p>
          <ul>
            {projects.map((p) => (
              <li key={p.slug}>
                <a href={projectPath(lang, p.slug)}>{p.name[lang]}</a>: {p.summary[lang]}
              </li>
            ))}
            <li>
              <a href={`mailto:${profile.email}`}>{profile.email}</a>
            </li>
          </ul>
        </div>

        <main
          className="desktop"
          aria-label={t('Escritorio', 'Desktop')}
          onPointerDown={(e) => {
            if (e.target === e.currentTarget) setSelectedIcon(null)
          }}
          onContextMenu={(e) => {
            if ((e.target as HTMLElement).closest('.os-window')) return
            e.preventDefault()
            setMenu({ x: Math.min(e.clientX, window.innerWidth - 210), y: Math.min(e.clientY, window.innerHeight - TASKBAR - 230) })
          }}
        >
          <DesktopIcons
            icons={icons}
            selected={selectedIcon}
            onSelect={setSelectedIcon}
            onOpen={(i) => open(i.app, i.arg)}
            offsets={iconOffsets}
            onMove={(id, pos) => setIconOffsets((o) => ({ ...o, [id]: pos }))}
            viewportH={viewportH}
          />

          {ordered.map((w) => {
            const m = meta(w)
            return (
              <WindowFrameLazy
                key={w.id}
                win={w}
                title={m.title}
                icon={m.icon}
                active={w.id === activeId}
                resizable={!fixedSize.has(w.app)}
                dialog={dialogs.has(w.app)}
                onFocus={() => focus(w.id)}
                onMinimize={() => patch(w.id, { minimized: true })}
                onToggleMaximize={() => patch(w.id, { maximized: !w.maximized })}
                onClose={() => {
                  play('click')
                  close(w.id)
                }}
                onCommit={(p) => patch(w.id, p)}
              >
                {renderApp(w)}
              </WindowFrameLazy>
            )
          })}

          {menu && (
            <div className="os-menu desktop-menu" role="menu" style={{ left: menu.x, top: menu.y }} onPointerDown={(e) => e.stopPropagation()}>
              <button type="button" role="menuitem" onClick={() => { setIconOffsets({}); setMenu(null) }}>
                {t('Organizar iconos', 'Arrange Icons')}
              </button>
              <button type="button" role="menuitem" onClick={() => { setMenu(null); play('click') }}>
                {t('Actualizar', 'Refresh')}
              </button>
              <hr className="menu-separator" />
              <button type="button" role="menuitem" onClick={() => open('notepad', `new-${Date.now()}`)}>
                {t('Nuevo › Documento de texto', 'New › Text Document')}
              </button>
              <button type="button" role="menuitem" onClick={() => open('terminal')}>
                {t('Abrir MS-DOS Prompt aquí', 'Open MS-DOS Prompt here')}
              </button>
              <hr className="menu-separator" />
              {wallpaperOptions.map((o) => (
                <button key={o.id} type="button" role="menuitemradio" aria-checked={wallpaper === o.id} onClick={() => { setWallpaper(o.id); setMenu(null) }}>
                  <span className="menu-check" aria-hidden="true">{wallpaper === o.id ? '•' : ''}</span>
                  {t(o.es, o.en)}
                </button>
              ))}
              <hr className="menu-separator" />
              <button type="button" role="menuitem" onClick={() => open('display')}>
                {t('Propiedades', 'Properties')}
              </button>
            </div>
          )}
        </main>

        <Taskbar
          tasks={tasks}
          activeId={activeId}
          onTask={(id) => {
            const w = windows.find((x) => x.id === id)
            if (!w) return
            if (w.id === activeId && !w.minimized) patch(id, { minimized: true })
            else focus(id)
          }}
        />

        {phase === 'boot' && <BootScreen lang={lang} onDone={finishBoot} />}
        {phase === 'off' && <OffScreen lang={lang} onWake={() => setPhase('boot')} />}
        {saver && phase === 'desktop' && <Screensaver onExit={() => setSaver(false)} />}
      </div>
    </OsContext.Provider>
  )
}

function DesktopIcons({
  icons,
  selected,
  onSelect,
  onOpen,
  offsets,
  onMove,
  viewportH,
}: {
  icons: DesktopIcon[]
  selected: string | null
  onSelect: (id: string) => void
  onOpen: (icon: DesktopIcon) => void
  offsets: Record<string, { x: number; y: number }>
  onMove: (id: string, pos: { x: number; y: number }) => void
  viewportH: number
}) {
  const gesture = useOpenGesture()
  const dragged = useRef(false)
  const CELL_W = 84
  const CELL_H = 78
  const rows = Math.max(1, Math.floor((viewportH - TASKBAR - 8) / CELL_H))

  const startDrag = (e: React.PointerEvent<HTMLButtonElement>, id: string, origin: { x: number; y: number }) => {
    if (e.button !== 0 || e.pointerType === 'touch' || window.matchMedia('(max-width: 640px)').matches) return
    const el = e.currentTarget
    const sx = e.clientX
    const sy = e.clientY
    dragged.current = false
    let pos = origin
    const move = (ev: PointerEvent) => {
      const dx = ev.clientX - sx
      const dy = ev.clientY - sy
      if (!dragged.current && Math.hypot(dx, dy) < 5) return
      dragged.current = true
      pos = { x: Math.max(0, Math.min(window.innerWidth - CELL_W, origin.x + dx)), y: Math.max(0, Math.min(window.innerHeight - TASKBAR - CELL_H, origin.y + dy)) }
      el.style.left = `${pos.x}px`
      el.style.top = `${pos.y}px`
    }
    const up = () => {
      window.removeEventListener('pointermove', move)
      window.removeEventListener('pointerup', up)
      if (dragged.current) {
        const snapped = { x: Math.round(pos.x / 12) * 12, y: Math.round(pos.y / 12) * 12 }
        onMove(id, snapped)
        el.style.left = `${snapped.x}px`
        el.style.top = `${snapped.y}px`
      }
    }
    window.addEventListener('pointermove', move)
    window.addEventListener('pointerup', up)
  }

  return (
    <ul className="desktop-icons" aria-label="Desktop icons">
      {icons.map((icon, i) => {
        const base = { x: 6 + Math.floor(i / rows) * CELL_W, y: 6 + (i % rows) * CELL_H }
        const pos = offsets[icon.id] ?? base
        const handlers = gesture(
          () => onSelect(icon.id),
          () => onOpen(icon),
        )
        return (
          <li key={icon.id}>
            <button
              type="button"
              className={`desktop-icon ${selected === icon.id ? 'is-selected' : ''}`}
              style={{ left: pos.x, top: pos.y }}
              {...handlers}
              onPointerDown={(e) => {
                handlers.onPointerDown(e)
                startDrag(e, icon.id, pos)
              }}
              onClick={(e) => {
                if (dragged.current) {
                  dragged.current = false
                  e.stopPropagation()
                  return
                }
                handlers.onClick(e)
              }}
              onKeyDown={(e) => e.key === 'Enter' && onOpen(icon)}
            >
              <OsIcon name={icon.icon} size={32} />
              <span>{icon.label}</span>
            </button>
          </li>
        )
      })}
    </ul>
  )
}
