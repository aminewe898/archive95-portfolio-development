'use client'

import { useReducer } from 'react'
import { useOs } from '../os-context'

type Op = '+' | '-' | '*' | '/'
type State = { display: string; acc: number | null; op: Op | null; fresh: boolean; memory: number }

const initial: State = { display: '0', acc: null, op: null, fresh: true, memory: 0 }
const format = (n: number) => (Number.isFinite(n) ? String(parseFloat(n.toPrecision(12))) : 'Error')
const apply = (a: number, b: number, op: Op) => (op === '+' ? a + b : op === '-' ? a - b : op === '*' ? a * b : b === 0 ? NaN : a / b)

export function calculate(state: State, key: string): State {
  const error = state.display === 'Error'
  const value = error ? 0 : Number(state.display)
  const result = (n: number): State => ({ ...state, display: format(n), fresh: true })
  if (/^\d$/.test(key)) return { ...state, display: state.fresh || state.display === '0' ? key : state.display.length < 16 ? state.display + key : state.display, fresh: false }
  switch (key) {
    case '.': return state.fresh ? { ...state, display: '0.', fresh: false } : state.display.includes('.') ? state : { ...state, display: `${state.display}.` }
    case '+': case '-': case '*': case '/': {
      if (state.op && state.acc !== null && !state.fresh) {
        const r = apply(state.acc, value, state.op)
        return { ...state, display: format(r), acc: Number.isFinite(r) ? r : null, op: Number.isFinite(r) ? key : null, fresh: true }
      }
      return { ...state, acc: value, op: key, fresh: true }
    }
    case '=': return state.op && state.acc !== null ? { ...state, display: format(apply(state.acc, value, state.op)), acc: null, op: null, fresh: true } : { ...state, fresh: true }
    case 'C': return { ...initial, memory: state.memory }
    case 'CE': return { ...state, display: '0', fresh: true }
    case 'Back': return state.fresh || error ? state : { ...state, display: state.display.length > 1 && state.display.slice(0, -1) !== '-' ? state.display.slice(0, -1) : '0' }
    case '±': return error ? state : { ...state, display: format(-value) }
    case '√': return result(Math.sqrt(value))
    case '1/x': return result(value === 0 ? NaN : 1 / value)
    case '%': return result(state.acc !== null ? (state.acc * value) / 100 : 0)
    case 'MC': return { ...state, memory: 0 }
    case 'MR': return { ...state, display: format(state.memory), fresh: true }
    case 'MS': return { ...state, memory: value, fresh: true }
    case 'M+': return { ...state, memory: state.memory + value, fresh: true }
    default: return state
  }
}

const rows = [
  ['MC', '7', '8', '9', '/', '√'],
  ['MR', '4', '5', '6', '*', '%'],
  ['MS', '1', '2', '3', '-', '1/x'],
  ['M+', '0', '±', '.', '+', '='],
]
const keyMap: Record<string, string> = { Enter: '=', '=': '=', Backspace: 'Back', Escape: 'C', Delete: 'CE', ',': '.', x: '*', X: '*' }

export function CalculatorApp() {
  const { t } = useOs()
  const [state, press] = useReducer(calculate, initial)
  const tone = (k: string) => (/^M/.test(k) || ['Back', 'CE', 'C', '/', '*', '-', '+', '='].includes(k) ? 'calc-red' : 'calc-blue')
  const label = (k: string) => (k === 'Back' ? t('Retroceso', 'Back') : k)
  return (
    <div
      className="calc"
      tabIndex={0}
      aria-label={t('Calculadora', 'Calculator')}
      onKeyDown={(e) => {
        if (e.ctrlKey || e.metaKey || e.altKey) return
        const key = keyMap[e.key] ?? e.key
        if (/^\d$/.test(key) || ['.', '+', '-', '*', '/', '=', 'Back', 'C', 'CE', '%'].includes(key)) {
          e.preventDefault()
          e.stopPropagation()
          press(key)
        }
      }}
    >
      <output className="calc-display" aria-live="polite">{state.display}</output>
      <div className="calc-top">
        <span className="calc-memory" aria-label={state.memory ? t('Memoria en uso', 'Memory in use') : undefined}>{state.memory ? 'M' : ''}</span>
        {['Back', 'CE', 'C'].map((k) => <button key={k} type="button" className={tone(k)} onClick={() => press(k)}>{label(k)}</button>)}
      </div>
      <div className="calc-keys">
        {rows.flat().map((k) => <button key={k} type="button" className={tone(k)} onClick={() => press(k)}>{k}</button>)}
      </div>
    </div>
  )
}
