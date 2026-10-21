import { profile, projects } from '@/lib/content'
import type { IconName } from './icons'
import type { AppId } from './os-context'

const projectFiles: Record<string, string> = {
  relay: 'RELAY.EXE',
  'local-ai-server': 'LOCAL_AI.DOC',
  'homelab-cloud': 'HOMELAB.DOC',
  'raspberry-pi-nas': 'PI_NAS.DOC',
}
export const projectFile = (slug: string) => projectFiles[slug] ?? `${slug.toUpperCase().replace(/-/g, '_').slice(0, 8)}.DOC`

export const projectIcon = (slug: string): IconName => ({relay:'automation','local-ai-server':'pc','homelab-cloud':'network','raspberry-pi-nas':'hardware'} as Record<string,IconName>)[slug] ?? 'doc'
export const projectAppName = (slug: string) => ({relay:'Relay · Workflow Playground','local-ai-server':'Local AI · Inference Console','homelab-cloud':'Homelab · Network Monitor','raspberry-pi-nas':'Pi NAS · File Explorer'} as Record<string,string>)[slug] ?? projectFile(slug)

export type Program = { app: AppId; arg?: string } | { url: string }

const aliases: Record<string, AppId> = {
  cmd: 'terminal',
  command: 'terminal',
  dos: 'terminal',
  terminal: 'terminal',
  winmine: 'mines',
  minesweeper: 'mines',
  buscaminas: 'mines',
  snake: 'snake',
  serpiente: 'snake',
  notepad: 'notepad',
  readme: 'notepad',
  'readme.txt': 'notepad',
  mail: 'mail',
  outlook: 'mail',
  contact: 'mail',
  contacto: 'mail',
  explorer: 'projects',
  projects: 'projects',
  proyectos: 'projects',
  cv: 'resume',
  resume: 'resume',
  'resume.doc': 'resume',
  'cv.doc': 'resume',
  control: 'skills',
  skills: 'skills',
  about: 'about',
  sysinfo: 'about',
  mycomputer: 'about',
  desk: 'display',
  display: 'display',
  welcome: 'welcome',
  recycle: 'recycle',
}

export function resolveProgram(input: string): Program | null {
  const name = input.trim().toLowerCase().replace(/^[a-z]:\\.*\\/, '').replace(/\.(exe|doc)$/, '')
  if (!name) return null
  if (name === 'github' || name.startsWith('http')) return { url: name.startsWith('http') ? input.trim() : profile.github }
  if (aliases[name]) return { app: aliases[name] }
  const project = projects.find((p) => p.slug === name || projectFile(p.slug).toLowerCase().replace(/\.(exe|doc)$/, '') === name || p.slug.startsWith(name))
  if (project) return { app: 'project', arg: project.slug }
  return null
}
