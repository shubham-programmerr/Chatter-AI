# 🏗️ ChatterAI Architecture

## System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                        CLIENT (React)                            │
│                    http://localhost:3000                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐           │
│  │ Auth Pages   │  │ Chat Pages   │  │ Components    │           │
│  ├──────────────┤  ├──────────────┤  ├──────────────┤           │
│  │ Login.jsx    │  │ Home.jsx     │  │ ChatWindow   │           │
│  │ Register.jsx │  │ ChatRoom.jsx │  │ MessageBubble│           │
│  │              │  │              │  │ TypingInd...│           │
│  └──────────────┘  └──────────────┘  └──────────────┘           │
│                                                                   │
│  ┌────────────────────────────────────────────────────────────┐  │
│  │ State Management (Context)                                 │  │
│  ├────────────────────────────────────────────────────────────┤  │
│  │ • AuthContext (user, token, login/logout)                  │  │
│  │ • ThemeContext (dark/light mode)                           │  │
│  │ • useSocket Hook (Socket.io wrapper)                       │  │
│  └────────────────────────────────────────────────────────────┘  │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
                              ↓
                    Socket.io + REST API
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                    SERVER (Node.js)                              │
│                    http://localhost:5000                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ Express Routes (/api)                                    │  │
│  ├──────────────────────────────────────────────────────────┤  │
│  │ • /api/auth (register, login)                            │  │
│  │ • /api/rooms (create, join, leave, list)                 │  │
│  │ • /api/messages (send, fetch, delete)                    │  │
│  │ • /api/bot (chat with AI)                                │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                   │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ Controllers & Business Logic                             │  │
│  ├──────────────────────────────────────────────────────────┤  │
│  │ • authController (register, login, JWT)                  │  │
│  │ • botController (Claude API calls)                       │  │
│  │ • Middleware: authMiddleware (JWT verification)          │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                   │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ Socket.io Real-Time Events                               │  │
│  ├──────────────────────────────────────────────────────────┤  │
│  │ joinRoom → userJoined                                    │  │
│  │ sendMessage → messageReceived                            │  │
│  │ typing → userTyping                                      │  │
│  │ leaveRoom → userLeft                                     │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
                              ↓
                    REST API + Queries
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                    DATABASE (MongoDB)                            │
│              https://cloud.mongodb.com                           │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  Collections:                                                    │
│  ├── users (username, email, password_hash, avatar, isOnline)   │
│  ├── rooms (name, description, members, createdAt)              │
│  ├── messages (room_id, sender_id, content, isBot, timestamp)   │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
```

---

## Data Flow Architecture

### 1. Authentication Flow

```
User Registration
    ↓
React Form (Register.jsx)
    ↓
POST /api/auth/register
    ↓
authController.register()
    ├─ Hash password (bcryptjs)
    ├─ Create user in MongoDB
    ├─ Generate JWT token
    └─ Return user + token
    ↓
Store in localStorage
    ↓
AuthContext updated
    ↓
Redirect to ChatRoom
```

### 2. Real-Time Chat Flow

```
User Types Message
    ↓
ChatWindow component
    ↓
emit('sendMessage') via Socket.io
    ↓
socketHandler receives
    ├─ Save to MongoDB
    └─ emit('messageReceived')
    ↓
All clients in room receive
    ↓
MessageBubble renders message
```

### 3. AI Bot Flow

```
User types "@bot question"
    ↓
ChatWindow detects @bot
    ↓
POST /api/bot/chat
    ↓
botController.handleBotMessage()
    ├─ Extract question
    ├─ Call Claude API
    ├─ Save bot response to MongoDB
    └─ Emit via Socket.io
    ↓
BotMessage component renders
    with 🤖 badge
```

---

## Component Hierarchy

```
App.jsx
├── AuthProvider
│   └── ThemeProvider
│       └── Router
│           ├── <ProtectedRoute>
│           │   ├── Home.jsx
│           │   │   ├── RoomList (create room form)
│           │   │   ├── RoomList (join rooms)
│           │   │   └── Room cards
│           │   └── ChatRoom.jsx
│           │       ├── Sidebar
│           │       │   ├── RoomList
│           │       │   └── OnlineUsers
│           │       └── ChatWindow
│           │           ├── MessageBubble[] (map messages)
│           │           ├── TypingIndicator
│           │           ├── MessageInput
│           │           └── FileUpload
│           ├── Login.jsx
│           └── Register.jsx
```

---

## State Management Flow

```
AuthContext
├── user (object)
├── token (string)
├── loading (boolean)
├── isAuthenticated (computed)
└── Methods: register(), login(), logout()

ThemeContext
├── isDarkMode (boolean)
└── Methods: toggleTheme()

Socket.io (Local State)
├── messages[]
├── typing[]
├── room
├── users[]
└── Connection status
```

## API Endpoints Overview

```
POST   /api/auth/register         → Register user
POST   /api/auth/login            → Login user

