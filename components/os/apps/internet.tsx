'use client'

import { useEffect, useRef, useState } from 'react'
import { about, profile, projects, type Lang } from '@/lib/content'
import { OsIcon } from '../icons'
import { MenuBar } from '../menu-bar'
import { useOs } from '../os-context'

// Internet Explorer: real pages load in a sandboxed frame. Each visit is either
// the live site or an archived copy from the Wayback Machine for a chosen year.
// There is no proxy: sites that forbid embedding are offered in a new tab or as
// an archived copy instead.
const HOME = 'about:home'
const YEARS = ['live', '1996', '1998', '2001', '2005'] as const
type Year = (typeof YEARS)[number]
type Visit = { url: string; year: Year }
type Favorite = Visit & { label: string }

// Large sites known to refuse being framed. Others may refuse too; the status bar says what to do.
const REFUSES_FRAMES = /(^|\.)(github\.com|google\.[a-z.]+|youtube\.com|x\.com|twitter\.com|facebook\.com|instagram\.com|linkedin\.com|reddit\.com|amazon\.[a-z.]+|netflix\.com|microsoft\.com|apple\.com|claude\.ai|chatgpt\.com)$/i

const search = (query: string, lang: Lang) => `https://${lang}.wikipedia.org/w/index.php?search=${encodeURIComponent(query)}`

export function toAddress(input: string, lang: Lang): string {
  const raw = input.trim()
  if (!raw || raw.toLowerCase() === HOME) return HOME
  const candidate = /^https?:\/\//i.test(raw) ? raw : /^localhost(:\d+)?(\/.*)?$/i.test(raw) ? `http://${raw}` : /^[\w-]+(\.[\w-]+)+(:\d+)?([/?#].*)?$/.test(raw) ? `https://${raw}` : null
  if (!candidate) return search(raw, lang)
  try {
    const url = new URL(candidate)
    return url.protocol === 'http:' || url.protocol === 'https:' ? url.href : search(raw, lang)
  } catch {
    return search(raw, lang)
  }
}

const frameSrc = ({ url, year }: Visit) => (year === 'live' ? url : `https://web.archive.org/web/${year}0601000000if_/${url}`)
const refusesFrames = (url: string) => {
  try { return REFUSES_FRAMES.test(new URL(url).hostname) } catch { return false }
}

const favoritesFor = (lang: Lang): Favorite[] => [
  { label: 'Wikipedia — Windows 95', url: `https://${lang}.wikipedia.org/wiki/Windows_95`, year: 'live' },
  { label: 'Wikipedia — Internet Explorer', url: `https://${lang}.wikipedia.org/wiki/Internet_Explorer`, year: 'live' },
  { label: 'Microsoft (1996)', url: 'http://www.microsoft.com/', year: '1996' },
  { label: 'Yahoo! (1996)', url: 'http://www.yahoo.com/', year: '1996' },
  { label: 'Apple (1998)', url: 'http://www.apple.com/', year: '1998' },
  { label: 'Google (1998)', url: 'http://www.google.com/', year: '1998' },
  { label: 'Wikipedia (2001)', url: 'http://www.wikipedia.com/', year: '2001' },
]

