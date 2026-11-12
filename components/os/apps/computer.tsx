'use client'

import { useState } from 'react'
import { profile, projects } from '@/lib/content'
import type { IconName } from '../icons'
import { useOs, type AppId } from '../os-context'
import { projectFile, projectIcon } from '../programs'
import { FileView, type Item } from './explorer'

type Place = 'computer' | 'c' | 'd' | 'documents' | 'programs' | 'windows'

// My Computer: drives and folders that lead to the same portfolio apps and documents.
export function ComputerExplorer({ winId }: { winId: string }) {
  const { t, lang, open, message, close } = useOs()
  const [place, setPlace] = useState<Place>('computer')
  const fileFolder = t('Carpeta de archivos', 'File Folder')
  const application = t('Aplicación', 'Application')

  const folder = (id: string, name: string, to: Place | (() => void), detail = ''): Item => ({ id, name, icon: 'folder', type: fileFolder, detail, status: name, onOpen: typeof to === 'function' ? to : () => setPlace(to) })
  const program = (name: string, icon: IconName, app: AppId, status: string, arg?: string): Item => ({ id: name, name, icon, type: application, detail: status, status, onOpen: () => open(app, arg) })
  const text = (name: string, body: string): Item => ({ id: name, name, icon: 'notepad', type: t('Archivo de sistema', 'System file'), detail: '1 KB', status: name, onOpen: () => message({ title: name, text: body, kind: 'info' }) })
  const documents: Item[] = [
    { id: 'resume', name: 'RESUME.DOC', icon: 'doc', type: t('Documento de WordPad', 'WordPad Document'), detail: t('Currículum', 'Résumé'), status: t('Mi currículum, imprimible y descargable.', 'My résumé, printable and downloadable.'), onOpen: () => open('resume') },
    { id: 'readme', name: 'README.TXT', icon: 'notepad', type: t('Documento de texto', 'Text Document'), detail: t('Empieza aquí', 'Start here'), status: t('Una nota de bienvenida editable.', 'An editable welcome note.'), onOpen: () => open('notepad') },
    ...projects.map((p): Item => ({ id: p.slug, name: projectFile(p.slug), icon: projectIcon(p.slug), type: p.category[lang], detail: p.technologies.slice(0, 3).join(', '), status: `${p.name[lang]} — ${p.summary[lang]}`, onOpen: () => open('project', p.slug) })),
  ]

  const places: Record<Place, { address: string; parent?: Place; items: Item[] }> = {
    computer: {
      address: t('Mi PC', 'My Computer'),
      items: [
        { id: 'a', name: t('Disco de 3½ (A:)', '3½ Floppy (A:)'), icon: 'floppy', type: t('Disco de 3½ pulgadas', '3½ Inch Floppy Disk'), detail: '', status: t('Unidad de disquete', 'Floppy disk drive'), onOpen: () => message({ title: t('Mi PC', 'My Computer'), text: t('No se puede acceder a A:\\.\n\nEl dispositivo no está listo.', 'A:\\ is not accessible.\n\nThe device is not ready.'), kind: 'warning' }) },
        { id: 'c', name: 'Archive95 (C:)', icon: 'hardware', type: t('Disco local', 'Local Disk'), detail: t('Portfolio', 'Portfolio'), status: t('Disco local con proyectos, documentos y programas.', 'Local disk with projects, documents and programs.'), onOpen: () => setPlace('c') },
        { id: 'd', name: t('Extras (D:)', 'Fun Stuff (D:)'), icon: 'cd', type: 'CD-ROM', detail: t('Juegos', 'Games'), status: t('CD-ROM con juegos y extras.', 'CD-ROM with games and extras.'), onOpen: () => setPlace('d') },
        { id: 'control', name: t('Panel de control', 'Control Panel'), icon: 'settings', type: t('Carpeta del sistema', 'System Folder'), detail: t('Competencias', 'Skills'), status: t('Competencias técnicas y configuración.', 'Technical skills and settings.'), onOpen: () => open('skills') },
        { id: 'dialup', name: t('Acceso telefónico a redes', 'Dial-Up Networking'), icon: 'ie', type: t('Carpeta del sistema', 'System Folder'), detail: 'Internet', status: t('Abre Internet Explorer.', 'Opens Internet Explorer.'), onOpen: () => open('ie') },
      ],
    },
    c: {
      address: 'C:\\',
      parent: 'computer',
      items: [
        folder('projects', t('Proyectos', 'Projects'), () => open('projects'), `${projects.length} ${t('proyectos', 'projects')}`),
        folder('documents', t('Mis documentos', 'My Documents'), 'documents', `${documents.length} ${t('archivos', 'files')}`),
        folder('programs', t('Archivos de programa', 'Program Files'), 'programs'),
        folder('windows', 'Windows', 'windows'),
        text('AUTOEXEC.BAT', `@ECHO OFF\nSET NAME=${profile.name}\nSET ROLE=${profile.role[lang]}\nSET CITY=Reus\nPATH C:\\WINDOWS;C:\\PROJECTS\nWIN`),
        text('CONFIG.SYS', 'DEVICE=C:\\WINDOWS\\CURIOSITY.SYS\nDEVICE=C:\\WINDOWS\\PATIENCE.SYS\nFILES=4\nBUFFERS=COFFEE'),
      ],
    },
    documents: { address: t('C:\\Mis documentos', 'C:\\My Documents'), parent: 'c', items: documents },
    programs: {
      address: t('C:\\Archivos de programa', 'C:\\Program Files'),
      parent: 'c',
      items: [
        program('IEXPLORE.EXE', 'ie', 'ie', 'Internet Explorer'),
        program('MSPAINT.EXE', 'paint', 'paint', 'Paint'),
        program('CALC.EXE', 'calc', 'calc', t('Calculadora', 'Calculator')),
        program('NOTEPAD.EXE', 'notepad', 'notepad', t('Bloc de notas', 'Notepad')),
        program('MSIMN.EXE', 'mail', 'mail', 'Outlook Express'),
        program('COMMAND.COM', 'dos', 'terminal', 'MS-DOS Prompt'),
        program('RELAY.EXE', 'automation', 'project', 'Relay · Workflow Playground', 'relay'),
      ],
    },
    windows: {
      address: 'C:\\Windows',
      parent: 'c',
      items: [
        program('SYSTEM.CPL', 'computer', 'about', t('Propiedades del sistema: quién soy', 'System Properties: who I am')),
        program('DESK.CPL', 'desktop', 'display', t('Propiedades de Pantalla', 'Display Properties')),
        program('TIMEDATE.CPL', 'clock', 'datetime', t('Propiedades de Fecha y hora', 'Date/Time Properties')),
        program('TASKMAN.EXE', 'taskman', 'taskman', t('Cerrar programa', 'Close Program')),
        program('WELCOME.EXE', 'help', 'welcome', t('Bienvenida', 'Welcome')),
        text('WIN.INI', '[windows]\nload=curiosity\nrun=projects\n\n[desktop]\nWallpaper=(None)\nTileWallpaper=0'),
      ],
    },
    d: {
      address: 'D:\\',
      parent: 'computer',
      items: [
        program('SOL.EXE', 'sol', 'sol', t('Solitario', 'Solitaire')),
        program('WINMINE.EXE', 'mines', 'mines', t('Buscaminas', 'Minesweeper')),
        program('SNAKE.EXE', 'snake', 'snake', 'Snake'),
        text('README.TXT', t('Extras de Archive95\n\nTres juegos que funcionan de verdad. Ninguno afecta a la nota del portfolio.', 'Archive95 Fun Stuff\n\nThree games that really work. None of them counts towards the portfolio grade.')),
      ],
    },
  }

  const here = places[place]
  return (
    <FileView
      key={place}
      winId={winId}
      items={here.items}
      address={here.address}
      addressIcon={place === 'computer' ? 'computer' : 'folderOpen'}
      empty={t('Esta carpeta está vacía.', 'This folder is empty.')}
      menus={[
        {
          label: t('Archivo', 'File'),
          items: [
            { label: t('Subir un nivel', 'Up One Level'), disabled: !here.parent, onSelect: () => here.parent && setPlace(here.parent) },
            { label: t('Propiedades del sistema', 'System Properties'), onSelect: () => open('about') },
            'separator',
            { label: t('Cerrar', 'Close'), onSelect: () => close(winId) },
          ],
        },
      ]}
      toolbar={
        <button type="button" disabled={!here.parent} onClick={() => here.parent && setPlace(here.parent)} title={t('Subir un nivel', 'Up One Level')}>
          ↑ {t('Subir', 'Up')}
        </button>
      }
    />
  )
}
