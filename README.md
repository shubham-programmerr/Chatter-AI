# 🤖 ChatterAI - Real-Time Chat App with AI Bot

A Discord-style chat application where users can chat in rooms AND summon an AI assistant bot anytime using the `@bot` command.

## ✨ Features

### Week 1: Foundation & Auth ✅
- User authentication (Register/Login) with JWT
- Password hashing with bcryptjs
- Protected routes on frontend
- Persistent login with localStorage

### Week 2: Real-Time Chat Core ✅
- Socket.io real-time messaging
- Create and join chat rooms
- Online status indicator (green dot)
- Typing indicator ("User is typing...")
- Messages stored in MongoDB

### Week 3: AI Bot & File Sharing ✅
- AI bot integration with Claude API
- Trigger bot with `@bot` command
- Special AI bot message styling
- File upload support (ready for Cloudinary)

### Week 4: Polish & Deployment ✅
- Dark/Light theme toggle
- Responsive mobile UI
- Error handling & notifications
- Deployment ready

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | React + Tailwind CSS |
| **Backend** | Node.js + Express |
| **Real-time** | Socket.io |
| **Database** | MongoDB |
| **Auth** | JWT + bcryptjs |
| **AI Bot** | Claude API (Anthropic) |
| **File Storage** | Cloudinary (optional) |
| **Deployment** | Vercel (frontend) + Render (backend) |

## 📦 Prerequisites

- **Node.js** v16+ and npm/yarn
- **MongoDB Atlas** account (free tier available)
- **Claude API Key** from [Anthropic](https://console.anthropic.com)
- **Git** for version control

## 🚀 Installation & Setup

### 1. Clone the Repository

```bash
git clone <your-repo-url>
cd chatterai
```

### 2. Setup Backend Server

```bash
cd server
npm install
cp .env.example .env
```

Edit `.env` with your credentials:
```env
PORT=5000
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_super_secret_key
CLAUDE_API_KEY=your_claude_api_key
CLIENT_URL=http://localhost:3000
```

Start the backend:
```bash
npm run dev  # Development with auto-reload
npm start    # Production
```

✅ Backend running on `http://localhost:5000`

### 3. Setup Frontend Client

```bash
cd client
npm install
cp .env.example .env.local
```

Edit `.env.local`:
```env
REACT_APP_API_URL=http://localhost:5000/api
REACT_APP_SOCKET_URL=http://localhost:5000
```

Start the frontend:
```bash
npm start
```

✅ Frontend running on `http://localhost:3000`

## 📝 Usage

### 1. Register/Login
- Go to `http://localhost:3000/register`
- Create an account with username, email, and password
- Or login with existing credentials

### 2. Create or Join a Room
- On the home page, create a new room with a name and description
- Or join existing rooms with the "Join Room" button

### 3. Chat in Real-Time
- Type messages and see them appear instantly
- See typing indicators when others are typing
- Online users shown in the sidebar

### 4. Use the AI Bot 🤖
- Type `@bot` followed by your question
- Example: `@bot explain WebSockets in simple terms`
- The bot will respond with AI-generated answers

## 🔌 API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user

### Rooms
- `GET /api/rooms` - Get all rooms
- `POST /api/rooms` - Create new room (requires auth)
- `POST /api/rooms/:id/join` - Join a room (requires auth)
- `POST /api/rooms/:id/leave` - Leave a room (requires auth)

### Messages
- `GET /api/messages/room/:roomId` - Get messages in a room
- `POST /api/messages` - Send a message (requires auth)
- `DELETE /api/messages/:id` - Delete a message (requires auth)

### Bot
- `POST /api/bot/chat` - Send message to AI bot (requires auth)

## 🔌 Socket.io Events

### Client → Server
- `joinRoom` - Join a chat room
- `typing` - User is typing
- `stopTyping` - User stopped typing
- `sendMessage` - Send a message
- `leaveRoom` - Leave a room

### Server → Client
- `messageReceived` - New message in room
- `userTyping` - User typing indicator
- `userStoppedTyping` - User stopped typing
- `userJoined` - User joined room
- `userLeft` - User left room

## 📁 Project Structure

```
chatterai/
├── client/                          # React Frontend
│   ├── src/
│   │   ├── components/
│   │   │   ├── Chat/               # Chat UI components
│   │   │   ├── Auth/               # Login/Register
│   │   │   ├── Sidebar/            # Room list & online users
│   │   │   └── Bot/                # Bot message display
│   │   ├── context/                # React Context (Auth, Theme)
│   │   ├── hooks/                  # Custom hooks (useSocket)
│   │   ├── pages/                  # Pages (Home, ChatRoom)
│   │   ├── App.jsx                 # Main app with routing
│   │   └── index.jsx               # React entry point
│   └── package.json
│
└── server/                          # Node.js Backend
    ├── models/                      # MongoDB schemas
    ├── routes/                      # API routes
    ├── controllers/                 # Business logic
    ├── middleware/                  # Auth middleware
    ├── socket/                      # Socket.io handlers
    ├── server.js                    # Express server
    └── package.json
```

## 🌐 Environment Variables

### Server `.env`
```
PORT=5000
NODE_ENV=development
MONGO_URI=mongodb+srv://user:pass@cluster.mongodb.net/chatterai
JWT_SECRET=your_secret_key
CLAUDE_API_KEY=sk-ant-xxxxx
CLIENT_URL=http://localhost:3000
```

### Client `.env.local`
```
REACT_APP_API_URL=http://localhost:5000/api
REACT_APP_SOCKET_URL=http://localhost:5000
```

## 🚢 Deployment

### Deploy Frontend to Vercel

```bash
cd client
npm run build
# Deploy the build folder to Vercel
```

### Deploy Backend to Render

1. Push code to GitHub
2. Create new Web Service on Render
3. Connect your GitHub repository
4. Set up environment variables in Render dashboard
5. Deploy!

## 🔒 Security Features

- ✅ Password hashing with bcryptjs
- ✅ JWT token authentication
- ✅ Protected API routes with middleware
- ✅ CORS enabled for frontend origin
- ✅ Environment variables for sensitive data
- ✅ Socket.io connection validation

## 🐛 Troubleshooting

### Backend won't connect to MongoDB
- Check `MONGO_URI` in `.env`
- Ensure MongoDB Atlas cluster is running
- Whitelist your IP in MongoDB Atlas

### Frontend can't connect to backend
- Check `REACT_APP_API_URL` in `.env.local`
- Ensure backend is running on correct port
- Check browser console for CORS errors

### AI Bot not responding
- Verify `CLAUDE_API_KEY` in `.env`
- Check API key is valid and has credits
- Look at server logs for errors

### Socket.io connection issues
- Check `CLIENT_URL` in server `.env`
- Ensure frontend and backend are on same network
- Try clearing browser cache

## 📚 Learning Resources

- [Socket.io Documentation](https://socket.io/docs/)
- [React Router v6](https://reactrouter.com/)
- [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
- [JWT Authentication](https://jwt.io/)
- [Anthropic Claude API](https://docs.anthropic.com/)

## 🤝 Contributing

Contributions are welcome! Please follow these steps:
1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is open source and available under the MIT License.

## 🙏 Acknowledgments

- Built with React, Node.js, and Socket.io
- AI powered by Claude API from Anthropic
- Styling with Tailwind CSS
- Inspired by Discord

## 📧 Support

For issues, questions, or suggestions, please open an issue on GitHub or contact the maintainers.

---

**Happy Chatting! 🚀**
