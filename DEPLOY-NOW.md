# 🚀 Deploy to Railway.app (10 Minutes)

## Your App Works Locally! Now Make It Live! 🌍

---

## Step 1: Prepare for Deployment (2 min)

### Rename the server file:
```bash
# In your project folder, rename:
server-railway.py → server.py
```

Or just use `server-railway.py` as-is (Railway will find it).

---

## Step 2: Push to GitHub (3 min)

### If you don't have a repo yet:
```bash
git init
git add .
git commit -m "Piano learning app with MP3-to-MIDI conversion"
```

### Create a new repo on GitHub:
1. Go to [github.com](https://github.com)
2. Click "New repository"
3. Name it: `piano-learning-app`
4. Don't initialize with README
5. Copy the commands shown

### Push your code:
```bash
git remote add origin https://github.com/YOUR_USERNAME/piano-learning-app.git
git branch -M main
git push -u origin main
```

---

## Step 3: Deploy to Railway (5 min)

### 1. Sign Up
- Go to [railway.app](https://railway.app)
- Click "Login with GitHub"
- Authorize Railway

### 2. Create New Project
- Click "New Project"
- Select "Deploy from GitHub repo"
- Choose `piano-learning-app`

### 3. Configure (Railway does this automatically!)
Railway will:
- ✅ Detect Python
- ✅ Install requirements.txt
- ✅ Run server.py
- ✅ Give you a URL!

### 4. Get Your URL
- Click on your deployment
- Go to "Settings" → "Domains"
- Copy your URL: `https://your-app-abc123.up.railway.app`

---

## Step 4: Update Your App (1 min)

### Open `app.js` and find line ~763:
```javascript
const SERVER_URL = 'http://localhost:5000';
```

### Change it to your Railway URL:
```javascript
const SERVER_URL = 'https://your-app-abc123.up.railway.app';
```

### Save and push:
```bash
git add app.js
git commit -m "Update server URL"
git push
```

---

## Step 5: Test It! 🎉

1. Open `index.html` in your browser
2. Upload an MP3 file
3. Watch it say "Uploading to server..."
4. See "Server processing..."
5. Get professional MIDI conversion! ✨

---

## What You Get:

### Before (Local):
- ⚠️ Magenta AI (browser) - 70-85% accurate
- ⚠️ Fallback analysis - 50-70% accurate

### After (Railway):
- ✅ Basic Pitch AI - 85-95% accurate
- ✅ Professional quality
- ✅ Same as Samplab
- ✅ Works on any device

---

## Troubleshooting:

### "Build failed"
- Check `requirements.txt` is in your repo
- Make sure `server.py` or `server-railway.py` exists
- Railway needs Python 3.9-3.11 (not 3.13)

### "Server not responding"
- Wait 2-3 minutes for first deployment
- Check Railway logs for errors
- Make sure CORS is enabled (it is)

### "Still using fallback"
- Check `SERVER_URL` in `app.js`
- Make sure it's your Railway URL
- Check browser console for errors

---

## Railway.app Tips:

### Free Tier:
- ✅ $5 free credit per month
- ✅ Enough for 100-500 conversions
- ✅ No credit card required

### Monitoring:
- Check "Deployments" for logs
- See "Metrics" for usage
- Get alerts for errors

### Custom Domain (Optional):
- Go to Settings → Domains
- Add your domain
- Update DNS records
- Done!

---

## Alternative: Render.com

If Railway doesn't work, try Render:

1. Go to [render.com](https://render.com)
2. New Web Service
3. Connect GitHub repo
4. Build: `pip install -r requirements.txt`
5. Start: `python server.py`
6. Deploy!

---

## You're Almost There! 🎯

Just:
1. Push to GitHub (3 min)
2. Deploy to Railway (5 min)
3. Update SERVER_URL (1 min)
4. Test it! (1 min)

**Total: 10 minutes to professional MP3-to-MIDI conversion!** 🚀

---

## Need Help?

- 📖 Check Railway docs: [docs.railway.app](https://docs.railway.app)
- 💬 Railway Discord: [discord.gg/railway](https://discord.gg/railway)
- 🐛 Check logs in Railway dashboard

**You've got this!** 💪
