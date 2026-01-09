import { BrandBadge } from '../../components/BrandBadge';
import './Student.css';

export function StudentKickedOut() {
  return (
    <div className="student-container">
      <div className="student-content student-kicked-out-content">
        <BrandBadge />
        <div className="kicked-out-box">
          <h1 className="kicked-out-title">You've been Kicked out!</h1>
          <p className="kicked-out-message">
            Looks like the teacher had removed you from the poll system. Please Try again sometime.
          </p>
        </div>
      </div>
    </div>
  );
}
