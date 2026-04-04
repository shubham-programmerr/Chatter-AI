# ⚡ Quick Start Guide

Get ChatterAI running in 5 minutes!

## Prerequisites

- Node.js v16+
- MongoDB Atlas account (free)
- Claude API key

## Step 1: Get API Keys

### MongoDB
1. Go to https://www.mongodb.com/cloud/atlas
2. Create free account & cluster
3. Copy connection string

### Claude API
1. Go to https://console.anthropic.com
2. Create API key
3. Copy your API key

## Step 2: Setup Backend

```bash
cd server
npm install
cp .env.example .env
```

Edit `.env`:
```env
MONGO_URI=your_mongodb_connection_string
CLAUDE_API_KEY=your_claude_api_key
JWT_SECRET=change_me_to_random_string
```

Start backend:
```bash
npm run dev
```

✅ Backend ready on http://localhost:5000

## Step 3: Setup Frontend

```bash
cd ../client
npm install
cp .env.example .env.local
npm start
```

✅ Frontend ready on http://localhost:3000

## Step 4: Test the App

1. **Register**: Create account at http://localhost:3000/register
2. **Create Room**: Name it "general"
3. **Send Message**: Type "Hello!" and send
4. **Use Bot**: Type "@bot What is React?" and see AI response

## 🔑 Key Commands

### Backend
```bash
npm run dev     # Start with auto-reload
npm start       # Production mode
```

### Frontend
```bash
npm start       # Development server
npm build       # Build for production
npm test        # Run tests
```

## 🔗 Connections

| Service | URL | Purpose |
|---------|-----|---------|
| Frontend | http://localhost:3000 | React app |
| Backend | http://localhost:5000 | API server |
| MongoDB | cloud.mongodb.com | Database |
| Claude | console.anthropic.com | AI bot |

## ✨ Features to Try

- **Real-time Chat**: Send messages and see them instantly
- **Typing Indicator**: See when people are typing
- **Online Status**: Green dot shows who's online
- **AI Bot**: Type `@bot` + question for AI response
- **Dark Mode**: Toggle theme in settings (Week 4)

## 🐛 Troubleshooting

**Backend won't start**
```bash
# Check MongoDB connection
# Verify PORT isn't in use
# Clear node_modules: rm -rf node_modules && npm install
```

**Frontend won't load**
```bash
# Check API URL in .env.local
# Ensure backend is running
# Clear cache: Ctrl+Shift+Delete
```

**Bot not responding**
```bash
# Check CLAUDE_API_KEY in .env
# Verify API key has credits
# Check server logs for errors
```

## 📚 Next Steps

1. Add your own features (emoji reactions, voice chat, etc.)
2. Deploy to Vercel (frontend) and Render (backend)
3. Add file upload with Cloudinary
4. Implement user profiles and avatars
5. Add message search functionality

## 🚀 Deploy to Production

### Frontend (Vercel)
```bash
npm run build
# Deploy build folder to Vercel
```

### Backend (Render)
1. Push to GitHub
2. Create Web Service on Render
3. Set environment variables
4. Deploy!

---

**Need help?** Check the full README.md for detailed documentation!
