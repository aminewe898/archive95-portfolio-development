'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { profile, projectPath, projects, type Lang } from '@/lib/content'
const AboutApp = dynamic(() => import('./apps/about').then(m => m.AboutApp))
const MailApp = dynamic(() => import('./apps/mail').then(m => m.MailApp))
const Minesweeper = dynamic(() => import('./apps/minesweeper').then(m => m.Minesweeper))
const SnakeGame = dynamic(() => import('./apps/snake').then(m => m.SnakeGame))
const NotepadApp = dynamic(() => import('./apps/notepad').then(m => m.NotepadApp))
const ProjectViewer = dynamic(() => import('./apps/project').then(m => m.ProjectViewer))
import { ProjectsExplorer, RecycleBin } from './apps/explorer'
const ResumeApp = dynamic(() => import('./apps/resume').then(m => m.ResumeApp))
const SkillsApp = dynamic(() => import('./apps/skills').then(m => m.SkillsApp))
import { DisplayProperties, MessageBox, RunDialog, ShutdownDialog, wallpaperOptions } from './apps/system-dialogs'
const TerminalApp = dynamic(() => import('./apps/terminal').then(m => m.TerminalApp))
const InternetApp = dynamic(() => import('./apps/internet').then(m => m.InternetApp))
const PaintApp = dynamic(() => import('./apps/paint').then(m => m.PaintApp))
const CalculatorApp = dynamic(() => import('./apps/calculator').then(m => m.CalculatorApp))
const TaskManager = dynamic(() => import('./apps/task-manager').then(m => m.TaskManager))
import { WelcomeApp } from './apps/welcome'
import { BootScreen, OffScreen, Screensaver } from './boot'
import { OsIcon, type IconName } from './icons'
import { OsContext, windowId, type AppId, type MessageSpec, type OsApi, type OsWindow, type Wallpaper } from './os-context'
import { projectAppName, projectIcon } from './programs'
import { playSound, type SoundName } from './sound'
import { Taskbar, type ArrangeKind } from './taskbar'
import { useOpenGesture } from './use-open-gesture'
import { WindowFrame as WindowFrameLazy } from './window-frame'

import { readPreference, writePreference } from './storage'
import dynamic from 'next/dynamic'
import { PortfolioDocument } from '../portfolio-document'
import { documentPath, parseDocumentRoute, type DocumentRoute } from '@/lib/navigation'
import { syncDocumentMetadata } from './document-metadata'

const TASKBAR = 30
const IDLE_MS = 120_000

const sizes: Record<AppId, [number, number]> = {
  welcome: [660, 490],
  about: [470, 430],
  projects: [580, 390],
  project: [900, 720],
  resume: [660, 560],
  mail: [540, 440],
  terminal: [620, 390],
  mines: [196, 292],
  snake: [360, 610],
  notepad: [500, 400],
  recycle: [500, 330],
  skills: [560, 440],
  display: [400, 430],
  run: [390, 196],
  shutdown: [370, 206],
  message: [400, 170],
  ie: [760, 540],
  paint: [740, 560],
  calc: [262, 262],
  taskman: [380, 320],
}

const dialogs = new Set<AppId>(['run', 'shutdown', 'message', 'display', 'about', 'taskman'])
const fixedSize = new Set<AppId>([...dialogs, 'mines', 'snake', 'welcome', 'calc'])
const singletons = new Set<AppId>(['project', 'mail', 'ie'])

const rectOf = (selector: string) => document.querySelector(selector)?.getBoundingClientRect()
const windowRect = (id: string) => rectOf(`[data-win-id="${CSS.escape(id)}"]`)
const taskRect = (id: string) => rectOf(`[data-task-id="${CSS.escape(id)}"]`)

