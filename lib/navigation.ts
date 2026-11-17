import { basePath, homePath, projectPath, projects, type Lang } from './content'

export type DocumentRoute = { lang: Lang; slug?: string; cv?: boolean }
export const cvPath = (lang: Lang) => lang === 'en' ? '/en/cv' : '/cv'
export const documentPath = ({ lang, slug, cv }: DocumentRoute) => slug ? projectPath(lang, slug) : cv ? cvPath(lang) : homePath(lang)
export function parseDocumentRoute(fullPath: string, search = ''): DocumentRoute {
  // Drop the base path and any trailing slash (static hosts add one) before reading the route.
  const path = (basePath && fullPath.startsWith(basePath) ? fullPath.slice(basePath.length) : fullPath).replace(/(.)\/+$/, '$1') || '/'
  const lang = path === '/en' || path.startsWith('/en/') || (path === '/cv' && new URLSearchParams(search).get('lang') === 'en') ? 'en' : 'es'
  const slug = path.match(/\/projects\/([^/]+)$/)?.[1]
  return { lang, ...(slug && projects.some(p => p.slug === slug) ? { slug } : {}), ...(/\/cv$/.test(path) ? { cv: true } : {}) }
}
