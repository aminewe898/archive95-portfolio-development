import type { Metadata } from 'next'
import { Desktop } from '@/components/os/desktop'
import type { Lang } from '@/lib/content'
export const metadata: Metadata = { title: 'CV — Mohamed Amine Aslimani' }
export default async function CV({ searchParams }: { searchParams: Promise<{ lang?: string }> }) {
  const lang: Lang = (await searchParams).lang === 'en' ? 'en' : 'es'
  return <Desktop lang={lang} initial={{ app: 'resume' }} />
}
