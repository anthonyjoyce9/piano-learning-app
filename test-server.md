# Test Your Server Setup

## Step 1: Install Dependencies

Open your terminal and run:
```bash
pip install -r requirements.txt
```

This will install:
- Flask (web server)
- Flask-CORS (allows your web app to connect)
- Basic Pitch (Spotify's AI for audio-to-MIDI)
- NumPy (math library)

**Note**: This may take 2-3 minutes as Basic Pitch downloads AI models.

## Step 2: Start the Server

```bash
python server.py
```

You should see:
```
🎹 Piano Learning App - Conversion Server
Starting server on http://localhost:5000
```

## Step 3: Test with Your Web App

1. Keep the server running
2. Open `index.html` in your browser
3. Upload an MP3 file
4. Watch the magic happen! ✨

The app will:
1. Try Magenta AI first (if available)
2. If that fails, send to your server
3. Your server uses Basic Pitch to convert
4. Returns perfect MIDI data
5. Your app displays falling notes!

## Troubleshooting

### "Module not found" error
Run: `pip install -r requirements.txt`

### "Port 5000 already in use"
Change the port in `server.py`:
```python
app.run(host='0.0.0.0', port=5001, debug=True)
```

And in `app.js`:
```javascript
const SERVER_URL = 'http://localhost:5001';
```

### Server works but app doesn't connect
Make sure CORS is enabled (it already is in `server.py`)

## Next Steps

Once it works locally, deploy to Railway.app following `DEPLOYMENT.md`!
