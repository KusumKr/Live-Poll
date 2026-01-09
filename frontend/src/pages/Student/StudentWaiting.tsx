import { useEffect } from 'react';
import { useSocket } from '../../hooks/useSocket';
import { useNavigate } from 'react-router-dom';
import { storage } from '../../utils/storage';
import { BrandBadge } from '../../components/BrandBadge';
import './Student.css';

export function StudentWaiting() {
  const { currentState, socket, wasKickedOut } = useSocket();
  const navigate = useNavigate();

  // Navigate to kicked out page if student was kicked out
  useEffect(() => {
    if (wasKickedOut) {
      navigate('/student/kicked-out');
    }
  }, [wasKickedOut, navigate]);

  useEffect(() => {
    // Check if student has a name, if not redirect to name input
    const studentName = storage.getStudentName();
    if (!studentName) {
      navigate('/student');
      return;
    }

    if (socket) {
      socket.emit('registerParticipant', { name: studentName });
    }
  }, [socket, navigate]);

  useEffect(() => {
    // If a poll becomes active, navigate to the poll screen
    if (currentState?.poll && currentState.poll.isActive && currentState.remainingTime > 0) {
      navigate('/student/poll');
    }
  }, [currentState, navigate]);

  return (
    <div className="student-container">
      <div className="student-content">
        <BrandBadge />
        <div className="waiting-spinner-large"></div>
        <h1 className="waiting-title">Wait for the teacher to ask questions..</h1>
      </div>
    </div>
  );
}
