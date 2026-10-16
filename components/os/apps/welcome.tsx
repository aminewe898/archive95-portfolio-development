'use client'

import Image from 'next/image'
import { readPreference, writePreference } from '../storage'
import { useState } from 'react'
import { profile } from '@/lib/content'
import { OsIcon } from '../icons'
import { useOs } from '../os-context'

export function WelcomeApp({ winId }: { winId: string }) {
  const { t, open, close, lang } = useOs()
  const [tip, setTip] = useState(0)
  const [showNext, setShowNext] = useState(() => typeof window === 'undefined' || readPreference('a95-welcome') !== 'off')

  const tips = [
    t(
      `${profile.name} es técnico junior en sistemas y redes en Reus. Está disponible para puestos junior y prácticas.`,
      `${profile.name} is a junior systems & network technician in Reus, Spain. Available for junior roles and internships.`,
    ),
    t('Haz doble clic en RELAY.EXE para abrir el proyecto principal: un service desk autoalojado que convierte notas de voz en tickets.', 'Double-click RELAY.EXE to open the flagship project: a self-hosted service desk that turns voice notes into tickets.'),
    t('Abre el MS-DOS Prompt y escribe HELP. Todo el portfolio se puede recorrer desde la línea de comandos.', 'Open the MS-DOS Prompt and type HELP. The whole portfolio can be explored from the command line.'),
    t('Haz clic derecho en el escritorio para cambiar el fondo o crear un documento de texto.', 'Right-click the desktop to change the wallpaper or create a text document.'),
    t('La Papelera de reciclaje contiene lo que este portfolio decidió no afirmar. Échale un vistazo.', 'The Recycle Bin holds what this portfolio chose not to claim. Take a look.'),
    t('¿Atascado? Pulsa Inicio → Ejecutar… y escribe el nombre de un programa, como WINMINE o CV.', 'Stuck? Press Start → Run… and type a program name such as WINMINE or CV.'),
  ]

  return (
    <div className="welcome">
      <div className="welcome-head">
        <p className="welcome-title">
          {t('Bienvenido a ', 'Welcome to ')}
          <b>Archive</b>
          <span className="welcome-95">95</span>
        </p>
        <p className="welcome-sub">
          {profile.name} — {profile.role[lang]}
        </p>
      </div>
      <div className="welcome-art"><Image src="/art/retro/welcome.svg" width={640} height={360} unoptimized priority alt={t('Ordenador retro, servidor y disquete en pixel art', 'Pixel-style retro computer, server and floppy disk')} /><span>{t('SISTEMAS · REDES · AUTOMATIZACIÓN', 'SYSTEMS · NETWORKS · AUTOMATION')}</span></div>
      <div className="welcome-main">
        <div className="welcome-tip">
          <OsIcon name="help" size={32} />
          <div>
            <p className="welcome-tip-title">{tip === 0 ? t('Hola, soy Amine.', 'Hi, I’m Amine.') : t('¿Sabías que…', 'Did you know…')}</p>
            <p aria-live="polite">{tips[tip]}</p>
          </div>
        </div>
        <div className="welcome-buttons">
          <button type="button" onClick={() => open('projects')}>{t('Ver proyectos', 'View projects')}</button>
          <button type="button" onClick={() => open('project', 'relay')}>RELAY.EXE</button>
          <button type="button" onClick={() => open('resume')}>{t('Abrir CV', 'Open resume')}</button>
          <button type="button" onClick={() => open('mail')}>{t('Contactar', 'Get in touch')}</button>
          <hr />
          <button type="button" onClick={() => setTip((tip + 1) % tips.length)}>{t('Consejo', 'Tip')} {tip + 1}/{tips.length} →</button>
          <button type="button" onClick={() => close(winId)}>{t('Cerrar', 'Close')}</button>
        </div>
      </div>
      <div className="field-row welcome-foot">
        <input
          id="welcome-next"
          type="checkbox"
          checked={showNext}
          onChange={(e) => {
            setShowNext(e.target.checked)
            writePreference('a95-welcome', e.target.checked ? 'on' : 'off')
          }}
        />
        <label htmlFor="welcome-next">{t('Mostrar esta pantalla de bienvenida la próxima vez', 'Show this Welcome Screen next time')}</label>
      </div>
    </div>
  )
}
