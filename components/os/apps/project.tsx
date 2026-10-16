'use client'

import Image from 'next/image'
import { useState } from 'react'
import { artwork, profile, projectPath, projects } from '@/lib/content'
import { OsIcon } from '../icons'
import { MenuBar } from '../menu-bar'
import { useOs } from '../os-context'

function RelayDiagram() {
  const { t } = useOs()
  const nodes = [
    { id: 'tg', label: 'Telegram', note: t('Mensajes de voz de usuarios autorizados.', 'Voice messages from authorized users.') },
    { id: 'in', label: 'Ingress', note: t('Entrada autenticada: valida y encola el trabajo.', 'Authenticated ingress: validates and queues work.') },
    { id: 'q', label: 'PostgreSQL', note: t('Cola con checkpoints duraderos, leases y fencing.', 'Queue with durable checkpoints, leases and fencing.') },
    { id: 'w', label: 'n8n + Groq', note: t('Workers: transcripción y extracción estructurada.', 'Workers: transcription and structured extraction.') },
    { id: 'r', label: t('Resolución', 'Resolution'), note: t('Resolución determinista de clientes y tickets.', 'Deterministic customer and ticket resolution.') },
    { id: 'o', label: 'Outbox', note: t('Respuestas persistentes; los envíos inciertos se reconcilian.', 'Persistent replies; uncertain sends are reconciled.') },
  ]
  const [active, setActive] = useState(0)
  return (
    <fieldset className="diagram">
      <legend>{t('Diagrama de red — haz clic en un nodo', 'Network diagram — click a node')}</legend>
      <ol className="diagram-flow">
        {nodes.map((n, i) => (
          <li key={n.id}>
            <button type="button" className={`diagram-node ${active === i ? 'is-active' : ''}`} aria-pressed={active === i} onClick={() => setActive(i)}>
              <span className="diagram-step">{String(i + 1).padStart(2, '0')}</span>
              {n.label}
            </button>
          </li>
        ))}
      </ol>
      <p className="diagram-note" aria-live="polite">
        <b>{nodes[active].label}:</b> {nodes[active].note}
      </p>
    </fieldset>
  )
}

