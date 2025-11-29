# 🏗️ System Architecture

## High-Level Overview

```
┌─────────────────────────────────────────────────────────────┐
│                        USER'S BROWSER                        │
│                                                              │
│  ┌────────────────────────────────────────────────────┐    │
│  │              Your Web App (index.html)             │    │
│  │                                                     │    │
│  │  • Upload MP3                                      │    │
│  │  • Display falling notes                           │    │
│  │  • Show piano keyboard                             │    │
│  │  • Practice mode                                   │    │
│  └────────────────────────────────────────────────────┘    │
│                           │                                  │
│                           ▼                                  │
│  ┌────────────────────────────────────────────────────┐    │
│  │           Conversion Logic (app.js)                │    │
│  │                                                     │    │
│  │  Try 1: Magenta AI (browser) ──────────┐          │    │
│  │         ↓ fails                         │          │    │
│  │  Try 2: Your Server ─────────┐         │          │    │
│  │         ↓ fails               │         │          │    │
│  │  Try 3: Fallback Analysis     │         │          │    │
│  └───────────────────────────────┼─────────┼──────────┘    │
│                                   │         │                │
└───────────────────────────────────┼─────────┼────────────────┘
                                    │         │
                                    │         │ Works offline
                                    │         └─────────────┐
                                    │                       │
                                    │ HTTP POST             │
                                    ▼                       ▼
                    ┌───────────────────────────┐   ┌──────────────┐
                    │    YOUR SERVER            │   │  Magenta AI  │
                    │   (server.py)             │   │  (Browser)   │
                    │                           │   └──────────────┘
                    │  • Receives MP3           │
                    │  • Uses Basic Pitch AI    │
                    │  • Returns MIDI data      │
                    └───────────────────────────┘
                                │
                                │ JSON Response
                                ▼
                    ┌───────────────────────────┐
                    │   MIDI Data (JSON)        │
                    │                           │
                    │  {                        │
                    │    tempo: 120,            │
                    │    events: [              │
                    │      {note: "C4",         │
                    │       start: 0.5,         │
                    │       duration: 0.3}      │
                    │    ]                      │
                    │  }                        │
                    └───────────────────────────┘
```

---

## Detailed Flow

### 1. User Uploads MP3

```
User clicks "Choose File"
    ↓
Browser reads file
    ↓
app.js receives file
    ↓
Starts conversion process
```

### 2. Conversion Attempts

#### Attempt 1: Magenta AI (Browser)
```
app.js → midiConverter.js
    ↓
Try Magenta.js (if loaded)
    ↓
Success? → Use result
    ↓
Fail? → Try server
```

#### Attempt 2: Your Server
```
app.js → serverConversion()
    ↓
Create FormData with MP3
    ↓
POST to http://localhost:5000/convert
    ↓
server.py receives file
    ↓
Basic Pitch processes audio
    ↓
Returns JSON with notes
    ↓
Success? → Use result
    ↓
Fail? → Try fallback
```

#### Attempt 3: Fallback Analysis
```
app.js → enhancedAnalysis()
    ↓
Analyze audio buffer
    ↓
Detect frequencies
    ↓
Convert to notes
    ↓
Always succeeds (basic quality)
```

### 3. Display Results

```
MIDI data received
    ↓
Filter by difficulty
    ↓
Create falling notes
    ↓
Sync with audio playback
    ↓
Light up piano keys
    ↓
User learns the song! 🎹
```

---

## Component Breakdown

### Frontend Components

#### 1. `index.html`
- Main UI
- File upload
- Piano canvas
- Falling notes canvas
- Controls

#### 2. `app.js`
- Main application logic
- Conversion orchestration
- Piano rendering
- Note animation
- User interaction

#### 3. `midiConverter.js`
- Magenta AI integration
- Browser-based conversion
- Fallback to server

#### 4. `audioAnalyzer.js`
- Audio processing utilities
- Frequency analysis
- Pitch detection

#### 5. `syncedPlayer.js`
- Synced note playback
- Timing management
- Note scheduling

#### 6. `styles.css`
- Visual styling
- Responsive design
- Animations

### Backend Components

#### 1. `server.py`
- Flask web server
- File upload handling
- Basic Pitch integration
- MIDI conversion
- JSON response

#### 2. `requirements.txt`
- Python dependencies
- Flask
- Flask-CORS
- Basic Pitch
- NumPy

---

## Data Flow

### MP3 Upload → MIDI Data

```
MP3 File (Binary)
    ↓
AudioBuffer (Web Audio API)
    ↓
Frequency Data (FFT)
    ↓
Pitch Detection
    ↓
Note Events (JSON)
    ↓
Falling Notes (Visual)
```

### MIDI Data Structure

```javascript
{
  tempo: 120,              // BPM
  timeSignature: [4, 4],   // Time signature
  events: [                // Array of notes
    {
      note: "C4",          // Note name
      start: 0.5,          // Start time (seconds)
      duration: 0.3,       // Duration (seconds)
      velocity: 80         // Volume (0-127)
    },
    // ... more notes
  ],
  syncOffsetMs: 0          // Sync offset
}
```

---

## Deployment Architecture

### Local Development
```
Browser ←→ index.html (file://)
              ↓
         app.js (local)
              ↓
    localhost:5000 (server.py)
```

### Production (Railway.app)
```
Browser ←→ your-domain.com (static hosting)
              ↓
         app.js (CDN)
              ↓
    your-app.railway.app (server.py)
```

---

## Scalability

### Current Setup
- ✅ Handles 1-10 users easily
- ✅ Free tier sufficient
- ✅ No database needed

### If You Get Popular
- Add Redis for caching
- Use CDN for static files
- Scale server horizontally
- Add rate limiting

---

## Security

### Current
- ✅ CORS enabled
- ✅ File size limits
- ✅ No user data stored

### Future Considerations
- Add API key authentication
- Rate limiting per IP
- File type validation
- Virus scanning

---

## Performance

### Bottlenecks
1. **Basic Pitch AI** - 30-60 seconds
2. **File upload** - Depends on connection
3. **Browser rendering** - Depends on device

### Optimizations
- ✅ Multiple conversion methods
- ✅ Fallback options
- ✅ Client-side caching
- ✅ Efficient canvas rendering

---

## Technology Choices

### Why Flask?
- Simple to deploy
- Python ecosystem
- Easy to understand
- Free hosting available

### Why Basic Pitch?
- Professional quality
- Open source
- Same as Samplab
- Well-maintained

### Why Magenta?
- Works in browser
- No server needed
- Fast conversion
- Good fallback

---

## Future Enhancements

### Possible Additions
- User accounts
- Save/load songs
- Share songs
- Leaderboards
- Social features
- Mobile app

### Technical Improvements
- WebSocket for real-time updates
- Progressive Web App (PWA)
- Offline mode
- Better caching
- Faster conversion

---

This architecture gives you:
- ✅ Reliability (3 fallback methods)
- ✅ Quality (professional AI)
- ✅ Speed (browser-first)
- ✅ Scalability (easy to deploy)
- ✅ Cost-effective (free tier)