// Windows 95 draws a title bar flying between a window and its taskbar button.
function zoomTitle(from: DOMRect | undefined, to: DOMRect | undefined) {
  if (!from || !to || !from.width || !to.width || window.matchMedia('(prefers-reduced-motion: reduce), (max-width: 640px)').matches) return
  const el = document.createElement('div')
  el.className = 'zoom-title'
  document.querySelector('.os-root')?.append(el)
  const frame = (r: DOMRect) => ({ left: `${r.left}px`, top: `${r.top}px`, width: `${r.width}px` })
  const animation = el.animate([frame(from), frame(to)], { duration: 220, easing: 'steps(8)' })
  animation.onfinish = animation.oncancel = () => el.remove()
}

type DesktopIcon = { id: string; label: string; icon: IconName; app: AppId; arg?: string }

type ContextMenuState = { x: number; y: number } | null

export function Desktop({ lang: initialLang, initial }: { lang: Lang; initial?: { app: AppId; arg?: string } }) {
  const [lang, setLangState] = useState<Lang>(initialLang)
  const [route, setRoute] = useState<DocumentRoute>({ lang: initialLang, ...(initial?.app === 'project' ? { slug: initial.arg } : {}), ...(initial?.app === 'resume' ? { cv: true } : {}) })
  const routeRef = useRef(route)
  routeRef.current = route
  const launchers = useRef(new Map<string, HTMLElement>())
  const [windows, setWindows] = useState<OsWindow[]>(() => {
    const app = initial?.app ?? 'welcome'
    const [w, h] = sizes[app]
    return [{ id: singletons.has(app) ? app : windowId(app, initial?.arg), app, arg: initial?.arg, x: 120, y: 30, w, h, z: 10, minimized: false, maximized: false }]
  })
  const navigate = useCallback((next: DocumentRoute) => {
    const target = documentPath(next)
    if (window.location.pathname + window.location.search !== target) window.history.pushState(null, '', target + (window.location.hash === '#portfolio-document' ? window.location.hash : ''))
    routeRef.current = next
    setRoute(next)
    setLangState(next.lang)
  }, [])
  const [wallpaper, setWallpaperState] = useState<Wallpaper>('teal')
  const [customWallpaper, setCustomWallpaperState] = useState<string | null>(null)
  const [soundOn, setSoundOnState] = useState(false)
  const [volume, setVolumeState] = useState(0.5)
  const volumeRef = useRef(volume)
  volumeRef.current = volume
  const setVolume = useCallback((value: number) => {
    const next = Math.max(0, Math.min(1, value))
    setVolumeState(next)
    writePreference('a95-volume', String(next))
  }, [])
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
  const play = useCallback((name: SoundName) => soundRef.current && playSound(name, volumeRef.current), [])

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
        const W = window.innerWidth || 1024
        const H = (window.innerHeight || 768) - TASKBAR
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
      const id = singletons.has(app) ? app : windowId(app, arg)
      if (document.activeElement instanceof HTMLElement && !launchers.current.has(id)) launchers.current.set(id, document.activeElement)
      if (app === 'project' || app === 'resume') navigate({ lang: routeRef.current.lang, ...(app === 'project' ? { slug: arg } : { cv: true }) })
      play('open')
      spawn(app, arg)
      setMenu(null)
    },
    [play, spawn, navigate],
  )

  const close = useCallback((id: string) => {
    setWindows(list => list.filter(w => w.id !== id))
    if (id === 'project' || id === 'resume') navigate({ lang: routeRef.current.lang })
    const launcher = launchers.current.get(id)
    launchers.current.delete(id)
    requestAnimationFrame(() => {
      if (launcher?.isConnected && !launcher.closest('[inert]')) launcher.focus()
      else document.querySelector<HTMLElement>('.os-window:not([inert]):not([style*="display: none"])')?.focus()
    })
  }, [navigate])
  const patch = useCallback((id: string, p: Partial<OsWindow>) => setWindows((list) => list.map((w) => (w.id === id ? { ...w, ...p } : w))), [])

  const minimize = useCallback((id: string) => {
    zoomTitle(windowRect(id), taskRect(id))
    patch(id, { minimized: true })
  }, [patch])

  const arrange = useCallback((kind: ArrangeKind) => setWindows((list) => {
    if (kind === 'minimize') return list.map((w) => ({ ...w, minimized: true }))
    const W = window.innerWidth
    const H = window.innerHeight - TASKBAR
    const shown = list.filter((w) => !w.minimized && !dialogs.has(w.app)).sort((a, b) => a.z - b.z)
    if (!shown.length || W <= 640) return list
    return list.map((w) => {
      const i = shown.indexOf(w)
      if (i < 0) return w
      const fixed = fixedSize.has(w.app)
      if (kind === 'cascade') return { ...w, maximized: false, x: 8 + i * 24, y: 8 + i * 24, ...(fixed ? {} : { w: Math.min(w.w, Math.round(W * 0.72)), h: Math.min(w.h, Math.round(H * 0.72)) }) }
      const across = kind === 'tile-v'
      const cell = Math.floor((across ? W : H) / shown.length)
      const place = across ? { x: i * cell, y: 0 } : { x: 0, y: i * cell }
      return { ...w, maximized: false, ...place, ...(fixed ? {} : across ? { w: cell, h: H } : { w: W, h: cell }) }
    })
  }), [])

  const message = useCallback(
    (spec: MessageSpec) => {
      play(spec.kind === 'warning' ? 'error' : 'ding')
      spawn('message', undefined, spec)
    },
    [play, spawn],
  )

  const setLang = useCallback((next: Lang) => {
    navigate({ ...routeRef.current, lang: next })
  }, [navigate])

  const setWallpaper = useCallback((w: Wallpaper) => {
    setWallpaperState(w)
    writePreference('a95-wallpaper', w)
  }, [])

  // A picture from Paint lasts for this visit only; it is not stored.
  const setCustomWallpaper = useCallback((image: string) => {
    setCustomWallpaperState(image)
    setWallpaperState('custom')
  }, [])

  const setSoundOn = useCallback((on: boolean) => {
    setSoundOnState(on)
    writePreference('a95-sound', on ? 'on' : 'off')
  }, [])

  const openWelcome = useCallback(() => {
    if (readPreference('a95-welcome') !== 'off') spawn('welcome')
  }, [spawn])

  const power = useCallback((mode: 'off' | 'restart') => {
    setWindows([])
    setPhase(mode === 'off' ? 'off' : 'boot')
  }, [])

  const finishBoot = useCallback(() => {
    writePreference('a95-booted', '1', true)
    setPhase('desktop')
    play('chord')
    openWelcome()
  }, [openWelcome, play])

  useEffect(() => {
    const storedWall = readPreference('a95-wallpaper') as Wallpaper | null
    if (storedWall && wallpaperOptions.some((o) => o.id === storedWall)) setWallpaperState(storedWall)
    setSoundOnState(readPreference('a95-sound') === 'on')
    const storedVolume = readPreference('a95-volume')
    if (storedVolume !== null && Number.isFinite(Number(storedVolume))) setVolumeState(Math.max(0, Math.min(1, Number(storedVolume))))
    setViewportH(window.innerHeight)
    const onResize = () => {
      setViewportH(window.innerHeight)
      if (window.innerWidth <= 640) return // also covers a hidden, zero-size viewport
      setWindows(list => list.map(w => {
        const width = Math.min(w.w, window.innerWidth - 8)
        const height = Math.min(w.h, window.innerHeight - TASKBAR - 8)
        return {...w, w: width, h: height, x: Math.max(4, Math.min(w.x, window.innerWidth - width - 4)), y: Math.max(4, Math.min(w.y, window.innerHeight - TASKBAR - height - 4))}
      }))
    }
    window.addEventListener('resize', onResize)

    if (!initial && readPreference('a95-welcome') === 'off') setWindows([])
    onResize()
    return () => window.removeEventListener('resize', onResize)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (phase !== 'desktop' || window.matchMedia('(prefers-reduced-motion: reduce)').matches || readPreference('a95-screensaver') === 'off') return
    let timer = window.setTimeout(() => setSaver(true), IDLE_MS)
    const reset = () => {
      window.clearTimeout(timer)
      if (!document.hidden && readPreference('a95-screensaver') !== 'off') timer = window.setTimeout(() => setSaver(true), IDLE_MS)
    }
    const events = ['pointermove', 'pointerdown', 'keydown', 'wheel'] as const
    events.forEach((e) => window.addEventListener(e, reset, { passive: true }))
    document.addEventListener('visibilitychange', reset)
    return () => {
      window.clearTimeout(timer)
      events.forEach((e) => window.removeEventListener(e, reset))
      document.removeEventListener('visibilitychange', reset)
    }
  }, [phase])

  useEffect(() => { syncDocumentMetadata(route) }, [route])

  useEffect(() => {
    const restore = () => {
      const next = parseDocumentRoute(window.location.pathname, window.location.search)
      if (documentPath(next) === documentPath(routeRef.current)) return
      routeRef.current = next
      setRoute(next)
      setLangState(next.lang)
      setWindows(list => list.map(w => w.app === 'project' || w.app === 'resume' ? { ...w, minimized: true } : w))
      if (next.slug) spawn('project', next.slug)
      else if (next.cv) spawn('resume')
    }
    window.addEventListener('popstate', restore)
    return () => window.removeEventListener('popstate', restore)
  }, [spawn])

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

  useEffect(() => {
    const shortcut = (event: KeyboardEvent) => {
      if (phase !== 'desktop' || saver || event.repeat || event.ctrlKey || event.metaKey) return
      const target = event.target as HTMLElement
      if (target.closest('input, textarea, select, [contenteditable="true"]')) return
      if (event.key === 'F1') { event.preventDefault(); open('welcome') }
      if (event.altKey && event.code === 'KeyP') { event.preventDefault(); open('projects') }
      if (event.altKey && event.code === 'KeyM') { event.preventDefault(); setSoundOn(!soundRef.current) }
    }
    window.addEventListener('keydown', shortcut)
    return () => window.removeEventListener('keydown', shortcut)
  }, [open, phase, saver, setSoundOn])

  const api: OsApi = useMemo(
    () => ({
      lang,
      t,
      open,
      close,
      message,
      wallpaper,
      setWallpaper,
      setCustomWallpaper,
      volume,
      setVolume,
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
    [lang, t, open, close, message, wallpaper, setWallpaper, setCustomWallpaper, volume, setVolume, soundOn, setSoundOn, play, setLang, power, recycleEmptied],
  )

  const icons: DesktopIcon[] = [
    { id: 'about', label: t('Mi PC', 'My Computer'), icon: 'computer', app: 'about' },
    { id: 'projects', label: t('Proyectos', 'Projects'), icon: 'folder', app: 'projects' },
    { id: 'ie', label: 'Internet Explorer', icon: 'ie', app: 'ie' },
    { id: 'relay', label: 'RELAY.EXE', icon: 'automation', app: 'project', arg: 'relay' },
    { id: 'resume', label: 'RESUME.DOC', icon: 'doc', app: 'resume' },
    { id: 'mail', label: t('Bandeja de entrada', 'Inbox'), icon: 'mail', app: 'mail' },
    { id: 'terminal', label: 'MS-DOS Prompt', icon: 'dos', app: 'terminal' },
    { id: 'readme', label: 'README.TXT', icon: 'notepad', app: 'notepad' },
    { id: 'skills', label: t('Panel de control', 'Control Panel'), icon: 'settings', app: 'skills' },
    { id: 'mines', label: t('Buscaminas', 'Minesweeper'), icon: 'mines', app: 'mines' },
    { id: 'snake', label: 'SNAKE.EXE', icon: 'snake', app: 'snake' },
    { id: 'paint', label: 'Paint', icon: 'paint', app: 'paint' },
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
        return { title: projectAppName(w.arg ?? ''), icon: projectIcon(w.arg ?? '') }
      }
      case 'resume':
        return { title: 'RESUME.DOC — WordPad', icon: 'doc' }
      case 'mail':
        return { title: `${t('Mensaje nuevo', 'New Message')} — Outlook Express`, icon: 'mail' }
      case 'terminal':
        return { title: 'MS-DOS Prompt', icon: 'dos' }
      case 'mines':
        return { title: t('Buscaminas', 'Minesweeper'), icon: 'mines' }
      case 'snake':
        return { title: 'Snake', icon: 'snake' }
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
      case 'ie':
        return { title: 'Internet Explorer', icon: 'ie' }
      case 'paint':
        return { title: t('Sin título — Paint', 'untitled — Paint'), icon: 'paint' }
      case 'calc':
        return { title: t('Calculadora', 'Calculator'), icon: 'calc' }
      case 'taskman':
        return { title: t('Cerrar programa', 'Close Program'), icon: 'taskman' }
    }
  }

  const ordered = [...windows].sort((a, b) => a.z - b.z)
  const tasks = windows.filter((w) => w.app !== 'message').map((w) => ({ win: w, ...meta(w) }))

  const renderApp = (w: OsWindow) => {
    switch (w.app) {
      case 'welcome':
        return <WelcomeApp winId={w.id} />
      case 'about':
        return <AboutApp winId={w.id} />
      case 'projects':
        return <ProjectsExplorer winId={w.id} />
      case 'project':
        return <ProjectViewer key={w.arg} slug={w.arg ?? 'relay'} winId={w.id} suspended={w.minimized || phase !== 'desktop' || saver} />
      case 'resume':
        return <ResumeApp winId={w.id} />
      case 'mail':
        return <MailApp topic={w.arg} winId={w.id} />
      case 'terminal':
        return <TerminalApp winId={w.id} />
      case 'mines':
        return <Minesweeper winId={w.id} />
      case 'snake':
        return <SnakeGame winId={w.id} suspended={w.minimized || w.id !== activeId || phase !== 'desktop' || saver} />
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
      case 'ie':
        return <InternetApp winId={w.id} url={w.arg} />
      case 'paint':
        return <PaintApp winId={w.id} />
      case 'calc':
        return <CalculatorApp />
      case 'taskman':
        return <TaskManager winId={w.id} tasks={tasks.map((task) => ({ id: task.win.id, title: task.title }))} onSwitch={focus} />
    }
  }


  return (
    <OsContext.Provider value={api}>
      <div className={`os-root wallpaper-${wallpaper}`} lang={lang} style={wallpaper === 'custom' && customWallpaper ? { backgroundImage: `url(${customWallpaper})` } : undefined}>
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
          id="desktop"
          tabIndex={-1}
          className="desktop"
          aria-label={t('Escritorio', 'Desktop')}
          onPointerDown={(e) => {
            if (e.target === e.currentTarget) setSelectedIcon(null)
          }}
          onContextMenu={(e) => {
            if ((e.target as HTMLElement).closest('.os-window')) return
            e.preventDefault()
            setMenu({ x: Math.max(4, Math.min(e.clientX, window.innerWidth - 210)), y: Math.max(4, Math.min(e.clientY, window.innerHeight - TASKBAR - 270)) })
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
                blocked={phase !== 'desktop' || saver || (topWindow?.app === 'message' || topWindow?.app === 'shutdown') && w.id !== activeId}
                resizable={!fixedSize.has(w.app)}
                dialog={dialogs.has(w.app)}
                onFocus={() => focus(w.id)}
                onMinimize={() => minimize(w.id)}
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
            if (w.id === activeId && !w.minimized) minimize(id)
            else {
              if (w.minimized) zoomTitle(taskRect(id), w.maximized ? new DOMRect(0, 0, window.innerWidth, 20) : new DOMRect(w.x, w.y, w.w, 20))
              focus(id)
            }
          }}
          onArrange={arrange}
          onMinimize={minimize}
        />

        {phase === 'boot' && <BootScreen lang={lang} onDone={finishBoot} />}
        {phase === 'off' && <OffScreen lang={lang} onWake={() => setPhase('boot')} />}
        {saver && phase === 'desktop' && <Screensaver onExit={() => setSaver(false)} />}
      </div>
      <PortfolioDocument lang={route.lang} slug={route.slug} cv={route.cv} />
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
