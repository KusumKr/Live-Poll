import { Vote, IVote } from '../models/Vote';
import { Poll } from '../models/Poll';

export class VoteService {
  /**
   * Submit a vote for a poll
   * Returns true if vote was successful, false if already voted or poll is invalid
   */
  static async submitVote(
    pollId: string,
    studentId: string,
    optionIndex: number
  ): Promise<{ success: boolean; message?: string }> {
    try {
      // Check if poll exists and is active
      const poll = await Poll.findById(pollId);
      if (!poll) {
        return { success: false, message: 'Poll not found' };
      }

      if (!poll.isActive) {
        return { success: false, message: 'Poll is no longer active' };
      }

      // Check if time has expired
      const now = new Date();
      const elapsed = (now.getTime() - poll.startTime.getTime()) / 1000;
      if (elapsed >= poll.timerDuration) {
        // Auto-end the poll
        poll.isActive = false;
        poll.endTime = now;
        await poll.save();
        return { success: false, message: 'Time limit exceeded' };
      }

      // Check if option index is valid
      if (optionIndex < 0 || optionIndex >= poll.options.length) {
        return { success: false, message: 'Invalid option' };
      }

      // Check if student has already voted (race condition prevention)
      const existingVote = await Vote.findOne({ pollId, studentId });
      if (existingVote) {
        return { success: false, message: 'You have already voted for this poll' };
      }

      // Create vote
      const vote = new Vote({
        pollId,
        studentId,
        optionIndex
      });

      await vote.save();
      return { success: true };
    } catch (error: any) {
      // Handle duplicate key error (race condition)
      if (error.code === 11000) {
        return { success: false, message: 'You have already voted for this poll' };
      }
      throw error;
    }
  }

  /**
   * Check if a student has voted for a poll
   */
  static async hasVoted(pollId: string, studentId: string): Promise<boolean> {
    const vote = await Vote.findOne({ pollId, studentId });
    return !!vote;
  }

  /**
   * Get vote count for a poll
   */
  static async getVoteCount(pollId: string): Promise<number> {
    return await Vote.countDocuments({ pollId });
  }
}
