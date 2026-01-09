import { Server, Socket } from 'socket.io';
import { PollService } from '../services/PollService';
import { VoteService } from '../services/VoteService';

interface Participant {
  id: string;
  name: string;
  socketId: string;
}

interface ChatMessage {
  id: string;
  senderName: string;
  senderId: string;
  message: string;
  timestamp: Date;
}

export class PollSocketHandler {
  private io: Server;
  private participants: Map<string, Participant> = new Map();
  private chatMessages: ChatMessage[] = [];

  constructor(io: Server) {
    this.io = io;
    this.setupEventHandlers();
  }

  private setupEventHandlers(): void {
    this.io.on('connection', (socket: Socket) => {
      console.log('Client connected:', socket.id);

      // Send current state to newly connected client
      this.sendCurrentState(socket);

      // Handle vote submission
      socket.on('submitVote', async (data: { pollId: string; studentId: string; optionIndex: number }) => {
        try {
          const result = await VoteService.submitVote(
            data.pollId,
            data.studentId,
            data.optionIndex
          );

          if (result.success) {
            // Broadcast updated results to all clients
            await this.broadcastPollResults(data.pollId);
            socket.emit('voteSuccess', { pollId: data.pollId });
          } else {
            socket.emit('voteError', { message: result.message });
          }
        } catch (error: any) {
          console.error('Error handling vote:', error);
          socket.emit('voteError', { message: 'Failed to submit vote' });
        }
      });

      // Handle poll creation (teacher)
      socket.on('createPoll', async (data: { question: string; options: string[]; timerDuration: number }) => {
        try {
          const poll = await PollService.createPoll(
            data.question,
            data.options,
            data.timerDuration
          );

          // Broadcast new poll to all clients
          const remainingTime = await PollService.getRemainingTime(poll._id.toString());
          this.io.emit('pollCreated', {
            poll,
            remainingTime: remainingTime || 0
          });

          // Start timer countdown
          this.startPollTimer(poll._id.toString(), poll.timerDuration);
        } catch (error: any) {
          console.error('Error creating poll:', error);
          socket.emit('pollError', { message: 'Failed to create poll' });
        }
      });

      // Handle poll end (teacher)
      socket.on('endPoll', async () => {
        try {
          const poll = await PollService.endActivePoll();
          if (poll) {
            const results = await PollService.getPollResults(poll._id.toString());
            this.io.emit('pollEnded', results);
          }
        } catch (error: any) {
          console.error('Error ending poll:', error);
          socket.emit('pollError', { message: 'Failed to end poll' });
        }
      });

      // Handle request for current state
      socket.on('requestState', () => {
        this.sendCurrentState(socket);
      });

      // Chat functionality
      socket.on('sendChatMessage', (data: { senderName: string; message: string }) => {
        const message: ChatMessage = {
          id: `${Date.now()}-${Math.random()}`,
          senderName: data.senderName,
          senderId: socket.id,
          message: data.message,
          timestamp: new Date()
        };
        this.chatMessages.push(message);
        // Broadcast to all clients
        this.io.emit('chatMessage', message);
      });

      // Participants management
      socket.on('registerParticipant', (data: { name: string }) => {
        const participant: Participant = {
          id: socket.id,
          name: data.name,
          socketId: socket.id
        };
        this.participants.set(socket.id, participant);
        this.broadcastParticipants();
      });

      socket.on('getParticipants', () => {
        socket.emit('participantsList', Array.from(this.participants.values()));
      });

      socket.on('kickParticipant', (data: { participantId: string }) => {
        const participant = this.participants.get(data.participantId);
        if (participant) {
          // Emit kicked out event before disconnecting
          const participantSocket = this.io.sockets.sockets.get(data.participantId);
          if (participantSocket) {
            participantSocket.emit('kickedOut', { message: 'You have been removed from the poll system' });
            // Small delay to ensure event is sent before disconnect
            setTimeout(() => {
              participantSocket.disconnect(true);
            }, 100);
          }
          this.participants.delete(data.participantId);
          this.broadcastParticipants();
        }
      });

      socket.on('disconnect', () => {
        console.log('Client disconnected:', socket.id);
        // Remove participant on disconnect
        this.participants.delete(socket.id);
        this.broadcastParticipants();
      });
    });
  }

  private broadcastParticipants(): void {
    this.io.emit('participantsList', Array.from(this.participants.values()));
  }

  private async sendCurrentState(socket: Socket): Promise<void> {
    try {
      const activePoll = await PollService.getActivePoll();
      if (activePoll) {
        const remainingTime = await PollService.getRemainingTime(activePoll._id.toString());
        const results = await PollService.getPollResults(activePoll._id.toString());

        socket.emit('currentState', {
          poll: activePoll,
          remainingTime: remainingTime || 0,
          results: results?.results || []
        });

        // If poll is still active, start/resume timer
        if (remainingTime && remainingTime > 0) {
          this.startPollTimer(activePoll._id.toString(), remainingTime);
        }
      } else {
        socket.emit('currentState', { poll: null, remainingTime: 0, results: [] });
      }
    } catch (error: any) {
      console.error('Error sending current state:', error);
      socket.emit('currentState', { poll: null, remainingTime: 0, results: [] });
    }
  }

  private async broadcastPollResults(pollId: string): Promise<void> {
    try {
      const results = await PollService.getPollResults(pollId);
      if (results) {
        this.io.emit('pollResults', results);
      }
    } catch (error: any) {
      console.error('Error broadcasting poll results:', error);
    }
  }

  private startPollTimer(pollId: string, initialRemaining: number): void {
    // Clear any existing timer for this poll
    const timerKey = `pollTimer_${pollId}`;
    if ((this as any)[timerKey]) {
      clearInterval((this as any)[timerKey]);
    }

    let remaining = initialRemaining;
    
    const interval = setInterval(async () => {
      // Sync with server time to prevent drift
      const serverRemaining = await PollService.getRemainingTime(pollId);
      if (serverRemaining !== null) {
        remaining = serverRemaining;
      } else {
        remaining--;
      }
      
      if (remaining <= 0) {
        clearInterval(interval);
        delete (this as any)[timerKey];

        // End the poll and broadcast results
        try {
          const poll = await PollService.endActivePoll();
          if (poll) {
            const results = await PollService.getPollResults(poll._id.toString());
            this.io.emit('pollEnded', results);
            this.io.emit('timerUpdate', { remainingTime: 0 });
          }
        } catch (error: any) {
          console.error('Error ending poll on timer:', error);
        }
      } else {
        // Broadcast timer update
        this.io.emit('timerUpdate', { remainingTime: remaining });
      }
    }, 1000);

    (this as any)[timerKey] = interval;
  }
}
