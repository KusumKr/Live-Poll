import { Poll, IPoll } from '../models/Poll';
import { Vote } from '../models/Vote';

export interface PollResult {
  poll: IPoll;
  results: {
    option: string;
    count: number;
    percentage: number;
  }[];
  totalVotes: number;
}

export class PollService {
  /**
   * Create a new poll
   */
  static async createPoll(
    question: string,
    options: string[],
    timerDuration: number
  ): Promise<IPoll> {
    try {
      // End any active polls first
      await Poll.updateMany({ isActive: true }, { isActive: false, endTime: new Date() });

      const poll = new Poll({
        question,
        options,
        timerDuration,
        startTime: new Date(),
        isActive: true
      });

      return await poll.save();
    } catch (error: any) {
      console.error('Database error in createPoll:', error);
      throw new Error('Failed to create poll due to database error');
    }
  }

  /**
   * Get the currently active poll
   */
  static async getActivePoll(): Promise<IPoll | null> {
    const poll = await Poll.findOne({ isActive: true });
    
    // Check if poll has expired
    if (poll) {
      const now = new Date();
      const elapsed = (now.getTime() - poll.startTime.getTime()) / 1000;
      if (elapsed >= poll.timerDuration) {
        // Auto-end expired poll
        poll.isActive = false;
        poll.endTime = now;
        await poll.save();
        return null;
      }
    }
    
    return poll;
  }

  /**
   * Get poll by ID
   */
  static async getPollById(pollId: string): Promise<IPoll | null> {
    return await Poll.findById(pollId);
  }

  /**
   * Get all polls (for history)
   */
  static async getAllPolls(): Promise<IPoll[]> {
    return await Poll.find().sort({ createdAt: -1 });
  }

  /**
   * End the active poll
   */
  static async endActivePoll(): Promise<IPoll | null> {
    const poll = await Poll.findOne({ isActive: true });
    if (poll) {
      poll.isActive = false;
      poll.endTime = new Date();
      await poll.save();
    }
    return poll;
  }

  /**
   * Check if a new poll can be created
   */
  static async canCreateNewPoll(): Promise<boolean> {
    const activePoll = await this.getActivePoll();
    if (!activePoll) return true;

    // Check if all students have answered
    const totalVotes = await Vote.countDocuments({ pollId: activePoll._id });
    // Note: We don't track total students, so we'll allow creation if poll has ended
    // or if enough time has passed
    const now = new Date();
    const elapsed = (now.getTime() - activePoll.startTime.getTime()) / 1000;
    
    return elapsed >= activePoll.timerDuration || !activePoll.isActive;
  }

  /**
   * Get poll results with vote counts
   */
  static async getPollResults(pollId: string): Promise<PollResult | null> {
    const poll = await Poll.findById(pollId);
    if (!poll) return null;

    const votes = await Vote.find({ pollId: poll._id });
    const totalVotes = votes.length;

    // Count votes per option
    const optionCounts = new Map<number, number>();
    poll.options.forEach((_, index) => {
      optionCounts.set(index, 0);
    });

    votes.forEach(vote => {
      const current = optionCounts.get(vote.optionIndex) || 0;
      optionCounts.set(vote.optionIndex, current + 1);
    });

    // Build results array
    const results = poll.options.map((option, index) => {
      const count = optionCounts.get(index) || 0;
      const percentage = totalVotes > 0 ? Math.round((count / totalVotes) * 100) : 0;
      return {
        option,
        count,
        percentage
      };
    });

    return {
      poll,
      results,
      totalVotes
    };
  }

  /**
   * Get remaining time for an active poll
   */
  static async getRemainingTime(pollId: string): Promise<number | null> {
    const poll = await Poll.findById(pollId);
    if (!poll || !poll.isActive) return null;

    const now = new Date();
    const elapsed = (now.getTime() - poll.startTime.getTime()) / 1000;
    const remaining = Math.max(0, poll.timerDuration - elapsed);

    // If time expired, end the poll
    if (remaining <= 0) {
      poll.isActive = false;
      poll.endTime = now;
      await poll.save();
      return 0;
    }

    return Math.floor(remaining);
  }
}
