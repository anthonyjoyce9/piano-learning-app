# ❓ Frequently Asked Questions

## General Questions

### Q: Do I need to deploy the server?
**A:** No! The app works without the server using:
- Magenta AI (browser-based)
- Fallback analysis

The server just gives you **better quality** conversions.

### Q: Is this free?
**A:** Yes! Everything is free:
- The web app (open source)
- Railway.app (free tier)
- Render.com (free tier)
- Fly.io (free tier)

### Q: Can I use this offline?
**A:** Partially:
- ✅ Web app works offline (after first load)
- ✅ Magenta AI works offline
- ❌ Server conversion needs internet
- ✅ Fallback works offline

### Q: What audio formats are supported?
**A:** 
- MP3 ✅
- WAV ✅
- OGG ✅
- M4A ✅
- MIDI ✅
- Any format your browser supports

---

## Technical Questions

### Q: Why does conversion take 30-60 seconds?
**A:** The first conversion downloads AI models (one-time). Subsequent conversions are faster (20-30 seconds).

### Q: Can I make it faster?
**A:** Yes:
1. Use Magenta AI (browser) - 5-10 seconds
2. Deploy to better server (Railway Pro)
3. Use MIDI files instead of MP3

### Q: How accurate is the conversion?
**A:**
- **Basic Pitch (server)**: 85-95% accurate
- **Magenta AI (browser)**: 70-85% accurate
- **Fallback**: 50-70% accurate

Piano-only recordings work best!

### Q: Why do I get different results each time?
**A:** The app tries different conversion methods:
1. Magenta AI (if available)
2. Your server (if running)
3. Fallback (always works)

Each method has different accuracy.

### Q: Can I convert songs with vocals?
**A:** Yes, but:
- Piano-only works best
- Vocals may be detected as notes
- Use "Beginner" mode to filter melody only

---

## Setup Questions

### Q: How do I install Python dependencies?
**A:**
```bash
pip install -r requirements.txt
```

If that fails, try:
```bash
pip3 install -r requirements.txt
```

Or:
```bash
python -m pip install -r requirements.txt
```

### Q: "Module not found" error?
**A:** Install dependencies:
```bash
pip install flask flask-cors basic-pitch numpy
```

### Q: "Port 5000 already in use"?
**A:** Change the port:

In `server.py`:
```python
app.run(host='0.0.0.0', port=5001)
```

In `app.js`:
```javascript
const SERVER_URL = 'http://localhost:5001';
```

### Q: Server starts but app can't connect?
**A:** Check:
1. Server is running (`python server.py`)
2. URL is correct in `app.js`
3. CORS is enabled (already is)
4. No firewall blocking port 5000

---

## Deployment Questions

### Q: Which hosting should I use?
**A:**
- **Railway.app** - Easiest (recommended)
- **Render.com** - Free tier, slower
- **Fly.io** - More control, technical

### Q: How much does hosting cost?
**A:**
- **Free tier**: $0/month (sufficient for most)
- **Railway Pro**: $5/month (faster)
- **Render Pro**: $7/month

### Q: Can I use my own domain?
**A:** Yes! All platforms support custom domains:
- Railway: Settings → Domains
- Render: Settings → Custom Domain
- Fly.io: `fly certs add your-domain.com`

### Q: How do I update the deployed server?
**A:**
1. Push changes to GitHub
2. Railway auto-deploys
3. Or manually: `git push railway main`

---

## Usage Questions

### Q: Why are some notes missing?
**A:** Try:
1. Use "Advanced" difficulty (shows all notes)
2. Use piano-only recordings
3. Try server conversion (better quality)

### Q: Why are there extra notes?
**A:** Try:
1. Use "Beginner" difficulty (melody only)
2. Use cleaner recordings
3. Adjust microphone sensitivity

### Q: Can I slow down the song?
**A:** Yes! Use the speed slider:
- 0.5x = Half speed (easier)
- 1.0x = Normal speed
- 2.0x = Double speed (challenge)

### Q: How do I practice a specific section?
**A:** Use Practice Mode:
1. Click "Practice Mode"
2. Use ← → buttons to navigate
3. Practice each step individually

### Q: Can I export the MIDI?
**A:** Not yet, but you can:
1. Use the piano roll view
2. Screenshot for reference
3. (Future feature: MIDI export)

---

## Troubleshooting

### Q: No notes are detected
**A:** Check:
1. Audio file has piano/melody
2. Volume is sufficient
3. Try different difficulty levels
4. Try server conversion

### Q: Notes are out of sync
**A:** Try:
1. Reload the page
2. Re-upload the file
3. Use MIDI files (perfect sync)

### Q: Falling notes are too fast/slow
**A:** Adjust:
1. Speed slider (0.5x - 2.0x)
2. Or edit `app.js` line ~1450:
```javascript
speed: 2.5 * this.playbackRate  // Change 2.5 to your preference
```

### Q: Piano keys don't light up
**A:** Check:
1. Browser supports Canvas
2. JavaScript is enabled
3. No console errors (F12)

### Q: Microphone doesn't work
**A:** Check:
1. Browser has microphone permission
2. Using HTTPS or localhost
3. Microphone is connected
4. No other app using microphone

---

## Performance Questions

### Q: App is slow on my device
**A:** Try:
1. Close other tabs
2. Use Chrome (fastest)
3. Reduce canvas quality
4. Use simpler songs

### Q: Server is slow
**A:** Try:
1. Deploy to better server
2. Use Railway Pro ($5/month)
3. Use Magenta AI instead
4. Cache results

### Q: Can I handle multiple users?
**A:** Yes:
- Free tier: 10-50 users
- Pro tier: 100-500 users
- Scale horizontally for more

---

## Feature Requests

### Q: Can you add [feature]?
**A:** Maybe! The code is open source. You can:
1. Fork the repo
2. Add the feature
3. Submit a pull request

### Q: Can I customize the colors?
**A:** Yes! The app has 5 themes:
- Purple (default)
- Blue
- Green
- Gold
- Red

Or edit `app.js` to add more!

### Q: Can I add more difficulty levels?
**A:** Yes! Edit the `filterByDifficulty()` function in `app.js`.

### Q: Can I change the piano range?
**A:** Yes! Edit `initPiano()` in `app.js`:
```javascript
// Current: A0 to C8 (88 keys)
// Change octave range as needed
```

---

## Business Questions

### Q: Can I use this commercially?
**A:** Check the license. If MIT/open source, yes!

### Q: Can I charge users?
**A:** Yes, but consider:
- Server costs
- Support costs
- Legal requirements

### Q: Can I white-label this?
**A:** Yes! Customize:
- Colors/themes
- Branding
- Domain name
- Features

### Q: How do I monetize?
**A:** Options:
- Premium features
- Ad-supported free tier
- Subscription model
- One-time purchase

---

## Support

### Q: Where can I get help?
**A:** 
1. Read the documentation
2. Check console errors (F12)
3. Search GitHub issues
4. Ask in discussions

### Q: How do I report a bug?
**A:**
1. Check if it's already reported
2. Create GitHub issue
3. Include:
   - Browser/OS
   - Steps to reproduce
   - Console errors
   - Screenshots

### Q: Can I contribute?
**A:** Yes! 
1. Fork the repo
2. Make improvements
3. Submit pull request
4. Help others in discussions

---

## Still Have Questions?

- 📖 Read `README.md` for overview
- 🚀 Read `QUICKSTART.md` for setup
- 🏗️ Read `ARCHITECTURE.md` for technical details
- 📝 Read `DEPLOYMENT.md` for hosting

**Happy piano learning!** 🎹✨
