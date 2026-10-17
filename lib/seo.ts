import type { Metadata } from 'next'
import { profile, projectPath, homePath, siteUrl, type Lang, type Project } from './content'

export function pageMetadata(lang: Lang, project?: Project, cv = false): Metadata {
  const path = cv ? `/cv?lang=${lang}` : project ? projectPath(lang, project.slug) : homePath(lang)
  const es = cv ? '/cv?lang=es' : project ? projectPath('es', project.slug) : '/'
  const en = cv ? '/cv?lang=en' : project ? projectPath('en', project.slug) : '/en'
  const title = cv ? `CV — ${profile.name}` : project ? `${project.name[lang]} — ${project.category[lang]} | ${profile.name}` : lang === 'es' ? `${profile.name} — Técnico de sistemas y redes en Reus` : `${profile.name} — Systems & network technician in Reus`
  const description = project?.summary[lang] ?? (lang === 'es' ? 'Portfolio de Mohamed Amine Aslimani: sistemas Linux, redes, automatización con n8n e IA local. Técnico junior en Reus, disponible para oportunidades y prácticas.' : 'Mohamed Amine Aslimani’s portfolio: Linux systems, networking, n8n automation and local AI. Junior technician in Reus, Spain, available for roles and internships.')
  const images = [{ url: `${siteUrl}/art/social.webp`, width: 1200, height: 630, alt: `${profile.name} — Archive95 portfolio` }]
  return {
    title: { absolute: title }, description,
    authors: [{ name: profile.name, url: profile.github }],
    alternates: { canonical: `${siteUrl}${path}`, languages: { es: `${siteUrl}${es}`, en: `${siteUrl}${en}`, 'x-default': `${siteUrl}${es}` } },
    openGraph: { title, description, url: `${siteUrl}${path}`, siteName: 'Archive95', type: 'website', locale: lang === 'es' ? 'es_ES' : 'en_GB', alternateLocale: [lang === 'es' ? 'en_GB' : 'es_ES'], images },
    twitter: { card: 'summary_large_image', title, description, images },
  }
}
