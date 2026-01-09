import { useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { CurrentState, Poll, PollResult, PollResultsResponse } from '../types';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';

export function useSocket() {
  const socketRef = useRef<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [currentState, setCurrentState] = useState<CurrentState | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [wasKickedOut, setWasKickedOut] = useState(false);

  useEffect(() => {
    // Initialize socket connection
    socketRef.current = io(SOCKET_URL, {
      transports: ['websocket', 'polling']
    });

    const socket = socketRef.current;

    socket.on('connect', () => {
      console.log('Connected to server');
      setIsConnected(true);
      setError(null);
      // Request current state on connection (for state recovery)
      socket.emit('requestState');
    });

    // Handle kicked out event
    socket.on('kickedOut', () => {
      console.log('Kicked out by teacher');
      setWasKickedOut(true);
    });

    socket.on('disconnect', (reason: string) => {
      console.log('Disconnected from server:', reason);
      setIsConnected(false);
      // If disconnected due to server disconnect (kicked out), set flag
      if (reason === 'io server disconnect') {
        setWasKickedOut(true);
      }
    });

    socket.on('connect_error', (err) => {
      console.error('Connection error:', err);
      setError('Failed to connect to server. Please check your connection.');
    });

    socket.on('error', (err) => {
      console.error('Socket error:', err);
      setError('Connection error occurred');
    });

    // Handle current state
    socket.on('currentState', (state: CurrentState) => {
      setCurrentState(state);
    });

    // Handle poll created
    socket.on('pollCreated', (data: { poll: Poll; remainingTime: number }) => {
      setCurrentState({
        poll: data.poll,
        remainingTime: data.remainingTime,
        results: []
      });
    });

    // Handle poll results update
    socket.on('pollResults', (results: PollResultsResponse) => {
      setCurrentState(prev => {
        if (prev) {
          return {
            ...prev,
            results: results.results
          };
        } else {
          // If no current state, create one with results
          return {
            poll: results.poll,
            remainingTime: 0,
            results: results.results
          };
        }
      });
    });

    // Handle poll ended
    socket.on('pollEnded', (results: PollResultsResponse) => {
      setCurrentState({
        poll: results.poll,
        remainingTime: 0,
        results: results.results
      });
    });

    // Handle timer updates
    socket.on('timerUpdate', (data: { remainingTime: number }) => {
      setCurrentState(prev => {
        if (prev) {
          return {
            ...prev,
            remainingTime: data.remainingTime
          };
        }
        return prev;
      });
    });

    // Handle vote success/error
    socket.on('voteSuccess', () => {
      // Results will be updated via pollResults event
    });

    socket.on('voteError', (data: { message: string }) => {
      setError(data.message);
    });

    socket.on('pollError', (data: { message: string }) => {
      setError(data.message);
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  const createPoll = (question: string, options: string[], timerDuration: number) => {
    if (socketRef.current) {
      socketRef.current.emit('createPoll', { question, options, timerDuration });
    }
  };

  const submitVote = (pollId: string, studentId: string, optionIndex: number) => {
    if (socketRef.current) {
      socketRef.current.emit('submitVote', { pollId, studentId, optionIndex });
    }
  };

  const endPoll = () => {
    if (socketRef.current) {
      socketRef.current.emit('endPoll');
    }
  };

  return {
    isConnected,
    currentState,
    error,
    wasKickedOut,
    createPoll,
    submitVote,
    endPoll,
    clearError: () => setError(null),
    socket: socketRef.current
  };
}
