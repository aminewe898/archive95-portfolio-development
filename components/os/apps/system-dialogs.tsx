'use client'

import { useState } from 'react'
import { OsIcon } from '../icons'
import { useOs, type MessageSpec, type Wallpaper } from '../os-context'
import { resolveProgram } from '../programs'

export function MessageBox({ spec, winId }: { spec: MessageSpec; winId: string }) {
  const { close, t } = useOs()
  return (
    <div className="message-box">
      <div className="message-content">
        <OsIcon name={spec.kind === 'warning' ? 'warning' : spec.kind === 'question' ? 'question' : 'info'} size={32} />
        <p>{spec.text}</p>
      </div>
      <div className="dialog-actions centered">
        <button type="button" autoFocus onClick={() => close(winId)}>
          {t('Aceptar', 'OK')}
        </button>
      </div>
    </div>
  )
}

export function RunDialog({ winId }: { winId: string }) {
  const { t, open, close, message, play } = useOs()
  const [value, setValue] = useState('')
  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    const program = resolveProgram(value)
    if (!program) {
      play('error')
      message({ title: value || t('Ejecutar', 'Run'), text: t(`No se encuentra '${value}'. Prueba con RELAY, CV, WINMINE, CMD o NOTEPAD.`, `Cannot find '${value}'. Try RELAY, CV, WINMINE, CMD or NOTEPAD.`), kind: 'warning' })
      return
    }
    if ('url' in program) window.open(program.url, '_blank', 'noopener')
    else open(program.app, program.arg)
    close(winId)
  }
  return (
    <form className="run-dialog" onSubmit={submit}>
      <div className="message-content">
        <OsIcon name="run" size={32} />
        <p>{t('Escribe el nombre de un programa, carpeta o documento y Archive95 lo abrirá.', 'Type the name of a program, folder, or document, and Archive95 will open it for you.')}</p>
      </div>
      <div className="field-row">
        <label htmlFor={`${winId}-input`}>{t('Abrir:', 'Open:')}</label>
        <input id={`${winId}-input`} list={`${winId}-list`} value={value} onChange={(e) => setValue(e.target.value)} autoFocus autoComplete="off" />
        <datalist id={`${winId}-list`}>
          {['relay', 'cv', 'winmine', 'cmd', 'notepad', 'outlook', 'explorer', 'control', 'github'].map((v) => (
            <option key={v} value={v} />
          ))}
        </datalist>
      </div>
      <div className="dialog-actions">
        <button type="submit">{t('Aceptar', 'OK')}</button>
        <button type="button" onClick={() => close(winId)}>
          {t('Cancelar', 'Cancel')}
        </button>
      </div>
    </form>
  )
}

export function ShutdownDialog({ winId }: { winId: string }) {
  const { t, close, power } = useOs()
  const [mode, setMode] = useState<'off' | 'restart'>('off')
  return (
    <form
      className="run-dialog"
      onSubmit={(e) => {
        e.preventDefault()
        close(winId)
        power(mode)
      }}
    >
      <div className="message-content">
        <OsIcon name="power" size={32} />
        <fieldset className="plain-fieldset">
          <legend>{t('¿Seguro que quieres:', 'Are you sure you want to:')}</legend>
          <div className="field-row">
            <input id={`${winId}-off`} type="radio" name="mode" checked={mode === 'off'} onChange={() => setMode('off')} />
            <label htmlFor={`${winId}-off`}>{t('Apagar el equipo', 'Shut down the computer')}</label>
          </div>
          <div className="field-row">
            <input id={`${winId}-restart`} type="radio" name="mode" checked={mode === 'restart'} onChange={() => setMode('restart')} />
            <label htmlFor={`${winId}-restart`}>{t('Reiniciar el equipo', 'Restart the computer')}</label>
          </div>
        </fieldset>
      </div>
      <div className="dialog-actions">
        <button type="submit" autoFocus>
          {t('Sí', 'Yes')}
        </button>
        <button type="button" onClick={() => close(winId)}>
          No
        </button>
      </div>
    </form>
  )
}

export const wallpaperOptions: { id: Wallpaper; es: string; en: string }[] = [
  { id: 'teal', es: '(Ninguno) Verde azulado', en: '(None) Teal' },
  { id: 'clouds', es: 'Nubes', en: 'Clouds' },
  { id: 'pattern', es: 'Archivo (trama)', en: 'Archive (pattern)' },
  { id: 'night', es: 'Medianoche', en: 'Midnight' },
]

export function DisplayProperties({ winId }: { winId: string }) {
  const { t, wallpaper, setWallpaper, close, startScreensaver } = useOs()
  const [tab, setTab] = useState<'background' | 'saver'>('background')
  const [choice, setChoice] = useState<Wallpaper>(wallpaper)

  return (
    <div className="dialog-layout">
      <menu role="tablist" className="os-tabs">
        <li role="tab" aria-selected={tab === 'background'}>
          <button type="button" className="tab-button" onClick={() => setTab('background')}>
            {t('Fondo', 'Background')}
          </button>
        </li>
        <li role="tab" aria-selected={tab === 'saver'}>
          <button type="button" className="tab-button" onClick={() => setTab('saver')}>
            {t('Protector de pantalla', 'Screen Saver')}
          </button>
        </li>
      </menu>
      <div className="window tab-panel" role="tabpanel">
        <div className="window-body tab-panel-body display-body">
          <div className="monitor" aria-hidden="true">
            <div className={`monitor-screen wallpaper-${tab === 'saver' ? 'saver' : choice}`} />
            <div className="monitor-stand" />
          </div>
          {tab === 'background' ? (
            <div className="field-row-stacked">
              <label htmlFor={`${winId}-wall`}>{t('Fondo de escritorio', 'Wallpaper')}</label>
              <select id={`${winId}-wall`} size={4} value={choice} onChange={(e) => setChoice(e.target.value as Wallpaper)} className="wall-list">
                {wallpaperOptions.map((o) => (
                  <option key={o.id} value={o.id}>
                    {t(o.es, o.en)}
                  </option>
                ))}
              </select>
            </div>
          ) : (
            <div className="saver-row">
              <p>{t('Campo de estrellas · se activa tras 2 minutos de inactividad.', 'Starfield · starts after 2 minutes of inactivity.')}</p>
              <button type="button" onClick={startScreensaver}>
                {t('Vista previa', 'Preview')}
              </button>
            </div>
          )}
        </div>
      </div>
      <div className="dialog-actions">
        <button
          type="button"
          onClick={() => {
            setWallpaper(choice)
            close(winId)
          }}
        >
          {t('Aceptar', 'OK')}
        </button>
        <button type="button" onClick={() => close(winId)}>
          {t('Cancelar', 'Cancel')}
        </button>
        <button type="button" onClick={() => setWallpaper(choice)}>
          {t('Aplicar', 'Apply')}
        </button>
      </div>
    </div>
  )
}
