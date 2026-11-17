import { Desktop } from '@/components/os/desktop'
import { pageMetadata } from '@/lib/seo'
export const metadata = pageMetadata('es', undefined, true)
export default function CV(){return <Desktop lang="es" initial={{app:'resume'}}/>}
