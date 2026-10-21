import type { ComponentType, SVGProps } from 'react'
import { Computer } from '@react95/icons/Computer'
import { Folder } from '@react95/icons/Folder'
import { FolderOpen } from '@react95/icons/FolderOpen'
import { Wordpad } from '@react95/icons/Wordpad'
import { Mail } from '@react95/icons/Mail'
import { MsDos } from '@react95/icons/MsDos'
import { Winmine1 } from '@react95/icons/Winmine1'
import { Notepad } from '@react95/icons/Notepad'
import { RecycleEmpty } from '@react95/icons/RecycleEmpty'
import { RecycleFull } from '@react95/icons/RecycleFull'
import { Settings } from '@react95/icons/Settings'
import { Desktop } from '@react95/icons/Desktop'
import { HelpBook } from '@react95/icons/HelpBook'
import { Logo } from '@react95/icons/Logo'
import { Globe } from '@react95/icons/Globe'
import { Network } from '@react95/icons/Network'
import { Drvspace1 } from '@react95/icons/Drvspace1'
import { FolderSettings } from '@react95/icons/FolderSettings'
import { User } from '@react95/icons/User'
import { Warning } from '@react95/icons/Warning'
import { InfoBubble } from '@react95/icons/InfoBubble'
import { QuestionBubble } from '@react95/icons/QuestionBubble'
import { PowerOff } from '@react95/icons/PowerOff'
import { WindowsExplorer } from '@react95/icons/WindowsExplorer'
import { Mmsys120 } from '@react95/icons/Mmsys120'
import { Timedate } from '@react95/icons/Timedate'
import { FolderFile } from '@react95/icons/FolderFile'
import { Computer3 } from '@react95/icons/Computer3'
import { Rundll1 } from '@react95/icons/Rundll1'
import { Keys } from '@react95/icons/Keys'

type Variant = string
type IconComponent = ComponentType<SVGProps<SVGSVGElement> & { variant?: Variant }>
type Entry = { C: IconComponent; small?: Variant; large: Variant }

const icon = (C: unknown, large: Variant, small?: Variant): Entry => ({ C: C as IconComponent, large, small })

function SnakeIcon({ variant: _variant, ...props }: SVGProps<SVGSVGElement> & { variant?: string }) {
  return <svg {...props} viewBox="0 0 32 32" shapeRendering="crispEdges"><path fill="#000" d="M3 6h19v9H11v5h15v9H3V17h12v-5H3z"/><path fill="#008000" d="M4 7h17v7H10v7h15v7H4V18h12v-7H4z"/><path fill="#80ff80" d="M4 7h17v2H6v2H4zm0 11h12v2H6v6H4z"/><path fill="#fff" d="M17 8h2v2h-2z"/><path fill="#f00" d="M25 3h4v4h-4z"/></svg>
}

const library = {
  computer: icon(Computer, '32x32_4', '16x16_4'),
  folder: icon(Folder, '32x32_4', '16x16_4'),
  folderOpen: icon(FolderOpen, '32x32_4', '16x16_4'),
  doc: icon(Wordpad, '32x32_4', '16x16_4'),
  mail: icon(Mail, '32x32_4', '16x16_4'),
  dos: icon(MsDos, '32x32_32', '16x16_32'),
  mines: icon(Winmine1, '32x32_4', '16x16_4'),
  snake: icon(SnakeIcon, '32x32_4'),
  notepad: icon(Notepad, '32x32_4', '16x16_4'),
  recycleEmpty: icon(RecycleEmpty, '32x32_4', '16x16_4'),
  recycleFull: icon(RecycleFull, '32x32_4', '16x16_4'),
  settings: icon(Settings, '32x32_4', '16x16_4'),
  desktop: icon(Desktop, '32x32_4', '16x16_4'),
  help: icon(HelpBook, '32x32_4', '16x16_4'),
  logo: icon(Logo, '32x32_4', '16x16_4'),
  globe: icon(Globe, '32x32_4', '16x16_4'),
  network: icon(Network, '32x32_4', '16x16_4'),
  hardware: icon(Drvspace1, '32x32_4', '16x16_4'),
  automation: icon(FolderSettings, '32x32_4', '16x16_4'),
  user: icon(User, '32x32_4', '16x16_4'),
  warning: icon(Warning, '32x32_4'),
  info: icon(InfoBubble, '32x32_4'),
  question: icon(QuestionBubble, '32x32_32'),
  power: icon(PowerOff, '32x32_4', '16x16_4'),
  explorer: icon(WindowsExplorer, '32x32_4', '16x16_4'),
  speaker: icon(Mmsys120, '32x32_4', '16x16_4'),
  clock: icon(Timedate, '32x32_4', '16x16_4'),
  file: icon(FolderFile, '32x32_4', '16x16_4'),
  pc: icon(Computer3, '32x32_4', '16x16_4'),
  run: icon(Rundll1, '32x32_4'),
  keys: icon(Keys, '32x32_4'),
} satisfies Record<string, Entry>

export type IconName = keyof typeof library

export function OsIcon({ name, size = 32, className }: { name: IconName; size?: 16 | 24 | 32 | 48; className?: string }) {
  const entry: Entry = library[name]
  const variant = size <= 16 && entry.small ? entry.small : entry.large
  const { C } = entry
  return <C variant={variant} width={size} height={size} className={className} aria-hidden="true" focusable="false" style={{ imageRendering: 'pixelated', flexShrink: 0 }} />
}
