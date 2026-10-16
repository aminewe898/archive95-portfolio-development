'use client'

import { useRef, useState } from 'react'
import { profile } from '@/lib/content'
import { MenuBar } from '../menu-bar'
import { useOs } from '../os-context'

export function NotepadApp({ blank, winId }: { blank?: boolean; winId: string }) {
  const { t, close, message } = useOs()
  const ref = useRef<HTMLTextAreaElement>(null)
  const [wrap, setWrap] = useState(true)
  const [text, setText] = useState(() =>
    blank
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
        ),
  )

  const insertDate = () => {
    const el = ref.current
    const stamp = new Date().toLocaleString()
    if (!el) return setText((v) => v + stamp)
    const { selectionStart: s, selectionEnd: e } = el
    setText((v) => v.slice(0, s) + stamp + v.slice(e))
  }

  return (
    <div className="app-layout">
      <MenuBar
        menus={[
          {
            label: t('Archivo', 'File'),
            items: [
              { label: t('Nuevo', 'New'), onSelect: () => setText('') },
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
        onChange={(e) => setText(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'F5') {
            e.preventDefault()
            insertDate()
          }
        }}
      />
    </div>
  )
}
