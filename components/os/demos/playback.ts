export const TICKS_PER_STEP = 12
export const TOTAL_TICKS = 6 * TICKS_PER_STEP
export type Playback = { tick: number; running: boolean }
export type PlaybackAction = { type: 'toggle' | 'tick' | 'step' | 'reset' }
export function playbackReducer(state: Playback, action: PlaybackAction): Playback {
  switch (action.type) {
    case 'reset': return { tick: 0, running: false }
    case 'toggle': return state.tick === TOTAL_TICKS ? { tick: 0, running: true } : { ...state, running: !state.running }
    case 'step': return { tick: Math.min(TOTAL_TICKS, (Math.floor(state.tick / TICKS_PER_STEP) + 1) * TICKS_PER_STEP), running: false }
    case 'tick': {
      if (!state.running) return state
      const tick = Math.min(TOTAL_TICKS, state.tick + 1)
      return { tick, running: tick < TOTAL_TICKS }
    }
  }
}
