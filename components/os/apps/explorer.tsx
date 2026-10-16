'use client'

import { useState } from 'react'
import { projects } from '@/lib/content'
import { OsIcon, type IconName } from '../icons'
import { MenuBar } from '../menu-bar'
import { useOs } from '../os-context'
import { projectFile } from '../programs'
import { useOpenGesture } from '../use-open-gesture'

type Item = { id: string; name: string; icon: IconName; type: string; detail: string; status: string; onOpen: () => void }

function FileView({ items, address, empty, menus, toolbar, winId }: { items: Item[]; address: string; empty: string; menus?: Parameters<typeof MenuBar>[0]['menus']; toolbar?: React.ReactNode; winId: string }) {
  const { t, close } = useOs()
  const [view, setView] = useState<'icons' | 'details'>('icons')
  const [selected, setSelected] = useState<string | null>(null)
  const gesture = useOpenGesture()
  const current = items.find((i) => i.id === selected)

  return (
    <div className="app-layout">
      <MenuBar
        menus={[
          ...(menus ?? [{ label: t('Archivo', 'File'), items: [{ label: t('Cerrar', 'Close'), onSelect: () => close(winId) }] }]),
          {
            label: t('Ver', 'View'),
            items: [
              { label: t('Iconos grandes', 'Large Icons'), checked: view === 'icons', onSelect: () => setView('icons') },
              { label: t('Detalles', 'Details'), checked: view === 'details', onSelect: () => setView('details') },
            ],
          },
        ]}
      />
      <div className="toolbar">
        <label className="address">
          <span>{t('Dirección', 'Address')}</span>
          <span className="address-field">
            <OsIcon name="folderOpen" size={16} />
            {address}
          </span>
        </label>
        <div className="toolbar-group">
          <button type="button" className={view === 'icons' ? 'is-pressed' : ''} onClick={() => setView('icons')} aria-pressed={view === 'icons'}>
            {t('Iconos', 'Icons')}
          </button>
          <button type="button" className={view === 'details' ? 'is-pressed' : ''} onClick={() => setView('details')} aria-pressed={view === 'details'}>
            {t('Detalles', 'Details')}
          </button>
          {toolbar}
        </div>
      </div>
      <div className="sunken-panel file-area" onClick={() => setSelected(null)}>
        {items.length === 0 && <p className="file-empty">{empty}</p>}
        {view === 'icons' ? (
          <ul className="file-grid">
            {items.map((item) => (
              <li key={item.id}>
                <button type="button" className={`file-icon ${selected === item.id ? 'is-selected' : ''}`} {...gesture(() => setSelected(item.id), item.onOpen)} onKeyDown={(e) => e.key === 'Enter' && item.onOpen()}>
                  <OsIcon name={item.icon} size={32} />
                  <span>{item.name}</span>
                </button>
              </li>
            ))}
          </ul>
        ) : (
          items.length > 0 && (
            <table className="interactive file-table">
              <thead>
                <tr>
                  <th>{t('Nombre', 'Name')}</th>
                  <th>{t('Tipo', 'Type')}</th>
                  <th>{t('Detalle', 'Detail')}</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <tr key={item.id} className={selected === item.id ? 'highlighted' : ''} tabIndex={0} {...gesture(() => setSelected(item.id), item.onOpen)} onKeyDown={(e) => e.key === 'Enter' && item.onOpen()}>
                    <td>
                      <span className="cell-name">
                        <OsIcon name={item.icon} size={16} />
                        {item.name}
                      </span>
                    </td>
                    <td>{item.type}</td>
                    <td>{item.detail}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )
        )}
      </div>
      <div className="status-bar">
        <p className="status-bar-field status-grow">{current ? current.status : t(`${items.length} objeto(s)`, `${items.length} object(s)`)}</p>
        <p className="status-bar-field">{t('Doble clic para abrir', 'Double-click to open')}</p>
      </div>
    </div>
  )
}

export function ProjectsExplorer({ winId }: { winId: string }) {
  const { t, lang, open } = useOs()
  const items: Item[] = projects.map((p) => ({
    id: p.slug,
    name: projectFile(p.slug),
    icon: p.slug === 'relay' ? 'automation' : 'doc',
    type: p.category[lang],
    detail: p.technologies.slice(0, 3).join(', '),
    status: `${p.name[lang]} — ${p.summary[lang]}`,
    onOpen: () => open('project', p.slug),
  }))
  return <FileView winId={winId} items={items} address={t('C:\\Archive95\\Proyectos', 'C:\\Archive95\\Projects')} empty="" />
}

export function RecycleBin({ winId }: { winId: string }) {
  const { t, message, recycleEmptied, emptyRecycle, close } = useOs()
  const explain = (title: string, es: string, en: string) => () => message({ title, text: t(es, en), kind: 'info' })
  const items: Item[] = recycleEmptied
    ? []
    : [
        {
          id: 'bench',
          name: 'BENCHMARKS.XLS',
          icon: 'file',
          type: t('Hoja de cálculo', 'Spreadsheet'),
          detail: t('Eliminado a propósito', 'Deleted on purpose'),
          status: t('Cifras de rendimiento que nunca se midieron.', 'Performance numbers that were never measured.'),
          onOpen: explain('BENCHMARKS.XLS', 'Este archivo se eliminó a propósito. El laboratorio de IA local no publica benchmarks: no se midieron, así que no se afirman.', 'This file was deleted on purpose. The local AI lab publishes no benchmarks: they were not measured, so they are not claimed.'),
        },
        {
          id: 'uptime',
          name: 'UPTIME_99.DOC',
          icon: 'doc',
          type: t('Documento', 'Document'),
          detail: t('Eliminado a propósito', 'Deleted on purpose'),
          status: t('Una promesa de disponibilidad sin evidencia.', 'An availability promise without evidence.'),
          onOpen: explain('UPTIME_99.DOC', 'El homelab es un entorno de aprendizaje, no de producción. No hay cifras verificadas de disponibilidad, así que esta afirmación se tiró a la papelera.', 'The homelab is a learning environment, not production. There are no verified uptime figures, so this claim went in the bin.'),
        },
        {
          id: 'buzz',
          name: 'BUZZWORDS.TXT',
          icon: 'notepad',
          type: t('Documento de texto', 'Text document'),
          detail: t('Eliminado a propósito', 'Deleted on purpose'),
          status: t('“Ninja”, “rockstar”, “10x”…', '“Ninja”, “rockstar”, “10x”…'),
          onOpen: explain('BUZZWORDS.TXT', 'Ninja. Rockstar. Ingeniero 10x. Disruptivo. — Archive95 prefiere describir lo que realmente se construyó y probó.', 'Ninja. Rockstar. 10x engineer. Disruptive. — Archive95 prefers to describe what was actually built and tested.'),
        },
      ]
  return (
    <FileView
      winId={winId}
      items={items}
      address={t('C:\\Papelera', 'C:\\Recycled')}
      empty={t('Esta carpeta está vacía.', 'This folder is empty.')}
      menus={[
        {
          label: t('Archivo', 'File'),
          items: [
            { label: t('Vaciar Papelera de reciclaje', 'Empty Recycle Bin'), disabled: recycleEmptied, onSelect: emptyRecycle },
            'separator',
            { label: t('Cerrar', 'Close'), onSelect: () => close(winId) },
          ],
        },
      ]}
      toolbar={
        <button type="button" disabled={recycleEmptied} onClick={emptyRecycle}>
          {t('Vaciar', 'Empty')}
        </button>
      }
    />
  )
}
