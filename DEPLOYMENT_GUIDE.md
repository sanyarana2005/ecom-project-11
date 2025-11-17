# 🚀 Deployment Guide

This guide will help you deploy both the frontend and backend of your College Resource Booking Portal.

## 📋 Prerequisites

- GitHub account (for code repository)
- Accounts on deployment platforms:
  - **Frontend**: Vercel or Netlify (free tier available)
  - **Backend**: Railway, Render, or Heroku (free tier available)

---

## 🎯 Deployment Strategy

### Option 1: Recommended (Separate Platforms)
- **Frontend**: Deploy to Vercel or Netlify
- **Backend**: Deploy to Railway or Render

### Option 2: All-in-One
- **Frontend + Backend**: Deploy both to Railway (supports both Node.js and Python)

---

## 🌐 Frontend Deployment (Vercel)

### Step 1: Prepare Frontend
1. Ensure your code is pushed to GitHub
2. The frontend is already configured with `vercel.json`

### Step 2: Deploy to Vercel
1. Go to [vercel.com](https://vercel.com) and sign up/login
2. Click "Add New Project"
3. Import your GitHub repository
4. Configure:
   - **Framework Preset**: Create React App
   - **Root Directory**: Leave as root (or set to project root)
   - **Build Command**: `npm run build` (auto-detected)
   - **Output Directory**: `build` (auto-detected)

### Step 3: Set Environment Variables
In Vercel project settings → Environment Variables, add:
```
REACT_APP_API_URL=https://your-backend-url.railway.app/api
```
Replace `your-backend-url.railway.app` with your actual backend URL.

### Step 4: Deploy
Click "Deploy" and wait for the build to complete.

---

## 🌐 Frontend Deployment (Netlify)

### Step 1: Deploy to Netlify
1. Go to [netlify.com](https://netlify.com) and sign up/login
2. Click "Add new site" → "Import an existing project"
3. Connect your GitHub repository
4. Configure:
   - **Build command**: `npm run build`
   - **Publish directory**: `build`
   - **Base directory**: Leave empty

### Step 2: Set Environment Variables
In Site settings → Environment variables, add:
```
REACT_APP_API_URL=https://your-backend-url.railway.app/api
```

### Step 3: Deploy
Click "Deploy site" and wait for the build.

---

## 🔧 Backend Deployment (Railway) - Recommended

### Step 1: Prepare Backend
1. Ensure your code is pushed to GitHub
2. Railway will auto-detect Python from `requirements.txt`

### Step 2: Deploy to Railway
1. Go to [railway.app](https://railway.app) and sign up/login
2. Click "New Project" → "Deploy from GitHub repo"
3. Select your repository
4. Railway will auto-detect it's a Python project

### Step 3: Configure Settings
1. **Root Directory**: Set to `backend` (if not auto-detected)
2. **Start Command**: Railway will auto-detect from `Procfile`
   - Should be: `gunicorn app:app --config gunicorn_config.py`

### Step 4: Set Environment Variables (if needed)
Railway usually auto-detects PORT, but you can set:
```
PORT=8000
```

### Step 5: Get Backend URL
1. After deployment, Railway will provide a URL like: `https://your-app.railway.app`
2. Copy this URL - you'll need it for frontend environment variable

### Step 6: Update Frontend
Go back to your frontend deployment (Vercel/Netlify) and update:
```
REACT_APP_API_URL=https://your-app.railway.app/api
```
Then redeploy the frontend.

---

## 🔧 Backend Deployment (Render)

### Step 1: Deploy to Render
1. Go to [render.com](https://render.com) and sign up/login
2. Click "New" → "Web Service"
3. Connect your GitHub repository
4. Configure:
   - **Name**: `college-booking-backend`
   - **Environment**: Python 3
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `gunicorn app:app --config gunicorn_config.py`
   - **Root Directory**: `backend`

### Step 2: Set Environment Variables
Add:
```
PORT=8000
```

### Step 3: Deploy
Click "Create Web Service" and wait for deployment.

### Step 4: Get Backend URL
Render will provide a URL like: `https://your-app.onrender.com`
Use this in your frontend `REACT_APP_API_URL`.

---

## 🔧 Backend Deployment (Heroku)

### Step 1: Install Heroku CLI
```bash
# macOS
brew install heroku/brew/heroku

# Or download from https://devcenter.heroku.com/articles/heroku-cli
```

### Step 2: Login to Heroku
```bash
heroku login
```

### Step 3: Create Heroku App
```bash
cd backend
heroku create your-app-name
```

### Step 4: Deploy
```bash
git push heroku main
```

### Step 5: Set Environment Variables (if needed)
```bash
heroku config:set PORT=8000
```

---

## ✅ Post-Deployment Checklist

### 1. Test Backend
Visit: `https://your-backend-url.com/health`
Should return: `{"ok": true}`

### 2. Test Frontend
- Visit your frontend URL
- Try logging in with:
  - `student@gmail.com` / `Student`
  - `teacher@gmail.com` / `Teacher`
  - `hod@gmail.com` / `hod`

### 3. Verify Demo Data
- Check if calendar shows events
- Check "My Bookings" section
- Verify bookings are visible

### 4. Test CORS
- Make sure frontend can call backend APIs
- Check browser console for CORS errors

---

## 🐛 Troubleshooting

### Issue: Frontend can't connect to backend
**Solution**: 
- Check `REACT_APP_API_URL` is set correctly
- Ensure backend URL includes `/api` at the end
- Verify CORS is enabled in backend (already configured)

### Issue: Database is empty after deployment
**Solution**: 
- The backend automatically seeds data on first startup
- If data is missing, restart the backend service
- Check backend logs for initialization messages

### Issue: Build fails
**Solution**:
- Check Node.js version (should be 16+)
- Check Python version (should be 3.11+)
- Review build logs for specific errors

### Issue: 500 errors from backend
**Solution**:
- Check backend logs
- Verify database file permissions (if using SQLite)
- Ensure all dependencies are in `requirements.txt`

---

## 📝 Important Notes

1. **Database Persistence**: 
   - SQLite database is created automatically on first run
   - Demo data is seeded automatically if database is empty
   - On platforms with ephemeral storage, data resets on restart (but auto-seeds again)

2. **Environment Variables**:
   - Frontend: `REACT_APP_API_URL` must be set
   - Backend: `PORT` is usually auto-detected

3. **CORS**: 
   - Already configured in backend to allow all origins
   - No additional setup needed

4. **Demo Accounts**:
   - `student@gmail.com` / `Student`
   - `teacher@gmail.com` / `Teacher`
   - `hod@gmail.com` / `hod`

---

## 🎉 You're Done!

Once deployed, your application will be live and accessible from anywhere. The demo data will automatically appear on first deployment.

