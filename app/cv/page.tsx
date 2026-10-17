import { pageMetadata } from '@/lib/seo'
import { PortfolioDocument } from '@/components/portfolio-document'
import { Desktop } from '@/components/os/desktop'
import type { Lang } from '@/lib/content'
export async function generateMetadata({searchParams}:{searchParams:Promise<{lang?:string}>}) { return pageMetadata((await searchParams).lang === 'en' ? 'en' : 'es', undefined, true) }
export default async function CV({ searchParams }: { searchParams: Promise<{ lang?: string }> }) {
  const lang: Lang = (await searchParams).lang === 'en' ? 'en' : 'es'
  return <><Desktop lang={lang} initial={{ app: 'resume' }} /><PortfolioDocument lang={lang} cv/></>
}
