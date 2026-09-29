import { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import { Post } from '../models/Post';

// In-memory fallback when DB is unavailable
const inMemoryPosts: any[] = [];

// POST /api/posts
export const publishPost = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { content, hashtags = [], mediaIds = [], aiGenerated = false } = req.body;
    if (!content?.trim()) return res.status(400).json({ error: 'content is required' });

    if (mongoose.connection.readyState === 1) {
      const post = await Post.create({ content, hashtags, mediaIds, aiGenerated });
      return res.status(201).json(post);
    } else {
      // Fallback: store in memory
      const post = {
        _id: new mongoose.Types.ObjectId().toString(),
        content,
        hashtags,
        mediaIds,
        aiGenerated,
        publishedAt: new Date(),
        createdAt: new Date(),
      };
      inMemoryPosts.push(post);
      return res.status(201).json(post);
    }
  } catch (err) {
    next(err);
  }
};

// GET /api/posts
export const listPosts = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (mongoose.connection.readyState === 1) {
      const posts = await Post.find().sort({ createdAt: -1 }).lean();
      return res.json(posts);
    }
    return res.json(inMemoryPosts.slice().reverse());
  } catch (err) {
    next(err);
  }
};
