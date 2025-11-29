# ⚡ Quick Start Guide

## For Users (2 minutes)

### Option 1: Use It Right Now
1. Open `index.html` in your browser
2. Upload an MP3 file
3. Wait 30-60 seconds for conversion
4. Play and learn! 🎹

### Option 2: Try with MIDI Files
1. Open `index.html`
2. Upload a `.mid` or `.midi` file
3. Instant playback - no conversion needed!
4. Find free MIDI files at: musescore.com, bitmidi.com

---

## For Developers (10 minutes)

### Local Server Setup

**1. Install Python dependencies:**
```bash
pip install -r requirements.txt
```
*This takes 2-3 minutes (downloads AI models)*

**2. Start the server:**
```bash
python server.py
```
*You should see: "Starting server on http://localhost:5000"*

**3. Test it:**
- Open `index.html` in your browser
- Upload an MP3
- Watch it use your local server!

---

### Deploy to Cloud (5 minutes)

**Railway.app (Easiest):**

1. Push your code to GitHub
2. Go to [railway.app](https://railway.app)
3. Click "Deploy from GitHub"
4. Select your repo
5. Done! Railway auto-deploys

**Get your URL:**
- Railway gives you: `https://your-app.up.railway.app`

**Update your app:**
- Open `app.js`
- Find line ~763: `const SERVER_URL = 'http://localhost:5000';`
- Change to: `const SERVER_URL = 'https://your-app.up.railway.app';`

---

## How It Works

### Conversion Priority:
1. **Magenta AI** (browser) - Tries first, works offline
2. **Your Server** (Basic Pitch) - Professional quality
3. **Fallback** (simple) - Always works

### When User Uploads MP3:
```
User uploads MP3
    ↓
Try Magenta AI (browser)
    ↓ (if fails)
Send to YOUR server
    ↓ (if fails)
Use fallback analysis
    ↓
Display falling notes! ✨
```

---

## Troubleshooting

### "Module not found" error
```bash
pip install -r requirements.txt
```

### "Port 5000 already in use"
Change port in `server.py`:
```python
app.run(host='0.0.0.0', port=5001)
```

And in `app.js`:
```javascript
const SERVER_URL = 'http://localhost:5001';
```

### Server works but app doesn't connect
- Check CORS is enabled (already is in `server.py`)
- Make sure server is running
- Check browser console for errors

### Conversion is slow
- First conversion downloads AI models (one-time)
- Subsequent conversions are faster
- Deploy to cloud for better performance

---

## Next Steps

✅ **Working locally?** → Deploy to Railway.app  
✅ **Deployed?** → Share your app!  
✅ **Want to customize?** → Check out the code in `app.js`

---

## Support

- Check `README.md` for full documentation
- See `DEPLOYMENT.md` for deployment options
- Read `test-server.md` for testing tips

**Have fun learning piano!** 🎹✨
