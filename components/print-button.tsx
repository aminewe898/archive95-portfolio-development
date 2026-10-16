'use client'
import { text, type Lang } from '@/lib/content'
export function PrintButton({lang}:{lang:Lang}){return <button className="cv-print" onClick={()=>window.print()}>{text(lang,'Imprimir / Guardar PDF','Print / Save PDF')}</button>}
