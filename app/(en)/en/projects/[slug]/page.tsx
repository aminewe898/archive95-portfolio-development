import { Desktop } from '@/components/os/desktop'
import { notFound } from 'next/navigation'
import { pageMetadata } from '@/lib/seo'
import { projects } from '@/lib/content'
export function generateStaticParams(){return projects.map(p=>({slug:p.slug}))}
export async function generateMetadata({params}:{params:Promise<{slug:string}>}){const { slug } = await params; const p = projects.find(p=>p.slug===slug); return p ? pageMetadata('en',p) : {}}
export default async function Page({params}:{params:Promise<{slug:string}>}){const slug = (await params).slug; if (!projects.some(p => p.slug === slug)) notFound(); return <><Desktop lang="en" initial={{app: 'project', arg: slug}}/></>}

