import mongoose, { Document, Schema } from 'mongoose';

export interface IPost extends Document {
  content: string;
  hashtags: string[];
  mediaIds: string[];
  aiGenerated: boolean;
  publishedAt: Date;
  createdAt: Date;
}

const PostSchema = new Schema<IPost>(
  {
    content: { type: String, required: true },
    hashtags: [{ type: String }],
    mediaIds: [{ type: String }],
    aiGenerated: { type: Boolean, default: false },
    publishedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

export const Post = mongoose.model<IPost>('Post', PostSchema);
