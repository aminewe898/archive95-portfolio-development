'use client'

import { useState } from 'react'
import { about, chronology, languages, profile, projects, skills } from '@/lib/content'
import { OsIcon } from '../icons'
import { MenuBar } from '../menu-bar'
import { useOs } from '../os-context'

const PDF = '/assets/cv-mohamed-amine-aslimani.pdf'

export function ResumeApp({ winId }: { winId: string }) {
  const { t, lang, close, open } = useOs()
  const [zoom, setZoom] = useState(1)
  const print = () => window.print()

  return (
    <div className="app-layout">
      <MenuBar
        menus={[
          {
            label: t('Archivo', 'File'),
            items: [
              { label: t('Descargar PDF', 'Download PDF'), onSelect: () => window.open(PDF, '_blank', 'noopener') },
              { label: t('Imprimir…', 'Print…'), shortcut: 'Ctrl+P', onSelect: print },
              'separator',
              { label: t('Cerrar', 'Close'), onSelect: () => close(winId) },
            ],
          },
          {
            label: t('Ver', 'View'),
            items: [
              { label: t('Ampliar', 'Zoom in'), onSelect: () => setZoom((z) => Math.min(1.4, z + 0.1)) },
              { label: t('Reducir', 'Zoom out'), onSelect: () => setZoom((z) => Math.max(0.8, z - 0.1)) },
            ],
          },
          { label: t('Insertar', 'Insert'), items: [{ label: t('Mensaje para Amine…', 'Message to Amine…'), onSelect: () => open('mail') }] },
        ]}
      />
      <div className="toolbar">
        <div className="toolbar-group">
          <a className="button-link" href={PDF} download>
            <OsIcon name="doc" size={16} /> {t('Descargar PDF', 'Download PDF')}
          </a>
          <button type="button" onClick={print}>{t('Imprimir', 'Print')}</button>
        </div>
        <div className="toolbar-group">
          <button type="button" aria-label={t('Reducir', 'Zoom out')} onClick={() => setZoom((z) => Math.max(0.8, z - 0.1))}>
            A−
          </button>
          <span className="zoom-readout">{Math.round(zoom * 100)}%</span>
          <button type="button" aria-label={t('Ampliar', 'Zoom in')} onClick={() => setZoom((z) => Math.min(1.4, z + 0.1))}>
            A+
          </button>
        </div>
      </div>
      <div className="ruler" aria-hidden="true" />
      <div className="sunken-panel doc-scroll doc-desk">
        <article className="doc-page resume-paper" style={{ fontSize: `${zoom}em` }} lang={lang}>
          <header className="resume-head">
            <h1 className="doc-title">{profile.name}</h1>
            <p className="resume-role">
              {profile.role[lang]} · {t('Infraestructura de IA', 'AI infrastructure')}
            </p>
            <p className="resume-meta">
              Reus, {t('España', 'Spain')} · <a href={`mailto:${profile.email}`}>{profile.email}</a> · <a href={profile.github}>github.com/aminewe898</a>
            </p>
          </header>
          <section className="doc-section">
            <h2>{t('Perfil', 'Profile')}</h2>
            <p>{about[lang]}</p>
          </section>
          <section className="doc-section">
            <h2>{t('Proyectos personales', 'Personal projects')}</h2>
            {projects.map((p) => (
              <div className="resume-item" key={p.slug}>
                <h3>
                  <button type="button" className="link-button" onClick={() => open('project', p.slug)}>
                    {p.name[lang]}
                  </button>
                </h3>
                <p>{p.summary[lang]}</p>
                <p className="resume-small">{p.technologies.join(' · ')}</p>
              </div>
            ))}
          </section>
          <section className="doc-section">
            <h2>{t('Experiencia y formación', 'Experience and education')}</h2>
            {chronology.map((c) => (
              <div className="resume-item" key={c.date}>
                <h3>
                  {c.date} — {c.title[lang]}
                </h3>
                <p>{c.detail[lang]}</p>
              </div>
            ))}
          </section>
          <section className="doc-section">
            <h2>{t('Competencias', 'Skills')}</h2>
            {skills.map((s) => (
              <p key={s.title.en}>
                <b>{s.title[lang]}:</b> {typeof s.items === 'string' ? s.items : s.items[lang]}
              </p>
            ))}
            <p>
              <b>{t('Idiomas', 'Languages')}:</b> {languages[lang]}
            </p>
          </section>
        </article>
      </div>
      <div className="status-bar">
        <p className="status-bar-field status-grow">{t('Para obtener ayuda, pulse F1', 'For Help, press F1')}</p>
        <p className="status-bar-field">RESUME.DOC</p>
      </div>
    </div>
  )
}
