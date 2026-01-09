# Live Polling System

A resilient live polling system with real-time updates, state recovery, and timer synchronization.

## Features

### Teacher Persona
- Create polls with questions, options, and timer duration (1-60 seconds)
- View live polling results in real-time
- View poll history from database
- State recovery on page refresh
- End polls manually or automatically when timer expires

### Student Persona
- Enter name on first visit (unique per session/tab)
- Receive questions instantly via WebSocket
- Timer synchronization (shows remaining time, not full duration)
- Submit answers within time limit
- View live polling results after submission
- Maximum of 60 seconds to answer a question

### Resilience Features
- **State Recovery**: If teacher or student refreshes during an active poll, the application fetches current state from backend and resumes exactly where it left off
- **Timer Synchronization**: Timer syncs with server - if a student joins 30 seconds late to a 60-second question, their timer shows 30 seconds remaining
- **Race Condition Prevention**: One vote per student per question, even with API spam or client manipulation
- **Error Handling**: Graceful error handling with user feedback (toasts/alerts)
- **Connection Recovery**: Automatic reconnection with state sync

## Technology Stack

- **Frontend**: React.js with TypeScript, Vite
- **Backend**: Node.js with Express and TypeScript
- **Real-time**: Socket.io
- **Database**: MongoDB with Mongoose

## Setup Instructions

### Prerequisites
- Node.js (v16 or higher)
- MongoDB (local or MongoDB Atlas)

### Backend Setup

```bash
cd backend
npm install
# Create .env file with:
# PORT=5000
# MONGODB_URI=mongodb://localhost:27017/live-polling
# NODE_ENV=development
# FRONTEND_URL=http://localhost:3000
npm run dev
```

The backend will run on `http://localhost:5000`

### Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

The frontend will run on `http://localhost:3000`

## Architecture

### Backend Architecture (Controller-Service Pattern)
- **Controllers** (`src/controllers/`): Handle HTTP requests, validation, and response formatting
- **Services** (`src/services/`): Contain business logic and database interactions
  - `PollService`: Poll creation, retrieval, results calculation
  - `VoteService`: Vote submission, validation, duplicate prevention
- **Models** (`src/models/`): MongoDB schemas for Poll and Vote
- **Socket Handlers** (`src/socket/`): Handle real-time events separately from business logic

### Frontend Architecture
- **Custom Hooks**:
  - `useSocket`: Manages Socket.io connection, state, and events
  - `usePollTimer`: Handles timer countdown with server synchronization
- **Components**: Reusable UI components (Toast, ConnectionStatus)
- **Pages**: Route-based page components for Teacher and Student flows
- **Utils**: API client and localStorage utilities

## Project Structure

```
.
├── backend/
│   ├── src/
│   │   ├── controllers/
│   │   │   └── PollController.ts
│   │   ├── services/
│   │   │   ├── PollService.ts
│   │   │   └── VoteService.ts
│   │   ├── models/
│   │   │   ├── Poll.ts
│   │   │   └── Vote.ts
│   │   ├── socket/
│   │   │   └── PollSocketHandler.ts
│   │   └── server.ts
│   ├── package.json
│   └── tsconfig.json
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Toast.tsx
│   │   │   └── ConnectionStatus.tsx
│   │   ├── hooks/
│   │   │   ├── useSocket.ts
│   │   │   └── usePollTimer.ts
│   │   ├── pages/
│   │   │   ├── RoleSelection.tsx
│   │   │   ├── Student/
│   │   │   └── Teacher/
│   │   ├── types/
│   │   ├── utils/
│   │   ├── App.tsx
│   │   └── main.tsx
│   ├── package.json
│   └── vite.config.ts
└── README.md
```

## Deployment

### Backend Deployment (Example: Heroku/Railway/Render)

1. Set environment variables:
   - `MONGODB_URI`: Your MongoDB connection string
   - `PORT`: Port (usually auto-set by hosting)
   - `FRONTEND_URL`: Your frontend URL
   - `NODE_ENV`: production

2. Build and start:
   ```bash
   npm run build
   npm start
   ```

### Frontend Deployment (Example: Vercel/Netlify)

1. Set environment variables:
   - `VITE_API_URL`: Your backend API URL
   - `VITE_SOCKET_URL`: Your backend Socket.io URL

2. Build:
   ```bash
   npm run build
   ```

3. Deploy the `dist` folder

## Key Features Implementation

### State Recovery
- On page refresh, socket connection requests current state from server
- Server sends active poll, remaining time, and current results
- Frontend resumes UI exactly where it left off

### Timer Synchronization
- Server calculates remaining time based on `startTime` and `timerDuration`
- Timer updates broadcast every second via Socket.io
- Client timer syncs with server to prevent drift

### Race Condition Prevention
- Database unique index on `(pollId, studentId)` prevents duplicate votes
- Server-side validation checks before vote submission
- Client-side optimistic UI with server confirmation

## Testing the System

1. **Start Backend**: `cd backend && npm run dev`
2. **Start Frontend**: `cd frontend && npm run dev`
3. **Open two browser tabs**:
   - Tab 1: Select "I am Teacher" → Create a poll
   - Tab 2: Select "I am Student" → Enter name → Wait for poll → Vote
4. **Test Resilience**:
   - Refresh teacher tab during active poll → Should recover state
   - Refresh student tab during active poll → Should recover state and timer
   - Join student late → Timer should show remaining time, not full duration

## Notes

- MongoDB connection is required for the system to work
- Socket.io connection is required for real-time features
- Student IDs are stored in localStorage (unique per tab)
- Polls are automatically ended when timer expires
- Only one active poll at a time
