'use client'

import Image from 'next/image'
import { useState } from 'react'
import { about, artwork, chronology, languages, profile } from '@/lib/content'
import { useOs } from '../os-context'

const levelScore: Record<string, number> = { native: 10, nativo: 10, C2: 9, C1: 8, B2: 6, B1: 5, A2: 3, A1: 2 }

export function AboutApp({ winId }: { winId: string }) {
  const { t, lang, close, open } = useOs()
  const [tab, setTab] = useState<'general' | 'background' | 'languages'>('general')
  const tabs = [
    ['general', t('General', 'General')],
    ['background', t('Trayectoria', 'Background')],
    ['languages', t('Idiomas', 'Languages')],
  ] as const

  const languageRows = languages[lang].split(' · ').map((entry) => {
    const parts = entry.split(' ')
    const level = parts.pop() ?? ''
    return { name: parts.join(' '), level, score: levelScore[level] ?? 4 }
  })

  return (
    <div className="dialog-layout">
      <menu role="tablist" aria-label={t('Propiedades del sistema', 'System properties')} className="os-tabs">
        {tabs.map(([id, label]) => (
          <li role="presentation" key={id}>
            <button type="button" role="tab" id={`${winId}-${id}-tab`} aria-controls={`${winId}-panel`} aria-selected={tab===id} tabIndex={tab===id?0:-1} className="tab-button" onKeyDown={e=>{if(['ArrowLeft','ArrowRight','Home','End'].includes(e.key)){e.preventDefault();const i=tabs.findIndex(([v])=>v===tab);const next=e.key==='Home'?0:e.key==='End'?tabs.length-1:(i+(e.key==='ArrowRight'?1:-1)+tabs.length)%tabs.length;setTab(tabs[next][0]);document.getElementById(`${winId}-${tabs[next][0]}-tab`)?.focus()}}} onClick={() => setTab(id)}>
              {label}
            </button>
          </li>
        ))}
      </menu>
      <div className="window tab-panel" role="tabpanel" id={`${winId}-panel`} aria-labelledby={`${winId}-${tab}-tab`}>
        <div className="window-body tab-panel-body">
          {tab === 'general' && (
            <div className="sysprops">
              <figure className="sysprops-art">
                <Image src={artwork.tower} width={220} height={260} alt={t('Grabado de una torre de ordenador', 'Engraving of a computer tower')} />
              </figure>
              <dl className="sysprops-list">
                <dt>{t('Sistema:', 'System:')}</dt>
                <dd>
                  Archive95
                  <br />
                  {t('Edición personal · Vol. 01', 'Personal edition · Vol. 01')}
                </dd>
                <dt>{t('Registrado a:', 'Registered to:')}</dt>
                <dd>
                  {profile.name}
                  <br />
                  {profile.role[lang]}
                  <br />
                  {t('Infraestructura de IA · Reus, España', 'AI infrastructure · Reus, Spain')}
                </dd>
                <dt>{t('Estado:', 'Status:')}</dt>
                <dd className="status-ok">● {t('Disponible para puestos junior y prácticas', 'Available for junior roles and internships')}</dd>
              </dl>
              <p className="sysprops-about">{about[lang]}</p>
            </div>
          )}
          {tab === 'background' && (
            <ul className="tree-view background-tree">
              {chronology.map((c) => (
                <li key={c.date}>
                  <details open>
                    <summary>
                      <b>{c.date}</b> — {c.title[lang]}
                    </summary>
                    <ul>
                      <li>{c.detail[lang]}</li>
                    </ul>
                  </details>
                </li>
              ))}
            </ul>
          )}
          {tab === 'languages' && (
            <div className="language-list">
              {languageRows.map((row) => (
                <div className="language-row" key={row.name}>
                  <span className="language-name">{row.name}</span>
                  <span className="segment-bar" role="meter" aria-valuemin={0} aria-valuemax={10} aria-valuenow={row.score} aria-label={`${row.name} ${row.level}`}>
                    {Array.from({ length: 10 }, (_, i) => (
                      <span key={i} className={i < row.score ? 'on' : ''} />
                    ))}
                  </span>
                  <span className="language-level">{row.level}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      <div className="dialog-actions">
        <button type="button" onClick={() => open('resume')}>{t('CV…', 'Resume…')}</button>
        <button type="button" onClick={() => open('mail')}>{t('Contactar…', 'Contact…')}</button>
        <button type="button" onClick={() => close(winId)}>{t('Aceptar', 'OK')}</button>
      </div>
    </div>
  )
}
