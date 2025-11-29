// Complete Audio Transcription Pipeline for Piano Learning App

class AudioTranscriptionPipeline {
    constructor(audioBuffer, audioContext) {
        if (!audioBuffer) {
            throw new Error('AudioBuffer is required');
        }
        if (!audioContext) {
            throw new Error('AudioContext is required');
        }
        this.audioBuffer = audioBuffer;
        this.audioContext = audioContext;
        this.sampleRate = audioBuffer.sampleRate;
    }

    async process() {
        try {
            // A) AUDIO PREPROCESSING
            const cleanedAudio = await this.preprocessAudio();
            
            // B) MULTI-PASS NOTE TRANSCRIPTION
            const onsets = this.detectOnsets(cleanedAudio);
            const pitchEvents = this.detectPitches(cleanedAudio, onsets);
            const refinedEvents = this.refineEvents(pitchEvents);
            
            // C) QUANTIZATION & LATENCY COMPENSATION
            const tempo = this.estimateTempo(onsets);
            const quantized = this.quantizeEvents(refinedEvents, tempo);
            
            // D) GENERATE MIDI-LIKE STRUCTURED EVENTS
            const events = this.generateMIDIEvents(quantized.events);
            
            // E) FALLING-NOTE ANIMATION DATA
            const fallingNotes = this.generateFallingNotes(events);
            
            // F) FINAL OUTPUT
            return {
                tempo: tempo,
                timeSignature: [4, 4],
                events: events,
                fallingNotes: fallingNotes,
                syncOffsetMs: quantized.syncOffset
            };
        } catch (error) {
            console.error('Pipeline error:', error);
            throw error;
        }
    }

    async preprocessAudio() {
        if (!this.audioBuffer || !this.audioBuffer.getChannelData) {
            throw new Error('Invalid audio buffer');
        }
        const channelData = this.audioBuffer.getChannelData(0);
        if (!channelData || channelData.length === 0) {
            throw new Error('Empty audio data');
        }
        let processed = new Float32Array(channelData);
        
        // High-pass filter at 70 Hz
        processed = this.highPassFilter(processed, 70);
        
        // Low-pass filter at 12 kHz
        processed = this.lowPassFilter(processed, 12000);
        
        // Normalize
        const rms = Math.sqrt(processed.reduce((sum, val) => sum + val * val, 0) / processed.length);
        const targetRMS = 0.1;
        const gain = targetRMS / (rms + 0.0001);
        processed = processed.map(v => v * gain);
        
        return processed;
    }

    highPassFilter(data, cutoff) {
        const RC = 1.0 / (cutoff * 2 * Math.PI);
        const dt = 1.0 / this.sampleRate;
        const alpha = RC / (RC + dt);
        
        const filtered = new Float32Array(data.length);
        filtered[0] = data[0];
        
        for (let i = 1; i < data.length; i++) {
            filtered[i] = alpha * (filtered[i-1] + data[i] - data[i-1]);
        }
        
        return filtered;
    }

    lowPassFilter(data, cutoff) {
        const RC = 1.0 / (cutoff * 2 * Math.PI);
        const dt = 1.0 / this.sampleRate;
        const alpha = dt / (RC + dt);
        
        const filtered = new Float32Array(data.length);
        filtered[0] = data[0];
        
        for (let i = 1; i < data.length; i++) {
            filtered[i] = filtered[i-1] + alpha * (data[i] - filtered[i-1]);
        }
        
        return filtered;
    }

    detectOnsets(audioData) {
        const hopSize = Math.floor(this.sampleRate * 0.01); // 10ms
        const windowSize = Math.floor(this.sampleRate * 0.05); // 50ms
        const onsets = [];
        
        let prevEnergy = 0;
        
        for (let i = 0; i < audioData.length - windowSize; i += hopSize) {
            const window = audioData.slice(i, i + windowSize);
            const energy = window.reduce((sum, val) => sum + val * val, 0) / window.length;
            
            // Onset = significant energy increase
            if (energy > prevEnergy * 1.5 && energy > 0.001) {
                onsets.push({
                    time: i / this.sampleRate,
                    energy: energy
                });
            }
            
            prevEnergy = energy * 0.9 + energy * 0.1; // Smooth
        }
        
        return onsets;
    }

