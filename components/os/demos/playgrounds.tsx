'use client'

import { useId, useRef, useState } from 'react'
import { OsIcon } from '../icons'
import { useOs } from '../os-context'
import type { DemoStep } from './scenarios'

const initialPoints = [[14,16],[50,16],[86,16],[50,43],[22,67],[78,67],[50,88]]

export function RelayPlayground({ steps, tick, alternate, select }: { steps: DemoStep[]; tick: number; alternate: boolean; select: (index: number) => void }) {
  const { t } = useOs()
  const arrowId = useId()
  const inspector = useRef<HTMLDetailsElement>(null)
  const [points, setPoints] = useState(initialPoints)
  const [chosen, setChosen] = useState(0)
  const drag = useRef<{ id: number; x: number; y: number; point: number[] } | null>(null)
  const stage = Math.min(5, Math.floor(tick / 12))
  const route = [0,1,2,3,alternate ? 5 : 4,6]
  const nodes = [...steps.slice(0,4), { ...steps[4], name: t('Crear ticket', 'Create ticket'), icon: 'doc' as const }, { ...steps[4], name: t('Pedir aclaración', 'Request clarification'), icon: 'user' as const }, steps[5]]
  const edges = [[0,1],[1,2],[2,3],[3,4],[3,5],[4,6],[5,6]]
  const position = (index: number, x: number, y: number) => setPoints(p => p.map((point,i) => i === index ? [Math.max(10,Math.min(90,x)),Math.max(14,Math.min(88,y))] : point))
  const from = points[route[Math.max(0,stage-1)]]
  const to = points[route[stage]]
  const fraction = tick === 72 ? 1 : (tick % 12) / 12
  const payloads = [
    { event: 'voice', file: 'voice_note.ogg', sender: 'demo-user' },
    { authorized: true, job_id: 'DEMO-001', idempotency_key: 'sample-voice-001' },
    { job_id: 'DEMO-001', state: 'queued', checkpoint: 'received' },
    { transcript: alternate ? 'No funciona. ¿Podéis ayudar?' : 'La impresora de recepción no imprime.', fields: { asset: alternate ? null : 'printer', location: alternate ? null : 'reception' }, needs_review: alternate },
    { branch: 'create_ticket', ticket: 'DEMO-042', status: 'open', selected: !alternate },
    { branch: 'request_clarification', question: 'Which device is affected?', status: 'awaiting_details', selected: alternate },
    { channel: 'telegram', message: steps[5].output },
  ]
  return <div className="relay-playground">
    <div className="playground-hint"><span>{t('Arrastra los nodos · usa las flechas con un nodo enfocado', 'Drag nodes · use arrow keys with a node focused')}</span><button onClick={()=>setPoints(initialPoints)}>{t('Ordenar nodos', 'Arrange nodes')}</button></div>
    <div className="demo-map relay-map">
      <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="demo-wires" aria-hidden="true">
        <defs><marker id={arrowId} markerWidth="5" markerHeight="5" refX="4" refY="2.5" orient="auto" markerUnits="strokeWidth"><path d="M0 0L5 2.5L0 5Z" fill="#476963"/></marker></defs>
        {edges.map(([a,b]) => <line markerEnd={`url(#${arrowId})`} key={`${a}-${b}`} x1={points[a][0]} y1={points[a][1]} x2={points[b][0]} y2={points[b][1]} className={`relay-wire ${tick > 0 && route.slice(0,stage+(tick===72?1:0)).includes(a) && route.slice(0,stage+(tick===72?1:0)).includes(b) ? 'traversed' : ''}`}/>)}
        {tick > 0 && tick < 72 && <circle className="relay-packet" cx={from[0]+(to[0]-from[0])*fraction} cy={from[1]+(to[1]-from[1])*fraction} r="1.5"/>}
      </svg>
      {nodes.map((node,i) => <button key={i} type="button" aria-label={`${node.name} node`} aria-pressed={chosen===i} className={`demo-node ${chosen===i?'node-selected':''} ${tick>0 && route[stage]===i?'node-active':''} ${tick>=48 && (i===4 || i===5) && !route.includes(i)?'branch-skipped':''}`} style={{left:`${points[i][0]}%`,top:`${points[i][1]}%`}}
        onClick={()=>{setChosen(i);select(i===6?5:Math.min(i,4));if(inspector.current) inspector.current.open=true}}
        onPointerDown={e=>{if(e.button!==0)return; e.stopPropagation(); e.currentTarget.setPointerCapture(e.pointerId); drag.current={id:i,x:e.clientX,y:e.clientY,point:points[i]}}}
        onPointerMove={e=>{const d=drag.current;if(!d || d.id!==i)return;const rect=e.currentTarget.parentElement!.getBoundingClientRect();position(i,d.point[0]+(e.clientX-d.x)/rect.width*100,d.point[1]+(e.clientY-d.y)/rect.height*100)}}
        onPointerUp={()=>{drag.current=null}} onPointerCancel={()=>{drag.current=null}} onLostPointerCapture={()=>{drag.current=null}}
        onKeyDown={e=>{const delta:Record<string,number[]>={ArrowLeft:[-2,0],ArrowRight:[2,0],ArrowUp:[0,-2],ArrowDown:[0,2]};if(delta[e.key]){e.preventDefault();e.stopPropagation();position(i,points[i][0]+delta[e.key][0],points[i][1]+delta[e.key][1])}}}>
        <OsIcon name={node.icon} size={24}/><b>{node.name}</b><small>{i===4?'IF: complete':i===5?'ELSE: missing fields':String(i+1).padStart(2,'0')}</small>
      </button>)}
    </div>
    <div className="relay-story" aria-label={t('De voz a respuesta', 'From voice to reply')}>
      {[['01 / VOICE', '▂ ▅ ▃ █ ▅ ▂', 'voice_note.ogg'],['02 / TRANSCRIPT', tick>=48?String(payloads[3].transcript):'…', 'speech → text'],['03 / FIELDS', tick>=48?(alternate?'asset: ? → clarification':'asset: printer → ticket'):'…','text → structured data'],['04 / REPLY',tick>=72?steps[5].output:'…','outbox → Telegram']].map(([label,value,caption])=><div key={label}><b>{label}</b><p>{value}</p><small>{caption}</small></div>)}
    </div>
    <details ref={inspector} className="sample-json"><summary>{nodes[chosen].name} · {t('JSON de ejemplo', 'Sample JSON')}</summary><pre>{JSON.stringify(payloads[chosen],null,2)}</pre></details>
  </div>
}

