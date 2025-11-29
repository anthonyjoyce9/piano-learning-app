# 🎹 Piano Learning App

An interactive web application that analyzes audio and shows you how to play it on piano with falling notes animation.

## ✨ Unique Feature: Upload Any MP3 → Instant Piano Tutorial

This app is the **ONLY** piano learning app where you can:
- Upload your favorite song (MP3)
- Get instant, professional piano transcription
- See beautiful falling notes
- Learn any song immediately

No account needed. No manual conversion. Just upload and play!

## Features

- 🎵 **MP3-to-MIDI Conversion**: Upload any song and get instant piano notes
- 🎤 **Microphone Mode**: Play along and see your notes in real-time
- 🎹 **Full 88-Key Piano**: Complete piano range (A0 to C8)
- 🎮 **Falling Notes Animation**: Piano Tiles-style visualization
- 📊 **Real-time Analysis**: See notes as they play
- ⚡ **Adjustable Speed**: Slow down difficult sections (0.5x - 2x)
- 🎯 **3 Difficulty Levels**: 
  - Beginner (melody only)
  - Intermediate (melody + bass)
  - Advanced (full song)
- 📝 **Practice Mode**: Step-by-step learning
- 🎨 **5 Color Themes**: Purple, Blue, Green, Gold, Red
- 📈 **Piano Roll View**: See the entire song at once
- 🎼 **MIDI File Support**: Load existing MIDI files
- 📱 **Mobile Optimized**: Touch support and responsive design

## How to Use

### Quick Start
1. Open `index.html` in a modern web browser
2. Upload an MP3 file (or MIDI file)
3. Wait for AI conversion (30-60 seconds)
4. Watch the notes fall and light up the piano!
5. Adjust difficulty and speed as needed

### File Mode
1. Click "Choose Audio File" to upload a song
2. Wait for automatic transcription
3. Press Play to start
4. Watch the glowing notes fall to the piano keys
5. Learn the timing and rhythm

### Microphone Mode
1. Click the "🎤 Microphone" tab
2. Click "Start Listening" and allow microphone access
3. Play your piano or keyboard
4. See your notes detected in real-time
5. Practice matching the song

## 🚀 Setup

### For Users (Just Use It)
1. Open `index.html` in your browser
2. Upload an MP3 file
3. That's it!

### For Developers (Add Server Conversion)

The app has 3 conversion methods:
1. **Magenta AI** (browser-based) - Works offline
2. **Your Server** (Basic Pitch) - Professional quality ✨
3. **Fallback** (simple analysis) - Always works

To enable server conversion:

#### 1. Install dependencies:
```bash
pip install -r requirements.txt
```

#### 2. Run the server:
```bash
python server.py
```

#### 3. Deploy to cloud (optional):
See `DEPLOYMENT.md` for:
- Railway.app (easiest)
- Render.com (free tier)
- Fly.io (3 free VMs)

Then update `SERVER_URL` in `app.js` with your deployed URL.

## Technical Details

### Frontend
- Built with vanilla JavaScript and Web Audio API
- Real-time frequency analysis using FFT
- Canvas-based piano and falling notes rendering
- Microphone input support with getUserMedia API
- Magenta.js for browser-based AI conversion

### Backend (Optional)
- Python + Flask web server
- Basic Pitch (Spotify's AI) for professional transcription
- CORS enabled for web app integration

### Audio Processing
- FFT (Fast Fourier Transform)
- Autocorrelation pitch detection
- Onset detection
- Note filtering by difficulty

## Browser Compatibility

Works best in modern browsers with Web Audio API support:
- Chrome/Edge (recommended)
- Firefox
- Safari (iOS 11+)

**Note**: Microphone mode requires HTTPS in production or localhost for development.

## Files

- `index.html` - Main web app
- `app.js` - Core application logic
- `audioAnalyzer.js` - Audio analysis utilities
- `midiConverter.js` - Magenta AI integration
- `syncedPlayer.js` - Synced note playback
- `styles.css` - Styling
- `server.py` - Backend conversion server (optional)
- `requirements.txt` - Python dependencies
- `DEPLOYMENT.md` - Deployment guide
- `test-server.md` - Testing guide

## Tips for Best Results

- Piano-only recordings work best
- Start with Beginner mode to see only the melody
- Use Practice mode to learn songs step-by-step
- Try different themes to find your favorite look
- Slow down speed for difficult sections
- Use landscape mode on mobile for best experience

## What Makes This Special?

Most piano learning apps require:
- Manual MIDI file creation
- Expensive subscriptions
- Limited song libraries

**This app lets you learn ANY song** by just uploading the MP3! 🎵

The AI automatically transcribes the audio into piano notes, so you can learn:
- Your favorite pop songs
- Classical pieces
- Movie soundtracks
- Video game music
- Anything with a piano!
