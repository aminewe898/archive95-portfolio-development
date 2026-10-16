'use client'

import { useEffect, useRef, useState } from 'react'
import type { Lang } from '@/lib/content'

const biosLines = (lang: Lang) => [
  'Archive95 Modular BIOS v4.51PG, An Energy Star Ally',
  'Copyright (C) 2026, Mohamed Amine Aslimani',
  '',
  'Main Processor : Curiosity-486DX 66MHz',
  'Memory Testing : 65536K OK',
  '',
  'Detecting IDE Primary Master ... RELAY.EXE',
  'Detecting IDE Primary Slave  ... LOCAL_AI_SERVER',
  'Detecting IDE Second Master  ... HOMELAB_CLOUD',
  'Detecting IDE Second Slave   ... RASPBERRY_PI_NAS',
  '',
  lang === 'es' ? 'Iniciando Archive95…' : 'Starting Archive95…',
]

export function BootScreen({ lang, onDone }: { lang: Lang; onDone: () => void }) {
  const lines = biosLines(lang)
  const [count, setCount] = useState(0)
  const [splash, setSplash] = useState(false)
  const done = useRef(false)

  useEffect(() => {
    const finish = () => {
      if (done.current) return
      done.current = true
      onDone()
    }
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const step = reduced ? 30 : 110
    const timers = lines.map((_, i) => window.setTimeout(() => setCount(i + 1), step * (i + 1)))
    const splashAt = step * (lines.length + 2)
    timers.push(window.setTimeout(() => setSplash(true), splashAt))
    timers.push(window.setTimeout(finish, splashAt + (reduced ? 600 : 2200)))
    const skip = (e: Event) => {
      if (e instanceof KeyboardEvent && e.key === 'Tab') return
      finish()
    }
    window.addEventListener('keydown', skip)
    window.addEventListener('pointerdown', skip)
    return () => {
      timers.forEach(window.clearTimeout)
      window.removeEventListener('keydown', skip)
      window.removeEventListener('pointerdown', skip)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  if (splash)
    return (
      <div className="boot-splash" role="status" aria-label="Archive95">
        <div className="splash-logo">
          <span className="splash-flag" aria-hidden="true">
            <i />
            <i />
            <i />
            <i />
          </span>
          <p>
            <span className="splash-small">Mohamed Amine Aslimani</span>
            <b>Archive</b>
            <span className="splash-95">95</span>
          </p>
        </div>
        <div className="splash-bar" aria-hidden="true" />
        <p className="boot-hint">{lang === 'es' ? 'Pulsa cualquier tecla para omitir' : 'Press any key to skip'}</p>
      </div>
    )

  return (
    <div className="boot-bios" role="status" aria-live="polite">
      <pre>
        {lines.slice(0, count).join('\n')}
        <span className="cursor">_</span>
      </pre>
      <p className="boot-hint">{lang === 'es' ? 'Pulsa cualquier tecla para omitir' : 'Press any key to skip'}</p>
    </div>
  )
}

export function OffScreen({ lang, onWake }: { lang: Lang; onWake: () => void }) {
  return (
    <button type="button" className="off-screen" onClick={onWake} autoFocus>
      <span>{lang === 'es' ? 'Ya puede apagar el equipo con seguridad.' : "It's now safe to turn off your computer."}</span>
      <small>{lang === 'es' ? 'Haz clic para volver a encender' : 'Click to power on again'}</small>
    </button>
  )
}

export function Screensaver({ onExit }: { onExit: () => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    const ctx = canvas?.getContext('2d')
    if (!canvas || !ctx) return
    let frame = 0
    const resize = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
    }
    resize()
    const stars = Array.from({ length: 260 }, () => ({ x: Math.random() * 2 - 1, y: Math.random() * 2 - 1, z: Math.random() }))
    const draw = () => {
      const { width: w, height: h } = canvas
      ctx.fillStyle = '#000'
      ctx.fillRect(0, 0, w, h)
      for (const s of stars) {
        s.z -= 0.006
        if (s.z <= 0.01) {
          s.x = Math.random() * 2 - 1
          s.y = Math.random() * 2 - 1
          s.z = 1
        }
        const px = (s.x / s.z) * (w / 2) + w / 2
        const py = (s.y / s.z) * (h / 2) + h / 2
        const size = Math.max(1, (1 - s.z) * 3)
        const shade = Math.floor((1 - s.z) * 255)
        ctx.fillStyle = `rgb(${shade},${shade},${shade})`
        ctx.fillRect(px, py, size, size)
      }
      frame = requestAnimationFrame(draw)
    }
    draw()
    let origin: { x: number; y: number } | null = null
    const move = (e: PointerEvent) => {
      if (!origin) origin = { x: e.clientX, y: e.clientY }
      else if (Math.hypot(e.clientX - origin.x, e.clientY - origin.y) > 6) onExit()
    }
    const leave = () => onExit()
    const start = window.setTimeout(() => {
      window.addEventListener('pointermove', move)
      window.addEventListener('pointerdown', leave)
      window.addEventListener('keydown', leave)
    }, 400)
    window.addEventListener('resize', resize)
    return () => {
      cancelAnimationFrame(frame)
      window.clearTimeout(start)
      window.removeEventListener('pointermove', move)
      window.removeEventListener('pointerdown', leave)
      window.removeEventListener('keydown', leave)
      window.removeEventListener('resize', resize)
    }
  }, [onExit])

  return <canvas ref={canvasRef} className="screensaver" aria-label="Screen saver" role="img" />
}
