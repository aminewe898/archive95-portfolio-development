'use client'

import Image from 'next/image'
import type { Project } from '@/lib/content'
import { useOs } from '../os-context'

const relayRoot = 'https://github.com/aminewe898/relay/blob/5bb1557774d68aa4a1ec34c5491797376b9293bf'
const cyberRoot = 'https://github.com/aminewe898/cyberdeck/blob/e43f51ebd2956e9339247cd0bf2417b410bc57b2'
const cloudRoot = 'https://github.com/aminewe898/cloudlink/blob/27024599e62ecbfec8ca088fc1bf99365fbcdc55'

export function ProjectEvidence({ project: p, readDossier }: { project: Project; readDossier: () => void }) {
  const { t, lang } = useOs()
  const related = p.slug === 'homelab-cloud' || p.slug === 'raspberry-pi-nas'
  return <aside className="project-evidence">
    <span className="evidence-kicker">{t('DETRÁS DE LA DEMO', 'BEHIND THE DEMO')}</span>
    <h2>{t('Lo que construí', 'What I built')}</h2>
    <p>{p.sections[0].body[lang]}</p>
    <details className="evidence-notes"><summary>{t('Aprendizajes y alcance', 'Lessons and scope')}</summary><p>{p.sections[p.slug === 'relay' ? 3 : 1].body[lang]}</p><button onClick={readDossier}>{t('Leer el dossier completo', 'Read the full dossier')}</button></details>
    {p.slug === 'relay' ? <div className="source-cards">
      <a href={`${relayRoot}/n8n/workflows/TI-02-intake-worker.json`} target="_blank" rel="noreferrer"><b>{t('Worker n8n', 'n8n worker')} ↗</b><span>{t('Workflow real: transcripción y extracción.', 'Actual workflow: transcription and extraction.')}</span></a>
      <a href={`${relayRoot}/docs/architecture.md`} target="_blank" rel="noreferrer"><b>{t('Arquitectura', 'Architecture')} ↗</b><span>{t('Cola persistente, workers y outbox.', 'Durable queue, workers and outbox.')}</span></a>
      <a href={`${relayRoot}/docs/PORTFOLIO_VALIDATION.md`} target="_blank" rel="noreferrer"><b>{t('Validación documentada', 'Documented validation')} ↗</b><span>{t('Comprobaciones de código; aceptación con proveedores pendiente.', 'Code checks recorded; provider acceptance remains separate.')}</span></a>
    </div> : <p className="evidence-pending">{t('La documentación específica de este laboratorio se añadirá próximamente.', 'Documentation for this specific lab will be added later.')}</p>}
    {related && <details className="related-evidence"><summary>{t('Trabajo relacionado en GitHub', 'Related work on GitHub')} · {p.slug === 'homelab-cloud' ? 'Cyberdeck' : 'CloudLink'}</summary>
      {p.slug === 'homelab-cloud' ? <><p>{t('Cyberdeck es mi dashboard Python/Flask para métricas de Linux y Raspberry Pi. Su código consulta servicios y transmite métricas por SSE. Es un proyecto relacionado; no documenta la topología Proxmox de esta demo.', 'Cyberdeck is my Python/Flask dashboard for Linux and Raspberry Pi metrics. Its source checks service status and streams metrics over SSE. It is related work; it does not document this demo’s Proxmox topology.')}</p><div className="source-cards"><a href={`${cyberRoot}/cyberdeck/server.py`} target="_blank" rel="noreferrer">{t('Código de monitorización', 'Monitoring source')} ↗</a><a href={`${cyberRoot}/docs/PORTFOLIO_VALIDATION.md`} target="_blank" rel="noreferrer">{t('Pruebas con métricas simuladas; hardware sin verificar', 'Tests use mocked metrics; hardware unverified')} ↗</a></div></> : <div className="screenshot-evidence"><a href="/evidence/cloudlink-dashboard.png" target="_blank" rel="noreferrer" aria-label={t('Ampliar captura de CloudLink', 'Enlarge CloudLink screenshot')}><Image src="/evidence/cloudlink-dashboard.png" width={1080} height={2400} alt={t('Pantalla de CloudLink con una entrada de servidor Raspberry Pi', 'CloudLink server list with a Raspberry Pi entry')} /></a><div><h3>CloudLink</h3><p>{t('Cliente Android SSH/SFTP para administrar servidores. Esta captura del repositorio muestra la lista de servidores, no una transferencia ni la configuración Samba del NAS.', 'An Android SSH/SFTP client for managing servers. This repository screenshot shows the server list, not a transfer or the NAS Samba configuration.')}</p><p><a href={`${cloudRoot}/docs/screenshots/dashboard.png`} target="_blank" rel="noreferrer">{t('Captura original', 'Original screenshot')} ↗</a></p><p><a href={`${cloudRoot}/docs/ARCHITECTURE.md`} target="_blank" rel="noreferrer">{t('Arquitectura', 'Architecture')} ↗</a> · <a href={`${cloudRoot}/docs/PORTFOLIO_VALIDATION.md`} target="_blank" rel="noreferrer">{t('Validación', 'Validation')} ↗</a></p><small>{t('CI Android documentada; pruebas físicas SSH/SFTP y firma de release no repetidas.', 'Android CI is documented; physical SSH/SFTP tests and release signing were not repeated.')}</small></div></div>}
    </details>}
  </aside>
}
