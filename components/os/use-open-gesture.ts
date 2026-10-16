'use client'

import { useRef } from 'react'

/** Desktop-style activation: single click selects, double click or Enter opens, a tap on touch opens. */
export function useOpenGesture() {
  const pointerType = useRef<string>('mouse')
  return (onSelect: () => void, onOpen: () => void) => ({
    onPointerDown: (e: React.PointerEvent) => {
      pointerType.current = e.pointerType
    },
    onClick: (e: React.MouseEvent) => {
      e.stopPropagation()
      if (pointerType.current === 'touch' || e.detail === 0) onOpen()
      else onSelect()
    },
    onDoubleClick: (e: React.MouseEvent) => {
      e.stopPropagation()
      onOpen()
    },
    onFocus: onSelect,
  })
}
