import mongoose, { Schema, Document } from 'mongoose';

export interface IPoll extends Document {
  question: string;
  options: string[];
  timerDuration: number;
  startTime: Date;
  endTime?: Date;
  isActive: boolean;
  createdAt: Date;
}

const PollSchema = new Schema<IPoll>({
  question: { type: String, required: true },
  options: [{ type: String, required: true }],
  timerDuration: { type: Number, required: true, min: 1, max: 60 },
  startTime: { type: Date, required: true },
  endTime: { type: Date },
  isActive: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now }
});

export const Poll = mongoose.model<IPoll>('Poll', PollSchema);
