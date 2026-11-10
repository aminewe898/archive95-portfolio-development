import { redirect } from 'next/navigation'
import { Desktop } from '@/components/os/desktop'
import { pageMetadata } from '@/lib/seo'
export const metadata = pageMetadata('es', undefined, true)
export default async function CV({searchParams}:{searchParams:Promise<{lang?:string}>}){if((await searchParams).lang==='en')redirect('/en/cv');return <Desktop lang="es" initial={{app:'resume'}}/>}
