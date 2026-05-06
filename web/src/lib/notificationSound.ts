let audioContext: AudioContext | null = null
let lastPlayedAt = 0

const getAudioContext = () => {
  if (typeof window === 'undefined') {
    return null
  }

  if (!audioContext) {
    const AudioContextCtor = window.AudioContext || (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
    if (!AudioContextCtor) {
      return null
    }

    audioContext = new AudioContextCtor()
  }

  return audioContext
}

export const playMessagePing = async () => {
  const context = getAudioContext()
  if (!context) return

  const now = Date.now()
  if (now - lastPlayedAt < 1200) {
    return
  }
  lastPlayedAt = now

  try {
    if (context.state === 'suspended') {
      await context.resume()
    }

    const oscillator = context.createOscillator()
    const gainNode = context.createGain()

    oscillator.type = 'sine'
    oscillator.frequency.setValueAtTime(880, context.currentTime)
    oscillator.frequency.exponentialRampToValueAtTime(660, context.currentTime + 0.18)

    gainNode.gain.setValueAtTime(0.0001, context.currentTime)
    gainNode.gain.exponentialRampToValueAtTime(0.12, context.currentTime + 0.01)
    gainNode.gain.exponentialRampToValueAtTime(0.0001, context.currentTime + 0.22)

    oscillator.connect(gainNode)
    gainNode.connect(context.destination)

    oscillator.start(context.currentTime)
    oscillator.stop(context.currentTime + 0.24)

    oscillator.onended = () => {
      oscillator.disconnect()
      gainNode.disconnect()
    }
  } catch {
    // Sound is best-effort only.
  }
}
