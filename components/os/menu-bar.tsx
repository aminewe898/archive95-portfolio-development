'use client'

import { useEffect, useRef, useState } from 'react'

export type MenuItem = { label: string; onSelect?: () => void; disabled?: boolean; checked?: boolean; shortcut?: string } | 'separator'
export type Menu = { label: string; items: MenuItem[] }

export function MenuBar({ menus }: { menus: Menu[] }) {
  const [open, setOpen] = useState<number | null>(null)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (open === null) return
    const close = (e: PointerEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(null)
    }
    window.addEventListener('pointerdown', close)
    return () => window.removeEventListener('pointerdown', close)
  }, [open])

  return (
    <div className="menu-bar" ref={ref} role="menubar" onKeyDown={(e) => e.key === 'Escape' && setOpen(null)}>
      {menus.map((menu, i) => (
        <div className="menu-bar-entry" key={menu.label}>
          <button
            type="button"
            role="menuitem"
            aria-haspopup="menu"
            aria-expanded={open === i}
            className={`menu-bar-label ${open === i ? 'is-open' : ''}`}
            onClick={() => setOpen(open === i ? null : i)}
            onPointerEnter={() => open !== null && setOpen(i)}
          >
            <span className="mnemonic">{menu.label[0]}</span>
            {menu.label.slice(1)}
          </button>
          {open === i && (
            <div className="os-menu menu-dropdown" role="menu">
              {menu.items.map((item, j) =>
                item === 'separator' ? (
                  <hr key={`s${j}`} className="menu-separator" />
                ) : (
                  <button
                    key={item.label}
                    type="button"
                    role="menuitem"
                    className="menu-item"
                    disabled={item.disabled}
                    onClick={() => {
                      setOpen(null)
                      item.onSelect?.()
                    }}
                  >
                    <span className="menu-check">{item.checked ? '✓' : ''}</span>
                    <span className="menu-item-label">{item.label}</span>
                    {item.shortcut && <span className="menu-shortcut">{item.shortcut}</span>}
                  </button>
                ),
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  )
}
