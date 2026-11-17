'use client'

import { useEffect, useState } from 'react'

// Windows 95 tooltips: a small pop-up shown after a short time-out at the lower right of the
// pointer, removed on a click or when the pointer leaves. Any `title` inside the desktop is
// adopted as `data-tip`, so the browser's own tooltip never appears on top of this one.
export function Tooltips() {
  const [tip, setTip] = useState<{ text: string; x: number; y: number } | null>(null)

  useEffect(() => {
    let timer = 0
    let current: HTMLElement | null = null
    let x = 0
    let y = 0
    const hide = () => {
      window.clearTimeout(timer)
      current = null
      setTip(null)
    }
    const track = (e: PointerEvent) => { x = e.clientX; y = e.clientY }
    const over = (e: PointerEvent) => {
      track(e)
      if (e.pointerType === 'touch') return
      const el = (e.target as HTMLElement).closest?.<HTMLElement>('[data-tip], [title]') ?? null
      if (el === current) return
      hide()
      if (!el || !el.closest('.os-root')) return
      const title = el.getAttribute('title')
      if (title) {
        el.dataset.tip = title
        el.removeAttribute('title')
      }
      const text = el.dataset.tip
      if (!text) return
      current = el
      timer = window.setTimeout(() => setTip({ text, x: Math.max(2, Math.min(x + 12, window.innerWidth - 240)), y: Math.min(y + 20, window.innerHeight - 52) }), 600)
    }
    window.addEventListener('pointerover', over)
    window.addEventListener('pointermove', track)
    window.addEventListener('pointerdown', hide)
    window.addEventListener('keydown', hide)
    window.addEventListener('blur', hide)
    return () => {
      window.clearTimeout(timer)
      window.removeEventListener('pointerover', over)
      window.removeEventListener('pointermove', track)
      window.removeEventListener('pointerdown', hide)
      window.removeEventListener('keydown', hide)
      window.removeEventListener('blur', hide)
    }
  }, [])

  return tip ? <div className="os-tooltip" role="tooltip" style={{ left: tip.x, top: tip.y }}>{tip.text}</div> : null
}
