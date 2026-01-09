import { useEffect } from 'react';
import { useSocket } from '../../hooks/useSocket';
import { useNavigate } from 'react-router-dom';
import { ChatModal } from '../../components/ChatModal';
import './Student.css';

export function StudentResults() {
  const { currentState, wasKickedOut, socket } = useSocket();
  const navigate = useNavigate();

  // Navigate to kicked out page if student was kicked out
  useEffect(() => {
    if (wasKickedOut) {
      navigate('/student/kicked-out');
    }
  }, [wasKickedOut, navigate]);

  // Register as participant when on results page
  useEffect(() => {
    if (socket) {
      const studentName = storage.getStudentName();
      if (studentName) {
        socket.emit('registerParticipant', { name: studentName });
      }
    }
  }, [socket]);

  useEffect(() => {
    // If a new poll becomes active and student hasn't voted yet, navigate to poll screen
    // Check if student has voted by checking if results exist
    const hasResults = currentState?.results && currentState.results.length > 0;
    if (currentState?.poll && currentState.poll.isActive && currentState.remainingTime > 0 && !hasResults) {
      navigate('/student/poll');
    }
  }, [currentState, navigate]);

  const results = currentState?.results || [];
  const poll = currentState?.poll;
  const remainingTime = currentState?.remainingTime || 0;

  if (!poll) {
    return (
      <div className="student-container">
        <div className="student-content">
          <h1>Waiting for new poll...</h1>
        </div>
        <ChatModal />
      </div>
    );
  }

  // Create results map for quick lookup
  const resultsMap = new Map(results.map(r => [r.option, r.percentage]));
  
  // Show all poll options, even if they have 0% votes
  const displayResults = poll?.options.map((option) => ({
    option,
    percentage: resultsMap.get(option) || 0
  })) || [];

  return (
    <div className="student-container">
      <div className="student-content student-results-content">
        <div className="student-results-header">
          <h2 className="student-question-number">Question 1</h2>
          <div className="student-timer-display">
            <span className="student-timer-icon">🕐</span>
            <span className="student-timer-text">
              {String(Math.floor((remainingTime || 0) / 60)).padStart(2, '0')}:{String((remainingTime || 0) % 60).padStart(2, '0')}
            </span>
          </div>
        </div>
        <div className="student-results-container">
          <div className="student-poll-question-box">
            <h2 className="student-poll-question-text">{poll.question}</h2>
          </div>
          <div className="student-results-wrapper">
            <div className="student-results-list">
              {displayResults.map((result, index) => {
                const barWidthPercent = result.percentage;
                const hasBar = barWidthPercent > 0;
                return (
                  <div key={index} className={`student-result-item ${index === 0 ? 'highest-result' : ''}`}>
                    {hasBar && (
                      <div 
                        className="student-result-bar-background"
                        style={{ width: `${barWidthPercent}%` }}
                      ></div>
                    )}
                    <div className={`student-result-number ${hasBar ? 'with-bar' : ''}`}>{index + 1}</div>
                    <div className="student-result-content">
                      <span className={`student-result-option ${hasBar ? 'with-bar' : ''}`}>{result.option}</span>
                    </div>
                    <span className="student-result-percentage">{result.percentage}%</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
        <p className="waiting-text">Wait for the teacher to ask a new question..</p>
      </div>
      <ChatModal />
    </div>
  );
}
