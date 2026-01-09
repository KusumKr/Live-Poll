import { useState, useEffect } from 'react';
import { api } from '../../utils/api';
import { Poll, PollResult } from '../../types';
import { useNavigate } from 'react-router-dom';
import { useSocket } from '../../hooks/useSocket';
import { ChatModal } from '../../components/ChatModal';
import './Teacher.css';

interface PollWithResults {
  poll: Poll;
  results: PollResult[];
}

export function TeacherHistory() {
  const [polls, setPolls] = useState<PollWithResults[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { socket } = useSocket();

  useEffect(() => {
    if (socket) {
      socket.emit('registerParticipant', { name: 'Teacher' });
    }
  }, [socket]);

  useEffect(() => {
    loadPollHistory();
  }, []);

  const loadPollHistory = async () => {
    try {
      setLoading(true);
      const data = await api.get<PollWithResults[]>('/polls');
      setPolls(data);
    } catch (error: any) {
      console.error('Error loading poll history:', error);
      // Show error toast if needed
      alert('Failed to load poll history. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="teacher-container">
        <div className="teacher-content">
          <h1>Loading poll history...</h1>
        </div>
      </div>
    );
  }

  return (
    <div className="teacher-container">
      <div className="teacher-content teacher-history-content">
        <div className="history-header">
          <h1 className="teacher-title">
            <span className="title-normal">View</span> <span className="title-bold">Poll History</span>
          </h1>
          <div className="history-actions">
            <button onClick={() => navigate('/teacher/create')} className="teacher-button">
              Create New Poll
            </button>
          </div>
        </div>
        <div className="history-list">
          {polls.length === 0 ? (
            <p className="no-polls">No polls yet. Create your first poll!</p>
          ) : (
            polls.map((item, pollIndex) => {
              // Create results map for quick lookup
              const resultsMap = new Map(item.results.map(r => [r.option, r.percentage]));
              
              // Show all poll options, even if they have 0% votes
              const displayResults = item.poll.options.map((option, index) => ({
                option,
                percentage: resultsMap.get(option) || 0
              }));

              return (
                <div key={item.poll._id} className="history-poll-section">
                  <h2 className="history-question-number">Question {polls.length - pollIndex}</h2>
                  <div className="history-results-container">
                    <div className="poll-question-box-teacher">
                      <h2 className="poll-question-text-teacher">{item.poll.question}</h2>
                    </div>
                    <div className="results-wrapper-teacher">
                      <div className="results-list-teacher">
                        {displayResults.map((result, index) => {
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
                </div>
              );
            })
          )}
        </div>
      </div>
      <ChatModal />
    </div>
  );
}