export function LabPlayground() {
  const { t } = useOs()
  const [machine,setMachine] = useState(0)
  const [running,setRunning] = useState([true,true,true])
  const [log,setLog] = useState('Boot: all sample services healthy.')
  const machines = [{name:'GATEWAY',service:'reverse-proxy',ip:'192.0.2.1'}, {name:'VM 101 / LINUX',service:'web-server',ip:'192.0.2.10'}, {name:'MONITOR',service:'health-check',ip:'192.0.2.20'}]
  const current=machines[machine]
  const action=(start:boolean)=>{setRunning(s=>s.map((v,i)=>i===machine?start:v));setLog(`${current.name}: ${current.service} ${start?'restarted → running':'stopped'}.`)}
  return <section className="lab-playground"><div className="machine-list">{machines.map((m,i)=><button key={m.name} aria-pressed={machine===i} onClick={()=>setMachine(i)}><OsIcon name={i===0?'network':i===1?'pc':'desktop'} size={32}/><b>{m.name}</b><span className={running[i]?'service-up':'service-down'}>● {running[i]?'RUNNING':'STOPPED'}</span></button>)}</div><div className="service-panel"><h2>{current.name}</h2><code>{current.ip} · {current.service}</code><p>{t('Estado del servicio', 'Service state')}: <b>{running[machine]?'running':'stopped'}</b></p><button disabled={!running[machine]} onClick={()=>action(false)}>{t('Detener servicio', 'Stop service')}</button> <button onClick={()=>action(true)}>{t('Reiniciar servicio', 'Restart service')}</button><p role="status">{log}</p><div className="request-route" aria-label={t('Ruta de la petición', 'Request route')}>{machines.map((m,i)=><span key={m.name} className={running[i]?'route-up':'route-down'}>{i>0 && ' → '}{m.name}: {running[i]?'OK':'STOP'}</span>)}</div><div className="health-result">GET /health → {running.every(Boolean)?'200 OK':!running[0]?'503 Gateway unavailable':!running[1]?'502 Upstream unavailable':'Monitoring unavailable'}</div><small>{t('Laboratorio simulado. Las acciones no controlan equipos reales.', 'Simulated lab. These actions do not control real machines.')}</small></div></section>
}

const sampleFiles=['resume.pdf','network.png','readme.txt']
export function NasPlayground() {
  const { t } = useOs()
  const [files,setFiles]=useState<Record<string,string>>(()=>Object.fromEntries(sampleFiles.map(f=>[f,'Documents'])))
  const [selected,setSelected]=useState<string|null>(null)
  const [status,setStatus]=useState('')
  const move=(file:string|null,folder:string)=>{if(!file || !sampleFiles.includes(file))return;setFiles(prev=>({...prev,[file]:folder}));setStatus(`${file} → ${folder}`);setSelected(null)}
  return <section className="nas-playground"><p>{t('Arrastra archivos entre carpetas, o selecciona un archivo y pulsa Mover aquí.', 'Drag files between folders, or select a file and press Move here.')}</p><div className="nas-folders">{['Documents','Archive','Backups'].map(folder=><div className="nas-folder" key={folder} onDragOver={e=>e.preventDefault()} onDrop={e=>{e.preventDefault();move(e.dataTransfer.getData('text/archive95-file'),folder)}}><h3><OsIcon name="folderOpen" size={24}/>{folder}</h3><div className="folder-files">{sampleFiles.filter(f=>files[f]===folder).map(file=><button draggable key={file} aria-pressed={selected===file} onClick={()=>setSelected(file)} onDragStart={e=>{e.dataTransfer.setData('text/archive95-file',file);e.dataTransfer.effectAllowed='move';setSelected(file)}}><OsIcon name="file" size={24}/>{file}</button>)}</div><button disabled={!selected || files[selected]===folder} onClick={()=>move(selected,folder)}>{t('Mover aquí', 'Move here')}</button></div>)}</div><p role="status">{status || t('Solo archivos ficticios en memoria.', 'Sample files in memory only.')}</p><button onClick={()=>{setFiles(Object.fromEntries(sampleFiles.map(f=>[f,'Documents'])));setSelected(null);setStatus(t('Carpetas restablecidas.', 'Folders reset.'))}}>{t('Restablecer carpetas', 'Reset folders')}</button></section>
}
