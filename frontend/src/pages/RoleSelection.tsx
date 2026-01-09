import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BrandBadge } from '../components/BrandBadge';
import './RoleSelection.css';

export function RoleSelection() {
  const navigate = useNavigate();
  const [selectedRole, setSelectedRole] = useState<'student' | 'teacher' | null>(null);

  const handleContinue = () => {
    if (selectedRole === 'student') {
      navigate('/student');
    } else if (selectedRole === 'teacher') {
      navigate('/teacher/create');
    }
  };

  return (
    <div className="role-selection">
      <div className="role-selection-container">
        <BrandBadge />
        <h1 className="role-selection-title">Welcome to the Live Polling System</h1>
        <p className="role-selection-subtitle">
          Please select the role that best describes you to begin using the live polling system
        </p>
        <div className="role-cards">
          <div 
            className={`role-card ${selectedRole === 'student' ? 'role-card-selected' : ''}`}
            onClick={() => setSelectedRole('student')}
          >
            <h2 className="role-card-title">I'm a Student</h2>
            <p className="role-card-description">
              Submit answers and view live poll results in real-time.
            </p>
          </div>
          <div 
            className={`role-card ${selectedRole === 'teacher' ? 'role-card-selected' : ''}`}
            onClick={() => setSelectedRole('teacher')}
          >
            <h2 className="role-card-title">I'm a Teacher</h2>
            <p className="role-card-description">
              Create and manage polls, ask questions, and monitor your students' responses in real-time.
            </p>
          </div>
        </div>
        <button 
          className="continue-button"
          onClick={handleContinue}
          disabled={!selectedRole}
        >
          Continue
        </button>
      </div>
    </div>
  );
}
