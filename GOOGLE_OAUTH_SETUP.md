# Google OAuth Setup Guide for ChatterAI

## 🔐 Google Cloud Console Setup (Required First)

Follow these steps to get your Google Client ID:

### Step 1: Create Google Cloud Project
1. Go to https://console.cloud.google.com/
2. Click "Select a Project" dropdown at the top
3. Click "NEW PROJECT"
4. Enter project name: "ChatterAI"
5. Click "CREATE" and wait 1-2 minutes

### Step 2: Enable Google+ API
1. In the Google Cloud Console, search for **"Google+ API"** in the search bar
2. Click on "Google+ API"
3. Click "ENABLE" button
4. Wait ~30 seconds for it to activate

### Step 3: Create OAuth 2.0 Credentials
1. In the left sidebar, go to **"Credentials"**
2. Click **"CREATE CREDENTIALS"** → **"OAuth client ID"**
3. If prompted to "Configure OAuth consent screen first":
   - Click "CONFIGURE CONSENT SCREEN"
   - Select "External" for User Type
   - In "App information", enter:
     - App name: "ChatterAI"
     - User support email: (your email)
   - In "Developer contact information", enter your email
   - Click "SAVE AND CONTINUE" for all remaining screens
4. After consent screen is configured, go back to create OAuth credentials:
   - Click "CREATE CREDENTIALS" → "OAuth client ID"
   - Select application type: **"Web application"**
   - Give it a name: "ChatterAI Web Client"

### Step 4: Add URIs for Development
1. Under "Authorized JavaScript origins", add:
   ```
   http://localhost:3000
   http://192.168.55.1:3000
   ```
   (Add both for development and testing from different devices)

2. Under "Authorized redirect URIs", add same URLs:
   ```
   http://localhost:3000
   http://192.168.55.1:3000
   ```

3. Click "CREATE"

### Step 5: Copy Your Client ID
1. A modal will show your credentials
2. **COPY the "Client ID"** (looks like: `xxxxxx.apps.googleusercontent.com`)
3. Keep this safe - you'll use it below

---

## 📝 Environment Configuration

### Backend Setup (Server)
1. Edit `server/.env` file (create if doesn't exist)
2. Add your Google Client ID:
   ```
   GOOGLE_CLIENT_ID=your_copied_client_id_here
   ```
3. Make sure you also have:
   ```
   MONGO_URI=your_mongo_connection_string
   JWT_SECRET=your_jwt_secret
   GROQ_API_KEY=your_groq_api_key
   PORT=5000
   ```

### Frontend Setup (Client)
1. Edit `client/.env.local` file (create if doesn't exist)
2. Add your Google Client ID:
   ```
   REACT_APP_GOOGLE_CLIENT_ID=your_copied_client_id_here
   REACT_APP_API_URL=http://localhost:5000/api
   REACT_APP_SOCKET_URL=http://localhost:5000
   ```

---

## 🚀 Installation & Running

### Install Dependencies

**Backend:**
```bash
cd server
npm install
```

**Frontend:**
```bash
cd client
npm install
```

### Start the Application

**Terminal 1 - Backend:**
```bash
cd server
npm run dev
```

**Terminal 2 - Frontend:**
```bash
cd client
npm start
```

---

## ✅ Testing Google Login

1. Open http://localhost:3000
2. Go to Login page
3. Click "Sign in with Google" button
4. You'll be redirected to Google account selection
5. Select your Google account
6. Allow permissions when prompted
7. You'll be redirected back and logged in!

### What happens:
- **First time Google login:** New account is created with your Google email
- **Existing email:** If you already have a ChatterAI account with that email, it gets linked
- **Profile picture:** Your Google profile picture is saved

---

## 🔍 Troubleshooting

### "Google login button not showing"
- Check that `REACT_APP_GOOGLE_CLIENT_ID` is in `client/.env.local`
- Restart frontend server: `npm start`

### "Google authentication failed" error
- Check that `GOOGLE_CLIENT_ID` is in `server/.env`
- Verify Client ID matches between frontend and backend
- Restart backend server: `npm run dev`

### "Redirect URI mismatch" error
- Add the URL you're using to "Authorized redirect URIs" in Google Cloud Console
- For local network testing, add `http://192.168.55.1:3000`

### Port conflict
- If port 3000 or 5000 is in use, update `.env` files:
  ```
  REACT_APP_API_URL=http://localhost:5001/api  # if backend on 5001
  ```

---

## 📦 What Was Added

### Backend
- ✅ `google-auth-library` package for token verification
- ✅ User model updated to support Google ID
- ✅ New `/api/auth/google` endpoint
- ✅ Auto-account creation for first-time Google users

### Frontend
- ✅ `@react-oauth/google` & `jwt-decode` packages
- ✅ GoogleOAuthProvider wrapper in App
- ✅ Google login button on Login page
- ✅ Google login handler in AuthContext

---

## 🎯 Next Steps

1. ✅ Setup Google Cloud Console (follow steps above)
2. ✅ Add credentials to `.env` files
3. ✅ Run `npm install` in both folders
4. ✅ Start backend and frontend servers
5. ✅ Test Google login functionality

Enjoy your new Google OAuth integration! 🎉
