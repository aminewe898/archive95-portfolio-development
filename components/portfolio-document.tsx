'use client'

import { useEffect } from 'react'
import { cvPath } from '@/lib/navigation'
import { about, asset, chronology, skills, languages, homePath, profile, projectPath, projects, siteUrl, type Lang } from '@/lib/content'

// A real reading alternative: the same server-rendered document is available to
// visitors, assistive technology and crawlers, including without JavaScript.
export function PortfolioDocument({ lang, slug, cv = false }: { lang: Lang; slug?: string; cv?: boolean }) {
  useEffect(() => {
    const focusReading = () => {
      if (window.location.hash === '#portfolio-document') document.getElementById('portfolio-document')?.focus()
      else if (window.location.hash === '#desktop') document.getElementById('desktop')?.focus()
    }
    focusReading()
    window.addEventListener('hashchange', focusReading)
    return () => window.removeEventListener('hashchange', focusReading)
  }, [lang, slug, cv])
  const p = projects.find(project => project.slug === slug)
  const t = (es: string, en: string) => lang === 'es' ? es : en
  const path = p ? projectPath(lang, p.slug) : cv ? cvPath(lang) : homePath(lang)
  const data = {
    '@context': 'https://schema.org', '@type': p ? 'WebPage' : 'ProfilePage',
    url: `${siteUrl}${path}`, inLanguage: lang,
    name: p ? `${p.name[lang]} — ${profile.name}` : profile.name,
    mainEntity: p ? { '@type': 'CreativeWork', name: p.name[lang], description: p.summary[lang], author: { '@id': `${siteUrl}/#person` }, keywords: p.technologies.join(', '), ...(p.evidence ? { citation: p.evidence.map(e=>e.url) } : {}) } : { '@id': `${siteUrl}/#person` },
  }
  return <>
    <a href="#portfolio-document" className="reading-link">{t('Leer portfolio', 'Read portfolio')}</a>
    <section id="portfolio-document" className="portfolio-document window" lang={lang} tabIndex={-1} aria-label={t('Portfolio en modo lectura', 'Portfolio reading view')} onKeyDown={e=>{if(e.key==='Escape')window.location.hash='desktop'}} >
      <div className="title-bar"><div className="title-bar-text">PORTFOLIO.TXT — {profile.name}</div><a href="#desktop" className="reading-close" aria-label={t('Volver al escritorio', 'Return to desktop')}>×</a></div>
      <main className="portfolio-paper">
        <nav aria-label={t('Navegación del portfolio', 'Portfolio navigation')}><a href={asset(homePath(lang))}>{t('Inicio', 'Home')}</a> · <a href={`${asset('')}${p ? projectPath(lang === 'es' ? 'en' : 'es', p.slug) : cv ? cvPath(lang === 'es' ? 'en' : 'es') : homePath(lang === 'es' ? 'en' : 'es')}#portfolio-document`} hrefLang={lang === 'es' ? 'en' : 'es'}>{lang === 'es' ? 'English' : 'Español'}</a> · <a href={`mailto:${profile.email}`}>{t('Contacto', 'Contact')}</a></nav>
        <h1>{p ? p.name[lang] : profile.name}</h1>
        <p className="reading-lead">{p ? p.summary[lang] : `${profile.role[lang]} · Reus, ${t('España', 'Spain')}`}</p>
        {p ? <><p>{p.technologies.join(' · ')}</p>{p.sections.map(s=><section key={s.title.en}><h2>{s.title[lang]}</h2><p>{s.body[lang]}</p></section>)}{p.evidence && <section><h2>{t('Código y evidencia', 'Source and evidence')}</h2><ul>{p.evidence.map(e=><li key={e.url}><a href={e.url}>{e.label[lang]}</a></li>)}</ul></section>}</> : <><p>{about[lang]}</p><p>{t('Disponible para oportunidades junior y prácticas.', 'Available for junior roles and internships.')}</p>{cv && <section><h2>{t('Trayectoria', 'Background')}</h2>{chronology.map(c=><p key={c.date}><b>{c.date} — {c.title[lang]}</b><br/>{c.detail[lang]}</p>)}</section>} {cv && <section><h2>{t('Competencias', 'Skills')}</h2>{skills.map(s=><p key={s.title.en}><b>{s.title[lang]}:</b> {typeof s.items==='string'?s.items:s.items[lang]}</p>)}<h2>{t('Idiomas', 'Languages')}</h2><p>{languages[lang]}</p><a href={asset('/assets/cv-mohamed-amine-aslimani.pdf')} hrefLang="en">{t('Descargar CV en PDF (en inglés)', 'Download CV as PDF (English)')}</a></section>}</>}
        <section><h2>{t('Proyectos', 'Projects')}</h2><ul className="reading-projects">{projects.map(project=><li key={project.slug}><a href={`${asset(projectPath(lang,project.slug))}#portfolio-document`}>{project.name[lang]}</a><p>{project.summary[lang]}</p></li>)}</ul></section>
        <footer><a href={profile.github}>GitHub</a> · <a href={`${asset(cvPath(lang))}#portfolio-document`}>{t('Currículum', 'Resume')}</a> · <a href={`mailto:${profile.email}`}>{profile.email}</a></footer>
      </main>
    </section>
    <noscript><style>{`.portfolio-document { display:flex !important; } .reading-close, .reading-link { display:none !important; }`}</style></noscript>
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, '\\u003c') }}/>
  </>
}