    detectPitches(audioData, onsets) {
        const events = [];
        
        for (const onset of onsets) {
            const startSample = Math.floor(onset.time * this.sampleRate);
            const windowSize = 4096;
            const window = audioData.slice(startSample, startSample + windowSize);
            
            if (window.length < windowSize) continue;
            
            const pitch = this.detectPitch(window);
            if (pitch > 0) {
                const duration = this.estimateDuration(audioData, startSample);
                const velocity = Math.min(127, Math.floor(onset.energy * 500));
                
                events.push({
                    time: onset.time,
                    pitch: pitch,
                    duration: duration,
                    velocity: velocity
                });
            }
        }
        
        return events;
    }

    detectPitch(window) {
        // Autocorrelation method
        const minPeriod = Math.floor(this.sampleRate / 4186); // C8
        const maxPeriod = Math.floor(this.sampleRate / 27.5); // A0
        
        let bestPeriod = 0;
        let bestCorrelation = 0;
        
        for (let period = minPeriod; period < maxPeriod; period++) {
            let correlation = 0;
            for (let i = 0; i < window.length - period; i++) {
                correlation += window[i] * window[i + period];
            }
            
            if (correlation > bestCorrelation) {
                bestCorrelation = correlation;
                bestPeriod = period;
            }
        }
        
        if (bestPeriod === 0) return 0;
        
        const frequency = this.sampleRate / bestPeriod;
        return this.frequencyToMIDI(frequency);
    }

    frequencyToMIDI(frequency) {
        if (frequency < 20) return 0;
        return Math.round(69 + 12 * Math.log2(frequency / 440));
    }

    midiToNoteName(midi) {
        const notes = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
        const octave = Math.floor(midi / 12) - 1;
        const note = notes[midi % 12];
        return note + octave;
    }

    estimateDuration(audioData, startSample) {
        const maxDuration = Math.floor(this.sampleRate * 2); // Max 2 seconds
        let duration = 0;
        
        const threshold = 0.001;
        for (let i = startSample; i < Math.min(startSample + maxDuration, audioData.length); i++) {
            if (Math.abs(audioData[i]) < threshold) {
                duration = (i - startSample) / this.sampleRate;
                break;
            }
        }
        
        return duration || 0.2; // Default 200ms
    }

    refineEvents(events) {
        // Remove duplicates within 25ms
        const refined = [];
        
        for (let i = 0; i < events.length; i++) {
            const event = events[i];
            
            // Check if too close to previous
            if (i > 0 && event.time - events[i-1].time < 0.025) {
                continue;
            }
            
            // Remove too short
            if (event.duration < 0.025) {
                continue;
            }
            
            refined.push(event);
        }
        
        return refined;
    }

    estimateTempo(onsets) {
        if (onsets.length < 4) return 120;
        
        const intervals = [];
        for (let i = 1; i < Math.min(onsets.length, 50); i++) {
            intervals.push(onsets[i].time - onsets[i-1].time);
        }
        
        intervals.sort((a, b) => a - b);
        const medianInterval = intervals[Math.floor(intervals.length / 2)];
        const bpm = 60 / (medianInterval * 4); // Assume 16th notes
        
        return Math.round(Math.max(60, Math.min(200, bpm)));
    }

    quantizeEvents(events, tempo) {
        const beatDuration = 60 / tempo;
        const sixteenthNote = beatDuration / 4;
        const quantized = [];
        let syncOffset = 0;
        
        for (const event of events) {
            // Quantize to 10ms grid
            const quantizedTime = Math.round(event.time * 100) / 100;
            
            quantized.push({
                ...event,
                time: quantizedTime
            });
        }
        
        return { events: quantized, syncOffset: syncOffset };
    }

    generateMIDIEvents(quantized) {
        return quantized.events.map(event => ({
            note: this.midiToNoteName(event.pitch),
            pitch: event.pitch,
            start: event.time,
            duration: event.duration,
            velocity: event.velocity
        }));
    }

    generateFallingNotes(events) {
        return events.map(event => ({
            keyIndex: event.pitch - 21, // A0 = MIDI 21 = keyIndex 0
            start: event.start,
            duration: event.duration,
            brightness: event.velocity / 127
        }));
    }
}

// Make available globally for browser
if (typeof window !== 'undefined') {
    window.AudioTranscriptionPipeline = AudioTranscriptionPipeline;
}

// Export for use in Node.js if needed
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AudioTranscriptionPipeline;
}
