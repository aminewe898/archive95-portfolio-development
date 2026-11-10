import { Desktop } from '@/components/os/desktop'
import { pageMetadata } from '@/lib/seo'
export const metadata = pageMetadata('en', undefined, true)
export default function CV(){return <Desktop lang="en" initial={{app:'resume'}}/>}
