import type { MetadataRoute } from 'next'
import { projects, siteUrl } from '@/lib/content'
export default function sitemap():MetadataRoute.Sitemap{if(!siteUrl)return [];return ['','/en','/cv',...projects.flatMap(p=>[`/projects/${p.slug}`,`/en/projects/${p.slug}`])].map(path=>({url:`${siteUrl}${path}`,changeFrequency:'monthly' as const,priority:path===''?1:.7}))}
