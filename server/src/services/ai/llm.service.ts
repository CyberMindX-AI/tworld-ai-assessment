/**
 * llm.service.ts
 * --------------
 * AI Orchestration Layer — the brain of the post creation feature.
 *
 * This file sits between the HTTP controllers and the raw Gemini API call.
 * It is responsible for:
 *  1. Building prompts (delegated to /prompts/post-generation.ts)
 *  2. Calling Gemini via the low-level gemini.service wrapper
 *  3. Parsing and VALIDATING the structured JSON returned by the model
 *  4. Returning typed, safe objects to the controller layer
 *
 * All output shapes are validated with Zod schemas. If Gemini returns
 * malformed JSON (e.g. wraps it in markdown fences), a local JSON cleaner
 * strips the noise before parsing. If validation still fails, the error is
 * thrown and the controller returns a 500 so the frontend can handle it.
 *
 * Why Zod? Because LLMs are non-deterministic. Even with a strict prompt,
 * the model may occasionally return unexpected shapes. Zod catches this at
 * the boundary before bad data reaches the frontend.
 */

import { z } from 'zod';
import { callGemini } from './gemini.service';
import {
  buildGeneratePostPrompt,
  buildImprovePostPrompt,
  buildHashtagPrompt,
  buildMediaRecommendationPrompt,
} from '../../prompts/post-generation';
import type {
  GeneratePostOutput,
  ImprovePostOutput,
  HashtagOutput,
  RecommendMediaOutput,
  PostMode,
  ImproveInstruction,
} from '../../types';

// ─── Zod Schemas ──────────────────────────────────────────────────────────────
// Each schema mirrors the JSON structure the model is instructed to return.
// If the model diverges, safeParse() catches it here instead of crashing later.

/** Schema for /generate-post — expects three content variants in one call */
const GeneratePostSchema = z.object({
  short: z.string().min(1),                        // One-liner social post
  long: z.string().min(1),                         // Full paragraph version
  bullets: z.array(z.string().min(1)).min(1),      // Bulleted list version
});

/** Schema for /improve-post — expects a single improved string */
const ImprovePostSchema = z.object({
  content: z.string().min(1),
});

/** Schema for /suggest-hashtags — expects an array of hashtag strings */
const HashtagSchema = z.object({
  hashtags: z.array(z.string().min(1)).min(1),
});

/**
 * Schema for /recommend-media — expects ranked file recommendations.
 * relevanceScore is 0–1 so the frontend can optionally show a match %.
 * reason is a plain-English explanation of WHY each file was recommended.
 */
const RecommendMediaSchema = z.object({
  recommendations: z.array(
    z.object({
      fileId: z.string(),
      filename: z.string(),
      relevanceScore: z.number().min(0).max(1),
      reason: z.string(),
    })
  ),
});

// ─── JSON Cleaner ─────────────────────────────────────────────────────────────

/**
 * parseJSON
 * ---------
 * Gemini sometimes wraps its JSON output in markdown code fences:
 *   ```json
 *   { ... }
 *   ```
 * This utility strips those fences before calling JSON.parse so the Zod
 * validation step always receives a clean object.
 */
function parseJSON(raw: string): unknown {
  const cleaned = raw
    .replace(/^```(?:json)?\s*/i, '')  // Strip opening ``` or ```json
    .replace(/\s*```$/, '')            // Strip closing ```
    .trim();
  return JSON.parse(cleaned);
}

// ─── Exported AI Operations ───────────────────────────────────────────────────

/**
 * generatePost
 * ------------
 * Accepts a user topic and generates three content variants in a single
 * prompt call (short, long, bullets). This reduces API round-trips compared
 * to making three separate calls.
 *
 * @param topic   Free-text topic or partial post the user typed
 * @param _mode   Format hint (currently used by the frontend tab UI; the
 *                backend always generates all three and lets the frontend
 *                choose which to display)
 */
export async function generatePost(topic: string, _mode: PostMode): Promise<GeneratePostOutput> {
  const prompt = buildGeneratePostPrompt(topic);
  const { text } = await callGemini({ operation: 'generate-post', prompt });

  // Parse and validate — throws if the model returned bad JSON
  const parsed = parseJSON(text);
  const result = GeneratePostSchema.safeParse(parsed);
  if (!result.success) {
    throw new Error(`Gemini returned invalid structure: ${result.error.message}`);
  }
  return result.data;
}

/**
 * improvePost
 * -----------
 * Takes existing post content and an instruction (e.g. 'shorten', 'formal')
 * and asks the model to rephrase it accordingly.
 *
 * @param content      The draft post text to be improved
 * @param instruction  A named transformation (see ImproveInstruction type)
 */
export async function improvePost(content: string, instruction: ImproveInstruction): Promise<ImprovePostOutput> {
  const prompt = buildImprovePostPrompt(content, instruction);
  // Append the instruction to the operation name so AILogs are filterable
  const { text } = await callGemini({ operation: `improve-post:${instruction}`, prompt });

  const parsed = parseJSON(text);
  const result = ImprovePostSchema.safeParse(parsed);
  if (!result.success) {
    throw new Error(`Gemini returned invalid structure: ${result.error.message}`);
  }
  return result.data;
}

/**
 * suggestHashtags
 * ---------------
 * Extracts relevant hashtags from completed post content.
 * Runs as a secondary call after generatePost so it doesn't block the
 * initial generation UX — hashtags appear in the sidebar once ready.
 *
 * @param content  The final or draft post text to derive hashtags from
 */
export async function suggestHashtags(content: string): Promise<HashtagOutput> {
  const prompt = buildHashtagPrompt(content);
  const { text } = await callGemini({ operation: 'suggest-hashtags', prompt });

  const parsed = parseJSON(text);
  const result = HashtagSchema.safeParse(parsed);
  if (!result.success) {
    throw new Error(`Gemini returned invalid structure: ${result.error.message}`);
  }
  return result.data;
}

/**
 * recommendMedia
 * --------------
 * Uses the post context (what the user is writing about) plus a list of
 * pre-approved file metadata records to ask Gemini which files are most
 * relevant to attach to the post.
 *
 * IMPORTANT: Only APPROVED files are ever passed into this function.
 * Filtering by approval status is enforced in the controller BEFORE this
 * call, so rejected/pending files can never appear in recommendations.
 *
 * If no files are available, we short-circuit and return an empty array
 * to avoid wasting an API call.
 *
 * @param postContext  The draft post text (provides semantic matching context)
 * @param files        Array of approved file metadata from the database
 */
export async function recommendMedia(
  postContext: string,
  files: Array<{ id: string; filename: string; description: string; tags: string[]; type: string }>
): Promise<RecommendMediaOutput> {
  // Guard: no files to recommend — return empty immediately
  if (files.length === 0) return { recommendations: [] };

  const prompt = buildMediaRecommendationPrompt(postContext, files);
  const { text } = await callGemini({ operation: 'recommend-media', prompt });

  const parsed = parseJSON(text);
  const result = RecommendMediaSchema.safeParse(parsed);

  // For media recommendations, a parse failure is non-fatal — we return
  // empty rather than throwing, so the picker still opens without crashing.
  if (!result.success) {
    return { recommendations: [] };
  }
  return result.data;
}
