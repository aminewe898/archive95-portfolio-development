'use client'

import { useEffect, useRef, useState } from 'react'

export type MenuItem = { label: string; onSelect?: () => void; disabled?: boolean; checked?: boolean; shortcut?: string } | 'separator'
export type Menu = { label: string; items: MenuItem[] }

export function MenuBar({ menus }: { menus: Menu[] }) {
  const [open, setOpen] = useState<number | null>(null)
  const ref = useRef<HTMLDivElement>(null)
  const [current, setCurrent] = useState(0)
  const focusItem = useRef<'first' | 'last' | null>(null)

  const trigger = (index: number) => ref.current?.querySelectorAll<HTMLButtonElement>('.menu-bar-label')[index]
  const show = (index: number, edge: 'first' | 'last' = 'first') => {
    setCurrent(index)
    focusItem.current = edge
    setOpen(index)
  }

  useEffect(() => {
    if (open === null || !focusItem.current) return
    const items = ref.current?.querySelectorAll<HTMLButtonElement>('.menu-dropdown button:not(:disabled)')
    const edge = focusItem.current
    focusItem.current = null
    if (items?.length) items[edge === 'last' ? items.length - 1 : 0].focus()
  }, [open])

  useEffect(() => {
    if (open === null) return
    const close = (e: PointerEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(null)
    }
    window.addEventListener('pointerdown', close)
    return () => window.removeEventListener('pointerdown', close)
  }, [open])

  return (
    <div className="menu-bar" ref={ref} role="menubar" onKeyDown={(e) => {
      if (e.key === 'Escape' && open !== null) {
        e.preventDefault()
        e.stopPropagation()
        trigger(open)?.focus()
        setOpen(null)
      } else if (e.key === 'Tab') setOpen(null)
    }} onBlur={(e) => {
      if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setOpen(null)
    }}>
      {menus.map((menu, i) => (
        <div className="menu-bar-entry" key={menu.label}>
          <button
            type="button"
            role="menuitem"
            aria-haspopup="menu"
            aria-expanded={open === i}
            tabIndex={current === i ? 0 : -1}
            className={`menu-bar-label ${open === i ? 'is-open' : ''}`}
            onClick={() => open === i ? setOpen(null) : show(i)}
            onFocus={() => setCurrent(i)}
            onKeyDown={(e) => {
              if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
                e.preventDefault()
                show(i, e.key === 'ArrowUp' ? 'last' : 'first')
              } else if (['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(e.key)) {
                e.preventDefault()
                const next = e.key === 'Home' ? 0 : e.key === 'End' ? menus.length - 1 : (i + (e.key === 'ArrowRight' ? 1 : -1) + menus.length) % menus.length
                setOpen(null)
                trigger(next)?.focus()
              }
            }}
            onPointerEnter={() => open !== null && setOpen(i)}
          >
            <span className="mnemonic">{menu.label[0]}</span>
            {menu.label.slice(1)}
          </button>
          {open === i && (
            <div className="os-menu menu-dropdown" role="menu" aria-label={menu.label} onKeyDown={(e) => {
              const items = Array.from(e.currentTarget.querySelectorAll<HTMLButtonElement>('button:not(:disabled)'))
              const at = items.indexOf(document.activeElement as HTMLButtonElement)
              if (['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(e.key)) {
                e.preventDefault()
                const next = e.key === 'Home' ? 0 : e.key === 'End' ? items.length - 1 : (at + (e.key === 'ArrowDown' ? 1 : -1) + items.length) % items.length
                items[next]?.focus()
              } else if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
                e.preventDefault()
                show((i + (e.key === 'ArrowRight' ? 1 : -1) + menus.length) % menus.length)
              } else if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && e.key !== ' ') {
                const match = [...items.slice(at + 1), ...items.slice(0, at + 1)].find(item => item.querySelector('.menu-item-label')?.textContent?.toLocaleLowerCase().startsWith(e.key.toLocaleLowerCase()))
                if (match) { e.preventDefault(); match.focus() }
              }
            }}>
              {menu.items.map((item, j) =>
                item === 'separator' ? (
                  <hr key={`s${j}`} className="menu-separator" />
                ) : (
                  <button
                    key={item.label}
                    type="button"
                    role={item.checked === undefined ? 'menuitem' : 'menuitemcheckbox'}
                    aria-checked={item.checked}
                    tabIndex={-1}
                    className="menu-item"
                    disabled={item.disabled}
                    onClick={() => {
                      trigger(i)?.focus()
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
