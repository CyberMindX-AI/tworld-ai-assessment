import mongoose, { Document, Schema } from 'mongoose';
import type { FileStatus, FileType } from '../types';

export interface IFile extends Document {
  filename: string;
  originalName: string;
  mimeType: string;
  size: number;
  type: FileType;
  status: FileStatus;
  tags: string[];
  description: string;
  storageKey: string;
  localPath?: string;
  createdAt: Date;
  updatedAt: Date;
}

const FileSchema = new Schema<IFile>(
  {
    filename: { type: String, required: true },
    originalName: { type: String, required: true },
    mimeType: { type: String, required: true },
    size: { type: Number, required: true },
    type: { type: String, enum: ['image', 'video', 'document', 'other'], required: true },
    status: {
      type: String,
      enum: ['initiated', 'scanning', 'approved', 'rejected'],
      default: 'initiated',
      required: true,
    },
    tags: [{ type: String }],
    description: { type: String, default: '' },
    storageKey: { type: String, required: true },
    localPath: { type: String },
  },
  { timestamps: true }
);

export const File = mongoose.model<IFile>('File', FileSchema);
