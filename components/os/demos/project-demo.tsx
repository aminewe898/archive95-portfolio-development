'use client'

import { useEffect, useId, useReducer, useState } from 'react'
import { RelayPlayground, LabPlayground, NasPlayground } from './playgrounds'
import { OsIcon } from '../icons'
import { useOs } from '../os-context'
import { demoScenario, type DemoKind } from './scenarios'
import { playbackReducer, TICKS_PER_STEP, TOTAL_TICKS } from './playback'

const kinds: Record<string, DemoKind> = { relay: 'relay', 'local-ai-server': 'ai', 'homelab-cloud': 'lab', 'raspberry-pi-nas': 'nas' }
export function ProjectDemo({ slug, suspended = false }: { slug: string; suspended?: boolean }) {
  const { t } = useOs()
  const kind = kinds[slug] ?? 'relay'
  const [scenario, setScenario] = useState(0)
  const [state, dispatch] = useReducer(playbackReducer, { tick: 0, running: false })
  const [inspected, setInspected] = useState<number | null>(null)
  const [visible, setVisible] = useState(true)
  const [speed, setSpeed] = useState(1)
  const id = useId()
  const { steps, title, choices } = demoScenario(kind, scenario === 1, t)
  const complete = Math.floor(state.tick / TICKS_PER_STEP)
  const stage = Math.min(5, complete)
  const done = state.tick === TOTAL_TICKS
  const playing = state.running && !suspended && visible
  const active = state.tick === 0 && !state.running || done ? -1 : stage
  const selected = inspected ?? stage
  const current = steps[selected]
  const progress = Math.round(state.tick / TOTAL_TICKS * 100)

  useEffect(() => {
    const change = () => setVisible(!document.hidden)
    change()
    document.addEventListener('visibilitychange', change)
    return () => document.removeEventListener('visibilitychange', change)
  }, [])
  useEffect(() => {
    if (!playing) return
    const timer = window.setInterval(() => dispatch({ type: 'tick' }), 140 / speed)
    return () => window.clearInterval(timer)
  }, [playing, speed])

  const reset = () => { dispatch({type:'reset'}); setInspected(null) }
  const outputFraction = Math.max(0, Math.min(1, (state.tick - 4 * TICKS_PER_STEP) / TICKS_PER_STEP))
  const response = steps[4].output

  return <section className={`project-demo demo-${kind} ${playing ? 'is-playing' : ''}`} aria-label={t('Demostración interactiva', 'Interactive demonstration')}>
    <div className="demo-heading"><div><span className="demo-kicker">ARCHIVE95 LABS / {t('MODO DEMO', 'DEMO MODE')}</span><h1>{title}</h1></div><span className="demo-offline"><i/>{t('Simulación local', 'Local simulation')}</span></div>
    {(kind === 'relay' || kind === 'ai') && <><div className="demo-controls">
      <button type="button" className="demo-run" onClick={() => {setInspected(null); dispatch({type:'toggle'})}}>{state.running ? 'Ⅱ ' + t('Pausar', 'Pause') : done ? '↻ ' + t('Repetir', 'Replay') : '▶ ' + t('Ejecutar', 'Run')}</button>
      <button type="button" disabled={done} onClick={() => { setInspected(null); dispatch({type:'step'}) }}>▸| {t('Paso', 'Step')}</button>
      <button type="button" onClick={reset}>↺ {t('Reiniciar', 'Reset')}</button>
      <label htmlFor={`${id}-speed`}>{t('Velocidad', 'Speed')}</label><select id={`${id}-speed`} value={speed} onChange={e=>setSpeed(Number(e.target.value))}><option value={1}>1×</option><option value={2}>2×</option></select>
    </div>
    {kind === 'relay' && <div className="demo-scenario"><label htmlFor={`${id}-scenario`}>{t('Escenario de ejemplo', 'Example scenario')}</label><select id={`${id}-scenario`} value={scenario} onChange={e=>{setScenario(Number(e.target.value));reset()}}>{choices.map((c,i)=><option value={i} key={i}>{c}</option>)}</select></div>}</>}

    {kind === 'relay' && <RelayPlayground steps={steps} tick={state.tick} alternate={scenario===1} select={setInspected}/>}
    {kind === 'lab' && <LabPlayground/>}
    {kind === 'nas' && <NasPlayground/>}
    {kind === 'ai' && <div className="prompt-choices">{choices.map((choice,i)=><button key={choice} onClick={()=>{setScenario(i);reset();dispatch({type:'toggle'})}}>▶ {choice}</button>)}</div>}
    {kind === 'ai' && <div className="ai-workstation">
      <div className="demo-hardware"><OsIcon name="pc" size={48}/><b>LOCALHOST</b><span>Qwen / GGUF</span><div className="demo-chip">GPU<span className={active >= 1 && active < 5 ? 'chip-on' : ''}/></div><div className="demo-memory"><span style={{transform:`scaleX(${Math.min(1,state.tick/24)})`}}/></div><small>{t('Carga de modelo ilustrativa', 'Illustrative model loading')}</small><span className="demo-cable"/></div>
      <div className="demo-console"><div className="console-label">INFERENCE.EXE · {t('respuesta predefinida', 'predefined response')}</div><p className="console-muted">C:\LOCAL_AI&gt; load model.gguf</p><p>{complete >= 2 ? '[OK] Model loaded' : '[…] Awaiting model'}</p><p className="console-prompt">{complete >= 3 ? '> '+steps[2].input : '> _'}</p><p className="console-answer">{response.slice(0,Math.floor(response.length*outputFraction))}<span className={playing ? 'demo-caret' : ''}>▌</span></p><p className="console-muted">{done ? '[DONE] '+t('Sesión finalizada', 'Session complete') : outputFraction > 0 ? t('Respuesta de ejemplo en curso.', 'Example response in progress.') : t('Los tokens aparecerán al ejecutar.', 'Run to see the output tokens appear.')}</p></div>
    </div>}

    {(kind === 'relay' || kind === 'ai') && <><div className="demo-progress"><div className="demo-meter" role="progressbar" aria-label={t('Progreso de la demo', 'Demo progress')} aria-valuenow={progress} aria-valuemin={0} aria-valuemax={100}><span style={{transform:`scaleX(${state.tick/TOTAL_TICKS})`}}/></div><b>{progress}%</b></div>
    <div className="demo-status" role="status">{done ? '✓ '+t('Simulación completada', 'Simulation complete') : state.tick === 0 && !state.running ? t('Listo. Pulsa Ejecutar o avanza paso a paso.', 'Ready. Press Run or advance one step at a time.') : `${state.running ? t('Ejecutando', 'Running') : t('En pausa', 'Paused')} — ${stage+1}/6 · ${steps[stage].name}`}</div>
    <details className="technical-details"><summary>{t('Inspeccionar pasos y registro', 'Inspect steps and execution log')}</summary><div className="demo-detail"><div className="demo-inspector"><div className="demo-panel-title">{t('INSPECTOR DE NODOS', 'NODE INSPECTOR')}<span>{selected+1}/6</span></div><div className="demo-step-buttons" aria-label={t('Pasos', 'Steps')}>{steps.map((s,i)=><button type="button" key={i} aria-label={s.name} aria-pressed={selected===i} onClick={()=>setInspected(i)}>{complete>i?'✓':i+1}</button>)}</div><h2><OsIcon name={current.icon} size={16}/>{current.name}</h2><p>{current.note}</p><dl><dt>INPUT</dt><dd><pre>{current.input}</pre></dd><dt>{t('SALIDA DE EJEMPLO', 'EXAMPLE OUTPUT')}</dt><dd><pre>{current.output}</pre></dd></dl></div>
    <div className="demo-log"><div className="demo-panel-title">EXECUTION.LOG <span>{complete}/6</span></div><ol>{steps.map((step,i)=><li key={i} className={complete>i?'log-done':active===i?'log-active':''}><span>{complete>i?'[OK]':active===i?'[RUN]':'[ — ]'}</span><span>{step.name}</span></li>)}</ol><p>{t('Datos de ejemplo · sin servicios conectados', 'Sample data · no connected services')}</p></div></div>
    </details></>}
    <p className="demo-footnote">{t('Demo visual simplificada. Los resultados y tiempos son ilustrativos; consulta el dossier para el alcance real.', 'Simplified visual demo. Results and timings are illustrative; see the dossier for the actual project scope.')}</p>
  </section>
}
