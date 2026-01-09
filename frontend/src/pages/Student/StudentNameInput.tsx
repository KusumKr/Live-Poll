import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { storage } from '../../utils/storage';
import { BrandBadge } from '../../components/BrandBadge';
import './Student.css';

export function StudentNameInput() {
  const [name, setName] = useState('');
  const navigate = useNavigate();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedName = name.trim();
    if (trimmedName) {
      try {
        const studentId = storage.generateStudentId();
        storage.setStudentId(studentId);
        storage.setStudentName(trimmedName);
        navigate('/student/waiting');
      } catch (error) {
        console.error('Error saving student data:', error);
        alert('Failed to save your name. Please try again.');
      }
    }
  };

  return (
    <div className="student-container">
      <div className="student-content">
        <BrandBadge />
        <h1 className="student-title">Let's Get Started</h1>
        <p className="student-description">
          If you're a student, you'll be able to <strong>submit your answers</strong>, participate in live polls, and see how your responses compare with your classmates.
        </p>
        <form onSubmit={handleSubmit} className="student-form">
          <label htmlFor="student-name" className="student-label">Enter your Name</label>
          <input
            id="student-name"
            type="text"
            placeholder="Rahul Bajaj"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="student-input"
            autoFocus
            required
          />
          <button 
            type="submit" 
            className="student-button"
            disabled={!name.trim()}
          >
            Continue
          </button>
        </form>
      </div>
    </div>
  );
}
