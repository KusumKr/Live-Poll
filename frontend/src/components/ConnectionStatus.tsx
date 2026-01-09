import { useSocket } from '../hooks/useSocket';
import './ConnectionStatus.css';

export function ConnectionStatus() {
  const { isConnected } = useSocket();

  if (isConnected) return null;

  return (
    <div className="connection-status connection-status-disconnected">
      <span>⚠️ Connection lost. Attempting to reconnect...</span>
    </div>
  );
}
