import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { RoleSelection } from './pages/RoleSelection';
import { StudentNameInput } from './pages/Student/StudentNameInput';
import { StudentWaiting } from './pages/Student/StudentWaiting';
import { StudentPoll } from './pages/Student/StudentPoll';
import { StudentResults } from './pages/Student/StudentResults';
import { StudentKickedOut } from './pages/Student/StudentKickedOut';
import { TeacherCreatePoll } from './pages/Teacher/TeacherCreatePoll';
import { TeacherResults } from './pages/Teacher/TeacherResults';
import { TeacherHistory } from './pages/Teacher/TeacherHistory';
import { ConnectionStatus } from './components/ConnectionStatus';
import './App.css';

function App() {
  return (
    <BrowserRouter>
      <ConnectionStatus />
      <Routes>
        <Route path="/" element={<RoleSelection />} />
        <Route path="/student" element={<StudentNameInput />} />
        <Route path="/student/waiting" element={<StudentWaiting />} />
        <Route path="/student/poll" element={<StudentPoll />} />
        <Route path="/student/results" element={<StudentResults />} />
        <Route path="/student/kicked-out" element={<StudentKickedOut />} />
        <Route path="/teacher" element={<Navigate to="/teacher/create" replace />} />
        <Route path="/teacher/create" element={<TeacherCreatePoll />} />
        <Route path="/teacher/results" element={<TeacherResults />} />
        <Route path="/teacher/history" element={<TeacherHistory />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
