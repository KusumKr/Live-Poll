import { useEffect } from 'react';
import { useSocket } from '../../hooks/useSocket';
import { useNavigate } from 'react-router-dom';
import { usePollTimer } from '../../hooks/usePollTimer';
import { ChatModal } from '../../components/ChatModal';
import './Teacher.css';

export function TeacherResults() {
  const { currentState, endPoll, socket } = useSocket();

  useEffect(() => {
    if (socket) {
      socket.emit('registerParticipant', { name: 'Teacher' });
    }
  }, [socket]);
  const navigate = useNavigate();

  const poll = currentState?.poll;
  const remainingTime = currentState?.remainingTime || 0;
  const results = currentState?.results || [];
  const isActive = poll?.isActive && remainingTime > 0;

  const { minutes, seconds } = usePollTimer(remainingTime, isActive || false);

  const handleEndPoll = () => {
    endPoll();
  };

  const handleCreateNew = () => {
    navigate('/teacher/create');
  };

  if (!poll) {
    return (
      <div className="teacher-container">
        <div className="teacher-content">
          <h1>No active poll</h1>
          <button onClick={handleCreateNew} className="teacher-button">
            Create New Poll
          </button>
        </div>
        <ChatModal />
      </div>
    );
  }

  return (
    <div className="teacher-container">
      <button onClick={() => navigate('/teacher/history')} className="view-history-button">
        <span className="history-icon">👁️</span> View Poll history
      </button>
      <div className="teacher-content teacher-results-content">
        <div className="results-header-top">
          <h1 className="teacher-title-results">Question</h1>
        </div>
        <div className="results-container-teacher">
          <div className="poll-question-box-teacher">
            <h2 className="poll-question-text-teacher">{poll.question}</h2>
          </div>
          <div className="results-wrapper-teacher">
            <div className="results-list-teacher">
              {results.map((result, index) => {
                // Calculate bar width as percentage of container (678px)
                // The bar should represent the percentage visually
                const barWidthPercent = result.percentage;
                const hasBar = barWidthPercent > 0;
                return (
                  <div key={index} className={`result-item-teacher ${index === 0 ? 'highest-result' : ''}`}>
                    {hasBar && (
                      <div 
                        className="result-bar-background"
                        style={{ width: `${barWidthPercent}%` }}
                      ></div>
                    )}
                    <div className={`result-number ${hasBar ? 'with-bar' : ''}`}>{index + 1}</div>
                    <div className="result-content">
                      <span className={`result-option-teacher ${hasBar ? 'with-bar' : ''}`}>{result.option}</span>
                    </div>
                    <span className="result-percentage-teacher">{result.percentage}%</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
        {!isActive && (
          <div className="ask-new-question-wrapper">
            <button onClick={handleCreateNew} className="teacher-button-ask-new">
              <span className="plus-icon">+</span> Ask a new question
            </button>
          </div>
        )}
      </div>
      <ChatModal />
    </div>
  );
}
