import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { PollController } from './controllers/PollController';
import { PollSocketHandler } from './socket/PollSocketHandler';

dotenv.config();

const app = express();
const server = http.createServer(app);

// Socket.io setup
const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    methods: ['GET', 'POST']
  }
});

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.post('/api/polls', PollController.createPoll);
app.get('/api/polls/active', PollController.getActivePoll);
app.get('/api/polls', PollController.getAllPolls);
app.get('/api/polls/:pollId/results', PollController.getPollResults);
app.post('/api/polls/end', PollController.endPoll);
app.post('/api/votes', PollController.submitVote);
app.get('/api/votes/status', PollController.checkVoteStatus);

// Socket.io handler
new PollSocketHandler(io);

// Database connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/live-polling';

mongoose.connect(MONGODB_URI)
  .then(() => {
    console.log('Connected to MongoDB');
    const PORT = process.env.PORT || 5000;
    server.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  })
  .catch((error) => {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  });

// Error handling middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Error:', err);
  
  // Handle database connection errors
  if (err.name === 'MongoNetworkError' || err.name === 'MongoServerSelectionError') {
    res.status(503).json({ error: 'Database connection error. Please try again later.' });
    return;
  }
  
  res.status(500).json({ error: 'Internal server error' });
});
