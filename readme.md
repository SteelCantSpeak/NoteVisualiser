# 🎹 Keyano - Text-Based Piano

**Keyano** is a browser-based, text-driven piano application that lets you compose and play music using musical note notation (e.g., `C4`, `D#3`) directly from a simple web interface. It uses the Web Audio API (specifically oscillators) to generate sounds, making it lightweight and fast — no MIDI files required.

---

## 🚀 Features

- 🎼 **Text-Based Input**: Enter notes and chords using standard octave notation (e.g., `C4`, `G#3`, `(C4/E4/G4):2`).
- ✋ **Two-Handed Input**: Compose separately for the **left** and **right** hand.
- 🔊 **Oscillator Customization**: Choose oscillator types (`sine`, `square`, `sawtooth`, `triangle`) for each hand.
- 🎵 **Custom Tempo**: Adjustable BPM (from 5 to 200).
- 🎚️ **Modes**:
  - **Letter Mode**: Input notes directly with A-G notation.
  - **Word Length Mode**: Map word lengths to notes (experimental / fun mode).
- 🧠 **Visual Feedback**: See currently playing notes for each hand.
- 🖱️ **Simple UI**: Built using HTML, CSS (Bootstrap), and JavaScript.

# Example Inputs
A Variety of potential Songs are available, requiring only one or two Oscillators, but I'm not good at transcribing Music. Here are some simple tracks.

### Ode to Joy
#### Left Hand
```js
(C3):2 (G3):2 (C3):2 (G3):2 (G3):2 (B2):2 (C3):2 (G3):2 

(C3):2 (G3):2 (C3):2 (G3):2 (G3):2 (B3):2 (C3):4

```
#### Right Hand
```js
(E4):1 (D4):1 (C4):1 (D4):1 (E4):1 (E4):1 (E4):2 (D4):1 (D4):1 (D4):2 (E4):1 (G4):1 (G4):2

(E4):1 (D4):1 (C4):1 (D4):1 (E4):1 (E4):1 (E4):1 (E4):1 (D4):1 (D4):1 (E4):1 (D4):1 (C4):4
```