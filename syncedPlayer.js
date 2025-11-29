// Synced Note Player - Ensures perfect timing between audio and falling notes

class SyncedNotePlayer {
    constructor(app) {
        this.app = app;
        this.noteSchedule = [];
        this.spawnedNotes = new Set();
        this.isPlaying = false;
        this.startTime = 0;
        this.fallDuration = 2.0; // Notes take 2 seconds to fall
    }

    setSchedule(schedule) {
        this.noteSchedule = schedule;
        this.spawnedNotes.clear();
        console.log('Schedule loaded:', schedule.length, 'notes');
    }

    start(audioStartTime) {
        this.startTime = audioStartTime;
        this.isPlaying = true;
        this.spawnedNotes.clear();
        this.update();
    }

    stop() {
        this.isPlaying = false;
    }

    update() {
        if (!this.isPlaying) return;

        const currentTime = this.app.audioContext.currentTime - this.startTime;
        const spawnTime = currentTime + this.fallDuration;

        // Find notes that should spawn now
        for (const noteEvent of this.noteSchedule) {
            const noteId = `${noteEvent.note}_${noteEvent.start}`;
            
            // Check if this note should spawn now
            if (!this.spawnedNotes.has(noteId) && 
                noteEvent.start <= spawnTime && 
                noteEvent.start > spawnTime - 0.05) {
                
                // Spawn the note
                this.app.addFallingNote(noteEvent.note);
                this.spawnedNotes.add(noteId);
                
                console.log('Spawned note:', noteEvent.note, 'at', currentTime.toFixed(2), 'for time', noteEvent.start.toFixed(2));
            }
        }

        // Continue updating
        if (this.isPlaying) {
            requestAnimationFrame(() => this.update());
        }
    }
}

// Make available globally
if (typeof window !== 'undefined') {
    window.SyncedNotePlayer = SyncedNotePlayer;
}
