# Backend Server Setup

## Quick Start (5 minutes)

### 1. Install Python dependencies:
```bash
pip install -r requirements.txt
```

### 2. Run the server:
```bash
python server.py
```

### 3. Server runs on http://localhost:5000

## Deploy to Cloud (Free):

### Option A: Railway.app (Easiest)
1. Sign up at railway.app
2. Click "New Project" → "Deploy from GitHub"
3. Connect your repo
4. Railway auto-detects Python and deploys
5. Get your URL: https://your-app.railway.app

### Option B: Render.com (Free tier)
1. Sign up at render.com
2. New Web Service → Connect repo
3. Build command: `pip install -r requirements.txt`
4. Start command: `python server.py`
5. Free tier available

### Option C: Fly.io
1. Install flyctl
2. Run: `fly launch`
3. Run: `fly deploy`
4. Free tier: 3 small VMs

## Update Your App:

In `app.js`, change:
```javascript
const SERVER_URL = 'https://your-app.railway.app';
```

That's it! Your app now has professional audio-to-MIDI conversion!
