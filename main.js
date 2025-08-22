import {
  baseNoteMap,
  scheduleNote,
  stopAllSounds,
  getAudioContext,
  setMasterVolume
} from './audio_engine.js';

const MIN_HANDS = 2;
const MAX_HANDS = 16;
let handCount = MIN_HANDS;

let isPlaying = false;
let currentTimeouts = [];

const handsContainer = document.getElementById("handsContainer");
const addHandBtn = document.getElementById("addHandBtn");
const removeHandBtn = document.getElementById("removeHandBtn");

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
  stopPlayback();
  isPlaying = true;

  handsSeqs.forEach(({ handIndex }) => {
    const handDiv = document.getElementById(`hand-${handIndex}`);
    const statusDiv = document.createElement("div");
    statusDiv.className = "status mt-1";
    handDiv.appendChild(statusDiv);
  });

  const context = getAudioContext();
  const startTime = context.currentTime;
  let globalCursor = 0;
  const activeNotes = [];

  handsSeqs.forEach(({ sequence, oscillatorType, handIndex }) => {
    const spans = [];
    const statusDiv = document.querySelector(`#hand-${handIndex} .status`);
    sequence.forEach(item => {
      const span = document.createElement("span");
      span.className = "note-span";
      span.textContent = item.isRest ? "Rest" :
        (item.notes.length > 1 ? `(${item.notes.join("/")})` : item.notes[0]);
      if (item.isRest) {
        span.style.fontStyle = "italic";
        span.style.color = "#bbb";
      }
      spans.push(span);
      statusDiv.appendChild(span);
    });

    let handTimeCursor = 0;
    sequence.forEach((item, idx) => {
      const duration = item.beats / bpmMultiplier;
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

  const schedulerStart = context.currentTime;
  const tickInterval = 50;

  const scheduler = setInterval(() => {
    const now = context.currentTime - schedulerStart;
    let allDone = true;

    activeNotes.forEach(note => {
      if (note.hasPlayed) return;
      if (now >= note.startTime) {
        note.hasPlayed = true;

        document.querySelectorAll(`#hand-${note.handIndex} .note-span`).forEach(s => s.classList.remove("note-playing"));
        if (note.span) note.span.classList.add("note-playing");

        if (!note.isRest) {
          const duration = note.endTime - note.startTime;
          const when = context.currentTime;
          const volume = 1.0 / note.notes.length;

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
        const doneMsg = document.createElement("div");
        doneMsg.className = "mt-2 text-success";
        doneMsg.textContent = "Done";
        statusDiv.appendChild(doneMsg);
      });
    }
  }, tickInterval);

  currentTimeouts.push(() => clearInterval(scheduler));
}


function playAllHands() {
  if (isPlaying) return;
  const context = getAudioContext();
  if (context.state === 'suspended') context.resume();

  stopPlayback();

  const mode = document.getElementById("modeSelect").value;
  const bpmMultiplier = parseFloat(document.getElementById("tempoRange").value);

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

  if (handsSeqs.every(h => h.sequence.length === 0)) {
    alert("No valid notes found in any hand.");
    return;
  }

  playHandsSequences(handsSeqs, baseNoteMap, bpmMultiplier);
}


function stopPlayback() {
  isPlaying = false;

  currentTimeouts.forEach(cancel => typeof cancel === "function" && cancel());
  currentTimeouts = [];

  stopAllSounds();

  document.querySelectorAll('.note-span').forEach(span => span.classList.remove('note-playing'));
  document.querySelectorAll(".status").forEach(s => s.remove());
}

document.getElementById("playBtn").addEventListener("click", playAllHands);
document.getElementById("stopBtn").addEventListener("click", stopPlayback);

document.getElementById("tempoRange").addEventListener("input", function () {
  document.getElementById("tempoValue").innerText = this.value + "x";
});



document.getElementById("masterVolumeRange").addEventListener("input", function () {
  setMasterVolume(this.value);
  document.getElementById("speedValue").innerText = this.value + "x";
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


renderHands();
