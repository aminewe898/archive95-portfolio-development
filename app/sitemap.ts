import type { MetadataRoute } from 'next'
import { projects, siteUrl } from '@/lib/content'
export default function sitemap(): MetadataRoute.Sitemap {
 const pairs = [['/', '/en'], ['/cv', '/en/cv'], ...projects.map(p => [`/projects/${p.slug}`, `/en/projects/${p.slug}`])]
 return pairs.flatMap(([es,en]) => [es,en].map(path => ({url:`${siteUrl}${path}`,changeFrequency:'monthly' as const,priority:path==='/'||path==='/en'?1:0.7,alternates:{languages:{es:`${siteUrl}${es}`,en:`${siteUrl}${en}`}}})))
}
