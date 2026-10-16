import assert from 'node:assert/strict'
import { playbackReducer as reduce, TOTAL_TICKS, TICKS_PER_STEP } from '../components/os/demos/playback.ts'

let state = { tick: 0, running: false }
assert.deepEqual(reduce(state, { type: 'tick' }), state, 'Idle timers must not advance playback')
state = reduce(state, { type: 'toggle' })
for (let i = 0; i < 5; i++) state = reduce(state, { type: 'tick' })
state = reduce(state, { type: 'toggle' })
assert.equal(state.tick, 5)
assert.deepEqual(reduce(state, { type: 'tick' }), state, 'Pausing must preserve progress')
state = reduce(state, { type: 'step' })
assert.deepEqual(state, { tick: TICKS_PER_STEP, running: false }, 'Step must finish the current stage')
state = reduce(state, { type: 'toggle' })
for (let i = 0; i < TOTAL_TICKS * 2; i++) state = reduce(state, { type: 'tick' })
assert.deepEqual(state, { tick: TOTAL_TICKS, running: false }, 'Completion must stop and clamp playback')
assert.deepEqual(reduce(state, { type: 'step' }), state, 'Stepping past completion must be harmless')
state = reduce(state, { type: 'toggle' })
assert.deepEqual(state, { tick: 0, running: true }, 'Replay must start a fresh run')
assert.deepEqual(reduce(state, { type: 'reset' }), { tick: 0, running: false })
console.log('Playback checks passed: idle, pause, step, completion, replay, reset.')
