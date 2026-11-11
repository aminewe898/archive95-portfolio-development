'use client'

import { useState } from 'react'
import { useOs } from '../os-context'

// The Windows 95 "Close Program" dialog: lists what is running and ends a task.
export function TaskManager({ winId, tasks, onSwitch }: { winId: string; tasks: { id: string; title: string }[]; onSwitch: (id: string) => void }) {
  const { t, close, open } = useOs()
  const others = tasks.filter((task) => task.id !== winId)
  const [picked, setPicked] = useState<string | null>(null)
  const selected = others.find((task) => task.id === picked)?.id ?? others[0]?.id
  return (
    <div className="dialog-layout taskman">
      <ul className="taskman-list sunken-panel" role="listbox" aria-label={t('Programas en ejecución', 'Running programs')}>
        {others.length === 0 && <li className="taskman-empty">{t('No hay programas abiertos.', 'No programs are open.')}</li>}
        {others.map((task) => (
          <li key={task.id} role="option" aria-selected={task.id === selected}>
            <button type="button" className={task.id === selected ? 'is-selected' : ''} onClick={() => setPicked(task.id)} onDoubleClick={() => { onSwitch(task.id); close(winId) }}>{task.title}</button>
          </li>
        ))}
      </ul>
      <p className="taskman-note">{t('ADVERTENCIA: Finalizar una tarea cierra su ventana. Los borradores del Bloc de notas y del correo se conservan durante esta sesión.', 'WARNING: Ending a task closes its window. Notepad and mail drafts are kept for this session.')}</p>
      <div className="dialog-actions">
        <button type="button" disabled={!selected} onClick={() => selected && close(selected)}>{t('Finalizar tarea', 'End Task')}</button>
        <button type="button" disabled={!selected} onClick={() => { if (selected) { onSwitch(selected); close(winId) } }}>{t('Cambiar a', 'Switch To')}</button>
        <button type="button" onClick={() => { close(winId); open('shutdown') }}>{t('Apagar…', 'Shut Down…')}</button>
        <button type="button" onClick={() => close(winId)}>{t('Cancelar', 'Cancel')}</button>
      </div>
    </div>
  )
}