export function ProjectViewer({ slug, winId }: { slug: string; winId: string }) {
  const { t, lang, open, close, message } = useOs()
  const [zoom, setZoom] = useState(1)
  const index = Math.max(0, projects.findIndex((p) => p.slug === slug))
  const p = projects[index]
  const prev = projects[(index - 1 + projects.length) % projects.length]
  const next = projects[(index + 1) % projects.length]
  const repo = p.evidence?.[0]?.url

  const copyLink = async () => {
    const url = `${window.location.origin}${projectPath(lang, p.slug)}`
    try {
      await navigator.clipboard.writeText(url)
      message({ title: t('Enlace copiado', 'Link copied'), text: t(`Se copió el enlace al portapapeles:\n${url}`, `The link was copied to the clipboard:\n${url}`), kind: 'info' })
    } catch {
      message({ title: t('Enlace', 'Link'), text: url, kind: 'info' })
    }
  }

  return (
    <div className="app-layout">
      <MenuBar
        menus={[
          {
            label: t('Archivo', 'File'),
            items: [
              { label: t('Copiar enlace', 'Copy link'), onSelect: copyLink },
              { label: t('Abrir repositorio', 'Open repository'), disabled: !repo, onSelect: () => repo && window.open(repo, '_blank', 'noopener') },
              'separator',
              { label: t('Cerrar', 'Close'), onSelect: () => close(winId) },
            ],
          },
          {
            label: t('Ver', 'View'),
            items: [
              { label: t('Ampliar', 'Zoom in'), onSelect: () => setZoom((z) => Math.min(1.4, z + 0.1)) },
              { label: t('Reducir', 'Zoom out'), onSelect: () => setZoom((z) => Math.max(0.8, z - 0.1)) },
              { label: '100%', onSelect: () => setZoom(1) },
            ],
          },
          {
            label: t('Ir', 'Go'),
            items: [
              { label: `← ${prev.name[lang]}`, onSelect: () => open('project', prev.slug) },
              { label: `→ ${next.name[lang]}`, onSelect: () => open('project', next.slug) },
              'separator',
              { label: t('Todos los proyectos', 'All projects'), onSelect: () => open('projects') },
            ],
          },
        ]}
      />
      <div className="toolbar">
        <div className="toolbar-group">
          <button type="button" onClick={() => open('project', prev.slug)} aria-label={`${t('Anterior', 'Previous')}: ${prev.name[lang]}`}>
            ◄ {t('Anterior', 'Back')}
          </button>
          <button type="button" onClick={() => open('project', next.slug)} aria-label={`${t('Siguiente', 'Next')}: ${next.name[lang]}`}>
            {t('Siguiente', 'Next')} ►
          </button>
          <button type="button" onClick={() => open('projects')}>
            <OsIcon name="folder" size={16} /> {t('Carpeta', 'Folder')}
          </button>
        </div>
        <div className="toolbar-group">
          {repo && (
            <a className="button-link" href={repo} target="_blank" rel="noreferrer">
              <OsIcon name="globe" size={16} /> GitHub
            </a>
          )}
          <button type="button" onClick={copyLink}>{t('Compartir', 'Share')}</button>
        </div>
      </div>
      <div className="sunken-panel doc-scroll">
        <article className="doc-page" style={{ fontSize: `${zoom}em` }}>
          <p className="doc-kicker">
            SPECIMEN {String(index + 1).padStart(2, '0')} · {p.category[lang]}
          </p>
          <h1 className="doc-title">{p.name[lang]}</h1>
          <p className="doc-lead">{p.summary[lang]}</p>
          <ul className="doc-tags" aria-label={t('Tecnologías', 'Technologies')}>
            {p.technologies.map((tech) => (
              <li key={tech}>{tech}</li>
            ))}
          </ul>
          <figure className="doc-figure">
            <Image src={artwork[p.illustration as keyof typeof artwork]} width={700} height={467} sizes="(max-width: 640px) 90vw, 560px" alt={t(`Grabado conceptual de ${p.name.es}`, `Conceptual engraving of ${p.name.en}`)} />
            <figcaption>{t('Fig. 1 — Grabado conceptual. No es una captura de pantalla.', 'Fig. 1 — Conceptual engraving. Not a screenshot.')}</figcaption>
          </figure>
          {p.slug === 'relay' && <RelayDiagram />}
          {p.sections.map((s, i) => (
            <section key={s.title.en} className="doc-section">
              <h2>
                <span>{String(i + 1).padStart(2, '0')}</span> {s.title[lang]}
              </h2>
              <p>{s.body[lang]}</p>
            </section>
          ))}
          <section className="doc-section">
            <h2>{t('Evidencia y referencias', 'Evidence and references')}</h2>
            {p.evidence ? (
              <ul className="doc-links">
                {p.evidence.map((e) => (
                  <li key={e.url}>
                    <a href={e.url} target="_blank" rel="noreferrer">
                      {e.label[lang]} ↗
                    </a>
                  </li>
                ))}
              </ul>
            ) : (
              <p>{t('No se ha facilitado un repositorio público para este proyecto.', 'No public repository has been supplied for this project.')}</p>
            )}
            <p className="doc-contact">
              {t('¿Preguntas sobre este proyecto? ', 'Questions about this project? ')}
              <button type="button" className="link-button" onClick={() => open('mail', p.slug)}>
                {t('Escríbeme', 'Write to me')}
              </button>{' '}
              · <a href={profile.github}>GitHub</a>
            </p>
          </section>
        </article>
      </div>
      <div className="status-bar">
        <p className="status-bar-field status-grow">
          {index + 1} / {projects.length} · {p.technologies.length} {t('tecnologías', 'technologies')}
        </p>
        <p className="status-bar-field">{Math.round(zoom * 100)}%</p>
      </div>
    </div>
  )
}
