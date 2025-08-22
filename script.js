const baseNoteMap = {
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

const context = window.audioContext || new (window.AudioContext || window.webkitAudioContext)();
if (!window.audioContext) {
  window.audioContext = context;
}

// 🔊 Master gain node
const masterGain = context.createGain();
masterGain.gain.value = 0.7; // Default to 70% volume
masterGain.connect(context.destination);


let currentOscillators = [];
let playbackTimeouts = [];
let isPlaying = false;

const handsContainer = document.getElementById("handsContainer");
const addHandBtn = document.getElementById("addHandBtn");
const removeHandBtn = document.getElementById("removeHandBtn");

// Min and Max Hands allowed
const MIN_HANDS = 2;
const MAX_HANDS = 16;

// Initialize with 2 hands
let handCount = 2;

function createHandElement(index) {
    const col = document.createElement("div");
    col.className = "col-md-6 mb-3";
    col.id = `hand-${index}`;

    const label = document.createElement("label");
    label.className = "hand-label";
    label.htmlFor = `handInput-${index}`;
    label.textContent = `Hand ${index + 1}`;

    const textarea = document.createElement("textarea");
    textarea.id = `handInput-${index}`;
    textarea.className = "form-control";
    textarea.rows = 4;
    textarea.placeholder = `Enter notes for Hand ${index + 1} (e.g. (C4/E4/G4):3 F4:1 ():2)`;

    const selectWrapper = document.createElement("div");
    selectWrapper.className = "col-md-4 mt-2 px-0";

    const select = document.createElement("select");
    select.id = `oscillatorTypeSelect-${index}`;
    select.className = "form-select";

    ["sine", "square", "sawtooth", "triangle"].forEach(type => {
        const option = document.createElement("option");
        option.value = type;
        option.textContent = type.charAt(0).toUpperCase() + type.slice(1);
        if (type === "sine") option.selected = true;
        select.appendChild(option);
    });

    selectWrapper.appendChild(select);

    col.appendChild(label);
    col.appendChild(textarea);
    col.appendChild(selectWrapper);

    return col;
}

function renderHands() {
    handsContainer.innerHTML = "";
    for (let i = 0; i < handCount; i++) {
        handsContainer.appendChild(createHandElement(i));
    }
    updateAddRemoveButtons();
}

function updateAddRemoveButtons() {
    addHandBtn.disabled = handCount >= MAX_HANDS;
    removeHandBtn.disabled = handCount <= MIN_HANDS;
}

addHandBtn.addEventListener("click", () => {
    if (handCount < MAX_HANDS) {
        handCount++;
        renderHands();
    }
});

removeHandBtn.addEventListener("click", () => {
    if (handCount > MIN_HANDS) {
        handCount--;
        renderHands();
    }
});

function getBpmMultiplier() {
    return parseFloat(document.getElementById("tempoRange").value); // 0.1 to 10
}

function scheduleNote(freq, startTime, duration = 0.5, oscillatorType, volume = 1.0) {
  const oscillator = context.createOscillator();
  const gainNode = context.createGain();

  oscillator.type = oscillatorType;
  oscillator.frequency.setValueAtTime(freq, startTime);

  gainNode.gain.setValueAtTime(volume, startTime);
  gainNode.gain.setValueAtTime(volume, startTime + duration - 0.05);
  gainNode.gain.linearRampToValueAtTime(0.0001, startTime + duration);

  oscillator.connect(gainNode);
  gainNode.connect(masterGain); // <== here

  oscillator.start(startTime);
  oscillator.stop(startTime + duration);

  currentOscillators.push({ oscillator, gainNode });
}



function mapTextToNotes(text, mode, noteMap) {
    const notes = [];

    if (mode === "letters") {
        const regex = /\(\s*([A-G#b0-9\/]*?)\s*\)(?::(\d+(\.\d+)?))?|([A-G][#b]?\d?)(?::(\d+(\.\d+)?))?/gi;
        let match;
        while ((match = regex.exec(text.toUpperCase())) !== null) {
            if (match[0].startsWith("()") || (match[1] !== undefined && match[1].trim() === "")) {
                const beats = match[2] ? parseFloat(match[2]) : 1;
                notes.push({ notes: [], beats, isRest: true });
            } else if (match[1]) {
                const chordNotes = match[1].split('/').filter(n => n.length > 0);
                const validNotes = chordNotes.filter(n => noteMap[n]);
                if (validNotes.length) {
                    const beats = match[2] ? parseFloat(match[2]) : 1;
                    notes.push({ notes: validNotes, beats, isRest: false });
                }
            } else if (match[4]) {
                if (noteMap[match[4]]) {
                    const beats = match[5] ? parseFloat(match[5]) : 1;
                    notes.push({ notes: [match[4]], beats, isRest: false });
                }
            }
        }
    } else if (mode === "wordlength") {
        const words = text.trim().split(/\s+/);
        for (let word of words) {
            const len = Math.min(word.length, 7);
            const noteLetter = ['A', 'B', 'C', 'D', 'E', 'F', 'G'][len - 1];
            const noteKey = noteLetter + '4';
            notes.push({ notes: [noteKey], beats: 1, isRest: false });
        }
    }

    return notes;
}

function playHandsSequences(handsSeqs, noteMap, bpmMultiplier) {
    // Clear any previous playback
    stopPlayback();
    isPlaying = true;

    // Render status bars for each hand
    handsSeqs.forEach(({ handIndex }) => {
        const handDiv = document.getElementById(`hand-${handIndex}`);
        const statusDiv = document.createElement("div");
        statusDiv.className = "status mt-1";
        handDiv.appendChild(statusDiv);
    });

    const startTime = context.currentTime;
    let globalCursor = 0;
    const activeNotes = []; // All note items scheduled with metadata

    handsSeqs.forEach(({ sequence, oscillatorType, handIndex }) => {
        const spans = [];

        // Render spans for visual feedback
        const statusDiv = document.querySelector(`#hand-${handIndex} .status`);
        sequence.forEach(item => {
            const span = document.createElement("span");
            span.className = "note-span";
            span.textContent = item.isRest
                ? "Rest"
                : (item.notes.length > 1 ? `(${item.notes.join("/")})` : item.notes[0]);
            if (item.isRest) {
                span.style.fontStyle = "italic";
                span.style.color = "#bbb";
            }
            spans.push(span);
            statusDiv.appendChild(span);
        });

        let handTimeCursor = 0;

        sequence.forEach((item, idx) => {
            const duration = item.beats * bpmMultiplier;
            const noteStart = handTimeCursor;
            const noteEnd = noteStart + duration;

            activeNotes.push({
                handIndex,
                startTime: noteStart,
                endTime: noteEnd,
                notes: item.notes,
                isRest: item.isRest,
                oscillatorType,
                span: spans[idx],
                hasPlayed: false
            });

            handTimeCursor += duration;
            globalCursor = Math.max(globalCursor, handTimeCursor);
        });
    });

    const tickInterval = 50; // milliseconds
    const schedulerStart = context.currentTime;

    const scheduler = setInterval(() => {
        const now = context.currentTime - schedulerStart;

        let allDone = true;

        activeNotes.forEach(note => {
            if (note.hasPlayed) return;
            if (now >= note.startTime) {
                note.hasPlayed = true;

                // Visual highlight
                document.querySelectorAll(`#hand-${note.handIndex} .note-span`).forEach(s => {
                    s.classList.remove("note-playing");
                });
                if (note.span) note.span.classList.add("note-playing");

                // Schedule audio
                if (!note.isRest) {
                    const duration = note.endTime - note.startTime;
                    const when = context.currentTime;
                    const noteCount = note.notes.length;
                    const volume = 1.0 / noteCount;  // Normalize volume based on number of notes

                    note.notes.forEach(n => {
                        if (noteMap[n]) {
                            scheduleNote(noteMap[n], when, duration, note.oscillatorType, volume);
                        }
                    });
                }
            }

            if (!note.hasPlayed || now < note.endTime) {
                allDone = false;
            }
        });

        if (allDone) {
            clearInterval(scheduler);
            isPlaying = false;

            handsSeqs.forEach(({ handIndex }) => {
                const statusDiv = document.querySelector(`#hand-${handIndex} .status`);
                if (statusDiv) {
                    const doneMsg = document.createElement("div");
                    doneMsg.className = "mt-2 text-success";
                    doneMsg.textContent = "Done";
                    statusDiv.appendChild(doneMsg);
                }
            });
        }
    }, tickInterval);

    playbackTimeouts.push(() => clearInterval(scheduler));
}


function playAllHands() {
    if (isPlaying) return;

    if (context.state === 'suspended') context.resume();
    stopPlayback();

    const mode = document.getElementById("modeSelect").value;
    const bpmMultiplier = getBpmMultiplier();

    // Gather inputs for all hands
    const handsSeqs = [];
    let allEmpty = true;

    for (let i = 0; i < handCount; i++) {
        const inputEl = document.getElementById(`handInput-${i}`);
        const oscSelect = document.getElementById(`oscillatorTypeSelect-${i}`);

        const inputValue = inputEl.value.trim();
        if (inputValue) allEmpty = false;

        const seq = mapTextToNotes(inputValue, mode, baseNoteMap);
        handsSeqs.push({ sequence: seq, oscillatorType: oscSelect.value, handIndex: i });
    }

    if (allEmpty) {
        alert("Please enter notes in at least one hand.");
        return;
    }

    // Validate at least one hand has notes
    if (handsSeqs.every(h => h.sequence.length === 0)) {
        alert("No valid notes found in any hand.");
        return;
    }

    playHandsSequences(handsSeqs, baseNoteMap, bpmMultiplier);
}

function stopPlayback() {
    isPlaying = false;

    // Clear scheduled intervals
    playbackTimeouts.forEach(cancel => {
        if (typeof cancel === "function") cancel();
        else clearTimeout(cancel);
    });
    playbackTimeouts = [];

    // Stop all oscillators smoothly
    const now = context.currentTime;
    currentOscillators.forEach(({ oscillator, gainNode }) => {
        gainNode.gain.exponentialRampToValueAtTime(0.0001, now + 0.05);
        oscillator.stop(now + 0.05);
        setTimeout(() => {
            try {
                oscillator.disconnect();
                gainNode.disconnect();
            } catch (e) { }
        }, 100);
    });

    currentOscillators = [];

    // Remove visual highlights
    document.querySelectorAll('.note-span').forEach(span => span.classList.remove('note-playing'));
    document.querySelectorAll(".status").forEach(s => s.remove());
}


// Event Listeners
document.getElementById("playBtn").addEventListener("click", playAllHands);
document.getElementById("stopBtn").addEventListener("click", stopPlayback);
document.getElementById("tempoRange").addEventListener("input", function () {
    document.getElementById("tempoValue").innerText = this.value + "x";
});
document.getElementById("masterVolumeRange").addEventListener("input", function () {
  masterGain.gain.value = parseFloat(this.value);
});


addHandBtn.addEventListener("click", () => {
    if (handCount < MAX_HANDS) {
        handCount++;
        renderHands();
    }
});

removeHandBtn.addEventListener("click", () => {
    if (handCount > MIN_HANDS) {
        handCount--;
        renderHands();
    }
});

// Initialize hands on page load
renderHands();
