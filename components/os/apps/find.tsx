'use client'

import { useMemo, useState } from 'react'
import { about, chronology, profile, projects, skills } from '@/lib/content'
import { OsIcon, type IconName } from '../icons'
import { useOs } from '../os-context'
import { projectFile, projectIcon } from '../programs'

type Entry = { id: string; name: string; folder: string; icon: IconName; text: string; onOpen: () => void }
const plain = (value: string) => value.toLocaleLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')

// Find: All Files. Searches everything on this computer: projects, skills, CV, programs.
export function FindApp({ winId }: { winId: string }) {
  const { t, lang, open } = useOs()
  const [query, setQuery] = useState('')
  const [asked, setAsked] = useState<string | null>(null)
  const [selected, setSelected] = useState<string | null>(null)

  const index = useMemo<Entry[]>(() => [
    ...projects.map((p): Entry => ({ id: p.slug, name: projectFile(p.slug), folder: t('C:\\Proyectos', 'C:\\Projects'), icon: projectIcon(p.slug), text: [p.name[lang], p.summary[lang], p.category[lang], p.technologies.join(' '), ...p.sections.flatMap((s) => [s.title[lang], s.body[lang]])].join(' '), onOpen: () => open('project', p.slug) })),
    { id: 'resume', name: 'RESUME.DOC', folder: t('C:\\Mis documentos', 'C:\\My Documents'), icon: 'doc', text: ['cv curriculum resume', profile.name, profile.role[lang], ...chronology.flatMap((c) => [c.title[lang], c.detail[lang]])].join(' '), onOpen: () => open('resume') },
    { id: 'about', name: 'SYSTEM.CPL', folder: 'C:\\Windows', icon: 'computer', text: ['about sobre mi who quien', about[lang], profile.name].join(' '), onOpen: () => open('about') },
    { id: 'skills', name: t('Panel de control', 'Control Panel'), folder: t('Mi PC', 'My Computer'), icon: 'settings', text: ['skills competencias', ...skills.flatMap((s) => [s.title[lang], typeof s.items === 'string' ? s.items : s.items[lang]])].join(' '), onOpen: () => open('skills') },
    { id: 'mail', name: 'MSIMN.EXE', folder: t('C:\\Archivos de programa', 'C:\\Program Files'), icon: 'mail', text: `contact contacto email mail correo ${profile.email} outlook`, onOpen: () => open('mail') },
    { id: 'readme', name: 'README.TXT', folder: t('C:\\Mis documentos', 'C:\\My Documents'), icon: 'notepad', text: 'readme notepad bloc notas welcome bienvenida', onOpen: () => open('notepad') },
    { id: 'ie', name: 'IEXPLORE.EXE', folder: t('C:\\Archivos de programa', 'C:\\Program Files'), icon: 'ie', text: 'internet explorer web browser navegador wikipedia', onOpen: () => open('ie') },
    { id: 'paint', name: 'MSPAINT.EXE', folder: t('C:\\Archivos de programa', 'C:\\Program Files'), icon: 'paint', text: 'paint draw dibujar pintar', onOpen: () => open('paint') },
    { id: 'calc', name: 'CALC.EXE', folder: t('C:\\Archivos de programa', 'C:\\Program Files'), icon: 'calc', text: 'calculator calculadora', onOpen: () => open('calc') },
    { id: 'terminal', name: 'COMMAND.COM', folder: t('C:\\Archivos de programa', 'C:\\Program Files'), icon: 'dos', text: 'ms-dos prompt terminal command cmd consola', onOpen: () => open('terminal') },
    { id: 'sol', name: 'SOL.EXE', folder: 'D:\\', icon: 'sol', text: 'solitaire solitario cards cartas game juego', onOpen: () => open('sol') },
    { id: 'mines', name: 'WINMINE.EXE', folder: 'D:\\', icon: 'mines', text: 'minesweeper buscaminas game juego', onOpen: () => open('mines') },
    { id: 'snake', name: 'SNAKE.EXE', folder: 'D:\\', icon: 'snake', text: 'snake serpiente game juego', onOpen: () => open('snake') },
  ], [lang, open, t])

  const results = useMemo(() => {
    if (asked === null) return []
    const words = plain(asked).split(/\s+/).filter(Boolean)
    return index.filter((entry) => { const hay = plain(`${entry.name} ${entry.text}`); return words.every((word) => hay.includes(word)) })
  }, [asked, index])

  return (
    <form className="app-layout find" onSubmit={(e) => { e.preventDefault(); setAsked(query); setSelected(null) }}>
      <div className="find-top">
        <div className="find-fields">
          <div className="field-row">
            <label htmlFor={`${winId}-named`}>{t('Nombre o texto:', 'Named or containing:')}</label>
            <input id={`${winId}-named`} type="text" value={query} onChange={(e) => setQuery(e.target.value)} autoFocus autoComplete="off" placeholder={t('p. ej. docker, redes, cv', 'e.g. docker, networking, cv')} />
          </div>
          <div className="field-row">
            <label htmlFor={`${winId}-in`}>{t('Buscar en:', 'Look in:')}</label>
            <select id={`${winId}-in`} disabled defaultValue="c"><option value="c">{t('Mi PC', 'My Computer')}</option></select>
          </div>
        </div>
        <div className="find-actions">
          <button type="submit">{t('Buscar ahora', 'Find Now')}</button>
          <button type="button" onClick={() => { setQuery(''); setAsked(null); setSelected(null) }}>{t('Nueva búsqueda', 'New Search')}</button>
        </div>
        <OsIcon name="find" size={32} className="find-glass" />
      </div>
      {asked !== null && (
        <div className="sunken-panel find-results">
          <table className="interactive file-table">
            <thead><tr><th>{t('Nombre', 'Name')}</th><th>{t('En la carpeta', 'In Folder')}</th></tr></thead>
            <tbody>
              {results.map((entry) => (
                <tr key={entry.id} tabIndex={0} className={selected === entry.id ? 'highlighted is-selected' : ''} onClick={() => setSelected(entry.id)} onFocus={() => setSelected(entry.id)} onDoubleClick={entry.onOpen} onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); entry.onOpen() } }}>
                  <td><span className="cell-name"><OsIcon name={entry.icon} size={16} />{entry.name}</span></td>
                  <td>{entry.folder}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <div className="status-bar">
        <p className="status-bar-field status-grow" role="status">{asked === null ? t('Escribe algo y pulsa Buscar ahora', 'Type something and press Find Now') : t(`${results.length} archivo(s) encontrado(s) · Doble clic para abrir`, `${results.length} file(s) found · Double-click to open`)}</p>
      </div>
    </form>
  )
}
