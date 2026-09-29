/**
 * ai.routes.ts
 * ------------
 * Express router for all AI-powered endpoints.
 *
 * These routes form the public API surface for the AI Writing Assistant and
 * Smart Media Recommendation features. All heavy logic is delegated to the
 * controller layer (ai.controller.ts) which in turn calls the LLM service.
 *
 * Endpoint summary:
 *
 *  POST /api/ai/generate-post
 *    Accepts: { prompt: string, mode: 'short' | 'long' | 'bullets' }
 *    Returns: { short: string, long: string, bullets: string[] }
 *    Purpose: Generates AI-drafted post content from a user topic.
 *
 *  POST /api/ai/improve-post
 *    Accepts: { content: string, instruction: 'shorten' | 'formal' | ... }
 *    Returns: { content: string }
 *    Purpose: Rephrases or restructures an existing draft post.
 *
 *  POST /api/ai/recommend-media
 *    Accepts: { postContext: string }
 *    Returns: MediaFile[] (approved files ranked by relevance)
 *    Purpose: Suggests files from the Files & Docs module to attach.
 *
 *  POST /api/ai/suggest-hashtags
 *    Accepts: { content: string }
 *    Returns: { hashtags: string[] }
 *    Purpose: Extracts relevant hashtags from completed post text.
 */

import { Router } from 'express';
import { generatePost, recommendMedia, suggestHashtags, improvePost } from '../controllers/ai.controller';

const router = Router();

// Wire each route to its controller handler.
// Controllers handle request/response parsing; business logic lives in services.
router.post('/generate-post', generatePost);
router.post('/improve-post', improvePost);
router.post('/recommend-media', recommendMedia);
router.post('/suggest-hashtags', suggestHashtags);

export default router;
