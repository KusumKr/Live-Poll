import { useState, useEffect, useRef } from 'react';
import { useSocket } from '../hooks/useSocket';
import { storage } from '../utils/storage';
import './ChatModal.css';

interface ChatMessage {
  id: string;
  senderName: string;
  senderId: string;
  message: string;
  timestamp: Date;
}

interface Participant {
  id: string;
  name: string;
}

export function ChatModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'chat' | 'participants'>('chat');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const socketHook = useSocket();
  const socket = socketHook.socket;

  useEffect(() => {
    if (!socket) return;

    // Store current user ID
    setCurrentUserId(socket.id || null);

    // Listen for chat messages
    socket.on('chatMessage', (data: ChatMessage) => {
      setMessages(prev => [...prev, data]);
    });

    // Listen for participants list
    const handleParticipantsList = (data: Participant[]) => {
      console.log('Received participants list event:', data);
      console.log('Participants data type:', typeof data, 'Is array:', Array.isArray(data));
      if (Array.isArray(data)) {
        setParticipants(data);
      } else {
        console.error('Participants data is not an array:', data);
        setParticipants([]);
      }
    };
    
    socket.on('participantsList', handleParticipantsList);

    // Request participants list on initial connection
    socket.emit('getParticipants');

    return () => {
      socket.off('chatMessage');
      socket.off('participantsList');
    };
  }, [socket]);

  useEffect(() => {
    if (isOpen && activeTab === 'chat') {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen, activeTab]);

  // Request participants list when modal opens or when switching to participants tab
  useEffect(() => {
    if (isOpen && socket) {
      if (activeTab === 'participants') {
        console.log('Requesting participants list...');
        socket.emit('getParticipants');
        // Also request again after a short delay to ensure we get the latest list
        const timeout = setTimeout(() => {
          socket.emit('getParticipants');
        }, 200);
        return () => clearTimeout(timeout);
      }
    }
  }, [isOpen, activeTab, socket]);


  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !socket) return;

    const senderName = storage.getStudentName() || 'Teacher';
    socket.emit('sendChatMessage', {
      senderName: senderName,
      message: newMessage.trim()
    });

    setNewMessage('');
  };

  const handleKickOut = (participantId: string) => {
    if (!socket) return;
    socket.emit('kickParticipant', { participantId });
  };

  return (
    <>
      <button 
        className="chat-floating-button"
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Toggle chat"
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M20 2H4C2.9 2 2 2.9 2 4V22L6 18H20C21.1 18 22 17.1 22 16V4C22 2.9 21.1 2 20 2ZM20 16H6L4 18V4H20V16Z" fill="white"/>
          <path d="M7 9H17V11H7V9ZM7 12H15V14H7V12Z" fill="white"/>
        </svg>
      </button>

      {isOpen && (
        <div className="chat-modal-overlay" onClick={() => setIsOpen(false)}>
          <div className="chat-modal" onClick={(e) => e.stopPropagation()}>
            <div className="chat-tabs">
              <button
                className={`chat-tab ${activeTab === 'chat' ? 'active' : ''}`}
                onClick={() => setActiveTab('chat')}
              >
                Chat
              </button>
              <button
                className={`chat-tab ${activeTab === 'participants' ? 'active' : ''}`}
                onClick={() => setActiveTab('participants')}
              >
                Participants
              </button>
            </div>

            <div className="chat-content">
              {activeTab === 'chat' ? (
                <>
                  <div className="chat-messages">
                    {messages.length === 0 ? (
                      <div className="chat-empty">No messages yet. Start the conversation!</div>
                    ) : (
                      messages.map((msg) => {
                        const isOwn = msg.senderId === currentUserId;
                        return (
                          <div key={msg.id} className={`chat-message ${isOwn ? 'own' : ''}`}>
                            {!isOwn && <div className="chat-message-sender">{msg.senderName}</div>}
                            <div className={`chat-message-bubble ${isOwn ? 'own' : ''}`}>
                              {msg.message}
                            </div>
                            {isOwn && <div className="chat-message-sender">{msg.senderName}</div>}
                          </div>
                        );
                      })
                    )}
                    <div ref={messagesEndRef} />
                  </div>
                  <form className="chat-input-form" onSubmit={handleSendMessage}>
                    <input
                      type="text"
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      placeholder="Type a message..."
                      className="chat-input"
                    />
                    <button type="submit" className="chat-send-button">
                      Send
                    </button>
                  </form>
                </>
              ) : (
                <div className="participants-list">
                  <div className="participants-header">
                    <div className="participant-col-header">Name</div>
                    <div className="participant-col-header">Action</div>
                  </div>
                  {(() => {
                    console.log('All participants received:', participants);
                    console.log('Participants array length:', participants.length);
                    const studentsOnly = participants.filter(p => p && p.name && p.name !== 'Teacher');
                    console.log('Filtered students:', studentsOnly);
                    console.log('Students count:', studentsOnly.length);
                    
                    if (studentsOnly.length === 0) {
                      return (
                        <div className="participants-empty">
                          {participants.length === 0 
                            ? 'No participants yet. Make sure students have entered their names and are connected.' 
                            : `No students found. (${participants.length} total participant(s))`}
                        </div>
                      );
                    }
                    return studentsOnly.map((participant) => (
                      <div key={participant.id} className="participant-item">
                        <div className="participant-name">{participant.name || 'Unknown'}</div>
                        <button
                          className="kick-out-button"
                          onClick={() => handleKickOut(participant.id)}
                        >
                          Kick out
                        </button>
                      </div>
                    ));
                  })()}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
