import { Desktop } from '@/components/os/desktop'
import { PortfolioDocument } from '@/components/portfolio-document'
import { pageMetadata } from '@/lib/seo'
export const metadata = pageMetadata('es')
export default function Page(){return <><Desktop lang="es"/><PortfolioDocument lang="es"/></>}
