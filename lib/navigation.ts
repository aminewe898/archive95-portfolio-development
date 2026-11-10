import { homePath, projectPath, projects, type Lang } from './content'

export type DocumentRoute = { lang: Lang; slug?: string; cv?: boolean }
export const cvPath = (lang: Lang) => lang === 'en' ? '/en/cv' : '/cv'
export const documentPath = ({ lang, slug, cv }: DocumentRoute) => slug ? projectPath(lang, slug) : cv ? cvPath(lang) : homePath(lang)
export function parseDocumentRoute(path: string, search = ''): DocumentRoute {
  const lang = path === '/en' || path.startsWith('/en/') || (path === '/cv' && new URLSearchParams(search).get('lang') === 'en') ? 'en' : 'es'
  const slug = path.match(/\/projects\/([^/]+)$/)?.[1]
  return { lang, ...(slug && projects.some(p => p.slug === slug) ? { slug } : {}), ...(/\/cv$/.test(path) ? { cv: true } : {}) }
}
