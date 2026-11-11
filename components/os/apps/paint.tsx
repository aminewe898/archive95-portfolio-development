'use client'

import { useEffect, useRef, useState } from 'react'
import { MenuBar } from '../menu-bar'
import { useOs } from '../os-context'

const W = 640
const H = 400
const COLORS = ['#000000', '#808080', '#800000', '#808000', '#008000', '#008080', '#000080', '#800080', '#808040', '#004040', '#0080ff', '#004080', '#4000ff', '#804000', '#ffffff', '#c0c0c0', '#ff0000', '#ffff00', '#00ff00', '#00ffff', '#0000ff', '#ff00ff', '#ffff80', '#00ff80', '#80ffff', '#8080ff', '#ff0080', '#ff8040']
const SIZES = [1, 3, 5, 8]

type Tool = 'pencil' | 'brush' | 'eraser' | 'line' | 'rect' | 'ellipse' | 'fill'
type Point = { x: number; y: number }

const toolIcons: Record<Tool, React.ReactNode> = {
  pencil: <path d="M2 14l1-4 8-8 3 3-8 8z" fill="#ffff80" stroke="#000" />,
  brush: <><path d="M9 2l5 5-5 5-3-3z" fill="#c0c0c0" stroke="#000" /><path d="M5 10l2 2c-1 2-3 2-5 2 1-1 1-3 3-4z" fill="#000" /></>,
  eraser: <path d="M6 3h8l-4 9H2z" fill="#ffc0c0" stroke="#000" />,
  line: <path d="M2 14L14 2" stroke="#000" strokeWidth="2" />,
  rect: <rect x="2" y="4" width="12" height="8" fill="none" stroke="#000" strokeWidth="1.5" />,
  ellipse: <ellipse cx="8" cy="8" rx="6" ry="4" fill="none" stroke="#000" strokeWidth="1.5" />,
  fill: <><path d="M3 8l5-5 5 5-5 5z" fill="#c0c0c0" stroke="#000" /><path d="M13 9c1 2 2 3 2 4a2 2 0 01-4 0c0-1 1-2 2-4z" fill="#0000ff" /></>,
}

