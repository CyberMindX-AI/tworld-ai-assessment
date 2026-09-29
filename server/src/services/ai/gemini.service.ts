/**
 * gemini.service.ts
 * -----------------
 * Low-level wrapper around the Google Gemini API (@google/genai SDK).
 *
 * Responsibilities:
 *  - Initialise the Gemini client once using the API key from the environment.
 *  - Execute a single LLM call with automatic retry (up to 3 attempts) and
 *    exponential back-off, so transient network blips don't surface as errors.
 *  - Capture token usage metadata returned by the model for cost/observability.
 *  - Write an AILog document to MongoDB after every call (success or failure),
 *    so engineers can inspect what was sent, how long it took, and whether it
 *    succeeded — without touching application logs.
 *  - Skip DB logging gracefully when the database is unavailable (fallback mode).
 *
 * Note: This file should NOT contain any prompt-building or business logic.
 *       All prompt construction lives in /prompts/ and orchestration lives in
 *       llm.service.ts. This keeps concerns cleanly separated.
 */

import mongoose from 'mongoose';
import { GoogleGenAI } from '@google/genai';
import { AILog } from '../../models/AILog';

// Read the model name from the environment so it can be changed without a code
// deploy. Defaults to gemini-2.5-flash-lite (cheap, fast, free-tier friendly).
const MODEL = process.env.GEMINI_MODEL || 'gemini-2.5-flash-lite';

// Initialise the Gemini client at module load time (singleton pattern).
// The API key must be set in the .env file — the ! asserts it is non-null.
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });

/**
 * Options passed to every Gemini call.
 * `operation` is a human-readable tag stored in AILog for traceability.
 */
export interface GeminiCallOptions {
  operation: string;        // e.g. 'generate-post', 'suggest-hashtags'
  prompt: string;           // The user-facing prompt text sent to the model
  systemInstruction?: string; // Optional persona / behavioural constraint
}

/**
 * The normalised response returned to callers.
 * `tokenUsage` is optional because some model responses omit metadata.
 */
export interface GeminiResponse {
  text: string;
  tokenUsage?: { input: number; output: number; total: number };
}

/**
 * callGemini
 * ----------
 * Makes a single Gemini API call with retry logic and operational logging.
 *
 * Flow:
 *  1. Attempt the API call up to 3 times (exponential back-off between retries).
 *  2. Extract the raw text and token usage from the response.
 *  3. In the `finally` block — always — write a log record to MongoDB so every
 *     AI invocation is traceable regardless of whether the call succeeded.
 *
 * @throws Error if all 3 attempts fail (propagates to the controller layer).
 */
export async function callGemini(opts: GeminiCallOptions): Promise<GeminiResponse> {
  // Track wall-clock time so we can record latency in the AILog.
  const start = Date.now();
  let success = false;
  let errorMsg: string | undefined;
  let tokenUsage: { input: number; output: number; total: number } | undefined;
  let text = '';

  try {
    let lastErr: any;
    let response: any;

    // Retry up to 3 times for transient network failures.
    // Back-off: 800 ms after attempt 1, 1600 ms after attempt 2.
    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        response = await ai.models.generateContent({
          model: MODEL,
          contents: opts.prompt,
          // Only include systemInstruction when the caller explicitly provides one
          ...(opts.systemInstruction
            ? { config: { systemInstruction: opts.systemInstruction } }
            : {}),
        });
        break; // Break on first success — no need to continue the loop
      } catch (err: any) {
        lastErr = err;
        // Wait before the next attempt (no wait needed after the final attempt)
        if (attempt < 3) {
          await new Promise(r => setTimeout(r, attempt * 800));
        }
      }
    }

    // If all retries failed, surface the last error to the catch block
    if (!response) throw lastErr;

    text = response.text ?? '';
    success = true;

    // Extract token usage if the model returned it (used for cost monitoring)
    const usage = response.usageMetadata;
    if (usage) {
      tokenUsage = {
        input: usage.promptTokenCount ?? 0,
        output: usage.candidatesTokenCount ?? 0,
        total: usage.totalTokenCount ?? 0,
      };
    }

    return { text, tokenUsage };
  } catch (err: any) {
    errorMsg = err?.message ?? 'Gemini call failed';
    throw new Error(errorMsg);
  } finally {
    // `finally` runs whether the call succeeded or failed.
    // We log every AI operation to MongoDB for observability/debugging.
    const latency = Date.now() - start;
    try {
      // Only write to DB when the connection is live (readyState 1 = connected).
      // This prevents the logging step from crashing the app in fallback mode.
      if (mongoose.connection.readyState === 1) {
        await AILog.create({
          operation: opts.operation,  // Tag for filtering logs by feature
          aiModel: MODEL,             // Records which model version was used
          latency,                    // How long the call took in milliseconds
          success,                    // True if the model returned a response
          error: errorMsg,            // Populated only when the call fails
          tokenUsage,                 // Input/output/total tokens consumed
          estimatedCost: 0,           // Free tier — extend this for paid usage
          prompt: opts.prompt.slice(0, 500), // Truncate to avoid huge log docs
        });
      }
    } catch {
      // Logging failure must NEVER crash the API request.
      // If the DB write fails, we silently swallow it and carry on.
    }
  }
}
