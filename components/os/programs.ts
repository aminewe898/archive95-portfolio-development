import { profile, projects } from '@/lib/content'
import type { AppId } from './os-context'

export const projectFile = (slug: string) => (slug === 'relay' ? 'RELAY.EXE' : `${slug.toUpperCase().replace(/-/g, '_').slice(0, 12)}.DOC`)

export type Program = { app: AppId; arg?: string } | { url: string }

const aliases: Record<string, AppId> = {
  cmd: 'terminal',
  command: 'terminal',
  dos: 'terminal',
  terminal: 'terminal',
  winmine: 'mines',
  minesweeper: 'mines',
  buscaminas: 'mines',
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
  const name = input.trim().toLowerCase().replace(/^[a-z]:\\.*\\/, '').replace(/\.exe$/, '')
  if (!name) return null
  if (name === 'github' || name.startsWith('http')) return { url: name.startsWith('http') ? input.trim() : profile.github }
  if (aliases[name]) return { app: aliases[name] }
  const project = projects.find((p) => p.slug === name || projectFile(p.slug).toLowerCase().replace(/\.(exe|doc)$/, '') === name || p.slug.startsWith(name))
  if (project) return { app: 'project', arg: project.slug }
  return null
}
