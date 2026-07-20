// Web Audio API sound effects — no external files needed
let audioCtx: AudioContext | null = null

function getAudioCtx(): AudioContext {
  if (!audioCtx) {
    audioCtx = new AudioContext()
  }
  return audioCtx
}

function playTone(frequency: number, duration: number, type: OscillatorType = 'sine', volume = 0.15) {
  try {
    const ctx = getAudioCtx()
    const oscillator = ctx.createOscillator()
    const gainNode = ctx.createGain()

    oscillator.type = type
    oscillator.frequency.setValueAtTime(frequency, ctx.currentTime)

    gainNode.gain.setValueAtTime(volume, ctx.currentTime)
    gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration)

    oscillator.connect(gainNode)
    gainNode.connect(ctx.destination)

    oscillator.start(ctx.currentTime)
    oscillator.stop(ctx.currentTime + duration)
  } catch {
    // Web Audio API not supported — silently ignore
  }
}

/** Alert triggered — ascending chime */
export function playAlertSound() {
  playTone(523.25, 0.15, 'sine', 0.12)   // C5
  setTimeout(() => playTone(659.25, 0.15, 'sine', 0.12), 150)  // E5
  setTimeout(() => playTone(783.99, 0.25, 'sine', 0.14), 300)  // G5
}

/** Alert triggered for a price drop — descending tone */
export function playAlertDownSound() {
  playTone(440, 0.15, 'triangle', 0.12)    // A4
  setTimeout(() => playTone(349.23, 0.15, 'triangle', 0.12), 150)  // F4
  setTimeout(() => playTone(261.63, 0.3, 'triangle', 0.14), 300)    // C4
}

/** Market open / connect sound */
export function playConnectSound() {
  playTone(440, 0.1, 'sine', 0.08)
  setTimeout(() => playTone(554.37, 0.15, 'sine', 0.08), 100)
  setTimeout(() => playTone(659.25, 0.2, 'sine', 0.1), 200)
}
