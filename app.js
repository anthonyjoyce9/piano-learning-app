class PianoLearningApp {
    constructor() {
        this.audioContext = null;
        this.audioBuffer = null;
        this.sourceNode = null;
        this.analyser = null;
        this.isPlaying = false;
        this.isPaused = false;
        this.playbackRate = 1;
        this.micStream = null;
        this.isMicActive = false;
        this.mode = 'file'; // 'file' or 'mic'
        this.playMode = 'live'; // 'live' or 'practice'
        this.difficulty = 'beginner'; // 'beginner', 'intermediate', 'advanced'
        this.theme = 'purple'; // Color theme
        this.currentStep = 0; // For practice mode
        this.practiceNotes = []; // Notes to practice
        this.themeColors = {
            purple: { primary: '#a855f7', secondary: '#ec4899', glow: '#d946ef' },
            blue: { primary: '#3b82f6', secondary: '#06b6d4', glow: '#0ea5e9' },
            green: { primary: '#10b981', secondary: '#84cc16', glow: '#22c55e' },
            gold: { primary: '#f59e0b', secondary: '#eab308', glow: '#fbbf24' },
            red: { primary: '#ef4444', secondary: '#f97316', glow: '#f87171' }
        };
        
        // Falling notes system
        this.fallingNotes = [];
        this.onsetTimes = []; // Pre-detected onset times
        this.transcriptionResult = null; // Complete transcription data
        this.syncedPlayer = null; // Synced note player
        this.startTime = 0;
        this.audioStartTime = 0;
        this.animationId = null;
        this.hitKeys = new Set(); // Track which keys are currently hit
        this.lastNoteTime = 0;
        
        // Initialize synced player
        if (typeof SyncedNotePlayer !== 'undefined') {
            this.syncedPlayer = new SyncedNotePlayer(this);
        }
        
        // Initialize MIDI converter
        this.midiConverter = null;
        this.initMIDIConverter();
        
        this.initElements();
        this.initPiano();
        this.setupEventListeners();
    }
    
    async initMIDIConverter() {
        if (typeof AudioToMIDIConverter !== 'undefined') {
            this.midiConverter = new AudioToMIDIConverter();
            const ready = await this.midiConverter.initialize();
            if (ready) {
                console.log('✓ Automatic audio-to-MIDI conversion ready!');
            } else {
                console.log('⚠ Using fallback analysis');
            }
        }
    }

    initElements() {
        this.audioFileInput = document.getElementById('audioFile');
        this.fileNameSpan = document.getElementById('fileName');
        this.playBtn = document.getElementById('playBtn');
        this.pauseBtn = document.getElementById('pauseBtn');
        this.stopBtn = document.getElementById('stopBtn');
        this.speedControl = document.getElementById('speedControl');
        this.speedValue = document.getElementById('speedValue');
        this.pianoCanvas = document.getElementById('pianoCanvas');
        this.fallingNotesCanvas = document.getElementById('fallingNotes');
        this.waveformCanvas = document.getElementById('waveform');
        this.currentNotesDiv = document.getElementById('currentNotes');
        
        // Mode switching
        this.fileModeBtn = document.getElementById('fileMode');
        this.micModeBtn = document.getElementById('micMode');
        this.fileSection = document.getElementById('fileSection');
        this.micSection = document.getElementById('micSection');
        this.startMicBtn = document.getElementById('startMic');
        this.stopMicBtn = document.getElementById('stopMic');
        this.micStatus = document.getElementById('micStatus');
        
        // Difficulty buttons
        this.beginnerModeBtn = document.getElementById('beginnerMode');
        this.intermediateModeBtn = document.getElementById('intermediateMode');
        this.advancedModeBtn = document.getElementById('advancedMode');
        
        // Play mode buttons
        this.liveModeBtn = document.getElementById('liveMode');
        this.practiceModeBtn = document.getElementById('practiceMode');
        
        // View tabs
        this.fallingViewTab = document.getElementById('fallingViewTab');
        this.pianoRollTab = document.getElementById('pianoRollTab');
        this.fallingView = document.getElementById('fallingView');
        this.pianoRollView = document.getElementById('pianoRollView');
        this.pianoRollCanvas = document.getElementById('pianoRollCanvas');
        this.pianoRollCtx = this.pianoRollCanvas.getContext('2d');
        
        // Theme buttons
        this.purpleThemeBtn = document.getElementById('purpleTheme');
        this.blueThemeBtn = document.getElementById('blueTheme');
        this.greenThemeBtn = document.getElementById('greenTheme');
        this.goldThemeBtn = document.getElementById('goldTheme');
        this.redThemeBtn = document.getElementById('redTheme');
        
        this.pianoCtx = this.pianoCanvas.getContext('2d');
        this.fallingNotesCtx = this.fallingNotesCanvas.getContext('2d');
        this.waveformCtx = this.waveformCanvas.getContext('2d');
    }

    initPiano() {
        // Get actual canvas display size
        const containerWidth = Math.min(window.innerWidth - 80, 1600);
        
        // Full piano - 7 octaves (A0 to C8)
        const whiteKeysPerOctave = 7;
        const totalOctaves = 7;
        const totalWhiteKeys = whiteKeysPerOctave * totalOctaves + 3; // A0 to C8 = 52 white keys
        
        // Calculate key width to fit screen
        const whiteKeyWidth = containerWidth / totalWhiteKeys;
        const whiteKeyHeight = 150;
        const blackKeyWidth = whiteKeyWidth * 0.6;
        const blackKeyHeight = 100;
        
        const totalWidth = containerWidth;
        const pianoHeight = 200;
        const fallingHeight = 400; // This is the actual falling area height
        
        // Set canvas sizes to match display
        this.pianoCanvas.width = totalWidth;
        this.pianoCanvas.height = pianoHeight;
        
        // Falling notes canvas fills the remaining space
        this.fallingNotesCanvas.width = totalWidth;
        this.fallingNotesCanvas.height = fallingHeight;
        
        console.log('Full piano initialized - Width:', totalWidth, 'White keys:', totalWhiteKeys, 'Key width:', whiteKeyWidth.toFixed(1));
        
        this.keys = [];
        const notes = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
        
        let whiteKeyIndex = 0;
        
        // Start from A0 and go to C8
        for (let octave = 0; octave <= 8; octave++) {
            for (let noteIndex = 0; noteIndex < notes.length; noteIndex++) {
                const noteName = notes[noteIndex];
                const isBlack = noteName.includes('#');
                
                // Skip notes before A0
                if (octave === 0 && noteIndex < 9) continue;
                // Stop after C8
                if (octave === 8 && noteIndex > 0) break;
                
                const key = {
                    note: noteName + octave,
                    isBlack: isBlack,
                    active: false
                };
                
                if (isBlack) {
                    const prevWhiteIndex = whiteKeyIndex - 1;
                    key.x = prevWhiteIndex * whiteKeyWidth + whiteKeyWidth - blackKeyWidth / 2;
                    key.y = 25;
                    key.width = blackKeyWidth;
                    key.height = blackKeyHeight;
                } else {
                    key.x = whiteKeyIndex * whiteKeyWidth;
                    key.y = 25;
                    key.width = whiteKeyWidth;
                    key.height = whiteKeyHeight;
                    whiteKeyIndex++;
                }
                
                this.keys.push(key);
            }
        }
        
        console.log('Total keys created:', this.keys.length);
        this.drawPiano();
    }

    drawPiano() {
        const ctx = this.pianoCtx;
        const colors = this.themeColors[this.theme];
        
        ctx.clearRect(0, 0, this.pianoCanvas.width, this.pianoCanvas.height);
        
        // Draw white keys first
        this.keys.filter(k => !k.isBlack).forEach(key => {
            if (key.active) {
                // Massive glow for active key
                ctx.shadowBlur = 60;
                ctx.shadowColor = colors.glow;
                ctx.fillStyle = colors.primary;
                
                // Draw glow underneath
                ctx.fillRect(key.x, key.y, key.width, key.height);
                
                // Brighter center
                ctx.shadowBlur = 40;
                ctx.fillStyle = '#ffffff';
                ctx.fillRect(key.x + 2, key.y + 2, key.width - 4, key.height - 4);
            } else {
                ctx.shadowBlur = 0;
                ctx.fillStyle = '#ffffff'; // White keys
                ctx.fillRect(key.x, key.y, key.width, key.height);
            }
            
            ctx.shadowBlur = 0;
            ctx.strokeStyle = '#333333';
            ctx.lineWidth = 1;
            ctx.strokeRect(key.x, key.y, key.width, key.height);
            
            // Draw note name (only on larger keys)
            if (key.width > 20) {
                ctx.fillStyle = key.active ? '#000000' : '#999999';
                ctx.font = 'bold 9px Arial';
                ctx.textAlign = 'center';
                ctx.fillText(key.note, key.x + key.width / 2, key.y + key.height - 8);
            }
        });
        
        // Draw black keys on top
        this.keys.filter(k => k.isBlack).forEach(key => {
            if (key.active) {
                ctx.shadowBlur = 60;
                ctx.shadowColor = colors.glow;
                ctx.fillStyle = colors.primary;
                ctx.fillRect(key.x, key.y, key.width, key.height);
                
                ctx.shadowBlur = 40;
                ctx.fillStyle = '#ffffff';
                ctx.fillRect(key.x + 2, key.y + 2, key.width - 4, key.height - 4);
            } else {
                ctx.shadowBlur = 0;
                ctx.fillStyle = '#000000'; // Black keys
                ctx.fillRect(key.x, key.y, key.width, key.height);
            }
            
            ctx.shadowBlur = 0;
            ctx.strokeStyle = '#333333';
            ctx.lineWidth = 1;
            ctx.strokeRect(key.x, key.y, key.width, key.height);
        });
        
        ctx.shadowBlur = 0;
    }

    setupEventListeners() {
        this.audioFileInput.addEventListener('change', (e) => this.handleFileUpload(e));
        this.playBtn.addEventListener('click', () => this.play());
        this.pauseBtn.addEventListener('click', () => this.pause());
        this.stopBtn.addEventListener('click', () => this.stop());
        this.prevStepBtn = document.getElementById('prevStepBtn');
        this.nextStepBtn = document.getElementById('nextStepBtn');
        this.prevStepBtn.addEventListener('click', () => this.previousPracticeStep());
        this.nextStepBtn.addEventListener('click', () => this.nextPracticeStep());
        this.speedControl.addEventListener('input', (e) => this.changeSpeed(e));
        this.pianoCanvas.addEventListener('click', (e) => this.handlePianoClick(e));
        
        // Mode switching
        this.fileModeBtn.addEventListener('click', () => this.switchMode('file'));
        this.micModeBtn.addEventListener('click', () => this.switchMode('mic'));
        this.startMicBtn.addEventListener('click', () => this.startMicrophone());
        this.stopMicBtn.addEventListener('click', () => this.stopMicrophone());
        
        // Difficulty switching
        this.beginnerModeBtn.addEventListener('click', () => this.setDifficulty('beginner'));
        this.intermediateModeBtn.addEventListener('click', () => this.setDifficulty('intermediate'));
        this.advancedModeBtn.addEventListener('click', () => this.setDifficulty('advanced'));
        
        // Play mode switching
        this.liveModeBtn.addEventListener('click', () => this.setPlayMode('live'));
        this.practiceModeBtn.addEventListener('click', () => this.setPlayMode('practice'));
        
        // View tab switching
        this.fallingViewTab.addEventListener('click', () => this.switchView('falling'));
        this.pianoRollTab.addEventListener('click', () => this.switchView('pianoRoll'));
        
        // Theme switching
        this.purpleThemeBtn.addEventListener('click', () => this.setTheme('purple'));
        this.blueThemeBtn.addEventListener('click', () => this.setTheme('blue'));
        this.greenThemeBtn.addEventListener('click', () => this.setTheme('green'));
        this.goldThemeBtn.addEventListener('click', () => this.setTheme('gold'));
        this.redThemeBtn.addEventListener('click', () => this.setTheme('red'));
        
        // Piano is visual only - no touch interaction needed
        
        // Responsive resize
        window.addEventListener('resize', () => {
            const oldNotes = this.fallingNotes;
            this.initPiano();
            this.fallingNotes = oldNotes; // Preserve falling notes
        });
    }

    switchMode(mode) {
        this.mode = mode;
        
        if (mode === 'file') {
            this.fileModeBtn.classList.add('active');
            this.micModeBtn.classList.remove('active');
            this.fileSection.style.display = 'flex';
            this.micSection.style.display = 'none';
            this.stopMicrophone();
        } else {
            this.micModeBtn.classList.add('active');
            this.fileModeBtn.classList.remove('active');
            this.fileSection.style.display = 'none';
            this.micSection.style.display = 'flex';
            this.stop();
        }
    }
    
    setPlayMode(mode) {
        this.playMode = mode;
        
        // Update button states
        this.liveModeBtn.classList.remove('active');
        this.practiceModeBtn.classList.remove('active');
        
        if (mode === 'live') {
            this.liveModeBtn.classList.add('active');
            this.playBtn.textContent = '▶ Play';
            this.speedControl.style.display = 'inline-block';
            this.speedValue.style.display = 'inline-block';
            this.prevStepBtn.style.display = 'none';
            this.nextStepBtn.style.display = 'none';
        } else {
            this.practiceModeBtn.classList.add('active');
            this.playBtn.textContent = '▶ Start Practice';
            this.speedControl.style.display = 'none';
            this.speedValue.style.display = 'none';
            this.prevStepBtn.style.display = 'inline-block';
            this.nextStepBtn.style.display = 'inline-block';
        }
        
        console.log('Play mode set to:', mode);
    }
    
    setDifficulty(difficulty) {
        this.difficulty = difficulty;
        
        // Update button states
        this.beginnerModeBtn.classList.remove('active');
        this.intermediateModeBtn.classList.remove('active');
        this.advancedModeBtn.classList.remove('active');
        
        if (difficulty === 'beginner') {
            this.beginnerModeBtn.classList.add('active');
        } else if (difficulty === 'intermediate') {
            this.intermediateModeBtn.classList.add('active');
        } else {
            this.advancedModeBtn.classList.add('active');
        }
        
        // Re-filter existing transcription if available
        if (this.transcriptionResult && this.transcriptionResult.events) {
            const allEvents = this.transcriptionResult.allEvents || this.transcriptionResult.events;
            this.transcriptionResult.allEvents = allEvents; // Store original
            this.transcriptionResult.events = this.filterByDifficulty(allEvents);
            this.fileNameSpan.textContent = `${this.transcriptionResult.events.length} notes (${difficulty} mode)`;
        }
        
        console.log('Difficulty set to:', difficulty);
    }
    
    switchView(view) {
        if (view === 'falling') {
            this.fallingViewTab.classList.add('active');
            this.pianoRollTab.classList.remove('active');
            this.fallingView.style.display = 'block';
            this.pianoRollView.style.display = 'none';
        } else {
            this.pianoRollTab.classList.add('active');
            this.fallingViewTab.classList.remove('active');
            this.pianoRollView.style.display = 'block';
            this.fallingView.style.display = 'none';
            
            // Draw piano roll when switching to it
            if (this.transcriptionResult && this.transcriptionResult.events) {
                this.drawPianoRoll();
            }
        }
    }
    
    drawPianoRoll() {
        const events = this.transcriptionResult.allEvents || this.transcriptionResult.events;
        if (!events || events.length === 0) return;
        
        const ctx = this.pianoRollCtx;
        const colors = this.themeColors[this.theme];
        
        // Calculate dimensions
        const maxTime = Math.max(...events.map(e => e.start + e.duration));
        const pixelsPerSecond = 100;
        const noteHeight = 8;
        const canvasWidth = Math.max(1200, maxTime * pixelsPerSecond + 100);
        const canvasHeight = 88 * noteHeight + 40; // 88 piano keys
        
        this.pianoRollCanvas.width = canvasWidth;
        this.pianoRollCanvas.height = canvasHeight;
        
        // Dark background
        ctx.fillStyle = '#0f0f1a';
        ctx.fillRect(0, 0, canvasWidth, canvasHeight);
        
        // Draw grid lines
        ctx.strokeStyle = '#1a1a2a';
        ctx.lineWidth = 1;
        
        // Horizontal lines (notes)
        for (let i = 0; i <= 88; i++) {
            const y = i * noteHeight + 20;
            ctx.beginPath();
            ctx.moveTo(60, y);
            ctx.lineTo(canvasWidth, y);
            ctx.stroke();
        }
        
        // Vertical lines (time)
        for (let t = 0; t <= maxTime; t++) {
            const x = 60 + t * pixelsPerSecond;
            ctx.strokeStyle = t % 4 === 0 ? '#2a2a3a' : '#1a1a2a';
            ctx.beginPath();
            ctx.moveTo(x, 20);
            ctx.lineTo(x, canvasHeight - 20);
            ctx.stroke();
        }
        
        // Draw piano keys on left
        ctx.fillStyle = '#ffffff';
        ctx.font = '8px Arial';
        ctx.textAlign = 'right';
        ctx.textBaseline = 'middle';
        
        for (let i = 0; i < 88; i++) {
            const midiNote = 21 + i; // A0 = 21
            const noteName = this.midiToNoteName(midiNote);
            const y = (87 - i) * noteHeight + 20;
            
            // Highlight C notes
            if (noteName.startsWith('C')) {
                ctx.fillStyle = '#2a2a3a';
                ctx.fillRect(0, y, 60, noteHeight);
                ctx.fillStyle = '#ffffff';
            }
            
            ctx.fillText(noteName, 55, y + noteHeight / 2);
        }
        
        // Draw notes
        events.forEach(event => {
            const midiNote = this.noteToMIDI(event.note);
            const keyIndex = midiNote - 21; // A0 = 0
            
            if (keyIndex < 0 || keyIndex >= 88) return;
            
            const x = 60 + event.start * pixelsPerSecond;
            const width = event.duration * pixelsPerSecond;
            const y = (87 - keyIndex) * noteHeight + 20;
            
            // Draw note bar with glow
            ctx.shadowBlur = 15;
            ctx.shadowColor = colors.glow;
            
            const gradient = ctx.createLinearGradient(x, y, x, y + noteHeight);
            gradient.addColorStop(0, colors.secondary);
            gradient.addColorStop(1, colors.primary);
            
            ctx.fillStyle = gradient;
            ctx.fillRect(x, y + 1, width, noteHeight - 2);
            
            // Inner highlight
            ctx.shadowBlur = 0;
            ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
            ctx.fillRect(x + 1, y + 2, width - 2, noteHeight / 3);
        });
        
        ctx.shadowBlur = 0;
    }
    
    setTheme(theme) {
        this.theme = theme;
        
        // Update button states
        this.purpleThemeBtn.classList.remove('active');
        this.blueThemeBtn.classList.remove('active');
        this.greenThemeBtn.classList.remove('active');
        this.goldThemeBtn.classList.remove('active');
        this.redThemeBtn.classList.remove('active');
        
        if (theme === 'purple') this.purpleThemeBtn.classList.add('active');
        else if (theme === 'blue') this.blueThemeBtn.classList.add('active');
        else if (theme === 'green') this.greenThemeBtn.classList.add('active');
        else if (theme === 'gold') this.goldThemeBtn.classList.add('active');
        else if (theme === 'red') this.redThemeBtn.classList.add('active');
        
        console.log('Theme set to:', theme);
    }

    async startMicrophone() {
        try {
            if (!this.audioContext) {
                this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            }

            this.micStream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const source = this.audioContext.createMediaStreamSource(this.micStream);
            
            this.analyser = this.audioContext.createAnalyser();
            this.analyser.fftSize = 8192; // Very high resolution for accurate pitch detection
            this.analyser.smoothingTimeConstant = 0.75; // Balanced smoothing for piano
            this.analyser.minDecibels = -85;
            this.analyser.maxDecibels = -15;
            
            source.connect(this.analyser);
            
            this.isMicActive = true;
            this.startMicBtn.style.display = 'none';
            this.stopMicBtn.style.display = 'inline-block';
            this.micStatus.textContent = '🎤 Listening...';
            this.micStatus.style.color = '#22c55e';
            
            this.analyzeMicrophoneInput();
        } catch (error) {
            alert('Error accessing microphone: ' + error.message);
            this.micStatus.textContent = '❌ Microphone access denied';
            this.micStatus.style.color = '#ef4444';
        }
    }

    stopMicrophone() {
        if (this.micStream) {
            this.micStream.getTracks().forEach(track => track.stop());
            this.micStream = null;
        }
        
        this.isMicActive = false;
        this.startMicBtn.style.display = 'inline-block';
        this.stopMicBtn.style.display = 'none';
        this.micStatus.textContent = '';
        this.clearActiveKeys();
        this.stopFallingNotesAnimation();
    }
    
    stopFallingNotesAnimation() {
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
            this.animationId = null;
        }
        this.fallingNotes = [];
        this.clearFallingNotesCanvas();
    }

    analyzeMicrophoneInput() {
        if (!this.isMicActive || !this.analyser) return;
        
        const bufferLength = this.analyser.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);
        
        this.startFallingNotesAnimation();
        
        const analyze = () => {
            if (!this.isMicActive) return;
            
            this.analyser.getByteFrequencyData(dataArray);
            const detectedNotes = this.detectNotes(dataArray);
            this.highlightKeys(detectedNotes);
            
            // Add falling notes for microphone input
            detectedNotes.forEach(note => {
                this.addFallingNote(note);
            });
            
            requestAnimationFrame(analyze);
        };
        
        analyze();
    }

    async handleFileUpload(event) {
        const file = event.target.files[0];
        if (!file) return;
        
        // Stop any currently playing audio
        this.stop();
        
        // Reset state
        this.audioBuffer = null;
        this.transcriptionResult = null;
        this.onsetTimes = [];
        this.fallingNotes = [];
        this.currentStep = 0;
        
        this.fileNameSpan.textContent = 'Loading: ' + file.name;
        this.playBtn.disabled = true;
        this.stopBtn.disabled = true;
        
        if (!this.audioContext) {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        }
        
        try {
            // Check if it's a MIDI file
            if (file.name.toLowerCase().endsWith('.mid') || file.name.toLowerCase().endsWith('.midi')) {
                await this.handleMIDIFile(file);
            } else {
                // Regular audio file
                const arrayBuffer = await file.arrayBuffer();
                this.audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer);
                
                this.drawWaveform();
                
                // Pre-analyze the audio to create note schedule
                await this.analyzeAudioBuffer();
            }
            
            this.playBtn.disabled = false;
            this.stopBtn.disabled = false;
        } catch (error) {
            console.error('File upload error:', error);
            alert('Error loading file: ' + error.message + '\n\nTip: Piano-only recordings work best!');
            this.fileNameSpan.textContent = 'Error loading file. Try another one.';
            this.playBtn.disabled = false; // Allow trying again
        }
    }
    
    async handleMIDIFile(file) {
        try {
            this.fileNameSpan.textContent = 'Loading MIDI file...';
            
            // Check if Tone.js MIDI parser is available
            if (typeof Midi === 'undefined') {
                throw new Error('MIDI parser not loaded');
            }
            
            // Read the MIDI file
            const arrayBuffer = await file.arrayBuffer();
            const midi = new Midi(arrayBuffer);
            
            this.fileNameSpan.textContent = 'Parsing MIDI data...';
            
            // Extract notes from all tracks
            const allNotes = [];
            
            for (const track of midi.tracks) {
                for (const note of track.notes) {
                    allNotes.push({
                        note: note.name, // e.g., "C4"
                        start: note.time,
                        duration: note.duration,
                        velocity: Math.floor(note.velocity * 127)
                    });
                }
            }
            
            // Sort by start time
            allNotes.sort((a, b) => a.start - b.start);
            
            // Apply difficulty filter
            const filtered = this.filterByDifficulty(allNotes);
            
            // Create transcription result
            this.transcriptionResult = {
                tempo: midi.header.tempos[0]?.bpm || 120,
                timeSignature: midi.header.timeSignatures[0]?.timeSignature || [4, 4],
                events: filtered,
                allEvents: allNotes,
                syncOffsetMs: 0
            };
            
            this.onsetTimes = filtered.map(e => e.start);
            
            // Create a silent audio buffer for timing (MIDI has no audio)
            const duration = Math.max(...allNotes.map(n => n.start + n.duration)) + 1;
            this.audioBuffer = this.audioContext.createBuffer(
                1,
                Math.floor(duration * this.audioContext.sampleRate),
                this.audioContext.sampleRate
            );
            
            this.fileNameSpan.textContent = `✓ MIDI loaded! ${filtered.length} notes (${this.transcriptionResult.tempo} BPM)`;
            console.log('MIDI file loaded:', filtered.length, 'notes');
            
        } catch (error) {
            console.error('MIDI loading error:', error);
            alert('Error loading MIDI file: ' + error.message + '\n\nMake sure the file is a valid MIDI file.');
            this.fileNameSpan.textContent = 'Error loading MIDI file';
            throw error;
        }
    }
    
    async analyzeAudioBuffer() {
        try {
            this.fileNameSpan.textContent = 'Analyzing audio... 0%';
            
            // Validate audio buffer
            if (!this.audioBuffer) {
                throw new Error('No audio buffer available');
            }
            
            // Try Magenta AI converter first (best quality)
            if (this.midiConverter && this.midiConverter.isReady) {
                console.log('Using Magenta AI audio-to-MIDI conversion...');
                await this.magentaConversion();
                return;
            }
            
            // Fallback to enhanced analysis
            console.log('Using enhanced pitch detection...');
            await this.enhancedAnalysis();
            
        } catch (error) {
            console.error('Analysis error:', error);
            console.error('Error stack:', error);
            this.fileNameSpan.textContent = 'Using fallback analysis...';
            await this.enhancedAnalysis();
        }
    }
    
    async magentaConversion() {
        try {
            const result = await this.midiConverter.convertAudioToMIDI(
                this.audioBuffer,
                (progress, status) => {
                    this.fileNameSpan.textContent = `AI Conversion: ${status} ${progress}%`;
                }
            );
            
            // Apply difficulty filter
            const filtered = this.filterByDifficulty(result.events);
            
            this.transcriptionResult = {
                tempo: result.tempo,
                timeSignature: result.timeSignature,
                events: filtered,
                allEvents: result.events,
                syncOffsetMs: 0
            };
            
            this.onsetTimes = filtered.map(e => e.start);
            
            this.fileNameSpan.textContent = `✓ AI conversion complete! ${filtered.length} notes detected`;
            console.log('Magenta conversion complete:', filtered.length, 'notes');
            
        } catch (error) {
            console.error('Magenta conversion error:', error);
            this.fileNameSpan.textContent = 'AI conversion failed, trying server...';
            await this.serverConversion();
        }
    }
    
    async serverConversion() {
        try {
            // Try to use your backend server for conversion
            const SERVER_URL = 'http://localhost:5000'; // Change this to your deployed URL
            
            this.fileNameSpan.textContent = 'Uploading to server... 0%';
            
            // Get the original file from the input
            const file = this.audioFileInput.files[0];
            if (!file) {
                throw new Error('No file available');
            }
            
            // Create form data
            const formData = new FormData();
            formData.append('audio', file);
            
            // Upload to server
            const response = await fetch(`${SERVER_URL}/convert`, {
                method: 'POST',
                body: formData
            });
            
            if (!response.ok) {
                throw new Error(`Server error: ${response.status}`);
            }
            
            this.fileNameSpan.textContent = 'Server processing... 75%';
            
            const result = await response.json();
            
            if (result.error) {
                throw new Error(result.error);
            }
            
            // Apply difficulty filter
            const filtered = this.filterByDifficulty(result.events);
            
            this.transcriptionResult = {
                tempo: result.tempo || 120,
                timeSignature: result.timeSignature || [4, 4],
                events: filtered,
                allEvents: result.events,
                syncOffsetMs: result.syncOffsetMs || 0
            };
            
            this.onsetTimes = filtered.map(e => e.start);
            
            this.fileNameSpan.textContent = `✓ Server conversion complete! ${filtered.length} notes detected`;
            console.log('Server conversion complete:', filtered.length, 'notes');
            
        } catch (error) {
            console.error('Server conversion error:', error);
            this.fileNameSpan.textContent = 'Server unavailable, using fallback...';
            await this.enhancedAnalysis();
        }
    }
    
    async basicPitchAnalysis() {
        try {
            this.fileNameSpan.textContent = 'Checking AI transcription availability...';
            
            // Check if Basic Pitch is actually loaded
            if (typeof basicPitch === 'undefined' || !basicPitch.predict) {
                console.warn('Basic Pitch not available, using enhanced analysis');
                await this.enhancedAnalysis();
                return;
            }
            
            this.fileNameSpan.textContent = 'AI transcription: Loading model... 0%';
            
            // Convert AudioBuffer to the format Basic Pitch expects
            const audioData = this.audioBuffer.getChannelData(0);
            const sampleRate = this.audioBuffer.sampleRate;
            
            this.fileNameSpan.textContent = 'AI transcription: Processing audio... 25%';
            
            // Run Basic Pitch
            const result = await basicPitch.predict(audioData, sampleRate, {
                onProgress: (progress) => {
                    const percent = Math.floor(25 + progress * 50);
                    this.fileNameSpan.textContent = `AI transcription: Processing... ${percent}%`;
                }
            });
            
            this.fileNameSpan.textContent = 'AI transcription: Converting to notes... 75%';
            
            // Convert Basic Pitch output to our format
            const events = [];
            
            if (result && result.notes) {
                for (const note of result.notes) {
                    const noteName = this.midiToNoteName(note.pitch);
                    events.push({
                        note: noteName,
                        start: note.startTime,
                        duration: note.endTime - note.startTime,
                        velocity: Math.floor(note.amplitude * 127)
                    });
                }
            }
            
            // Sort by start time
            events.sort((a, b) => a.start - b.start);
            
            this.fileNameSpan.textContent = 'AI transcription: Finalizing... 90%';
            
            // Apply difficulty filter
            const filtered = this.filterByDifficulty(events);
            
            this.transcriptionResult = {
                tempo: 120,
                timeSignature: [4, 4],
                events: filtered,
                allEvents: events,
                syncOffsetMs: 0
            };
            
            this.onsetTimes = filtered.map(e => e.start);
            
            this.fileNameSpan.textContent = `✓ AI transcription complete! ${filtered.length} notes detected`;
            console.log('Basic Pitch transcription complete:', filtered.length, 'notes');
            
        } catch (error) {
            console.error('Basic Pitch error:', error);
            this.fileNameSpan.textContent = 'AI unavailable, using enhanced analysis...';
            await this.enhancedAnalysis();
        }
    }
    
    async enhancedAnalysis() {
        // Better than simple analysis - uses improved pitch detection
        const channelData = this.audioBuffer.getChannelData(0);
        const sampleRate = this.audioBuffer.sampleRate;
        const hopSize = Math.floor(sampleRate * 0.03); // 30ms hops
        const windowSize = 8192; // Larger window for better pitch accuracy
        
        const tempSchedule = [];
        const totalChunks = Math.floor((channelData.length - windowSize) / hopSize);
        let processedChunks = 0;
        
        for (let i = 0; i < channelData.length - windowSize; i += hopSize) {
            const time = i / sampleRate;
            const chunk = channelData.slice(i, i + windowSize);
            const energy = chunk.reduce((sum, val) => sum + val * val, 0) / chunk.length;
            
            // Only process if there's significant energy
            if (energy > 0.003) {
                // Detect pitch using improved autocorrelation
                const pitch = this.detectPitchImproved(chunk, sampleRate);
                
                if (pitch > 0) {
                    const note = this.frequencyToNote(pitch);
                    if (note) {
                        tempSchedule.push({ 
                            note: note,
                            start: time, 
                            duration: 0.2,
                            velocity: Math.min(127, Math.floor(energy * 300))
                        });
                    }
                }
            }
            
            processedChunks++;
            if (processedChunks % 50 === 0) {
                const progress = Math.floor((processedChunks / totalChunks) * 100);
                this.fileNameSpan.textContent = `Enhanced analysis... ${progress}%`;
                await new Promise(resolve => setTimeout(resolve, 0));
            }
        }
        
        // Remove duplicates within 80ms
        const cleaned = [];
        for (let i = 0; i < tempSchedule.length; i++) {
            const current = tempSchedule[i];
            const isDuplicate = cleaned.some(note => 
                note.note === current.note && 
                Math.abs(note.start - current.start) < 0.08
            );
            if (!isDuplicate) {
                cleaned.push(current);
            }
        }
        
        this.onsetTimes = cleaned.map(s => s.start);
        
        // Create transcription result
        this.transcriptionResult = {
            tempo: 120,
            timeSignature: [4, 4],
            events: this.filterByDifficulty(cleaned),
            allEvents: cleaned,
            syncOffsetMs: 0
        };
        
        this.fileNameSpan.textContent = `✓ Analysis complete! ${this.transcriptionResult.events.length} notes detected`;
        console.log('Enhanced analysis complete:', this.transcriptionResult.events.length, 'notes');
    }
    
    detectPitchImproved(samples, sampleRate) {
        // Improved autocorrelation with parabolic interpolation
        const minPeriod = Math.floor(sampleRate / 2500);
        const maxPeriod = Math.floor(sampleRate / 60);
        
        let bestPeriod = 0;
        let bestCorrelation = -1;
        
        // Normalize samples
        const mean = samples.reduce((a, b) => a + b, 0) / samples.length;
        const normalized = samples.map(s => s - mean);
        
        for (let period = minPeriod; period < maxPeriod; period++) {
            let correlation = 0;
            let norm1 = 0;
            let norm2 = 0;
            
            for (let i = 0; i < samples.length - period; i++) {
                correlation += normalized[i] * normalized[i + period];
                norm1 += normalized[i] * normalized[i];
                norm2 += normalized[i + period] * normalized[i + period];
            }
            
            // Normalized correlation
            const normalizedCorr = correlation / Math.sqrt(norm1 * norm2 + 0.0001);
            
            if (normalizedCorr > bestCorrelation) {
                bestCorrelation = normalizedCorr;
                bestPeriod = period;
            }
        }
        
        if (bestPeriod === 0 || bestCorrelation < 0.3) return 0;
        
        return sampleRate / bestPeriod;
    }
    
    filterByDifficulty(events) {
        if (!events || events.length === 0) return [];
        
        // Sort events by time and pitch
        const sorted = [...events].sort((a, b) => {
            if (Math.abs(a.start - b.start) < 0.05) {
                // Same time - sort by pitch (higher = melody)
                return this.noteToMIDI(b.note) - this.noteToMIDI(a.note);
            }
            return a.start - b.start;
        });
        
        if (this.difficulty === 'beginner') {
            // Beginner: Only the highest note at each time (main melody)
            const filtered = [];
            let lastTime = -1;
            
            for (const event of sorted) {
                // If this is a new time point, take the highest note
                if (event.start - lastTime > 0.08) { // 80ms window
                    filtered.push(event);
                    lastTime = event.start;
                }
            }
            
            return filtered;
            
        } else if (this.difficulty === 'intermediate') {
            // Intermediate: Melody + bass/harmony (up to 2-3 notes)
            const filtered = [];
            const timeGroups = new Map();
            
            // Group notes by time
            for (const event of sorted) {
                const timeKey = Math.floor(event.start * 10); // 100ms buckets
                if (!timeGroups.has(timeKey)) {
                    timeGroups.set(timeKey, []);
                }
                timeGroups.get(timeKey).push(event);
            }
            
            // For each time group, take highest (melody) and lowest (bass)
            for (const group of timeGroups.values()) {
                if (group.length === 1) {
                    filtered.push(group[0]);
                } else if (group.length === 2) {
                    filtered.push(group[0], group[1]);
                } else {
                    // Take highest (melody), middle (harmony), and lowest (bass)
                    const sorted = group.sort((a, b) => 
                        this.noteToMIDI(b.note) - this.noteToMIDI(a.note)
                    );
                    filtered.push(sorted[0]); // Highest (melody)
                    if (sorted.length > 2) {
                        filtered.push(sorted[Math.floor(sorted.length / 2)]); // Middle
                    }
                    filtered.push(sorted[sorted.length - 1]); // Lowest (bass)
                }
            }
            
            return filtered.sort((a, b) => a.start - b.start);
            
        } else {
            // Advanced: All notes (full song)
            return events;
        }
    }
    
    noteToMIDI(noteName) {
        const noteMap = {
            'C': 0, 'C#': 1, 'D': 2, 'D#': 3, 'E': 4, 'F': 5,
            'F#': 6, 'G': 7, 'G#': 8, 'A': 9, 'A#': 10, 'B': 11
        };
        
        const match = noteName.match(/^([A-G]#?)(-?\d+)$/);
        if (!match) return 60; // Default to C4
        
        const note = match[1];
        const octave = parseInt(match[2]);
        
        return (octave + 1) * 12 + (noteMap[note] || 0);
    }
    
    midiToNoteName(midiNumber) {
        const noteNames = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
        const octave = Math.floor(midiNumber / 12) - 1;
        const note = noteNames[midiNumber % 12];
        return note + octave;
    }
    
    async simpleAnalysis() {
        const channelData = this.audioBuffer.getChannelData(0);
        const sampleRate = this.audioBuffer.sampleRate;
        const hopSize = Math.floor(sampleRate * 0.05); // 50ms hops
        const windowSize = 4096;
        
        const tempSchedule = [];
        const totalChunks = Math.floor((channelData.length - windowSize) / hopSize);
        let processedChunks = 0;
        
        for (let i = 0; i < channelData.length - windowSize; i += hopSize) {
            const time = i / sampleRate;
            const chunk = channelData.slice(i, i + windowSize);
            const energy = chunk.reduce((sum, val) => sum + val * val, 0) / chunk.length;
            
            // Only process if there's significant energy
            if (energy > 0.002) {
                // Detect pitch using autocorrelation
                const pitch = this.detectPitchSimple(chunk, sampleRate);
                
                if (pitch > 0) {
                    const note = this.frequencyToNote(pitch);
                    if (note) {
                        tempSchedule.push({ 
                            note: note,
                            start: time, 
                            duration: 0.15,
                            velocity: Math.min(127, Math.floor(energy * 400))
                        });
                    }
                }
            }
            
            processedChunks++;
            if (processedChunks % 100 === 0) {
                const progress = Math.floor((processedChunks / totalChunks) * 100);
                this.fileNameSpan.textContent = `Analyzing audio... ${progress}%`;
                await new Promise(resolve => setTimeout(resolve, 0));
            }
        }
        
        // Remove duplicates within 100ms
        const cleaned = [];
        for (let i = 0; i < tempSchedule.length; i++) {
            const current = tempSchedule[i];
            const isDuplicate = cleaned.some(note => 
                note.note === current.note && 
                Math.abs(note.start - current.start) < 0.1
            );
            if (!isDuplicate) {
                cleaned.push(current);
            }
        }
        
        this.onsetTimes = cleaned.map(s => s.start);
        
        // Create transcription result for synced playback
        this.transcriptionResult = {
            tempo: 120,
            timeSignature: [4, 4],
            events: cleaned,
            syncOffsetMs: 0
        };
        
        this.fileNameSpan.textContent = `Analysis complete! ${cleaned.length} notes detected`;
        console.log('Analysis complete:', cleaned.length, 'notes');
    }
    
    detectPitchSimple(samples, sampleRate) {
        // Autocorrelation pitch detection
        const minPeriod = Math.floor(sampleRate / 2000); // Up to 2000 Hz
        const maxPeriod = Math.floor(sampleRate / 80);   // Down to 80 Hz
        
        let bestPeriod = 0;
        let bestCorrelation = 0;
        
        for (let period = minPeriod; period < maxPeriod; period++) {
            let correlation = 0;
            for (let i = 0; i < samples.length - period; i++) {
                correlation += samples[i] * samples[i + period];
            }
            
            if (correlation > bestCorrelation) {
                bestCorrelation = correlation;
                bestPeriod = period;
            }
        }
        
        if (bestPeriod === 0 || bestCorrelation < 0.1) return 0;
        
        return sampleRate / bestPeriod;
    }
    

    

    


    play() {
        if (!this.audioBuffer) return;
        
        if (this.playMode === 'practice') {
            this.startPracticeMode();
            return;
        }
        
        // Live mode - play with audio
        // Resume from pause
        if (this.isPaused) {
            this.audioContext.resume();
            this.isPaused = false;
            this.startFallingNotesAnimation();
            return;
        }
        
        if (this.isPlaying) {
            return;
        }
        
        this.sourceNode = this.audioContext.createBufferSource();
        this.sourceNode.buffer = this.audioBuffer;
        this.sourceNode.playbackRate.value = this.playbackRate;
        
        this.analyser = this.audioContext.createAnalyser();
        this.analyser.fftSize = 8192;
        this.analyser.smoothingTimeConstant = 0.75;
        this.analyser.minDecibels = -85;
        this.analyser.maxDecibels = -15;
        
        this.sourceNode.connect(this.analyser);
        this.analyser.connect(this.audioContext.destination);
        
        this.startTime = this.audioContext.currentTime;
        this.sourceNode.start(0);
        this.isPlaying = true;
        this.pauseBtn.disabled = false;
        
        this.sourceNode.onended = () => {
            this.isPlaying = false;
            this.pauseBtn.disabled = true;
            this.stopFallingNotesAnimation();
        };
        
        this.analyzeFrequencies();
        this.startFallingNotesAnimation();
    }
    
    startPracticeMode() {
        if (!this.transcriptionResult || !this.transcriptionResult.events) {
            alert('Please analyze an audio file first!');
            return;
        }
        
        this.practiceNotes = [...this.transcriptionResult.events];
        this.currentStep = 0;
        this.isPlaying = true;
        this.pauseBtn.disabled = false;
        this.prevStepBtn.disabled = false;
        this.nextStepBtn.disabled = false;
        
        // Show first step
        this.showPracticeStep();
    }
    
    showPracticeStep() {
        if (this.currentStep >= this.practiceNotes.length) {
            this.fileNameSpan.textContent = '🎉 Practice Complete!';
            this.isPlaying = false;
            this.clearActiveKeys();
            this.pauseBtn.disabled = true;
            return;
        }
        
        // Get current note(s) - may be multiple notes at same time (chord)
        const currentTime = this.practiceNotes[this.currentStep].start;
        const currentNotes = this.practiceNotes.filter(n => 
            Math.abs(n.start - currentTime) < 0.05
        );
        
        // Light up all keys for this step
        this.keys.forEach(key => {
            key.active = currentNotes.some(n => n.note === key.note);
        });
        this.drawPiano();
        
        // Clear falling notes canvas and show static view
        this.clearFallingNotesCanvas();
        
        // Update display
        const noteNames = currentNotes.map(n => n.note).join(', ');
        this.fileNameSpan.textContent = `Step ${this.currentStep + 1}/${this.practiceNotes.length} - Play: ${noteNames}`;
        
        // Show in note display
        this.displayCurrentNotes(currentNotes.map(n => n.note));
    }
    
    nextPracticeStep() {
        // Skip to next unique time point
        const currentTime = this.practiceNotes[this.currentStep].start;
        
        // Find next note with different time
        do {
            this.currentStep++;
        } while (
            this.currentStep < this.practiceNotes.length &&
            Math.abs(this.practiceNotes[this.currentStep].start - currentTime) < 0.05
        );
        
        this.showPracticeStep();
    }
    
    previousPracticeStep() {
        if (this.currentStep === 0) return;
        
        const currentTime = this.practiceNotes[this.currentStep].start;
        
        // Go back to previous unique time point
        do {
            this.currentStep--;
        } while (
            this.currentStep > 0 &&
            Math.abs(this.practiceNotes[this.currentStep].start - currentTime) < 0.05
        );
        
        this.showPracticeStep();
    }

    pause() {
        if (this.audioContext && this.isPlaying) {
            this.audioContext.suspend();
            this.isPaused = true;
            // Stop animation but keep notes in place
            if (this.animationId) {
                cancelAnimationFrame(this.animationId);
                this.animationId = null;
            }
        }
    }

    stop() {
        // Stop audio
        if (this.sourceNode) {
            try {
                this.sourceNode.stop();
            } catch (e) {
                // Already stopped
            }
            this.sourceNode = null;
        }
        
        // Reset state
        this.isPlaying = false;
        this.isPaused = false;
        this.pauseBtn.disabled = true;
        
        if (this.prevStepBtn) this.prevStepBtn.disabled = true;
        if (this.nextStepBtn) this.nextStepBtn.disabled = true;
        
        this.clearActiveKeys();
        this.stopFallingNotesAnimation();
        
        // Stop synced player
        if (this.syncedPlayer) {
            this.syncedPlayer.stop();
        }
        
        // Reset practice mode
        this.currentStep = 0;
        
        // Update display
        if (this.transcriptionResult && this.transcriptionResult.events) {
            this.fileNameSpan.textContent = `Ready to play - ${this.transcriptionResult.events.length} notes`;
        }
    }

    changeSpeed(event) {
        this.playbackRate = parseFloat(event.target.value);
        this.speedValue.textContent = `Speed: ${this.playbackRate}x`;
        
        if (this.sourceNode) {
            this.sourceNode.playbackRate.value = this.playbackRate;
        }
    }

    drawWaveform() {
        const canvas = this.waveformCanvas;
        const ctx = this.waveformCtx;
        const width = canvas.width = canvas.offsetWidth;
        const height = canvas.height;
        
        const data = this.audioBuffer.getChannelData(0);
        const step = Math.ceil(data.length / width);
        const amp = height / 2;
        
        ctx.fillStyle = '#f0f0f0';
        ctx.fillRect(0, 0, width, height);
        ctx.strokeStyle = '#667eea';
        ctx.lineWidth = 1;
        ctx.beginPath();
        
        for (let i = 0; i < width; i++) {
            const min = Math.min(...data.slice(i * step, (i + 1) * step));
            const max = Math.max(...data.slice(i * step, (i + 1) * step));
            ctx.moveTo(i, (1 + min) * amp);
            ctx.lineTo(i, (1 + max) * amp);
        }
        
        ctx.stroke();
    }

    startFrequencyAnalysis() {
        // Placeholder for more advanced pitch detection
        console.log('Audio loaded and ready for analysis');
    }

    analyzeFrequencies() {
        if (!this.isPlaying) return;
        
        this.audioStartTime = this.audioContext.currentTime;
        this.startFallingNotesAnimation();
        
        // Use synced player if available and we have transcription results
        if (this.syncedPlayer && this.transcriptionResult && this.transcriptionResult.events.length > 0) {
            console.log('Using synced playback with', this.transcriptionResult.events.length, 'notes');
            this.syncedPlayer.setSchedule(this.transcriptionResult.events);
            this.syncedPlayer.start(this.audioStartTime);
        } else {
            console.log('Using real-time detection');
            this.realtimeDetection();
        }
    }
    
    realtimeDetection() {
        if (!this.isPlaying || !this.analyser) return;
        
        const bufferLength = this.analyser.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);
        
        const analyze = () => {
            if (!this.isPlaying) return;
            
            this.analyser.getByteFrequencyData(dataArray);
            
            const currentTime = this.audioContext.currentTime - this.audioStartTime;
            
            // Only detect notes at onset times
            const nearestOnset = this.onsetTimes.find(t => 
                Math.abs(t - currentTime) < 0.05
            );
            
            if (nearestOnset) {
                const detectedNotes = this.detectNotes(dataArray);
                this.highlightKeys(detectedNotes);
                
                detectedNotes.forEach(note => {
                    this.addFallingNote(note);
                });
            }
            
            requestAnimationFrame(analyze);
        };
        
        analyze();
    }
    
    addFallingNote(note) {
        const key = this.keys.find(k => k.note === note);
        if (!key) {
            return;
        }
        
        // Avoid duplicate notes too close together
        const minSpacing = 100; // Minimum spacing in pixels
        const recentNote = this.fallingNotes.find(n => 
            n.note === note && n.y < minSpacing
        );
        if (recentNote) {
            return;
        }
        
        // Create long vertical bar (Piano Tiles style) with theme colors
        const colors = this.themeColors[this.theme];
        const newNote = {
            note: note,
            x: key.x + key.width / 2,
            y: 0,
            width: key.width * 0.85,
            height: 80, // Shorter notes for better rhythm visibility
            color: colors.primary,
            glowColor: colors.glow,
            speed: 2.5 * this.playbackRate,
            active: true,
            glowing: false
        };
        
        this.fallingNotes.push(newNote);
    }
    
    startFallingNotesAnimation() {
        if (this.animationId) return;
        
        const animate = () => {
            this.clearFallingNotesCanvas();
            this.updateFallingNotes();
            this.drawFallingNotes();
            
            this.animationId = requestAnimationFrame(animate);
        };
        
        animate();
    }
    
    updateFallingNotes() {
        const targetY = this.fallingNotesCanvas.height; // Bottom of canvas = where piano starts
        const hitZoneStart = targetY - 40;
        const hitZoneEnd = targetY + 10;
        
        this.hitKeys.clear(); // Reset hit keys
        
        this.fallingNotes = this.fallingNotes.filter(note => {
            if (!this.isPaused) {
                note.y += note.speed;
            }
            
            // Check if note bottom is in the hit zone
            const noteBottom = note.y + note.height;
            if (noteBottom >= hitZoneStart && noteBottom <= hitZoneEnd) {
                note.glowing = true;
                this.hitKeys.add(note.note);
            } else {
                note.glowing = false;
            }
            
            // Remove notes only after they completely pass the bottom
            return note.y < targetY + 50;
        });
        
        // Update piano keys to light up when notes hit
        this.keys.forEach(key => {
            key.active = this.hitKeys.has(key.note);
        });
        this.drawPiano();
    }
    
    drawFallingNotes() {
        const ctx = this.fallingNotesCtx;
        const targetY = this.fallingNotesCanvas.height;
        const colors = this.themeColors[this.theme];
        
        // No line or gradient - completely clean
        
        this.fallingNotes.forEach(note => {
            const distanceToTarget = targetY - note.y;
            const isNearTarget = distanceToTarget < 80;
            
            // Neon glow effect - much stronger when hitting
            if (note.glowing) {
                ctx.shadowBlur = 100;
                ctx.shadowColor = colors.glow;
            } else if (isNearTarget) {
                ctx.shadowBlur = 60;
                ctx.shadowColor = colors.primary;
            } else {
                ctx.shadowBlur = 35;
                ctx.shadowColor = colors.primary;
            }
            
            // Draw the falling note as a glowing bar
            const gradient = ctx.createLinearGradient(
                note.x - note.width / 2, note.y,
                note.x - note.width / 2, note.y + note.height
            );
            
            if (note.glowing) {
                gradient.addColorStop(0, '#ffffff');
                gradient.addColorStop(0.5, colors.glow);
                gradient.addColorStop(1, colors.primary);
            } else {
                gradient.addColorStop(0, colors.secondary);
                gradient.addColorStop(1, colors.primary);
            }
            
            ctx.fillStyle = gradient;
            ctx.fillRect(
                note.x - note.width / 2, 
                note.y, 
                note.width, 
                note.height
            );
            
            // Inner bright core
            ctx.shadowBlur = 0;
            const coreGradient = ctx.createLinearGradient(
                note.x - note.width / 2 + 4, note.y,
                note.x - note.width / 2 + 4, note.y + note.height
            );
            coreGradient.addColorStop(0, 'rgba(255, 255, 255, 0.9)');
            coreGradient.addColorStop(1, 'rgba(255, 255, 255, 0.3)');
            ctx.fillStyle = coreGradient;
            ctx.fillRect(
                note.x - note.width / 2 + 4, 
                note.y, 
                note.width - 8, 
                note.height
            );
            
            // Draw note name
            ctx.shadowBlur = 5;
            ctx.shadowColor = '#000';
            ctx.fillStyle = '#ffffff';
            ctx.font = 'bold 16px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(note.note, note.x, note.y + note.height / 2);
            
            ctx.shadowBlur = 0;
        });
    }
    
    clearFallingNotesCanvas() {
        this.fallingNotesCtx.clearRect(
            0, 0, 
            this.fallingNotesCanvas.width, 
            this.fallingNotesCanvas.height
        );
    }
    
    detectNotesAdvanced(frequencyData) {
        const notes = [];
        const sampleRate = this.audioContext.sampleRate;
        const binSize = sampleRate / this.analyser.fftSize;
        
        // Find peaks in frequency data
        const peaks = [];
        for (let i = 1; i < frequencyData.length - 1; i++) {
            if (frequencyData[i] > -50 && // Threshold in dB
                frequencyData[i] > frequencyData[i - 1] && 
                frequencyData[i] > frequencyData[i + 1]) {
                const frequency = i * binSize;
                if (frequency > 80 && frequency < 2000) {
                    peaks.push({ frequency, magnitude: frequencyData[i] });
                }
            }
        }
        
        // Sort by magnitude and take top peaks
        peaks.sort((a, b) => b.magnitude - a.magnitude);
        
        peaks.slice(0, 5).forEach(peak => {
            const note = this.frequencyToNote(peak.frequency);
            if (note && !notes.includes(note)) {
                notes.push(note);
            }
        });
        
        return notes;
    }

    detectNotes(frequencyData) {
        const sampleRate = this.audioContext.sampleRate;
        const binSize = sampleRate / this.analyser.fftSize;
        
        // Full piano frequency range
        const minFreq = 27.5;  // A0 - Lowest piano note
        const maxFreq = 4186;  // C8 - Highest piano note
        const threshold = 85; // Balanced threshold
        
        // Find all significant peaks
        const peaks = [];
        
        for (let i = 10; i < frequencyData.length - 10; i++) {
            const frequency = i * binSize;
            
            // Skip frequencies outside piano range
            if (frequency < minFreq || frequency > maxFreq) continue;
            
            const magnitude = frequencyData[i];
            
            // Find peaks above threshold
            if (magnitude > threshold) {
                // Check if it's a local maximum (check wider range for better peak detection)
                let isLocalMax = true;
                for (let j = -5; j <= 5; j++) {
                    if (j !== 0 && frequencyData[i + j] >= magnitude) {
                        isLocalMax = false;
                        break;
                    }
                }
                
                if (isLocalMax) {
                    // Calculate "clarity" score - how much this peak stands out
                    const avgNeighbor = (frequencyData[i - 5] + frequencyData[i - 3] + frequencyData[i + 3] + frequencyData[i + 5]) / 4;
                    const clarity = magnitude / (avgNeighbor + 1);
                    
                    peaks.push({
                        frequency: frequency,
                        magnitude: magnitude,
                        clarity: clarity,
                        bin: i
                    });
                }
            }
        }
        
        if (peaks.length === 0) {
            return [];
        }
        
        // Sort by clarity first (how distinct the peak is), then magnitude
        peaks.sort((a, b) => {
            const clarityDiff = b.clarity - a.clarity;
            if (Math.abs(clarityDiff) > 0.5) return clarityDiff;
            return b.magnitude - a.magnitude;
        });
        
        // Collect notes intelligently based on difficulty
        const detectedNotes = [];
        let maxNotes, minMagnitudeRatio, minClarityRatio, minMagnitude;
        
        if (this.difficulty === 'easy') {
            maxNotes = 1; // Only 1 note at a time for beginners
            minMagnitudeRatio = 0.85; // Very strict - only very loud notes
            minClarityRatio = 0.85;
            minMagnitude = 100; // Must be quite loud
        } else if (this.difficulty === 'medium') {
            maxNotes = 2; // Up to 2 notes
            minMagnitudeRatio = 0.7;
            minClarityRatio = 0.65;
            minMagnitude = 95;
        } else {
            maxNotes = 3; // Up to 3 notes for advanced
            minMagnitudeRatio = 0.6;
            minClarityRatio = 0.55;
            minMagnitude = 90;
        }
        
        if (peaks.length > 0) {
            const loudestMagnitude = peaks[0].magnitude;
            const clearestClarity = peaks[0].clarity;
            
            // Only process if the loudest peak is significant enough
            if (loudestMagnitude < minMagnitude) {
                return [];
            }
            
            for (let i = 0; i < Math.min(peaks.length, 8); i++) {
                const peak = peaks[i];
                
                const magnitudeRatio = peak.magnitude / loudestMagnitude;
                const clarityRatio = peak.clarity / clearestClarity;
                
                // First note always included if clear and loud enough
                if (i === 0 && peak.clarity > 1.4 && peak.magnitude > minMagnitude) {
                    const note = this.frequencyToNote(peak.frequency);
                    if (note) {
                        detectedNotes.push(note);
                        continue;
                    }
                }
                
                // Additional notes must be loud, clear, and pass strict criteria
                if (magnitudeRatio >= minMagnitudeRatio && 
                    clarityRatio >= minClarityRatio && 
                    peak.magnitude > minMagnitude * 0.8) {
                    const note = this.frequencyToNote(peak.frequency);
                    
                    if (note && !detectedNotes.includes(note)) {
                        // Check if this note is not a harmonic of an already detected note
                        const isHarmonic = detectedNotes.some(existingNote => {
                            const existingFreq = this.noteToFrequency(existingNote);
                            const ratio = peak.frequency / existingFreq;
                            // If ratio is close to 2, 3, 4, etc., it's a harmonic
                            return Math.abs(ratio - Math.round(ratio)) < 0.15 && ratio > 1.5;
                        });
                        
                        if (!isHarmonic) {
                            detectedNotes.push(note);
                        }
                    }
                }
                
                // Stop if we have enough notes
                if (detectedNotes.length >= maxNotes) break;
            }
        }
        
        return detectedNotes;
    }
    
    hasInstrumentalHarmonics(frequencyData, peakBin, binSize) {
        // Check if this peak has harmonic overtones (characteristic of instruments)
        const fundamental = frequencyData[peakBin];
        
        // Check for 2nd harmonic (octave)
        const harmonic2Bin = Math.round(peakBin * 2);
        if (harmonic2Bin < frequencyData.length) {
            const harmonic2 = frequencyData[harmonic2Bin];
            if (harmonic2 > fundamental * 0.2) {
                return true; // Has octave harmonic
            }
        }
        
        // Check for 3rd harmonic (perfect fifth above octave)
        const harmonic3Bin = Math.round(peakBin * 3);
        if (harmonic3Bin < frequencyData.length) {
            const harmonic3 = frequencyData[harmonic3Bin];
            if (harmonic3 > fundamental * 0.15) {
                return true; // Has 3rd harmonic
            }
        }
        
        return false;
    }

    frequencyToNote(frequency) {
        const noteNames = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
        const A4 = 440;
        const C0 = A4 * Math.pow(2, -4.75);
        
        if (frequency < 20) return null;
        
        const halfSteps = 12 * Math.log2(frequency / C0);
        const octave = Math.floor(halfSteps / 12);
        const note = Math.round(halfSteps % 12);
        
        // Accept full piano range (A0 to C8)
        if (octave >= 0 && octave <= 8) {
            const noteName = noteNames[note] + octave;
            // Check if this note exists in our keys
            const keyExists = this.keys.some(k => k.note === noteName);
            if (keyExists) {
                return noteName;
            }
        }
        
        return null;
    }

    highlightKeys(notes) {
        this.clearActiveKeys();
        
        // Activate ALL notes in the array (supports chords)
        notes.forEach(note => {
            const key = this.keys.find(k => k.note === note);
            if (key) {
                key.active = true;
            }
        });
        
        // Debug: log when multiple notes are active
        if (notes.length > 1) {
            console.log('Chord detected:', notes.join(', '));
        }
        
        this.drawPiano();
        this.displayCurrentNotes(notes);
    }

    clearActiveKeys() {
        this.keys.forEach(key => key.active = false);
        this.drawPiano();
        this.currentNotesDiv.innerHTML = '';
    }

    displayCurrentNotes(notes) {
        this.currentNotesDiv.innerHTML = notes.map(note => 
            `<div class="note-badge">${note}</div>`
        ).join('');
    }

    handlePianoClick(event) {
        // Piano is just for visual reference - no interaction needed
        // Users play on their real piano while watching the screen
    }

    playNote(note) {
        // No sound needed - user plays on their real piano
        // This is just a visual guide
    }

    noteToFrequency(note) {
        const noteNames = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
        const noteName = note.slice(0, -1);
        const octave = parseInt(note.slice(-1));
        const noteIndex = noteNames.indexOf(noteName);
        
        const A4 = 440;
        const halfStepsFromA4 = (octave - 4) * 12 + (noteIndex - 9);
        
        return A4 * Math.pow(2, halfStepsFromA4 / 12);
    }
}

// Initialize the app
const app = new PianoLearningApp();
