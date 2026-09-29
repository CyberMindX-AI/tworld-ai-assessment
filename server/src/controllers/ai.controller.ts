import { Request, Response, NextFunction } from 'express';
import * as llm from '../services/ai/llm.service';
import { getFiles } from '../services/files/file.service';

// POST /api/ai/generate-post
export const generatePost = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { prompt, mode = 'short' } = req.body;
    if (!prompt?.trim()) return res.status(400).json({ error: 'prompt is required' });

    const result = await llm.generatePost(prompt.trim(), mode);
    res.json(result);
  } catch (err) {
    next(err);
  }
};

// POST /api/ai/improve-post
export const improvePost = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { content, instruction = 'improve' } = req.body;
    if (!content?.trim()) return res.status(400).json({ error: 'content is required' });

    const result = await llm.improvePost(content.trim(), instruction);
    res.json(result);
  } catch (err) {
    next(err);
  }
};

// POST /api/ai/suggest-hashtags
export const suggestHashtags = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { content } = req.body;
    if (!content?.trim()) return res.status(400).json({ error: 'content is required' });

    const result = await llm.suggestHashtags(content.trim());
    res.json(result);
  } catch (err) {
    next(err);
  }
};

// POST /api/ai/recommend-media
export const recommendMedia = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { postContext } = req.body;
    if (!postContext?.trim()) return res.json({ recommendations: [] });

    // Fetch only approved files
    const files = await getFiles({ status: 'approved' });
    const mapped = files.map((f: any) => ({
      id: f._id.toString(),
      filename: f.filename,
      description: f.description || '',
      tags: f.tags || [],
      type: f.type,
    }));

    const result = await llm.recommendMedia(postContext.trim(), mapped);
    res.json(result);
  } catch (err) {
    next(err);
  }
};
