import { Request, Response } from 'express';
import { PollService } from '../services/PollService';
import { VoteService } from '../services/VoteService';

export class PollController {
  /**
   * Create a new poll
   */
  static async createPoll(req: Request, res: Response): Promise<void> {
    try {
      const { question, options, timerDuration } = req.body;

      // Validation
      if (!question || !options || !Array.isArray(options) || options.length < 2) {
        res.status(400).json({ error: 'Question and at least 2 options are required' });
        return;
      }

      if (!timerDuration || timerDuration < 1 || timerDuration > 60) {
        res.status(400).json({ error: 'Timer duration must be between 1 and 60 seconds' });
        return;
      }

      // Check if new poll can be created
      const canCreate = await PollService.canCreateNewPoll();
      if (!canCreate) {
        res.status(400).json({ error: 'Cannot create new poll. Previous poll is still active and not all students have answered.' });
        return;
      }

      const poll = await PollService.createPoll(question, options, timerDuration);
      res.status(201).json(poll);
    } catch (error: any) {
      console.error('Error creating poll:', error);
      res.status(500).json({ error: 'Failed to create poll' });
    }
  }

  /**
   * Get active poll
   */
  static async getActivePoll(req: Request, res: Response): Promise<void> {
    try {
      const poll = await PollService.getActivePoll();
      if (!poll) {
        res.status(404).json({ error: 'No active poll' });
        return;
      }

      const remainingTime = await PollService.getRemainingTime(poll._id.toString());
      res.json({
        poll,
        remainingTime: remainingTime || 0
      });
    } catch (error: any) {
      console.error('Error getting active poll:', error);
      res.status(500).json({ error: 'Failed to get active poll' });
    }
  }

  /**
   * Get poll results
   */
  static async getPollResults(req: Request, res: Response): Promise<void> {
    try {
      const { pollId } = req.params;
      const results = await PollService.getPollResults(pollId);

      if (!results) {
        res.status(404).json({ error: 'Poll not found' });
        return;
      }

      res.json(results);
    } catch (error: any) {
      console.error('Error getting poll results:', error);
      res.status(500).json({ error: 'Failed to get poll results' });
    }
  }

  /**
   * Get all polls (history)
   */
  static async getAllPolls(req: Request, res: Response): Promise<void> {
    try {
      const polls = await PollService.getAllPolls();
      
      // Get results for each poll
      const pollsWithResults = await Promise.all(
        polls.map(async (poll) => {
          const results = await PollService.getPollResults(poll._id.toString());
          return {
            poll,
            results: results?.results || []
          };
        })
      );

      res.json(pollsWithResults);
    } catch (error: any) {
      console.error('Error getting all polls:', error);
      res.status(500).json({ error: 'Failed to get polls' });
    }
  }

  /**
   * End active poll
   */
  static async endPoll(req: Request, res: Response): Promise<void> {
    try {
      const poll = await PollService.endActivePoll();
      if (!poll) {
        res.status(404).json({ error: 'No active poll to end' });
        return;
      }

      res.json(poll);
    } catch (error: any) {
      console.error('Error ending poll:', error);
      res.status(500).json({ error: 'Failed to end poll' });
    }
  }

  /**
   * Submit a vote
   */
  static async submitVote(req: Request, res: Response): Promise<void> {
    try {
      const { pollId, studentId, optionIndex } = req.body;

      if (!pollId || studentId === undefined || optionIndex === undefined) {
        res.status(400).json({ error: 'pollId, studentId, and optionIndex are required' });
        return;
      }

      const result = await VoteService.submitVote(pollId, studentId, optionIndex);
      
      if (!result.success) {
        res.status(400).json({ error: result.message || 'Failed to submit vote' });
        return;
      }

      res.json({ success: true });
    } catch (error: any) {
      console.error('Error submitting vote:', error);
      res.status(500).json({ error: 'Failed to submit vote' });
    }
  }

  /**
   * Check if student has voted
   */
  static async checkVoteStatus(req: Request, res: Response): Promise<void> {
    try {
      const { pollId, studentId } = req.query;

      if (!pollId || !studentId) {
        res.status(400).json({ error: 'pollId and studentId are required' });
        return;
      }

      const hasVoted = await VoteService.hasVoted(pollId as string, studentId as string);
      res.json({ hasVoted });
    } catch (error: any) {
      console.error('Error checking vote status:', error);
      res.status(500).json({ error: 'Failed to check vote status' });
    }
  }
}
