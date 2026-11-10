'use client'

import Image from 'next/image'
import { useState } from 'react'
import { profile, projectPath, projects } from '@/lib/content'
import { OsIcon } from '../icons'
import { MenuBar } from '../menu-bar'
import { useOs } from '../os-context'
import { ProjectEvidence } from './project-evidence'
import { ProjectDemo } from '../demos/project-demo'

export function ProjectViewer({ slug, winId, suspended = false }: { slug: string; winId: string; suspended?: boolean }) {
  const { t, lang, open, close, message } = useOs()
  const [zoom, setZoom] = useState(1)
  const [view, setView] = useState<'demo' | 'dossier'>('demo')
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
            ◄ {t('Anterior', 'Previous')}
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
      <div className="project-view-switch" role="group" aria-label={t('Vista del proyecto', 'Project view')}>
        <button type="button" aria-pressed={view === 'demo'} onClick={() => setView('demo')}><OsIcon name="automation" size={16}/>{t('Demo interactiva', 'Interactive demo')}</button>
        <button type="button" aria-pressed={view === 'dossier'} onClick={() => setView('dossier')}><OsIcon name="doc" size={16}/>{t('Dossier del proyecto', 'Project dossier')}</button>
        <span>{t('Explora cómo funciona', 'Explore how it works')}</span>
      </div>
      <div className="demo-scroll" hidden={view !== 'demo'}><ProjectDemo key={slug} slug={slug} suspended={suspended || view !== 'demo'}/><ProjectEvidence project={p} readDossier={()=>setView('dossier')}/></div>
      {view === 'dossier' && <div className="sunken-panel doc-scroll">
        <article className="doc-page" style={{ '--document-zoom': zoom } as React.CSSProperties}>
          <p className="doc-kicker">
            ARCHIVE / {String(index + 1).padStart(2, '0')} · {p.category[lang]}
          </p>
          <h1 className="doc-title">{p.name[lang]}</h1>
          <p className="doc-lead">{p.summary[lang]}</p>
          <ul className="doc-tags" aria-label={t('Tecnologías', 'Technologies')}>
            {p.technologies.map((tech) => (
              <li key={tech}>{tech}</li>
            ))}
          </ul>
          <figure className="doc-figure">
            <Image src={`/art/retro/${p.illustration}.svg`} unoptimized width={640} height={360} sizes="(max-width: 640px) 90vw, 560px" alt={t(`Ilustración retro de ${p.name.es}`, `Retro illustration of ${p.name.en}`)} />
            <figcaption>{t('Fig. 1 — Ilustración del sistema.', 'Fig. 1 — Conceptual system illustration.')}</figcaption>
          </figure>
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
      </div>}
      <div className="status-bar">
        <p className="status-bar-field status-grow">
          {index + 1} / {projects.length} · {p.technologies.length} {t('tecnologías', 'technologies')}
        </p>
        <p className="status-bar-field">{view === 'demo' ? t('Simulación local', 'Local simulation') : `${Math.round(zoom * 100)}%`}</p>
      </div>
    </div>
  )
}
