export const baseNoteMap = {
  'A0': 27.50, 'A#0': 29.14, 'B0': 30.87, 'C1': 32.70, 'C#1': 34.65, 'D1': 36.71, 'D#1': 38.89, 'E1': 41.20,
  'F1': 43.65, 'F#1': 46.25, 'G1': 49.00, 'G#1': 51.91, 'A1': 55.00, 'A#1': 58.27, 'B1': 61.74, 'C2': 65.41,
  'C#2': 69.30, 'D2': 73.42, 'D#2': 77.78, 'E2': 82.41, 'F2': 87.31, 'F#2': 92.50, 'G2': 98.00, 'G#2': 103.83,
  'A2': 110.00, 'A#2': 116.54, 'B2': 123.47, 'C3': 130.81, 'C#3': 138.59, 'D3': 146.83, 'D#3': 155.56, 'E3': 164.81,
  'F3': 174.61, 'F#3': 185.00, 'G3': 196.00, 'G#3': 207.65, 'A3': 220.00, 'A#3': 233.08, 'B3': 246.94, 'C4': 261.63,
  'C#4': 277.18, 'D4': 293.66, 'D#4': 311.13, 'E4': 329.63, 'F4': 349.23, 'F#4': 369.99, 'G4': 392.00, 'G#4': 415.30,
  'A4': 440.00, 'A#4': 466.16, 'B4': 493.88, 'C5': 523.25, 'C#5': 554.37, 'D5': 587.33, 'D#5': 622.25, 'E5': 659.25,
  'F5': 698.46, 'F#5': 739.99, 'G5': 783.99, 'G#5': 830.61, 'A5': 880.00, 'A#5': 932.33, 'B5': 987.77, 'C6': 1046.50,
  'C#6': 1108.73, 'D6': 1174.66, 'D#6': 1244.51, 'E6': 1318.51, 'F6': 1396.91, 'F#6': 1479.98, 'G6': 1567.98, 'G#6': 1661.22,
  'A6': 1760.00, 'A#6': 1864.66, 'B6': 1975.53, 'C7': 2093.00, 'C#7': 2217.46, 'D7': 2349.32, 'D#7': 2489.02, 'E7': 2637.02,
  'F7': 2793.83, 'F#7': 2959.96, 'G7': 3135.96, 'G#7': 3322.44, 'A7': 3520.00, 'A#7': 3729.31, 'B7': 3951.07, 'C8': 4186.01
};

// 🔊 Audio context initialization
const context = window.audioContext || new (window.AudioContext || window.webkitAudioContext)();
if (!window.audioContext) {
  window.audioContext = context;
}

// 🔊 Master gain node (controls overall volume)
const masterGain = context.createGain();
masterGain.gain.value = 0.7;
masterGain.connect(context.destination);

let currentOscillators = [];

/**
 * Schedule a note for playback.
 * @param {number} freq - Frequency in Hz.
 * @param {number} startTime - When to start, in seconds (relative to AudioContext time).
 * @param {number} duration - Duration in seconds.
 * @param {string} oscillatorType - Type of waveform: "sine", "square", "sawtooth", "triangle".
 * @param {number} volume - Gain value between 0 and 1.
 */
export function scheduleNote(freq, startTime, duration = 0.5, oscillatorType = "sine", volume = 1.0) {
  const oscillator = context.createOscillator();
  const gainNode = context.createGain();

  oscillator.type = oscillatorType;
  oscillator.frequency.setValueAtTime(freq, startTime);

  gainNode.gain.setValueAtTime(volume, startTime);
  gainNode.gain.setValueAtTime(volume, startTime + duration - 0.05);
  gainNode.gain.linearRampToValueAtTime(0.0001, startTime + duration);

  oscillator.connect(gainNode);
  gainNode.connect(masterGain);

  oscillator.start(startTime);
  oscillator.stop(startTime + duration);

  currentOscillators.push({ oscillator, gainNode });
}

/**
 * Stop all currently playing oscillators smoothly.
 */
export function stopAllSounds() {
  const now = context.currentTime;
  currentOscillators.forEach(({ oscillator, gainNode }) => {
    try {
      gainNode.gain.exponentialRampToValueAtTime(0.0001, now + 0.05);
      oscillator.stop(now + 0.05);
      setTimeout(() => {
        oscillator.disconnect();
        gainNode.disconnect();
      }, 100);
    } catch (_) {
      // Ignore disconnect errors
    }
  });

  currentOscillators = [];
}

/**
 * Get the current AudioContext.
 * Useful if you want to resume it from a suspended state.
 */
export function getAudioContext() {
  return context;
}

/**
 * Adjust the master volume.
 * @param {number} value - New volume value (0.0 to 1.0).
 */
export function setMasterVolume(value) {
  masterGain.gain.value = parseFloat(value);
}
