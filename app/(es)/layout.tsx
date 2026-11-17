import DocumentRoot from '@/components/document-root'
export { metadata, viewport } from '@/components/document-root'
export default function Layout({children}:{children:React.ReactNode}){return <DocumentRoot lang="es">{children}</DocumentRoot>}
