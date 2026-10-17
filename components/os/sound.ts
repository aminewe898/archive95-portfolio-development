export type SoundName = 'click' | 'open' | 'ding' | 'chord' | 'boom' | 'error'

let audioContext: AudioContext | null = null

function context() {
  if (typeof window === 'undefined') return null
  if (!audioContext) {
    const AudioCtor = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
    if (!AudioCtor) return null
    audioContext = new AudioCtor()
  }
  if (audioContext.state === 'suspended') void audioContext.resume().catch(() => {})
  return audioContext
}

function tone(ctx: AudioContext, frequency: number, start: number, duration: number, type: OscillatorType, volume: number) {
  const oscillator = ctx.createOscillator()
  const gain = ctx.createGain()
  oscillator.type = type
  oscillator.frequency.value = frequency
  gain.gain.setValueAtTime(0, ctx.currentTime + start)
  gain.gain.linearRampToValueAtTime(volume, ctx.currentTime + start + 0.01)
  gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + start + duration)
  oscillator.connect(gain).connect(ctx.destination)
  oscillator.start(ctx.currentTime + start)
  oscillator.stop(ctx.currentTime + start + duration + 0.02)
}

export function playSound(name: SoundName, level = 0.5) {
  if (level <= 0) return
  const ctx = context()
  if (!ctx) return
  switch (name) {
    case 'click':
      tone(ctx, 1400, 0, 0.03, 'square', 0.03 * level)
      break
    case 'open':
      tone(ctx, 660, 0, 0.06, 'triangle', 0.08 * level)
      tone(ctx, 990, 0.05, 0.08, 'triangle', 0.06 * level)
      break
    case 'ding':
      tone(ctx, 1046, 0, 0.35, 'sine', 0.12 * level)
      tone(ctx, 784, 0.12, 0.45, 'sine', 0.1 * level)
      break
    case 'error':
      tone(ctx, 220, 0, 0.18, 'square', 0.05 * level)
      tone(ctx, 196, 0.16, 0.22, 'square', 0.05 * level)
      break
    case 'chord':
      ;[261.6, 329.6, 392, 523.3, 659.3].forEach((f, i) => tone(ctx, f, i * 0.16, 1.6 - i * 0.12, 'triangle', 0.07 * level))
      break
    case 'boom': {
      const buffer = ctx.createBuffer(1, ctx.sampleRate * 0.5, ctx.sampleRate)
      const data = buffer.getChannelData(0)
      for (let i = 0; i < data.length; i++) data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / data.length, 3)
      const source = ctx.createBufferSource()
      const gain = ctx.createGain()
      gain.gain.value = 0.25 * level
      source.buffer = buffer
      source.connect(gain).connect(ctx.destination)
      source.start()
      break
    }
  }
}