export function InternetApp({ winId, url }: { winId: string; url?: string }) {
  const { t, lang, open, close, message } = useOs()
  const [stack, setStack] = useState<Visit[]>(() => [{ url: url ? toAddress(url, lang) : HOME, year: 'live' }])
  const [at, setAt] = useState(0)
  const [input, setInput] = useState(stack[0].url)
  const [loading, setLoading] = useState(stack[0].url !== HOME)
  const [stopped, setStopped] = useState(false)
  const [reload, setReload] = useState(0)
  const [query, setQuery] = useState('')
  const visit = stack[at]
  const favorites = favoritesFor(lang)
  const isHome = visit.url === HOME
  const blocked = !isHome && visit.year === 'live' && refusesFrames(visit.url)

  const show = (next: Visit, index: number) => {
    setAt(index)
    setInput(next.url)
    setStopped(false)
    setLoading(next.url !== HOME && !(next.year === 'live' && refusesFrames(next.url)))
  }
  const go = (target: string, year: Year = visit.year) => {
    const next = { url: toAddress(target, lang), year }
    setStack((list) => [...list.slice(0, at + 1), next])
    show(next, at + 1)
  }
  const move = (delta: number) => {
    const index = at + delta
    if (stack[index]) show(stack[index], index)
  }
  const setYear = (year: Year) => {
    setStack((list) => list.map((v, i) => (i === at ? { ...v, year } : v)))
    show({ ...visit, year }, at)
  }
  const refresh = () => {
    if (isHome) return
    setStopped(false)
    setLoading(!blocked)
    setReload((n) => n + 1)
  }
  const stop = () => {
    if (!loading) return
    setLoading(false)
    setStopped(true)
  }
  const external = () => !isHome && window.open(visit.url, '_blank', 'noopener,noreferrer')

  // The desktop can hand this window a new address (Run dialog, MS-DOS, links).
  const handed = useRef(url)
  useEffect(() => {
    if (!url || url === handed.current) return
    handed.current = url
    go(url, 'live')
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [url])

  // A frame that never reports back (blocked or very slow) should not spin forever.
  useEffect(() => {
    if (!loading) return
    const timer = window.setTimeout(() => setLoading(false), 20000)
    return () => window.clearTimeout(timer)
  }, [loading, at, reload])

  const zone = isHome ? t('Mi equipo', 'My Computer') : visit.year === 'live' ? t('Zona Internet', 'Internet zone') : t(`Archivo de ${visit.year}`, `Archive from ${visit.year}`)

  return (
    <div className="app-layout ie">
      <MenuBar
        menus={[
          {
            label: t('Archivo', 'File'),
            items: [
              { label: t('Abrir en una pestaña nueva', 'Open in a new tab'), disabled: isHome, onSelect: external },
              'separator',
              { label: t('Cerrar', 'Close'), onSelect: () => close(winId) },
            ],
          },
          {
            label: t('Ver', 'View'),
            items: [
              { label: t('Detener', 'Stop'), shortcut: 'Esc', disabled: !loading, onSelect: stop },
              { label: t('Actualizar', 'Refresh'), shortcut: 'F5', disabled: isHome, onSelect: refresh },
              'separator',
              ...YEARS.map((y) => ({ label: y === 'live' ? t('Web actual', 'Live web') : t(`Web de ${y}`, `Web of ${y}`), checked: visit.year === y, onSelect: () => setYear(y) })),
            ],
          },
          {
            label: t('Ir', 'Go'),
            items: [
              { label: t('Atrás', 'Back'), disabled: at === 0, onSelect: () => move(-1) },
              { label: t('Adelante', 'Forward'), disabled: at >= stack.length - 1, onSelect: () => move(1) },
              { label: t('Página de inicio', 'Home page'), onSelect: () => go(HOME, 'live') },
            ],
          },
          { label: t('Favoritos', 'Favorites'), items: favorites.map((f) => ({ label: f.label, onSelect: () => go(f.url, f.year) })) },
          {
            label: t('Ayuda', 'Help'),
            items: [{ label: t('Acerca de Internet Explorer', 'About Internet Explorer'), onSelect: () => message({ title: 'Internet Explorer', text: t('Archive95 Internet Explorer 3.0\nLas páginas se cargan en un marco aislado. «Web de 1996» y los demás años usan copias de la Wayback Machine (web.archive.org).', 'Archive95 Internet Explorer 3.0\nPages load in an isolated frame. “Web of 1996” and the other years use copies from the Wayback Machine (web.archive.org).'), kind: 'info' }) }],
          },
        ]}
      />
      <div className="toolbar ie-toolbar">
        <div className="toolbar-group">
          <button type="button" disabled={at === 0} onClick={() => move(-1)}>◄ {t('Atrás', 'Back')}</button>
          <button type="button" disabled={at >= stack.length - 1} onClick={() => move(1)}>{t('Adelante', 'Forward')} ►</button>
          <button type="button" disabled={!loading} onClick={stop}>{t('Detener', 'Stop')}</button>
          <button type="button" disabled={isHome} onClick={refresh}>{t('Actualizar', 'Refresh')}</button>
          <button type="button" onClick={() => go(HOME, 'live')}>{t('Inicio', 'Home')}</button>
        </div>
        <div className="toolbar-group">
          <button type="button" disabled={isHome} onClick={external}><OsIcon name="globe" size={16} /> {t('Pestaña nueva', 'New tab')}</button>
        </div>
        <div className={`ie-throbber ${loading ? 'is-busy' : ''}`} aria-hidden="true"><OsIcon name="logo" size={16} /></div>
      </div>
      <form className="address ie-address" onSubmit={(e) => { e.preventDefault(); go(input) }}>
        <label htmlFor={`${winId}-address`}>{t('Dirección:', 'Address:')}</label>
        <input id={`${winId}-address`} type="text" value={input} onChange={(e) => setInput(e.target.value)} onFocus={(e) => e.currentTarget.select()} spellCheck={false} autoComplete="off" autoCapitalize="off" inputMode="url" placeholder={t('Escribe una dirección o una búsqueda', 'Type an address or a search')} />
        <label className="sr-only" htmlFor={`${winId}-year`}>{t('Época', 'Era')}</label>
        <select id={`${winId}-year`} value={visit.year} disabled={isHome} onChange={(e) => setYear(e.target.value as Year)}>
          {YEARS.map((y) => <option key={y} value={y}>{y === 'live' ? t('Actual', 'Live') : y}</option>)}
        </select>
        <button type="submit">{t('Ir', 'Go')}</button>
      </form>
      <div className="ie-view sunken-panel">
        {isHome ? (
          renderHome()
        ) : stopped ? (
          <Notice title={t('Navegación cancelada', 'Navigation cancelled')} text={t('Se detuvo la carga de la página.', 'The page stopped loading.')}>
            <button type="button" onClick={refresh}>{t('Actualizar', 'Refresh')}</button>
          </Notice>
        ) : blocked ? (
          <Notice title={t('Este sitio no permite mostrarse aquí', 'This site does not allow being shown here')} text={t(`${new URL(visit.url).hostname} prohíbe que otras páginas lo incrusten, así que Internet Explorer no puede mostrarlo dentro de esta ventana.`, `${new URL(visit.url).hostname} forbids other pages from embedding it, so Internet Explorer cannot display it inside this window.`)}>
            <button type="button" onClick={external}>{t('Abrir en una pestaña nueva', 'Open in a new tab')}</button>
            <button type="button" onClick={() => setYear('2001')}>{t('Ver una copia de 2001', 'View a copy from 2001')}</button>
          </Notice>
        ) : (
          <iframe
            key={`${at}-${reload}-${visit.year}`}
            className="ie-frame"
            src={frameSrc(visit)}
            title={t('Página web', 'Web page')}
            sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-popups-to-escape-sandbox"
            referrerPolicy="no-referrer"
            onLoad={() => setLoading(false)}
          />
        )}
      </div>
      <div className="status-bar">
        <p className="status-bar-field status-grow" role="status">
          {loading ? t(`Abriendo ${visit.url}…`, `Opening ${visit.url}…`) : isHome || blocked || stopped ? t('Listo', 'Done') : visit.year === 'live' ? t('Listo · Si queda en blanco, el sitio bloquea la incrustación: usa «Pestaña nueva» o elige un año', 'Done · If it stays blank, the site blocks embedding: use “New tab” or pick a year') : t('Listo · Copia archivada por web.archive.org', 'Done · Archived copy from web.archive.org')}
        </p>
        <p className="status-bar-field">{zone}</p>
      </div>
    </div>
  )

  function renderHome() {
    return (
      <div className="ie-page">
        <p className="ie-banner">★ {t('Página personal de Amine', 'Amine’s Home Page')} ★</p>
        <h1>{profile.name}</h1>
        <p className="ie-lead">{profile.role[lang]} · Reus, {t('España', 'Spain')}</p>
        <hr />
        <p>{about[lang]}</p>
        <h2>{t('Mis cosas', 'My stuff')}</h2>
        <ul>
          {projects.map((p) => (
            <li key={p.slug}>
              <button type="button" className="ie-link" onClick={() => open('project', p.slug)}>{p.name[lang]}</button> — {p.summary[lang]}
            </li>
          ))}
          <li><button type="button" className="ie-link" onClick={() => open('resume')}>{t('Mi currículum', 'My résumé')}</button> · <button type="button" className="ie-link" onClick={() => open('mail')}>{t('Escríbeme', 'Write to me')}</button> · <a href={profile.github} target="_blank" rel="noreferrer">GitHub ↗</a></li>
        </ul>
        <h2>{t('Buscar en la Web', 'Search the Web')}</h2>
        <form className="ie-search" onSubmit={(e) => { e.preventDefault(); if (query.trim()) go(query, 'live') }}>
          <label className="sr-only" htmlFor={`${winId}-search`}>{t('Buscar', 'Search')}</label>
          <input id={`${winId}-search`} type="text" value={query} onChange={(e) => setQuery(e.target.value)} placeholder={t('Busca en Wikipedia o escribe una dirección', 'Search Wikipedia or type an address')} />
          <button type="submit">{t('Buscar', 'Search')}</button>
        </form>
        <h2>{t('Sitios para visitar', 'Places to visit')}</h2>
        <ul>
          {favorites.map((f) => (
            <li key={f.label}><button type="button" className="ie-link" onClick={() => go(f.url, f.year)}>{f.label}</button></li>
          ))}
        </ul>
        <p className="ie-note">{t('Consejo: el selector junto a la dirección viaja en el tiempo. Elige 1996, 1998, 2001 o 2005 para ver cualquier sitio tal como era, gracias a la Wayback Machine.', 'Tip: the selector next to the address travels in time. Pick 1996, 1998, 2001 or 2005 to see any site as it was, courtesy of the Wayback Machine.')}</p>
        <hr />
        <p className="ie-foot">{t('Se ve mejor con Archive95 a 800×600', 'Best viewed with Archive95 at 800×600')} · <a href={`mailto:${profile.email}`}>{profile.email}</a></p>
      </div>
    )
  }
}

function Notice({ title, text, children }: { title: string; text: string; children: React.ReactNode }) {
  return (
    <div className="ie-page ie-notice">
      <div className="message-content">
        <OsIcon name="info" size={32} />
        <div>
          <h1>{title}</h1>
          <p>{text}</p>
          <div className="ie-notice-actions">{children}</div>
        </div>
      </div>
    </div>
  )
}
