'use client'

import { createContext, useContext } from 'react'
import type { Lang } from '@/lib/content'
import type { SoundName } from './sound'

export type AppId =
  | 'welcome'
  | 'about'
  | 'projects'
  | 'project'
  | 'resume'
  | 'mail'
  | 'terminal'
  | 'mines'
  | 'snake'
  | 'notepad'
  | 'recycle'
  | 'skills'
  | 'display'
  | 'run'
  | 'shutdown'
  | 'message'
  | 'ie'
  | 'paint'
  | 'calc'
  | 'taskman'
  | 'computer'
  | 'find'
  | 'datetime'
  | 'sol'

export type Wallpaper = 'teal' | 'clouds' | 'pattern' | 'night' | 'custom'

export type MessageSpec = { title: string; text: string; kind?: 'info' | 'warning' | 'question' }

export type OsWindow = {
  id: string
  app: AppId
  arg?: string
  message?: MessageSpec
  x: number
  y: number
  w: number
  h: number
  z: number
  minimized: boolean
  maximized: boolean
}

export type OsApi = {
  lang: Lang
  t: (es: string, en: string) => string
  open: (app: AppId, arg?: string) => void
  close: (id: string) => void
  message: (spec: MessageSpec) => void
  wallpaper: Wallpaper
  setWallpaper: (w: Wallpaper) => void
  setCustomWallpaper: (image: string) => void
  resizeWindow: (id: string, w: number, h: number) => void
  /** False (the Windows 95 default) drags an outline; true redraws the window while it moves. */
  fullDrag: boolean
  setFullDrag: (on: boolean) => void
  volume: number
  setVolume: (value: number) => void
  soundOn: boolean
  setSoundOn: (on: boolean) => void
  play: (name: SoundName) => void
  setLang: (lang: Lang) => void
  power: (mode: 'off' | 'restart' | 'dos') => void
  startScreensaver: () => void
  recycleEmptied: boolean
  emptyRecycle: () => void
}

export const OsContext = createContext<OsApi | null>(null)

export function useOs() {
  const api = useContext(OsContext)
  if (!api) throw new Error('useOs must be used inside the desktop')
  return api
}

export const windowId = (app: AppId, arg?: string) => (arg ? `${app}:${arg}` : app)