export function PaintApp({ winId }: { winId: string }) {
  const { t, close, message, setCustomWallpaper } = useOs()
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [tool, setTool] = useState<Tool>('pencil')
  const [size, setSize] = useState(3)
  const [fg, setFg] = useState('#000000')
  const [bg, setBg] = useState('#ffffff')
  const [cursor, setCursor] = useState<Point | null>(null)
  const [canUndo, setCanUndo] = useState(false)
  const undo = useRef<ImageData[]>([])
  const stroke = useRef<{ start: Point; last: Point; snapshot: ImageData; color: string } | null>(null)

  const tools: [Tool, string][] = [
    ['pencil', t('Lápiz', 'Pencil')],
    ['brush', t('Pincel', 'Brush')],
    ['eraser', t('Goma', 'Eraser')],
    ['fill', t('Relleno', 'Fill')],
    ['line', t('Línea', 'Line')],
    ['rect', t('Rectángulo', 'Rectangle')],
    ['ellipse', t('Elipse', 'Ellipse')],
  ]

  const context = () => canvasRef.current?.getContext('2d', { willReadFrequently: true }) ?? null

  useEffect(() => {
    const ctx = context()
    if (!ctx) return
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, W, H)
  }, [])

  const remember = () => {
    const ctx = context()
    if (!ctx) return
    undo.current = [...undo.current.slice(-11), ctx.getImageData(0, 0, W, H)]
    setCanUndo(true)
  }
  const undoLast = () => {
    const ctx = context()
    const image = undo.current.pop()
    if (ctx && image) ctx.putImageData(image, 0, 0)
    setCanUndo(undo.current.length > 0)
  }
  const clear = () => {
    const ctx = context()
    if (!ctx) return
    remember()
    ctx.fillStyle = bg
    ctx.fillRect(0, 0, W, H)
  }

  const point = (e: React.PointerEvent<HTMLCanvasElement>): Point => {
    const r = e.currentTarget.getBoundingClientRect()
    return { x: Math.max(0, Math.min(W - 1, Math.floor(((e.clientX - r.left) * W) / r.width))), y: Math.max(0, Math.min(H - 1, Math.floor(((e.clientY - r.top) * H) / r.height))) }
  }

  const flood = (ctx: CanvasRenderingContext2D, at: Point, color: string) => {
    const image = ctx.getImageData(0, 0, W, H)
    const data = image.data
    const n = parseInt(color.slice(1), 16)
    const fill = [n >> 16, (n >> 8) & 255, n & 255]
    const i0 = (at.y * W + at.x) * 4
    const target = [data[i0], data[i0 + 1], data[i0 + 2]]
    if (target.every((v, i) => v === fill[i])) return
    const pending = [at.y * W + at.x]
    while (pending.length) {
      const p = pending.pop()!
      const i = p * 4
      if (data[i] !== target[0] || data[i + 1] !== target[1] || data[i + 2] !== target[2]) continue
      data[i] = fill[0]; data[i + 1] = fill[1]; data[i + 2] = fill[2]; data[i + 3] = 255
      const x = p % W
      if (x > 0) pending.push(p - 1)
      if (x < W - 1) pending.push(p + 1)
      if (p >= W) pending.push(p - W)
      if (p < W * (H - 1)) pending.push(p + W)
    }
    ctx.putImageData(image, 0, 0)
  }

  const segment = (ctx: CanvasRenderingContext2D, a: Point, b: Point, color: string) => {
    ctx.strokeStyle = color
    ctx.lineCap = tool === 'eraser' ? 'square' : 'round'
    ctx.lineJoin = 'round'
    ctx.lineWidth = tool === 'pencil' ? 1 : tool === 'eraser' ? size * 3 : size
    ctx.beginPath()
    ctx.moveTo(a.x + 0.5, a.y + 0.5)
    ctx.lineTo(b.x + 0.5, b.y + 0.5)
    ctx.stroke()
  }

  const down = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (e.button !== 0 && e.button !== 2) return
    const ctx = context()
    if (!ctx) return
    e.preventDefault()
    const p = point(e)
    const color = tool === 'eraser' ? bg : e.button === 2 ? bg : fg
    remember()
    if (tool === 'fill') return flood(ctx, p, color)
    e.currentTarget.setPointerCapture(e.pointerId)
    stroke.current = { start: p, last: p, snapshot: ctx.getImageData(0, 0, W, H), color }
    if (tool === 'pencil' || tool === 'brush' || tool === 'eraser') segment(ctx, p, p, color)
  }
  const move = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const p = point(e)
    setCursor(p)
    const s = stroke.current
    const ctx = context()
    if (!s || !ctx) return
    if (tool === 'pencil' || tool === 'brush' || tool === 'eraser') {
      segment(ctx, s.last, p, s.color)
      s.last = p
      return
    }
    ctx.putImageData(s.snapshot, 0, 0)
    ctx.strokeStyle = s.color
    ctx.lineWidth = size
    ctx.lineCap = 'round'
    ctx.beginPath()
    if (tool === 'line') { ctx.moveTo(s.start.x + 0.5, s.start.y + 0.5); ctx.lineTo(p.x + 0.5, p.y + 0.5) }
    else if (tool === 'rect') ctx.rect(Math.min(s.start.x, p.x) + 0.5, Math.min(s.start.y, p.y) + 0.5, Math.abs(p.x - s.start.x), Math.abs(p.y - s.start.y))
    else ctx.ellipse((s.start.x + p.x) / 2, (s.start.y + p.y) / 2, Math.abs(p.x - s.start.x) / 2, Math.abs(p.y - s.start.y) / 2, 0, 0, Math.PI * 2)
    ctx.stroke()
  }
  const up = () => { stroke.current = null }

  const save = () => {
    canvasRef.current?.toBlob((blob) => {
      if (!blob) return
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = 'UNTITLED.PNG'
      document.body.append(link)
      link.click()
      link.remove()
      window.setTimeout(() => URL.revokeObjectURL(url), 1000)
    }, 'image/png')
  }
  const asWallpaper = () => {
    const canvas = canvasRef.current
    if (canvas) setCustomWallpaper(canvas.toDataURL('image/png'))
  }

  return (
    <div className="app-layout paint" onKeyDown={(e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') { e.preventDefault(); undoLast() }
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') { e.preventDefault(); save() }
    }}>
      <MenuBar
        menus={[
          {
            label: t('Archivo', 'File'),
            items: [
              { label: t('Nuevo', 'New'), onSelect: clear },
              { label: t('Guardar como PNG…', 'Save as PNG…'), shortcut: 'Ctrl+S', onSelect: save },
              { label: t('Establecer como papel tapiz', 'Set as Wallpaper'), onSelect: asWallpaper },
              'separator',
              { label: t('Salir', 'Exit'), onSelect: () => close(winId) },
            ],
          },
          { label: t('Edición', 'Edit'), items: [{ label: t('Deshacer', 'Undo'), shortcut: 'Ctrl+Z', disabled: !canUndo, onSelect: undoLast }, { label: t('Borrar imagen', 'Clear Image'), onSelect: clear }] },
          { label: t('Ayuda', 'Help'), items: [{ label: t('Acerca de Paint', 'About Paint'), onSelect: () => message({ title: 'Paint', text: t('Archive95 Paint\nClic izquierdo pinta con el color principal; clic derecho, con el de fondo.', 'Archive95 Paint\nLeft click paints with the foreground colour; right click with the background colour.'), kind: 'info' }) }] },
        ]}
      />
      <div className="paint-main">
        <div className="paint-tools" role="toolbar" aria-label={t('Herramientas', 'Tools')}>
          {tools.map(([id, label]) => (
            <button key={id} type="button" className={tool === id ? 'is-pressed' : ''} aria-pressed={tool === id} aria-label={label} title={label} onClick={() => setTool(id)}>
              <svg viewBox="0 0 16 16" width="16" height="16" aria-hidden="true">{toolIcons[id]}</svg>
            </button>
          ))}
          <div className="paint-sizes" role="group" aria-label={t('Grosor', 'Line width')}>
            {SIZES.map((s) => (
              <button key={s} type="button" className={size === s ? 'is-pressed' : ''} aria-pressed={size === s} aria-label={`${t('Grosor', 'Width')} ${s}`} title={`${s}px`} onClick={() => setSize(s)}>
                <span style={{ height: s }} />
              </button>
            ))}
          </div>
        </div>
        <div className="paint-area sunken-panel">
          <canvas
            ref={canvasRef}
            width={W}
            height={H}
            className="paint-canvas"
            role="img"
            aria-label={t('Lienzo de dibujo', 'Drawing canvas')}
            onPointerDown={down}
            onPointerMove={move}
            onPointerUp={up}
            onPointerCancel={up}
            onPointerLeave={() => setCursor(null)}
            onContextMenu={(e) => e.preventDefault()}
          />
        </div>
      </div>
      <div className="paint-palette">
        <div className="paint-current" title={t('Principal / fondo', 'Foreground / background')}>
          <span style={{ background: bg }} />
          <span style={{ background: fg }} />
        </div>
        <div className="paint-colors" role="group" aria-label={t('Colores', 'Colours')}>
          {COLORS.map((c) => (
            <button key={c} type="button" aria-label={`${t('Color', 'Colour')} ${c}`} aria-pressed={fg === c} title={c} style={{ background: c }} onClick={() => setFg(c)} onContextMenu={(e) => { e.preventDefault(); setBg(c) }} />
          ))}
        </div>
      </div>
      <div className="status-bar">
        <p className="status-bar-field status-grow">{t('Clic izquierdo: color principal · Clic derecho: color de fondo', 'Left click: foreground colour · Right click: background colour')}</p>
        <p className="status-bar-field">{cursor ? `${cursor.x}, ${cursor.y}` : `${W} × ${H}`}</p>
      </div>
    </div>
  )
}
