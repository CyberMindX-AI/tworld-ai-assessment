import mongoose, { Document, Schema } from 'mongoose';

export interface IAILog extends Document {
  operation: string;
  aiModel: string;
  timestamp: Date;
  latency: number;
  success: boolean;
  error?: string;
  tokenUsage?: { input: number; output: number; total: number };
  estimatedCost: number;
  prompt?: string;
}

const AILogSchema = new Schema<IAILog>({
  operation: { type: String, required: true },
  aiModel: { type: String, required: true },
  timestamp: { type: Date, default: Date.now },
  latency: { type: Number, required: true },
  success: { type: Boolean, required: true },
  error: { type: String },
  tokenUsage: {
    input: Number,
    output: Number,
    total: Number,
  },
  estimatedCost: { type: Number, default: 0 },
  prompt: { type: String },
});

export const AILog = mongoose.model<IAILog>('AILog', AILogSchema);
