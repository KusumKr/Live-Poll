import { useState, useEffect } from 'react';
import { useSocket } from '../../hooks/useSocket';
import { usePollTimer } from '../../hooks/usePollTimer';
import { storage } from '../../utils/storage';
import { api } from '../../utils/api';
import { useNavigate } from 'react-router-dom';
import { Toast } from '../../components/Toast';
import { ChatModal } from '../../components/ChatModal';
import { BrandBadge } from '../../components/BrandBadge';
import './Student.css';

export function StudentPoll() {
  const { currentState, submitVote, error, clearError, wasKickedOut } = useSocket();
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [hasVoted, setHasVoted] = useState(false);
  const navigate = useNavigate();

  // Navigate to kicked out page if student was kicked out
  useEffect(() => {
    if (wasKickedOut) {
      navigate('/student/kicked-out');
    }
  }, [wasKickedOut, navigate]);

  const studentId = storage.getStudentId();
  const studentName = storage.getStudentName();
  const poll = currentState?.poll;
  const remainingTime = currentState?.remainingTime || 0;
  const isActive = poll?.isActive && remainingTime > 0;

  // Redirect to name input if no student name
  useEffect(() => {
    if (!studentName) {
      navigate('/student');
    }
  }, [studentName, navigate]);

  // Register as participant when on poll page
  useEffect(() => {
    if (socket && studentName) {
      socket.emit('registerParticipant', { name: studentName });
    }
  }, [socket, studentName]);

  const { minutes, seconds } = usePollTimer(remainingTime, isActive || false);

  useEffect(() => {
    // Only navigate to results if poll exists but is not active (ended)
    // AND student hasn't voted yet (if they voted, they're already on results page)
    if (poll && !isActive && !hasVoted) {
      // Poll ended, show results
      navigate('/student/results');
    }
  }, [poll, isActive, hasVoted, navigate]);

  useEffect(() => {
    // Check if student has already voted
    if (poll && studentId) {
      api.get<{ hasVoted: boolean }>(`/votes/status?pollId=${poll._id}&studentId=${studentId}`)
        .then(data => {
          if (data.hasVoted) {
            setHasVoted(true);
            navigate('/student/results');
          }
        })
        .catch(console.error);
    }
  }, [poll, studentId, navigate]);

  const handleSubmit = async () => {
    if (selectedOption === null || !poll || !studentId || hasVoted) return;

    try {
      setHasVoted(true);
      submitVote(poll._id, studentId, selectedOption);
      // Navigate immediately to results - don't wait for timer
      navigate('/student/results');
    } catch (err) {
      console.error('Error submitting vote:', err);
      setHasVoted(false); // Reset on error
    }
  };

  // Show loading/waiting state if poll hasn't loaded yet
  if (!poll) {
    return (
      <div className="student-container">
        <div className="student-content">
          <BrandBadge />
          <div className="waiting-spinner-large"></div>
          <h1 className="waiting-title">Waiting for question...</h1>
        </div>
        <ChatModal />
      </div>
    );
  }

  return (
    <div className="student-container">
      {error && <Toast message={error} type="error" onClose={clearError} />}
      <div className="student-content student-poll-content">
        <div className="poll-header">
          <h2 className="poll-question-number">Question 1</h2>
          <div className="poll-timer-display">
            <span className="timer-icon">🕐</span>
            <span className="timer-text-red">
              {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
            </span>
          </div>
        </div>
        <div className="poll-question-box">
          <h1 className="poll-question-text">{poll.question}</h1>
        </div>
        <div className="poll-options-wrapper">
          <div className="poll-options">
            {poll.options.map((option, index) => (
              <label 
                key={index} 
                className={`poll-option ${selectedOption === index ? 'poll-option-selected' : ''}`}
              >
                <div className="option-number">{index + 1}</div>
                <input
                  type="radio"
                  name="poll-option"
                  value={index}
                  checked={selectedOption === index}
                  onChange={() => setSelectedOption(index)}
                  disabled={hasVoted}
                  className="option-radio"
                />
                <span className="option-text">{option}</span>
              </label>
            ))}
          </div>
        </div>
        <div className="submit-button-wrapper">
          <button
            onClick={handleSubmit}
            disabled={selectedOption === null || hasVoted}
            className="submit-button"
          >
            Submit
          </button>
        </div>
      </div>
      <ChatModal />
    </div>
  );
}
