'use client'

import { useEffect, useRef, useState } from 'react'
import { about, chronology, languages, profile, projects, skills } from '@/lib/content'
import { useOs } from '../os-context'
import { projectFile, resolveProgram } from '../programs'

const PROMPT = 'C:\\ARCHIVE95>'

export function TerminalApp({ winId }: { winId: string }) {
  const os = useOs()
  const { t, lang } = os
  const [lines, setLines] = useState<string[]>(() => [
    'Archive95 MS-DOS Prompt  [Version 4.00.950]',
    '(C) 2026 Mohamed Amine Aslimani.',
    '',
    t('Escribe HELP para ver los comandos.', 'Type HELP for a list of commands.'),
    '',
  ])
  const [value, setValue] = useState('')
  const [history, setHistory] = useState<string[]>([])
  const [cursor, setCursor] = useState(-1)
  const outputRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    outputRef.current?.scrollTo({ top: outputRef.current.scrollHeight })
  }, [lines])

  function run(raw: string): string[] | 'clear' {
    const [command = '', ...rest] = raw.trim().split(/\s+/)
    const arg = rest.join(' ')
    switch (command.toLowerCase()) {
      case '':
        return []
      case 'help':
      case '?':
        return [
          t('Comandos disponibles:', 'Available commands:'),
          '  ABOUT       ' + t('Quién soy', 'Who I am'),
          '  DIR         ' + t('Lista los proyectos', 'List projects'),
          '  TYPE <n>    ' + t('Muestra un proyecto (p. ej. TYPE RELAY)', 'Print a project (e.g. TYPE RELAY)'),
          '  START <n>   ' + t('Abre un programa (RELAY, CV, WINMINE…)', 'Open a program (RELAY, CV, WINMINE…)'),
          '  SKILLS      ' + t('Competencias técnicas', 'Technical skills'),
          '  HISTORY     ' + t('Trayectoria', 'Background'),
          '  CONTACT     ' + t('Cómo contactar', 'How to get in touch'),
          '  LANG ES|EN  ' + t('Cambia el idioma', 'Switch language'),
          '  PING <host> · VER · DATE · CLS · EXIT',
        ]
      case 'about':
      case 'whoami':
        return [profile.name.toUpperCase(), profile.role[lang], '', about[lang]]
      case 'dir':
      case 'ls':
        return [
          ` ${t('Directorio de', 'Directory of')} C:\\ARCHIVE95\\PROJECTS`,
          '',
          ...projects.map((p) => `${projectFile(p.slug).padEnd(18)} ${p.category[lang]}`),
          `        ${projects.length} ${t('archivo(s)', 'file(s)')}`,
        ]
      case 'type':
      case 'cat': {
        const program = resolveProgram(arg)
        const p = program && 'app' in program && program.app === 'project' ? projects.find((x) => x.slug === program.arg) : undefined
        if (!p) return [t(`No se encuentra el archivo: ${arg || '(vacío)'}`, `File not found: ${arg || '(empty)'}`)]
        return [p.name[lang].toUpperCase(), p.summary[lang], '', ...p.sections.flatMap((s) => [`== ${s.title[lang]} ==`, s.body[lang], '']), `${t('Stack', 'Stack')}: ${p.technologies.join(', ')}`]
      }
      case 'start':
      case 'open':
      case 'run': {
        const program = resolveProgram(arg)
        if (!program) return [t(`Comando o archivo incorrecto: ${arg}`, `Bad command or file name: ${arg}`)]
        if ('url' in program) window.open(program.url, '_blank', 'noopener')
        else os.open(program.app, program.arg)
        return [t(`Abriendo ${arg.toUpperCase()}…`, `Starting ${arg.toUpperCase()}…`)]
      }
      case 'skills':
        return skills.map((s) => `${s.title[lang].padEnd(14)} ${typeof s.items === 'string' ? s.items : s.items[lang]}`).concat([`${t('Idiomas', 'Languages').padEnd(14)} ${languages[lang]}`])
      case 'history':
        return chronology.map((c) => `${c.date.padEnd(9)} ${c.title[lang]}`)
      case 'contact':
      case 'mail':
        return [`EMAIL   ${profile.email}`, `GITHUB  ${profile.github}`, '', t('Escribe START MAIL para redactar un mensaje.', 'Type START MAIL to compose a message.')]
      case 'lang':
        if (arg.toLowerCase() === 'en' || arg.toLowerCase() === 'es') {
          os.setLang(arg.toLowerCase() as 'en' | 'es')
          return [arg.toLowerCase() === 'en' ? 'Language set to English.' : 'Idioma cambiado a español.']
        }
        return ['LANG ES | LANG EN']
      case 'ver':
        return ['Archive95 [Version 4.00.950] — Next.js edition']
      case 'date':
      case 'time':
        return [new Date().toLocaleString(lang === 'es' ? 'es-ES' : 'en-GB')]
      case 'ping': {
        const host = arg || 'archive95.local'
        return [`${t('Haciendo ping a', 'Pinging')} ${host}:`, ...[12, 9, 11, 10].map((ms) => `${t('Respuesta desde', 'Reply from')} ${host}: bytes=32 ${t('tiempo', 'time')}=${ms}ms TTL=64`)]
      }
      case 'cls':
      case 'clear':
        return 'clear'
      case 'exit':
        os.close(winId)
        return []
      case 'sudo':
        return [t('Buen intento. Esto es MS-DOS.', 'Nice try. This is MS-DOS.')]
      case 'format':
        return [t('Acceso denegado. Este archivo está protegido por su autor.', 'Access denied. This archive is protected by its author.')]
      default:
        return [t('Comando o archivo incorrecto', 'Bad command or file name')]
    }
  }

  const submit = () => {
    const result = run(value)
    if (value.trim()) setHistory((h) => [value, ...h].slice(0, 30))
    setCursor(-1)
    setLines((prev) => (result === 'clear' ? [] : [...prev, `${PROMPT}${value}`, ...result, '']))
    setValue('')
  }

  return (
    <div className="terminal" onClick={() => inputRef.current?.focus()}>
      <div className="terminal-output" ref={outputRef} role="log" aria-live="polite">
        {lines.map((line, i) => (
          <div key={i}>{line || '\u00a0'}</div>
        ))}
        <div className="terminal-line">
          <label htmlFor={`${winId}-cmd`}>{PROMPT}</label>
          <input
            id={`${winId}-cmd`}
            ref={inputRef}
            value={value}
            autoFocus
            spellCheck={false}
            autoComplete="off"
            autoCapitalize="off"
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                if (e.nativeEvent.isComposing || e.keyCode === 229) return
                submit()
              } else if (e.key === 'ArrowUp') {
                e.preventDefault()
                const next = Math.min(cursor + 1, history.length - 1)
                if (history[next] !== undefined) {
                  setCursor(next)
                  setValue(history[next])
                }
              } else if (e.key === 'ArrowDown') {
                e.preventDefault()
                const next = cursor - 1
                setCursor(Math.max(next, -1))
                setValue(next >= 0 ? history[next] : '')
              }
            }}
          />
        </div>
      </div>
    </div>
  )
}
