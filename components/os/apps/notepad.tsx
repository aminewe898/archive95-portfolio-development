'use client'

import { useRef, useState } from 'react'
import { profile } from '@/lib/content'
import { MenuBar } from '../menu-bar'
import { useOs } from '../os-context'
import { readPreference, writePreference } from '../storage'

export function NotepadApp({ blank, winId }: { blank?: boolean; winId: string }) {
  const { t, close, message, open } = useOs()
  const ref = useRef<HTMLTextAreaElement>(null)
  const [wrap, setWrap] = useState(true)
  const [position, setPosition] = useState({ line: 1, column: 1 })
  const [saved, setSaved] = useState(false)
  const draftKey = `a95-draft-${winId}`
  const [text, setText] = useState(() =>
    (typeof window !== 'undefined' ? readPreference(draftKey, true) : null) ?? (blank
      ? ''
      : t(
          `README.TXT
==========

Hola. Soy ${profile.name}.

Este escritorio es mi portfolio. Todo lo que ves funciona:
arrastra las ventanas, abre los iconos, juega al Buscaminas.

DÓNDE EMPEZAR
  * RELAY.EXE ........ el proyecto principal
  * Proyectos ........ todos los laboratorios
  * RESUME.DOC ....... mi CV (descargable en PDF)
  * Bandeja de entrada  escríbeme directamente

ATAJOS
  * Clic derecho en el escritorio: fondos y más
  * Inicio > Ejecutar: escribe RELAY, CV o WINMINE
  * MS-DOS Prompt: escribe HELP

Este archivo se puede editar. Adelante, deja una nota.

— Amine`,
          `README.TXT
==========

Hi. I'm ${profile.name}.

This desktop is my portfolio. Everything works:
drag the windows, open the icons, play Minesweeper.

WHERE TO START
  * RELAY.EXE ........ the flagship project
  * Projects ......... every lab
  * RESUME.DOC ....... my CV (PDF download)
  * Inbox ............ write to me directly

SHORTCUTS
  * Right-click the desktop: wallpapers and more
  * Start > Run: type RELAY, CV or WINMINE
  * MS-DOS Prompt: type HELP

This file is editable. Go ahead, leave a note.

— Amine`,
        )),
  )
  const update = (value: string | ((v: string) => string)) => setText((v) => {
    const next = typeof value === 'function' ? value(v) : value
    writePreference(draftKey, next, true)
    return next
  })

  const insertDate = () => {
    const el = ref.current
    const stamp = new Date().toLocaleString()
    if (!el) return update((v) => v + stamp)
    const { selectionStart: s, selectionEnd: e } = el
    update((v) => v.slice(0, s) + stamp + v.slice(e))
    setSaved(false)
    requestAnimationFrame(() => {
      el.focus()
      el.setSelectionRange(s + stamp.length, s + stamp.length)
    })
  }

  const save = () => {
    const url = URL.createObjectURL(new Blob([text], { type: 'text/plain;charset=utf-8' }))
    const link = document.createElement('a')
    link.href = url
    link.download = blank ? 'UNTITLED.TXT' : 'README.TXT'
    document.body.append(link)
    link.click()
    link.remove()
    window.setTimeout(() => URL.revokeObjectURL(url), 1000)
    setSaved(true)
  }

  return (
    <div className="app-layout" onKeyDown={(e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
        e.preventDefault()
        save()
      }
    }}>
      <MenuBar
        menus={[
          {
            label: t('Archivo', 'File'),
            items: [
              { label: t('Nuevo', 'New'), onSelect: () => open('notepad', `new-${Date.now()}`) },
              { label: t('Guardar como…', 'Save As…'), shortcut: 'Ctrl+S', onSelect: save },
              { label: t('Enviar como correo…', 'Send as mail…'), onSelect: () => (window.location.href = `mailto:${profile.email}?subject=README.TXT&body=${encodeURIComponent(text)}`) },
              'separator',
              { label: t('Salir', 'Exit'), onSelect: () => close(winId) },
            ],
          },
          {
            label: t('Edición', 'Edit'),
            items: [
              { label: t('Seleccionar todo', 'Select All'), onSelect: () => ref.current?.select() },
              { label: t('Hora/Fecha', 'Time/Date'), shortcut: 'F5', onSelect: insertDate },
              'separator',
              { label: t('Ajuste de línea', 'Word Wrap'), checked: wrap, onSelect: () => setWrap((w) => !w) },
            ],
          },
          {
            label: t('Ayuda', 'Help'),
            items: [{ label: t('Acerca del Bloc de notas', 'About Notepad'), onSelect: () => message({ title: t('Acerca del Bloc de notas', 'About Notepad'), text: 'Archive95 Notepad 4.00.950\n© 2026 Mohamed Amine Aslimani', kind: 'info' }) }],
          },
        ]}
      />
      <label className="sr-only" htmlFor={`${winId}-text`}>
        {t('Documento de texto', 'Text document')}
      </label>
      <textarea
        id={`${winId}-text`}
        ref={ref}
        className="notepad-text"
        value={text}
        wrap={wrap ? 'soft' : 'off'}
        spellCheck={false}
        onChange={(e) => { update(e.target.value); setSaved(false) }}
        onSelect={(e) => {
          const before = e.currentTarget.value.slice(0, e.currentTarget.selectionStart)
          const lines = before.split('\n')
          setPosition({ line: lines.length, column: lines[lines.length - 1].length + 1 })
        }}
        onKeyDown={(e) => {
          if (e.key === 'F5') {
            e.preventDefault()
            insertDate()
          }
        }}
      />
      <div className="status-bar">
        <p className="status-bar-field status-grow" role="status">{saved ? t('Descarga iniciada', 'Download started') : t('Borrador de esta sesión · Guarda una copia con Ctrl+S', 'Draft kept for this session · Save a copy with Ctrl+S')}</p>
        <p className="status-bar-field">Ln {position.line}, Col {position.column}</p>
        <p className="status-bar-field">{text.length} {t('caracteres', 'characters')}</p>
      </div>
    </div>
  )
}