GET    /api/rooms                 → List all rooms
POST   /api/rooms                 → Create room (auth)
POST   /api/rooms/:id/join        → Join room (auth)
POST   /api/rooms/:id/leave       → Leave room (auth)

GET    /api/messages/room/:roomId → Get room messages
POST   /api/messages              → Send message (auth)
DELETE /api/messages/:id          → Delete message (auth)

POST   /api/bot/chat              → Chat with AI (auth)
```

---

## Database Schema

### Users Collection
```javascript
{
  _id: ObjectId,
  username: String (unique, min 3 chars),
  email: String (unique),
  password: String (hashed),
  avatar: String (URL or placeholder),
  isOnline: Boolean,
  createdAt: Date,
  updatedAt: Date
}
```

### Rooms Collection
```javascript
{
  _id: ObjectId,
  name: String (required),
  description: String,
  users: [ObjectId], // array of user IDs
  isGroup: Boolean,
  createdAt: Date,
  updatedAt: Date
}
```

### Messages Collection
```javascript
{
  _id: ObjectId,
  room: ObjectId (ref: Room),
  sender: ObjectId (ref: User) or null for bot,
  content: String (required),
  isBot: Boolean (default: false),
  fileUrl: String (optional, for attachments),
  createdAt: Date,
  updatedAt: Date
}
```

---

## Deployment Architecture

```
┌─────────────────────────────────┐
│   Vercel (Frontend)             │
│   - React build                 │
│   - Static hosting              │
│   - Auto deployments from git   │
└─────────────────────────────────┘
           ↓ API calls
┌─────────────────────────────────┐
│   Render (Backend)              │
│   - Express server              │
│   - Node.js runtime             │
│   - Auto deployments from git   │
└─────────────────────────────────┘
           ↓ Database queries
┌─────────────────────────────────┐
│   MongoDB Atlas (Cloud)         │
│   - Managed database            │
│   - Automatic backups           │
│   - Global access               │
└─────────────────────────────────┘
```

---

## Security Architecture

```
┌─────────────────────────────────────────────────┐
│           Security Layers                       │
├─────────────────────────────────────────────────┤
│                                                 │
│ Layer 1: HTTPS/TLS (in production)              │
│ ├─ All data encrypted in transit                │
│ └─ Certificate from Let's Encrypt/Vercel        │
│                                                 │
│ Layer 2: Authentication                         │
│ ├─ Password hashing (bcryptjs, 10 rounds)       │
│ ├─ JWT tokens with expiration                   │
│ └─ Secure storage in httpOnly cookies (ready)   │
│                                                 │
│ Layer 3: Authorization                          │
│ ├─ authMiddleware checks JWT on protected routes│
│ ├─ Protected route wrappers in React            │
│ └─ Message deletion only by sender              │
│                                                 │
│ Layer 4: Data Validation                        │
│ ├─ Form validation in React                     │
│ ├─ Backend input validation                     │
│ └─ Mongoose schema validation                   │
│                                                 │
│ Layer 5: Environment Security                   │
│ ├─ Secrets in .env (not committed)              │
│ ├─ API keys never exposed to client             │
│ └─ CORS configured for frontend only            │
│                                                 │
└─────────────────────────────────────────────────┘
```

---

## Performance Optimizations

1. **Frontend**
   - React Context prevents prop drilling
   - Message virtualization ready (large lists)
   - Image lazy loading ready
   - Code splitting with React.lazy

2. **Backend**
   - Connection pooling with MongoDB
   - Indexed queries on frequently searched fields
   - Socket.io rooms for efficient broadcasting
   - Pagination ready for message queries

3. **Network**
   - Socket.io for real-time vs REST polling
   - Gzip compression (Express middleware ready)
   - CDN ready with Vercel/Render

---

## Scalability Considerations

```
Phase 1 (Current - Small scale)
├─ Single MongoDB instance
├─ Single Express server
└─ Works for ~100 concurrent users

Phase 2 (Growth)
├─ MongoDB replication set
├─ Multiple Express instances (load balanced)
├─ Redis for session management
└─ Works for ~1000 concurrent users

Phase 3 (Enterprise)
├─ MongoDB sharding
├─ Kubernetes orchestration
├─ Message queue (RabbitMQ/Kafka)
├─ Microservices architecture
└─ Works for millions of users
```

---

## Error Handling Flow

```
Client Error
    ↓
Try/Catch block
    ↓
Error Response
    ├─ UI Error message
    ├─ Console log
    └─ Error state management
    ↓
User can retry

Server Error
    ↓
Try/Catch block
    ↓
Error Response
    ├─ Console log
    ├─ Error code (4xx/5xx)
    └─ Error message
    ↓
Client receives & displays
```

---

This architecture is production-ready and can scale from MVP to enterprise level! 🚀
