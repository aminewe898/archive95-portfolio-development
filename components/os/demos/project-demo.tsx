'use client'

import { useEffect, useId, useReducer, useState } from 'react'
import { OsIcon } from '../icons'
import { useOs } from '../os-context'
import { demoScenario, type DemoKind, type DemoStep } from './scenarios'
import { playbackReducer, TICKS_PER_STEP, TOTAL_TICKS } from './playback'

const kinds: Record<string, DemoKind> = { relay: 'relay', 'local-ai-server': 'ai', 'homelab-cloud': 'lab', 'raspberry-pi-nas': 'nas' }
const locations = [[12.5,27],[50,27],[87.5,27],[87.5,73],[50,73],[12.5,73]]
const paths = ['M80 81H320', 'M320 81H560', 'M560 81V219', 'M560 219H320', 'M320 219H80']

function NodeMap({ steps, complete, active, selected, select, network }: { steps: DemoStep[]; complete: number; active: number; selected: number; select: (i: number) => void; network: boolean }) {
  const { t } = useOs()
  return <div className={`demo-map ${network ? 'demo-network' : ''}`}>
    <svg viewBox="0 0 640 300" preserveAspectRatio="none" aria-hidden="true" className="demo-wires">
      {paths.map((d,i) => <g key={d}><path d={d} className="demo-wire"/><path d={d} className={`demo-wire ${complete > i ? 'wire-done' : ''} ${active === i + 1 ? 'wire-active' : ''}`} /></g>)}
    </svg>
    {steps.map((step,i) => <button type="button" key={i} className={`demo-node ${complete > i ? 'node-done' : ''} ${active === i ? 'node-active' : ''} ${selected === i ? 'node-selected' : ''}`} style={{ left: `${locations[i][0]}%`, top: `${locations[i][1]}%` }} onClick={() => select(i)} aria-pressed={selected === i} aria-label={`${i+1}. ${step.name}`}>
      <span className="node-port port-in"/><span className="node-port port-out"/>
      <span className="node-icon"><OsIcon name={step.icon} size={32}/></span>
      <b>{step.name}</b><small>{complete > i ? '✓ ' + t('Listo', 'Done') : active === i ? '● ' + t('Procesando', 'Processing') : String(i+1).padStart(2,'0')}</small>
    </button>)}
    <span className="demo-map-caption">{network ? 'NETWORK TOPOLOGY / LAB' : 'VOICE → TICKET / n8n'} · {t('Haz clic para inspeccionar', 'Click to inspect')}</span>
  </div>
}

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
  const copyFraction = Math.max(0, Math.min(1, (state.tick - 3 * TICKS_PER_STEP) / TICKS_PER_STEP))
  const response = steps[4].output

  return <section className={`project-demo demo-${kind} ${playing ? 'is-playing' : ''}`} aria-label={t('Demostración interactiva', 'Interactive demonstration')}>
    <div className="demo-heading"><div><span className="demo-kicker">ARCHIVE95 LABS / {t('MODO DEMO', 'DEMO MODE')}</span><h1>{title}</h1></div><span className="demo-offline"><i/>{t('Simulación local', 'Local simulation')}</span></div>
    <div className="demo-controls">
      <button type="button" className="demo-run" onClick={() => {setInspected(null); dispatch({type:'toggle'})}}>{state.running ? 'Ⅱ ' + t('Pausar', 'Pause') : done ? '↻ ' + t('Repetir', 'Replay') : '▶ ' + t('Ejecutar', 'Run')}</button>
      <button type="button" disabled={done} onClick={() => { setInspected(null); dispatch({type:'step'}) }}>▸| {t('Paso', 'Step')}</button>
      <button type="button" onClick={reset}>↺ {t('Reiniciar', 'Reset')}</button>
      <label htmlFor={`${id}-speed`}>{t('Velocidad', 'Speed')}</label><select id={`${id}-speed`} value={speed} onChange={e=>setSpeed(Number(e.target.value))}><option value={1}>1×</option><option value={2}>2×</option></select>
    </div>
    <div className="demo-scenario"><label htmlFor={`${id}-scenario`}>{t('Escenario de ejemplo', 'Example scenario')}</label><select id={`${id}-scenario`} value={scenario} onChange={e=>{setScenario(Number(e.target.value));reset()}}>{choices.map((c,i)=><option value={i} key={i}>{c}</option>)}</select></div>

    {(kind === 'relay' || kind === 'lab') && <NodeMap steps={steps} complete={complete} active={active} selected={selected} select={setInspected} network={kind === 'lab'}/>}
    {kind === 'ai' && <div className="ai-workstation">
      <div className="demo-hardware"><OsIcon name="pc" size={48}/><b>LOCALHOST</b><span>Qwen / GGUF</span><div className="demo-chip">GPU<span className={active >= 1 && active < 5 ? 'chip-on' : ''}/></div><div className="demo-memory"><span style={{transform:`scaleX(${Math.min(1,state.tick/24)})`}}/></div><small>{t('Carga de modelo ilustrativa', 'Illustrative model loading')}</small><span className="demo-cable"/></div>
      <div className="demo-console"><div className="console-label">INFERENCE.EXE · {t('respuesta predefinida', 'predefined response')}</div><p className="console-muted">C:\LOCAL_AI&gt; load model.gguf</p><p>{complete >= 2 ? '[OK] Model loaded' : '[…] Awaiting model'}</p><p className="console-prompt">{complete >= 3 ? '> '+steps[2].input : '> _'}</p><p className="console-answer">{response.slice(0,Math.floor(response.length*outputFraction))}<span className={playing ? 'demo-caret' : ''}>▌</span></p><p className="console-muted">{done ? '[DONE] '+t('Sesión finalizada', 'Session complete') : outputFraction > 0 ? t('Respuesta de ejemplo en curso.', 'Example response in progress.') : t('Los tokens aparecerán al ejecutar.', 'Run to see the output tokens appear.')}</p></div>
    </div>}
    {kind === 'nas' && <div className="nas-workspace"><div className="nas-transfer"><div><OsIcon name="computer" size={48}/><b>LAPTOP</b></div><div className="nas-lane"><span className="nas-track"/><span className="nas-packet" style={{left:`${10+copyFraction*70}%`}}><OsIcon name="file" size={24}/></span></div><div><OsIcon name="hardware" size={48}/><b>PI / ARCHIVE</b></div></div><div className="nas-dialog"><b>{done ? t('Copia completada', 'Copy complete') : state.tick < 36 ? t('Preparando la transferencia', 'Preparing transfer') : t('Copiando y verificando…', 'Copying and verifying…')}</b><p>{t('De', 'From')}: C:\{scenario ? 'CONFIGS' : 'DOCUMENTS'}　→　\\PI\ARCHIVE</p><div className="demo-meter" role="progressbar" aria-label={t('Transferencia', 'Transfer')} aria-valuenow={Math.round(copyFraction*100)} aria-valuemin={0} aria-valuemax={100}><span style={{transform:`scaleX(${copyFraction})`}}/></div><ul className="nas-files">{steps[0].output.split('\n').map((file,i)=><li key={file}><OsIcon name="file" size={16}/>{file}<span>{copyFraction >= (i+1)/3 ? '✓' : '…'}</span></li>)}</ul><small>{complete >= 5 ? '✓ '+t('Sumas verificadas', 'Checksums verified') : t('Archivos ficticios; no se accede a tu disco.', 'Example files; your disk is not accessed.')}</small></div></div>}

    <div className="demo-progress"><div className="demo-meter" role="progressbar" aria-label={t('Progreso de la demo', 'Demo progress')} aria-valuenow={progress} aria-valuemin={0} aria-valuemax={100}><span style={{transform:`scaleX(${state.tick/TOTAL_TICKS})`}}/></div><b>{progress}%</b></div>
    <div className="demo-status" role="status">{done ? '✓ '+t('Simulación completada', 'Simulation complete') : state.tick === 0 && !state.running ? t('Listo. Pulsa Ejecutar o avanza paso a paso.', 'Ready. Press Run or advance one step at a time.') : `${state.running ? t('Ejecutando', 'Running') : t('En pausa', 'Paused')} — ${stage+1}/6 · ${steps[stage].name}`}</div>
    <div className="demo-detail"><div className="demo-inspector"><div className="demo-panel-title">{t('INSPECTOR DE NODOS', 'NODE INSPECTOR')}<span>{selected+1}/6</span></div><div className="demo-step-buttons" aria-label={t('Pasos', 'Steps')}>{steps.map((s,i)=><button type="button" key={i} aria-label={s.name} aria-pressed={selected===i} onClick={()=>setInspected(i)}>{complete>i?'✓':i+1}</button>)}</div><h2><OsIcon name={current.icon} size={16}/>{current.name}</h2><p>{current.note}</p><dl><dt>INPUT</dt><dd><pre>{current.input}</pre></dd><dt>{t('SALIDA DE EJEMPLO', 'EXAMPLE OUTPUT')}</dt><dd><pre>{current.output}</pre></dd></dl></div>
    <div className="demo-log"><div className="demo-panel-title">EXECUTION.LOG <span>{complete}/6</span></div><ol>{steps.map((step,i)=><li key={i} className={complete>i?'log-done':active===i?'log-active':''}><span>{complete>i?'[OK]':active===i?'[RUN]':'[ — ]'}</span><span>{step.name}</span></li>)}</ol><p>{t('Datos de ejemplo · sin servicios conectados', 'Sample data · no connected services')}</p></div></div>
    <p className="demo-footnote">{t('Demo visual simplificada. Los resultados y tiempos son ilustrativos; consulta el dossier para el alcance real.', 'Simplified visual demo. Results and timings are illustrative; see the dossier for the actual project scope.')}</p>
  </section>
}
