import Image from 'next/image'
import { ArrowDown, ArrowUpRight, Asterisk, FileText, GitBranch, Plus } from 'lucide-react'
import { about, artwork, chronology, dictionary, homePath, languages, profile, projectPath, projects, skills, text, type Lang } from '@/lib/content'
import { Architecture, ArchiveProvider, CopyEmail, EditorialComposition, Header, OpenDossier } from './archive-interactions'

export function ArchiveHome({ lang }: { lang: Lang }) {
  const d = dictionary[lang]
  return (
    <ArchiveProvider lang={lang}>
      <a className="skip-link" href="#main">{text(lang, 'Saltar al contenido', 'Skip to content')}</a>
      <Header lang={lang} />
      <main id="main" tabIndex={-1}>
        <section className="editorial-hero page-width" aria-labelledby="hero-heading">
          <div className="hero-overline">
            <span>MOHAMED AMINE ASLIMANI</span>
            <span className="edition">{text(lang, 'PORTFOLIO PERSONAL', 'PERSONAL PORTFOLIO')} — VOL. 01</span>
          </div>
          <EditorialComposition>
            <div className="hero-type">
              <p className="hero-discipline"><span className="live-dot" />{text(lang, 'SISTEMAS, REDES & AUTOMATIZACIÓN', 'SYSTEMS, NETWORKS & AUTOMATION')}</p>
              <h1 id="hero-heading">{text(lang, 'Sistemas.', 'Systems.')}<br /><em>{text(lang, 'Con criterio.', 'With intent.')}</em></h1>
              <p className="hero-statement">{text(lang, 'Entender las piezas. Conectar las ideas.\nConstruir algo que tenga sentido.', 'Understand the parts. Connect the ideas.\nBuild something that makes sense.')}</p>
              <a className="round-action" href="#projects">{text(lang, 'Explorar mi trabajo', 'Explore my work')}<span><ArrowDown size={18} /></span></a>
            </div>
            <div className="hero-object">
              <Image src="/art/system-sculpture.webp" width={1000} height={1250} alt={text(lang, 'Escultura conceptual de componentes de ordenador en aluminio y cromo, suspendidos en una composición vertical.', 'Conceptual sculpture of aluminum and chrome computer components suspended in a vertical composition.')} priority sizes="(max-width: 599px) 90vw, 50vw" />
              <div className="object-coordinate"><Plus size={12} /><span>FIG. 001<br />{text(lang, 'LA SUMA DE LAS PARTES', 'THE SUM OF THE PARTS')}</span></div>
              <span className="object-edition" aria-hidden="true">A—95</span>
            </div>
          </EditorialComposition>
          <div className="hero-colophon">
            <p>{profile.role[lang]}<br /><span>{text(lang, 'Infraestructura de IA · Reus, España', 'AI infrastructure · Reus, Spain')}</span></p>
            <a className="availability-link" href="#contact"><span className="live-dot" />{text(lang, 'Disponible para mi próximo paso', 'Available for my next chapter')}<ArrowUpRight size={15} /></a>
            <span className="hero-scroll">{text(lang, 'SIGUE EXPLORANDO', 'KEEP EXPLORING')}<ArrowDown size={14} /></span>
          </div>
        </section>

        <section id="projects" className="selected-work page-width">
          <div className="section-heading"><div><p className="eyebrow">01 / {d.selected}</p><h2>{text(lang, 'Ideas en', 'Ideas in')}{' '}<em>{text(lang, 'práctica.', 'practice.')}</em></h2></div><p className="section-aside">{text(lang, 'Una selección de laboratorios, sistemas\ny cosas que quería entender.', 'A selection of labs, systems,\nand things I wanted to understand.')}</p></div>
          <div className="work-grid">
            {projects.map((p, i) => (
              <article id={`project-${p.slug}`} className={`work-card ${i === 0 ? 'work-featured' : ''}`} key={p.slug}>
                <a href={projectPath(lang, p.slug)} className={`work-visual visual-${i}`} aria-label={`${d.study}: ${p.name[lang]}`}>
                  <div className="visual-topline"><span>ARCHIVE95 / 00{i + 1}</span><span>{i === 0 ? '2026' : p.technologies[0]}</span></div>
                  <Image src={artwork[p.illustration as keyof typeof artwork]} width={700} height={467} sizes={i === 0 ? '(max-width: 699px) 90vw, 58vw' : '(max-width: 699px) 90vw, 30vw'} alt={text(lang, `Grabado conceptual: ${p.name.es}`, `Conceptual engraving: ${p.name.en}`)} />
                  {i === 0 && <span className="visual-word">relay</span>}
                  <span className="visual-caption">{text(lang, 'ESTUDIO DE SISTEMAS', 'SYSTEM STUDY')} — {String(i + 1).padStart(2, '0')}</span>
                  <span className="project-open"><ArrowUpRight size={22} /></span>
                </a>
                <div className="work-information">
                  <p className="eyebrow"><span>0{i + 1}</span>{p.category[lang]}</p>
                  <h3><a href={projectPath(lang, p.slug)}>{p.name[lang]}{i === 0 && <em>{text(lang, 'Del mensaje a la solución.', 'From message to resolution.')}</em>}</a></h3>
                  <p className="work-summary">{p.summary[lang]}</p>
                  <div className="tags">{p.technologies.slice(0, 4).map(t => <span key={t}>{t}</span>)}</div>
                  <div className="project-actions"><a className="underlined-link" href={projectPath(lang, p.slug)}>{d.study}<ArrowUpRight size={15} /></a><OpenDossier id={p.slug} lang={lang} /></div>
                  {i === 0 && <a className="repo-link" href={profile.github + '/relay'} target="_blank" rel="noreferrer"><GitBranch size={14} />{text(lang, 'Ver código y documentación', 'View code & documentation')}<ArrowUpRight size={13} /></a>}
                </div>
              </article>
            ))}
          </div>
          <details className="workflow-disclosure"><summary><span>{text(lang, 'Bajo la superficie de Relay', 'Under the surface of Relay')}</span><span>{text(lang, 'EXPLORAR ARQUITECTURA', 'EXPLORE ARCHITECTURE')}<Plus size={18} /></span></summary><Architecture lang={lang} /></details>
        </section>

        <section id="about" className="personal-section">
          <div className="page-width personal-grid">
            <div className="personal-side"><p className="eyebrow">02 / {text(lang, 'La persona detrás', 'The person behind it')}</p><Asterisk size={88} strokeWidth={1} className="personal-mark" /><span className="mono">REUS, ES<br />41°09′ N · 01°06′ E</span></div>
            <div className="personal-story"><h2>{text(lang, 'Primero, curiosidad.', 'Curiosity first.')}<br /><em>{text(lang, 'Después, todo lo demás.', 'Everything else follows.')}</em></h2><p className="personal-lead">{about[lang]}</p><p>{text(lang, 'Ahora estudio Sistemas Microinformáticos y Redes en el Institut Baix Camp de Reus. Construyo laboratorios personales para aprender de verdad: probar, equivocarme, documentar y volver a probar.', 'Now I study Microcomputer Systems & Networks at Institut Baix Camp in Reus. I build personal labs to really learn: test, get things wrong, document, and try again.')}</p><div className="personal-signoff"><span>Amine Aslimani</span><a href={`/cv?lang=${lang}`}>{text(lang, 'Conocer mi trayectoria', 'More about my background')}<ArrowUpRight size={16} /></a></div></div>
          </div>
        </section>

        <section id="experience" className="experience-section page-width"><div className="section-heading"><div><p className="eyebrow">03 / {text(lang, 'Trayectoria', 'Background')}</p><h2>{text(lang, 'Aprender', 'Learning')}{' '}<em>{text(lang, 'haciendo.', 'by doing.')}</em></h2></div><a className="underlined-link" href={`/cv?lang=${lang}`}>{d.cv}<ArrowUpRight size={16} /></a></div><div className="chronology">{chronology.map(c => <div className="chronology-row" key={c.date}><span className="chronology-date">{c.date}</span><div><h3>{c.title[lang]}</h3><p>{c.detail[lang]}</p></div><Plus size={17} /></div>)}</div></section>

        <section id="skills" className="skills-section page-width"><div className="skills-intro"><p className="eyebrow">04 / {text(lang, 'Caja de herramientas', 'The toolkit')}</p><h2>{text(lang, 'No solo saber.', 'Beyond knowing.')}<br /><em>{text(lang, 'Saber usar.', 'Knowing how.')}</em></h2><p>{text(lang, 'Cada herramienta tiene un contexto.\nEstas son las que llevo a la práctica.', 'Every tool has a context.\nThese are the ones I put into practice.')}</p><OpenDossier id="system" lang={lang}>{text(lang, 'Explorar competencias', 'Explore capabilities')}</OpenDossier></div><div className="skills-ledger">{skills.map((s, i) => <a href={projectPath(lang, s.project)} key={s.title.en}><span className="ledger-number">0{i + 1}</span><div><h3>{s.title[lang]}</h3><p>{typeof s.items === 'string' ? s.items : s.items[lang]}</p></div><ArrowUpRight size={18} /></a>)}<div className="language-ledger"><span className="ledger-number">05</span><div><h3>{text(lang, 'Idiomas', 'Languages')}</h3><p>{languages[lang]}</p></div></div></div></section>

        <section id="contact" className="contact-editorial page-width"><div className="contact-prelude"><p className="eyebrow">05 / {text(lang, 'Lo siguiente, juntos.', 'What comes next, together.')}</p><span className="availability-link"><span className="live-dot" />{text(lang, 'ABIERTO A OPORTUNIDADES', 'OPEN TO OPPORTUNITIES')}</span></div><h2>{text(lang, 'Las buenas ideas', 'Good things start')}<br /><em>{text(lang, 'empiezan hablando.', 'with a conversation.')}</em><ArrowUpRight className="contact-big-arrow" /></h2><div className="contact-details"><a className="contact-email" href={`mailto:${profile.email}`}>{profile.email}<ArrowUpRight size={22} /></a><p>{text(lang, 'Busco una oportunidad junior o de prácticas\nen sistemas y redes. Reus y alrededores.', 'Looking for a junior role or internship in\nsystems and networking. Reus and nearby.')}</p></div><div className="contact-links"><CopyEmail lang={lang} /><a href={profile.github} target="_blank" rel="noreferrer">GitHub<ArrowUpRight size={15} /></a><a href={`/cv?lang=${lang}`}>{d.cv}<FileText size={15} /></a><OpenDossier id="contact" lang={lang}>{text(lang, 'Abrir correspondencia', 'Open correspondence')}</OpenDossier></div></section>
      </main>
      <footer className="footer page-width"><a className="wordmark" href={homePath(lang)}>Archive<span>95</span><Asterisk size={18} /></a><p>© 2026 MOHAMED AMINE ASLIMANI</p><a href="#main">{text(lang, 'Volver arriba', 'Back to top')}<ArrowUpRight size={15} /></a></footer>
    </ArchiveProvider>
  )
}
