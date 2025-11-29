// Automatic Audio-to-MIDI Converter using Magenta.js

class AudioToMIDIConverter {
    constructor() {
        this.model = null;
        this.isReady = false;
    }

    async initialize() {
        try {
            console.log('Initializing audio-to-MIDI converter...');
            
            // Check if TensorFlow and Magenta are loaded
            if (typeof tf === 'undefined') {
                console.warn('TensorFlow not loaded');
                return false;
            }
            
            if (typeof mm === 'undefined') {
                console.warn('Magenta not loaded');
                return false;
            }
            
            // Initialize Magenta's OnsetsAndFrames model
            this.model = new mm.OnsetsAndFrames('https://storage.googleapis.com/magentadata/js/checkpoints/transcription/onsets_frames_uni');
            await this.model.initialize();
            
            this.isReady = true;
            console.log('Audio-to-MIDI converter ready!');
            return true;
            
        } catch (error) {
            console.error('Failed to initialize converter:', error);
            this.isReady = false;
            return false;
        }
    }

    async convertAudioToMIDI(audioBuffer, onProgress) {
        if (!this.isReady) {
            throw new Error('Converter not initialized');
        }

        try {
            onProgress && onProgress(10, 'Preparing audio...');
            
            // Convert AudioBuffer to format Magenta expects
            const audioData = audioBuffer.getChannelData(0);
            const sampleRate = audioBuffer.sampleRate;
            
            onProgress && onProgress(25, 'Analyzing audio...');
            
            // Transcribe using Magenta
            const noteSequence = await this.model.transcribeFromAudioArray(audioData, sampleRate);
            
            onProgress && onProgress(75, 'Converting to notes...');
            
            // Convert NoteSequence to our format
            const events = [];
            
            if (noteSequence && noteSequence.notes) {
                for (const note of noteSequence.notes) {
                    const noteName = this.midiToNoteName(note.pitch);
                    events.push({
                        note: noteName,
                        start: note.startTime,
                        duration: note.endTime - note.startTime,
                        velocity: note.velocity || 80
                    });
                }
            }
            
            onProgress && onProgress(100, 'Complete!');
            
            // Sort by start time
            events.sort((a, b) => a.start - b.start);
            
            return {
                events: events,
                tempo: noteSequence.tempos?.[0]?.qpm || 120,
                timeSignature: noteSequence.timeSignatures?.[0] || [4, 4]
            };
            
        } catch (error) {
            console.error('Conversion error:', error);
            throw error;
        }
    }

    midiToNoteName(midiNumber) {
        const noteNames = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
        const octave = Math.floor(midiNumber / 12) - 1;
        const note = noteNames[midiNumber % 12];
        return note + octave;
    }
}

// Make available
if (typ
eof window !== 'undefined') {
    window.AudioToMIDIConverter = AudioToMIDIConverter;
}
