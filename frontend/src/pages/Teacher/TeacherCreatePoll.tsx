import { useState, useEffect } from 'react';
import { useSocket } from '../../hooks/useSocket';
import { useNavigate } from 'react-router-dom';
import { Toast } from '../../components/Toast';
import { BrandBadge } from '../../components/BrandBadge';
import './Teacher.css';

export function TeacherCreatePoll() {
  const [question, setQuestion] = useState('');
  const [options, setOptions] = useState(['', '']);
  const [correctAnswers, setCorrectAnswers] = useState<boolean[]>([true, false]);
  const [timerDuration, setTimerDuration] = useState(60);
  const { createPoll, error, clearError, socket } = useSocket();
  const navigate = useNavigate();

  useEffect(() => {
    if (socket) {
      socket.emit('registerParticipant', { name: 'Teacher' });
    }
  }, [socket]);

  const handleAddOption = () => {
    setOptions([...options, '']);
    setCorrectAnswers([...correctAnswers, false]);
  };

  const handleOptionChange = (index: number, value: string) => {
    const newOptions = [...options];
    newOptions[index] = value;
    setOptions(newOptions);
  };

  const handleRemoveOption = (index: number) => {
    if (options.length > 2) {
      const newOptions = options.filter((_, i) => i !== index);
      const newCorrectAnswers = correctAnswers.filter((_, i) => i !== index);
      setOptions(newOptions);
      setCorrectAnswers(newCorrectAnswers);
    }
  };

  const handleCorrectAnswerChange = (index: number, isYes: boolean) => {
    const newCorrectAnswers = [...correctAnswers];
    newCorrectAnswers[index] = isYes;
    setCorrectAnswers(newCorrectAnswers);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const validOptions = options.filter(opt => opt.trim() !== '');
    if (!question.trim() || validOptions.length < 2) {
      return;
    }

    if (timerDuration < 1 || timerDuration > 60) {
      return;
    }

    try {
      createPoll(question.trim(), validOptions, timerDuration);
      // Navigate after a short delay to allow socket event to process
      setTimeout(() => {
        navigate('/teacher/results');
      }, 100);
    } catch (err) {
      console.error('Error creating poll:', err);
    }
  };

  return (
    <div className="teacher-container">
      {error && <Toast message={error} type="error" onClose={clearError} />}
      <div className="teacher-content">
        <div className="teacher-header">
          <BrandBadge />
          <div className="teacher-header-content">
            <h1 className="teacher-title">Let's Get Started</h1>
            <p className="teacher-subtitle">
              you'll have the ability to create and manage polls, ask questions, and monitor your students' responses in real-time.
            </p>
          </div>
        </div>
        <form onSubmit={handleSubmit} className="teacher-form">
          <div className="form-group question-group">
            <div className="question-header">
              <label htmlFor="question">Enter your question</label>
              <select
                value={timerDuration}
                onChange={(e) => setTimerDuration(parseInt(e.target.value))}
                className="timer-dropdown"
              >
                {[15, 30, 45, 60].map(sec => (
                  <option key={sec} value={sec}>{sec} seconds</option>
                ))}
              </select>
            </div>
            <div className="textarea-wrapper">
              <textarea
                id="question"
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                placeholder="Rahul Bajaj"
                className="form-textarea"
                maxLength={100}
                required
              />
              <div className="character-counter">
                {question.length}/100
              </div>
            </div>
          </div>

          <div className="form-group options-group">
            <div className="options-header">
              <label>Edit Options</label>
              <span className="correct-answer-label">Is it Correct?</span>
            </div>
            <div className="options-list-container">
              {options.map((option, index) => (
                <div key={index} className="option-row-wrapper">
                  <div className="option-input-group-new">
                    <div className="option-number-input">{index + 1}</div>
                    <input
                      type="text"
                      value={option}
                      onChange={(e) => handleOptionChange(index, e.target.value)}
                      placeholder="Rahul Bajaj"
                      className="form-input option-input-new option-input-dark"
                      required
                    />
                    {options.length > 2 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveOption(index)}
                        className="remove-option-button"
                      >
                        ×
                      </button>
                    )}
                  </div>
                  <div className="correct-answer-buttons">
                    <label className="radio-label">
                      <input
                        type="radio"
                        name={`correct-${index}`}
                        value="yes"
                        checked={correctAnswers[index] === true}
                        onChange={() => handleCorrectAnswerChange(index, true)}
                        className="radio-input"
                      />
                      <span className="radio-text">Yes</span>
                    </label>
                    <label className="radio-label">
                      <input
                        type="radio"
                        name={`correct-${index}`}
                        value="no"
                        checked={correctAnswers[index] === false}
                        onChange={() => handleCorrectAnswerChange(index, false)}
                        className="radio-input"
                      />
                      <span className="radio-text">No</span>
                    </label>
                  </div>
                </div>
              ))}
            </div>
            <button
              type="button"
              onClick={handleAddOption}
              className="add-option-button-new"
            >
              + Add More option
            </button>
          </div>

          <div className="form-submit-wrapper">
            <button type="submit" className="teacher-button teacher-button-ask">
              Ask question
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
