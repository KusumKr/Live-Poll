export interface Poll {
  _id: string;
  question: string;
  options: string[];
  timerDuration: number;
  startTime: string;
  endTime?: string;
  isActive: boolean;
  createdAt: string;
}

export interface PollResult {
  option: string;
  count: number;
  percentage: number;
}

export interface PollResultsResponse {
  poll: Poll;
  results: PollResult[];
  totalVotes: number;
}

export interface CurrentState {
  poll: Poll | null;
  remainingTime: number;
  results: PollResult[];
}

export type UserRole = 'teacher' | 'student';
