import type { Metadata } from 'next'
import { Desktop } from '@/components/os/desktop'
export const metadata: Metadata = { title:'Mohamed Amine Aslimani — Systems, networks & AI infrastructure', description:'Junior systems and network technician in Reus, Spain. Explore automation, local AI, and infrastructure projects. Available for junior roles and internships.', alternates:{canonical:'/en',languages:{es:'/',en:'/en'}},openGraph:{locale:'en_GB'} }
export default function Page(){return <Desktop lang="en"/>}

