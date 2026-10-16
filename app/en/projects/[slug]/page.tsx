import { Desktop } from '@/components/os/desktop'
import { notFound } from 'next/navigation'
import { caseMetadata } from '@/components/case-study'
import { projects } from '@/lib/content'
export function generateStaticParams(){return projects.map(p=>({slug:p.slug}))}
export async function generateMetadata({params}:{params:Promise<{slug:string}>}){return caseMetadata((await params).slug,'en')}
export default async function Page({params}:{params:Promise<{slug:string}>}){const slug = (await params).slug; if (!projects.some(p => p.slug === slug)) notFound(); return <Desktop lang="en" initial={{app: 'project', arg: slug}}/>}

