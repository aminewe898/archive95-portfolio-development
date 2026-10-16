'use client'

import { useState } from 'react'
import { languages, projects, skills } from '@/lib/content'
import { OsIcon, type IconName } from '../icons'
import { useOs } from '../os-context'
import { useOpenGesture } from '../use-open-gesture'

const skillIcons: IconName[] = ['pc', 'network', 'automation', 'hardware']

export function SkillsApp() {
  const { t, lang, open, soundOn, setSoundOn } = useOs()
  const gesture = useOpenGesture()
  const applets = [
    ...skills.map((s, i) => ({
      id: s.title.en,
      name: s.title[lang],
      icon: skillIcons[i],
      items: (typeof s.items === 'string' ? s.items : s.items[lang]).split(' · '),
      project: s.project,
      action: undefined as undefined | (() => void),
    })),
    { id: 'languages', name: t('Idiomas', 'Languages'), icon: 'globe' as IconName, items: languages[lang].split(' · '), project: undefined, action: () => open('about') },
    { id: 'display', name: t('Pantalla', 'Display'), icon: 'desktop' as IconName, items: [t('Fondo de escritorio y protector de pantalla', 'Wallpaper and screen saver')], project: undefined, action: () => open('display') },
    { id: 'sounds', name: t('Sonidos', 'Sounds'), icon: 'speaker' as IconName, items: [soundOn ? t('Sonidos del sistema activados', 'System sounds on') : t('Sonidos del sistema desactivados', 'System sounds off')], project: undefined, action: () => setSoundOn(!soundOn) },
  ]
  const [selected, setSelected] = useState(applets[0].id)
  const current = applets.find((a) => a.id === selected) ?? applets[0]
  const related = projects.find((p) => p.slug === current.project)
  const activate = (a: (typeof applets)[number]) => {
    setSelected(a.id)
    if (a.action) a.action()
    else if (a.project) open('project', a.project)
  }

  return (
    <div className="app-layout">
      <div className="toolbar">
        <span className="address">
          <span>{t('Dirección', 'Address')}</span>
          <span className="address-field">
            <OsIcon name="settings" size={16} />
            {t('Panel de control', 'Control Panel')}
          </span>
        </span>
      </div>
      <div className="sunken-panel file-area">
        <ul className="file-grid">
          {applets.map((a) => (
            <li key={a.id}>
              <button type="button" className={`file-icon ${selected === a.id ? 'is-selected' : ''}`} {...gesture(() => setSelected(a.id), () => activate(a))} onKeyDown={(e) => e.key === 'Enter' && activate(a)}>
                <OsIcon name={a.icon} size={32} />
                <span>{a.name}</span>
              </button>
            </li>
          ))}
        </ul>
      </div>
      <fieldset className="applet-detail">
        <legend>{current.name}</legend>
        <ul className="skill-chips">
          {current.items.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
        <div className="applet-actions">
          {related && (
            <button type="button" onClick={() => open('project', related.slug)}>
              {t('En práctica:', 'In practice:')} {related.name[lang]}
            </button>
          )}
          {current.action && (
            <button type="button" onClick={current.action}>
              {current.id === 'sounds' ? (soundOn ? t('Desactivar', 'Turn off') : t('Activar', 'Turn on')) : t('Abrir…', 'Open…')}
            </button>
          )}
        </div>
      </fieldset>
    </div>
  )
}
