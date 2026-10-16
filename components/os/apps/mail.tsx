'use client'

import { useState } from 'react'
import { profile, projects } from '@/lib/content'
import { OsIcon } from '../icons'
import { useOs } from '../os-context'

export function MailApp({ topic, winId }: { topic?: string; winId: string }) {
  const { t, lang, message, close, play } = useOs()
  const project = projects.find((p) => p.slug === topic)
  const [name, setName] = useState('')
  const [subject, setSubject] = useState(project ? `${t('Sobre', 'About')} ${project.name[lang]}` : t('Oportunidad junior / prácticas', 'Junior role / internship'))
  const [body, setBody] = useState('')

  const send = (e: React.FormEvent) => {
    e.preventDefault()
    const signed = name.trim() ? `${body}\n\n— ${name.trim()}` : body
    window.location.href = `mailto:${profile.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(signed)}`
    play('ding')
    message({ title: 'Outlook Express', text: t('Continúa en tu aplicación de correo para enviar el mensaje. Si no se abre, copia la dirección y el mensaje en tu correo habitual.', 'Continue in your mail application to send the message. If nothing opens, copy the address and message into your usual email service.'), kind: 'info' })
  }

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(profile.email)
      message({ title: t('Copiado', 'Copied'), text: t(`${profile.email} se copió al portapapeles.`, `${profile.email} was copied to the clipboard.`), kind: 'info' })
    } catch {
      message({ title: 'Email', text: profile.email, kind: 'info' })
    }
  }

  return (
    <form className="app-layout" onSubmit={send}>
      <div className="toolbar toolbar-big">
        <div className="toolbar-group">
          <button type="submit" className="big-tool">
            <OsIcon name="mail" size={24} />
            {t('Abrir en correo', 'Open in mail')}
          </button>
          <button type="button" className="big-tool" onClick={copy}>
            <OsIcon name="file" size={24} />
            {t('Copiar email', 'Copy email')}
          </button>
          <a className="button-link big-tool" href={profile.github} target="_blank" rel="noreferrer">
            <OsIcon name="globe" size={24} />
            GitHub
          </a>
          <button type="button" className="big-tool" onClick={() => close(winId)}>
            <OsIcon name="recycleEmpty" size={24} />
            {t('Descartar', 'Discard')}
          </button>
        </div>
      </div>
      <div className="mail-fields">
        <div className="field-row">
          <label htmlFor={`${winId}-to`}>{t('Para:', 'To:')}</label>
          <input id={`${winId}-to`} type="text" value={`${profile.name} <${profile.email}>`} readOnly />
        </div>
        <div className="field-row">
          <label htmlFor={`${winId}-from`}>{t('De:', 'From:')}</label>
          <input id={`${winId}-from`} type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder={t('Tu nombre', 'Your name')} autoComplete="name" />
        </div>
        <div className="field-row">
          <label htmlFor={`${winId}-subject`}>{t('Asunto:', 'Subject:')}</label>
          <input id={`${winId}-subject`} type="text" value={subject} onChange={(e) => setSubject(e.target.value)} required maxLength={140} />
        </div>
      </div>
      <label className="sr-only" htmlFor={`${winId}-body`}>
        {t('Mensaje', 'Message')}
      </label>
      <textarea
        id={`${winId}-body`}
        className="mail-body"
        value={body}
        onChange={(e) => setBody(e.target.value)}
        required
        maxLength={4000}
        placeholder={t('Hola Amine, …', 'Hi Amine, …')}
      />
      <div className="status-bar">
        <p className="status-bar-field status-grow">{t('Se envía desde tu aplicación de correo', 'Send using your mail application')}</p>
        <p className="status-bar-field">{body.length}/4000</p>
      </div>
    </form>
  )
}
