import pretty_midi
import sys
import os

def midi_to_note_name(pitch):
    return pretty_midi.note_number_to_name(pitch)

def extract_notes_per_track(midi_path):
    try:
        midi_data = pretty_midi.PrettyMIDI(midi_path)
    except Exception as e:
        print(f"Error loading MIDI file: {e}")
        return []

    tracks = []
    for i, instrument in enumerate(midi_data.instruments):
        notes = []
        for note in instrument.notes:
            pitch_name = midi_to_note_name(note.pitch)
            start = round(note.start, 6)
            end = round(note.end, 6)
            duration = round(end - start, 6)
            notes.append({
                "pitch": pitch_name,
                "start": start,
                "end": end,
                "duration": duration
            })
        # Sort by start time
        notes.sort(key=lambda x: x["start"])
        tracks.append(notes)

    return tracks

def split_by_exact_time(notes):
    result = []
    time_map = {}

    for note in notes:
        if note["start"] not in time_map:
            time_map[note["start"]] = []
        time_map[note["start"]].append(note)

    for start_time in sorted(time_map.keys()):
        notes_at_time = time_map[start_time]
        pitches = [n["pitch"] for n in notes_at_time]
        durations = [n["duration"] for n in notes_at_time]
        avg_duration = sum(durations) / len(durations)
        result.append((start_time, pitches, avg_duration))

    return result

def add_silence(blocks):
    result = []
    prev_end = 0.0

    for start_time, pitches, duration in blocks:
        if start_time - prev_end > 0.0001:
            silent_duration = start_time - prev_end
            result.append((prev_end, [], silent_duration))

        result.append((start_time, pitches, duration))
        prev_end = start_time + duration

    return result

def save_track_output(notes_with_silence, filename):
    with open(filename, 'w') as f:
        for _, pitches, duration in notes_with_silence:
            duration_str = f"{duration:.6f}".rstrip('0').rstrip('.')
            if not pitches:
                line = f"():{duration_str}"
            else:
                pitch_str = '/'.join(pitches)
                if len(pitches) > 1:
                    pitch_str = f"({pitch_str})"
                else:
                    pitch_str = f"({pitch_str})"
                line = f"{pitch_str}:{duration_str}"
            f.write(line + '\n')

def main():
    if len(sys.argv) < 2:
        print("Usage: python midi_by_track_split.py <input_file.mid>")
        return

    midi_path = sys.argv[1]
    if not os.path.exists(midi_path):
        print(f"File not found: {midi_path}")
        return

    tracks = extract_notes_per_track(midi_path)
    base_name = os.path.splitext(midi_path)[0]

    for idx, notes in enumerate(tracks, start=1):
        if not notes:
            continue
        blocks = split_by_exact_time(notes)
        blocks_with_silence = add_silence(blocks)
        out_file = f"{base_name}_Track{idx}.txt"
        save_track_output(blocks_with_silence, out_file)
        print(f"Saved track {idx} to {out_file}")

if __name__ == "__main__":
    main()
