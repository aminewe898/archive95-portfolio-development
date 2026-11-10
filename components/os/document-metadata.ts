import { pageMetadata } from '@/lib/seo'
import { projects } from '@/lib/content'
import type { DocumentRoute } from '@/lib/navigation'

// The desktop uses native history so its open windows survive navigation.
// Keep the initial server metadata and the current document in agreement.
export function syncDocumentMetadata(route: DocumentRoute) {
  const metadata = pageMetadata(route.lang, projects.find(p => p.slug === route.slug), route.cv)
  const title = (metadata.title as { absolute: string }).absolute
  document.title = title
  document.documentElement.lang = route.lang
  const setMeta = (attribute: 'name' | 'property', name: string, content: string) => {
    let tag = document.head.querySelector<HTMLMetaElement>(`meta[${attribute}="${name}"]`)
    if (!tag) { tag = document.createElement('meta'); tag.setAttribute(attribute, name); document.head.append(tag) }
    tag.content = content
  }
  const link = (rel: string, href: string, language?: string) => {
    const selector = language ? `link[rel="${rel}"][hreflang="${language}"]` : `link[rel="${rel}"]`
    let tag = document.head.querySelector<HTMLLinkElement>(selector)
    if (!tag) { tag = document.createElement('link'); tag.rel = rel; if (language) tag.hreflang = language; document.head.append(tag) }
    tag.href = href
  }
  setMeta('name', 'description', String(metadata.description))
  setMeta('property', 'og:title', title)
  setMeta('property', 'og:description', String(metadata.description))
  setMeta('property', 'og:url', String(metadata.alternates!.canonical))
  setMeta('property', 'og:locale', route.lang === 'es' ? 'es_ES' : 'en_GB')
  setMeta('property', 'og:locale:alternate', route.lang === 'es' ? 'en_GB' : 'es_ES')
  setMeta('name', 'twitter:title', title)
  setMeta('name', 'twitter:description', String(metadata.description))
  link('canonical', String(metadata.alternates!.canonical))
  for (const [lang, href] of Object.entries(metadata.alternates!.languages!)) link('alternate', String(href), lang)
}
