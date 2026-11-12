'use client'

import { useEffect, useRef, useState } from 'react'
import { MenuBar } from '../menu-bar'
import { useOs } from '../os-context'

const W = 640
const H = 400
const COLORS = ['#000000', '#808080', '#800000', '#808000', '#008000', '#008080', '#000080', '#800080', '#808040', '#004040', '#0080ff', '#004080', '#4000ff', '#804000', '#ffffff', '#c0c0c0', '#ff0000', '#ffff00', '#00ff00', '#00ffff', '#0000ff', '#ff00ff', '#ffff80', '#00ff80', '#80ffff', '#8080ff', '#ff0080', '#ff8040']
const SIZES = [1, 3, 5, 8]

type Tool = 'eraser' | 'fill' | 'picker' | 'pencil' | 'brush' | 'airbrush' | 'line' | 'curve' | 'rect' | 'polygon' | 'ellipse' | 'roundrect'
type Point = { x: number; y: number }
type Stroke = { start: Point; last: Point; snapshot: ImageData; color: string }
const FREEHAND: Tool[] = ['pencil', 'brush', 'eraser']
const DRAGGED: Tool[] = ['line', 'rect', 'ellipse', 'roundrect']

const toolIcons: Record<Tool, React.ReactNode> = {
  eraser: <path d="M6 3h8l-4 9H2z" fill="#ffc0c0" stroke="#000" />,
  fill: <><path d="M3 8l5-5 5 5-5 5z" fill="#c0c0c0" stroke="#000" /><path d="M13 9c1 2 2 3 2 4a2 2 0 01-4 0c0-1 1-2 2-4z" fill="#0000ff" /></>,
  picker: <><path d="M10 2l4 4-2 2-4-4z" fill="#000" /><path d="M8 5l3 3-6 6H2v-3z" fill="#c0c0c0" stroke="#000" /></>,
  pencil: <path d="M2 14l1-4 8-8 3 3-8 8z" fill="#ffff80" stroke="#000" />,
  brush: <><path d="M9 2l5 5-5 5-3-3z" fill="#c0c0c0" stroke="#000" /><path d="M5 10l2 2c-1 2-3 2-5 2 1-1 1-3 3-4z" fill="#000" /></>,
  airbrush: <><path d="M9 6h5v8H9z" fill="#c0c0c0" stroke="#000" /><path d="M10 4h3v2h-3z" fill="#000" /><path d="M2 3h1v1H2zM5 2h1v1H5zM3 6h1v1H3zM6 5h1v1H6zM4 9h1v1H4zM1 8h1v1H1zM6 8h1v1H6z" fill="#000" /></>,
  line: <path d="M2 14L14 2" stroke="#000" strokeWidth="2" />,
  curve: <path d="M2 13C5 1 10 15 14 3" fill="none" stroke="#000" strokeWidth="1.5" />,
  rect: <rect x="2" y="4" width="12" height="8" fill="none" stroke="#000" strokeWidth="1.5" />,
  polygon: <path d="M3 13L2 6l6-4 6 5-3 7z" fill="none" stroke="#000" strokeWidth="1.5" />,
  ellipse: <ellipse cx="8" cy="8" rx="6" ry="4" fill="none" stroke="#000" strokeWidth="1.5" />,
  roundrect: <rect x="2" y="4" width="12" height="8" rx="3" fill="none" stroke="#000" strokeWidth="1.5" />,
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
  const stroke = useRef<Stroke | null>(null)
  // Multi-step shapes: a polygon collects corners; a curve is a line that is then bent once.
  const polygon = useRef<{ points: Point[]; snapshot: ImageData; color: string } | null>(null)
  const curve = useRef<{ a: Point; b: Point; snapshot: ImageData; color: string } | null>(null)
  const spray = useRef(0)
  const lastTool = useRef<Tool>('pencil')

  const tools: [Tool, string][] = [
    ['eraser', t('Goma', 'Eraser')],
    ['fill', t('Relleno de color', 'Fill With Color')],
    ['picker', t('Seleccionar color', 'Pick Color')],
    ['pencil', t('Lápiz', 'Pencil')],
    ['brush', t('Pincel', 'Brush')],
    ['airbrush', t('Aerógrafo', 'Airbrush')],
    ['line', t('Línea', 'Line')],
    ['curve', t('Curva', 'Curve')],
    ['rect', t('Rectángulo', 'Rectangle')],
    ['polygon', t('Polígono', 'Polygon')],
    ['ellipse', t('Elipse', 'Ellipse')],
    ['roundrect', t('Rectángulo redondeado', 'Rounded Rectangle')],
  ]

  const context = () => canvasRef.current?.getContext('2d', { willReadFrequently: true }) ?? null

  useEffect(() => {
    const ctx = context()
    if (!ctx) return
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, W, H)
    return () => window.clearInterval(spray.current)
  }, [])

  const remember = () => {
    const ctx = context()
    if (!ctx) return
    undo.current = [...undo.current.slice(-11), ctx.getImageData(0, 0, W, H)]
    setCanUndo(true)
  }
  const abandonShape = () => { polygon.current = null; curve.current = null; stroke.current = null; window.clearInterval(spray.current) }
  const undoLast = () => {
    const ctx = context()
    const image = undo.current.pop()
    abandonShape()
    if (ctx && image) ctx.putImageData(image, 0, 0)
    setCanUndo(undo.current.length > 0)
  }
  const pickTool = (next: Tool) => { abandonShape(); if (tool !== 'picker') lastTool.current = tool; setTool(next) }
  const clear = () => {
    const ctx = context()
    if (!ctx) return
    remember()
    abandonShape()
    ctx.fillStyle = bg
    ctx.fillRect(0, 0, W, H)
  }
  // Image menu: redraw the picture through a scratch copy.
  const transform = (kind: 'flip-h' | 'flip-v' | 'invert') => {
    const ctx = context()
    const canvas = canvasRef.current
    if (!ctx || !canvas) return
    remember()
    abandonShape()
    if (kind === 'invert') {
      const image = ctx.getImageData(0, 0, W, H)
      for (let i = 0; i < image.data.length; i += 4) { image.data[i] = 255 - image.data[i]; image.data[i + 1] = 255 - image.data[i + 1]; image.data[i + 2] = 255 - image.data[i + 2] }
      ctx.putImageData(image, 0, 0)
      return
    }
    const copy = document.createElement('canvas')
    copy.width = W
    copy.height = H
    copy.getContext('2d')?.drawImage(canvas, 0, 0)
    ctx.save()
    if (kind === 'flip-h') { ctx.translate(W, 0); ctx.scale(-1, 1) } else { ctx.translate(0, H); ctx.scale(1, -1) }
    ctx.drawImage(copy, 0, 0)
    ctx.restore()
  }

  const point = (e: React.PointerEvent<HTMLCanvasElement> | React.MouseEvent<HTMLCanvasElement>): Point => {
    const r = e.currentTarget.getBoundingClientRect()
    return { x: Math.max(0, Math.min(W - 1, Math.floor(((e.clientX - r.left) * W) / r.width))), y: Math.max(0, Math.min(H - 1, Math.floor(((e.clientY - r.top) * H) / r.height))) }
  }
  // Shift keeps lines to 45° steps and makes squares and circles, as in the original.
  const constrain = (from: Point, to: Point, shift: boolean): Point => {
    if (!shift) return to
    const dx = to.x - from.x
    const dy = to.y - from.y
    if (tool === 'line' || tool === 'polygon' || tool === 'curve') {
      const angle = Math.round(Math.atan2(dy, dx) / (Math.PI / 4)) * (Math.PI / 4)
      const length = Math.hypot(dx, dy)
      return { x: Math.round(from.x + Math.cos(angle) * length), y: Math.round(from.y + Math.sin(angle) * length) }
    }
    const side = Math.max(Math.abs(dx), Math.abs(dy))
    return { x: from.x + Math.sign(dx || 1) * side, y: from.y + Math.sign(dy || 1) * side }
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

  const pen = (ctx: CanvasRenderingContext2D, color: string, width = size) => {
    ctx.strokeStyle = color
    ctx.fillStyle = color
    ctx.lineWidth = width
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
  }
  const segment = (ctx: CanvasRenderingContext2D, a: Point, b: Point, color: string) => {
    pen(ctx, color, tool === 'pencil' ? 1 : tool === 'eraser' ? size * 3 : size)
    if (tool === 'eraser') ctx.lineCap = 'square'
    ctx.beginPath()
    ctx.moveTo(a.x + 0.5, a.y + 0.5)
    ctx.lineTo(b.x + 0.5, b.y + 0.5)
    ctx.stroke()
  }
  const path = (ctx: CanvasRenderingContext2D, points: Point[], closed: boolean) => {
    ctx.beginPath()
    points.forEach((p, i) => (i ? ctx.lineTo(p.x + 0.5, p.y + 0.5) : ctx.moveTo(p.x + 0.5, p.y + 0.5)))
    if (closed) ctx.closePath()
    ctx.stroke()
  }
  const shape = (ctx: CanvasRenderingContext2D, a: Point, b: Point) => {
    const x = Math.min(a.x, b.x) + 0.5
    const y = Math.min(a.y, b.y) + 0.5
    const w = Math.abs(b.x - a.x)
    const h = Math.abs(b.y - a.y)
    ctx.beginPath()
    if (tool === 'line') { ctx.moveTo(a.x + 0.5, a.y + 0.5); ctx.lineTo(b.x + 0.5, b.y + 0.5) }
    else if (tool === 'rect') ctx.rect(x, y, w, h)
    else if (tool === 'roundrect') { if (ctx.roundRect) ctx.roundRect(x, y, w, h, Math.min(12, w / 2, h / 2)); else ctx.rect(x, y, w, h) }
    else ctx.ellipse((a.x + b.x) / 2, (a.y + b.y) / 2, w / 2, h / 2, 0, 0, Math.PI * 2)
    ctx.stroke()
  }
  const finishPolygon = () => {
    const ctx = context()
    const poly = polygon.current
    polygon.current = null
    if (!ctx || !poly || poly.points.length < 2) return
    ctx.putImageData(poly.snapshot, 0, 0)
    pen(ctx, poly.color)
    path(ctx, poly.points, true)
  }

  const down = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (e.button !== 0 && e.button !== 2) return
    const ctx = context()
    if (!ctx) return
    e.preventDefault()
    const p = point(e)
    const color = tool === 'eraser' ? bg : e.button === 2 ? bg : fg
    if (tool === 'picker') {
      const [r, g, b] = ctx.getImageData(p.x, p.y, 1, 1).data
      const picked = `#${[r, g, b].map((v) => v.toString(16).padStart(2, '0')).join('')}`
      if (e.button === 2) setBg(picked); else setFg(picked)
      setTool(lastTool.current)
      return
    }
    e.currentTarget.setPointerCapture(e.pointerId)
    if (tool === 'polygon' && polygon.current) { stroke.current = { start: polygon.current.points[polygon.current.points.length - 1], last: p, snapshot: polygon.current.snapshot, color: polygon.current.color }; return }
    if (tool === 'curve' && curve.current) { stroke.current = { start: curve.current.a, last: p, snapshot: curve.current.snapshot, color: curve.current.color }; return }
    remember()
    if (tool === 'fill') return flood(ctx, p, color)
    const snapshot = ctx.getImageData(0, 0, W, H)
    stroke.current = { start: p, last: p, snapshot, color }
    if (tool === 'polygon') polygon.current = { points: [p], snapshot, color }
    if (FREEHAND.includes(tool)) segment(ctx, p, p, color)
    if (tool === 'airbrush') {
      const puff = () => {
        const s = stroke.current
        if (!s) return
        pen(ctx, s.color)
        for (let i = 0; i < 14; i++) {
          const angle = Math.random() * Math.PI * 2
          const radius = Math.random() * (size * 3 + 4)
          ctx.fillRect(Math.round(s.last.x + Math.cos(angle) * radius), Math.round(s.last.y + Math.sin(angle) * radius), 1, 1)
        }
      }
      puff()
      spray.current = window.setInterval(puff, 30)
    }
  }
  const move = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const raw = point(e)
    setCursor(raw)
    const s = stroke.current
    const ctx = context()
    if (!s || !ctx) return
    if (FREEHAND.includes(tool)) { segment(ctx, s.last, raw, s.color); s.last = raw; return }
    if (tool === 'airbrush') { s.last = raw; return }
    const p = constrain(s.start, raw, e.shiftKey)
    s.last = p
    ctx.putImageData(s.snapshot, 0, 0)
    pen(ctx, s.color)
    if (tool === 'polygon' && polygon.current) path(ctx, [...polygon.current.points, p], false)
    else if (tool === 'curve' && curve.current) { ctx.beginPath(); ctx.moveTo(curve.current.a.x + 0.5, curve.current.a.y + 0.5); ctx.quadraticCurveTo(raw.x, raw.y, curve.current.b.x + 0.5, curve.current.b.y + 0.5); ctx.stroke() }
    else if (tool === 'curve' || tool === 'polygon') path(ctx, [s.start, p], false)
    else if (DRAGGED.includes(tool)) shape(ctx, s.start, p)
  }
  const up = () => {
    const s = stroke.current
    stroke.current = null
    window.clearInterval(spray.current)
    if (!s) return
    if (tool === 'polygon' && polygon.current) {
      const poly = polygon.current
      const first = poly.points[0]
      // Releasing close to the first corner closes the shape; so does a double click.
      if (poly.points.length > 2 && Math.hypot(s.last.x - first.x, s.last.y - first.y) < 7) finishPolygon()
      else if (Math.hypot(s.last.x - s.start.x, s.last.y - s.start.y) > 1) poly.points.push(s.last)
    } else if (tool === 'curve') {
      if (curve.current) curve.current = null
      else if (Math.hypot(s.last.x - s.start.x, s.last.y - s.start.y) > 1) curve.current = { a: s.start, b: s.last, snapshot: s.snapshot, color: s.color }
    }
  }

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
  const asWallpaper = (mode: 'tiled' | 'centered') => {
    const canvas = canvasRef.current
    if (canvas) setCustomWallpaper(canvas.toDataURL('image/png'), mode)
  }
  const hint: Partial<Record<Tool, string>> = {
    polygon: t('Arrastra cada lado; doble clic para cerrar', 'Drag each side; double-click to close'),
    curve: t('Dibuja la línea y después arrástrala para curvarla', 'Draw the line, then drag to bend it'),
    picker: t('Haz clic en la imagen para tomar su color', 'Click the picture to take its colour'),
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
              'separator',
              { label: t('Establecer como papel tapiz (mosaico)', 'Set As Wallpaper (Tiled)'), onSelect: () => asWallpaper('tiled') },
              { label: t('Establecer como papel tapiz (centrado)', 'Set As Wallpaper (Centered)'), onSelect: () => asWallpaper('centered') },
              'separator',
              { label: t('Salir', 'Exit'), onSelect: () => close(winId) },
            ],
          },
          { label: t('Edición', 'Edit'), items: [{ label: t('Deshacer', 'Undo'), shortcut: 'Ctrl+Z', disabled: !canUndo, onSelect: undoLast }] },
          {
            label: t('Imagen', 'Image'),
            items: [
              { label: t('Voltear horizontalmente', 'Flip Horizontal'), onSelect: () => transform('flip-h') },
              { label: t('Voltear verticalmente', 'Flip Vertical'), onSelect: () => transform('flip-v') },
              { label: t('Invertir colores', 'Invert Colors'), onSelect: () => transform('invert') },
              'separator',
              { label: t('Borrar imagen', 'Clear Image'), onSelect: clear },
            ],
          },
          { label: t('Ayuda', 'Help'), items: [{ label: t('Acerca de Paint', 'About Paint'), onSelect: () => message({ title: 'Paint', text: t('Archive95 Paint\nClic izquierdo pinta con el color principal; clic derecho, con el de fondo. Mayús mantiene líneas rectas, cuadrados y círculos.', 'Archive95 Paint\nLeft click paints with the foreground colour; right click with the background colour. Shift keeps lines straight and makes squares and circles.'), kind: 'info' }) }] },
        ]}
      />
      <div className="paint-main">
        <div className="paint-tools" role="toolbar" aria-label={t('Herramientas', 'Tools')}>
          {tools.map(([id, label]) => (
            <button key={id} type="button" className={tool === id ? 'is-pressed' : ''} aria-pressed={tool === id} aria-label={label} data-tip={label} onClick={() => pickTool(id)}>
              <svg viewBox="0 0 16 16" width="16" height="16" aria-hidden="true">{toolIcons[id]}</svg>
            </button>
          ))}
          <div className="paint-sizes" role="group" aria-label={t('Grosor', 'Line width')}>
            {SIZES.map((s) => (
              <button key={s} type="button" className={size === s ? 'is-pressed' : ''} aria-pressed={size === s} aria-label={`${t('Grosor', 'Width')} ${s}`} data-tip={`${s}px`} onClick={() => setSize(s)}>
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
            onDoubleClick={() => tool === 'polygon' && finishPolygon()}
            onContextMenu={(e) => e.preventDefault()}
          />
        </div>
      </div>
      <div className="paint-palette">
        <div className="paint-current" data-tip={t('Principal / fondo', 'Foreground / background')}>
          <span style={{ background: bg }} />
          <span style={{ background: fg }} />
        </div>
        <div className="paint-colors" role="group" aria-label={t('Colores', 'Colours')}>
          {COLORS.map((c) => (
            <button key={c} type="button" aria-label={`${t('Color', 'Colour')} ${c}`} aria-pressed={fg === c} style={{ background: c }} onClick={() => setFg(c)} onContextMenu={(e) => { e.preventDefault(); setBg(c) }} />
          ))}
        </div>
      </div>
      <div className="status-bar">
        <p className="status-bar-field status-grow">{hint[tool] ?? t('Clic izquierdo: color principal · Clic derecho: color de fondo', 'Left click: foreground colour · Right click: background colour')}</p>
        <p className="status-bar-field">{cursor ? `${cursor.x}, ${cursor.y}` : `${W} × ${H}`}</p>
      </div>
    </div>
  )
}
