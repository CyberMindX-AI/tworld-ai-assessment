/**
 * file.service.ts
 * ---------------
 * Handles all file persistence and retrieval logic for the Files & Docs module.
 *
 * Responsibilities:
 *  - Accepting uploaded file buffers from the controller and writing them to
 *    the local `uploads/` directory (acting as a stand-in for AWS S3).
 *  - Persisting file metadata (name, type, size, storageKey, status) to MongoDB.
 *  - Simulating an asynchronous moderation pipeline:
 *      Upload → status: 'initiated' → 'scanning' (1s) → 'approved' (4s)
 *    In production this would invoke an AWS Step Function or SQS-triggered
 *    Lambda that runs content moderation checks before approval.
 *  - Providing a graceful in-memory fallback when MongoDB is unavailable,
 *    so the API still functions during network outages or dev environments
 *    without a live DB connection.
 *
 * AWS/S3 Note:
 *  In a production deployment, `fs.writeFileSync` would be replaced with an
 *  `s3.putObject` call using the AWS SDK. The `storageKey` stored in MongoDB
 *  would become the S3 object key (e.g. `uploads/2026/09/filename.jpg`).
 *  The frontend would receive a pre-signed S3 URL rather than a local path.
 */

import path from 'path';
import fs from 'fs';
import mongoose from 'mongoose';
import { File } from '../../models/File';
import type { FileStatus, FileType } from '../../types';

// Ensure the local uploads directory exists at server startup.
// In production this directory would not be needed — S3 handles storage.
const UPLOAD_DIR = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });

/**
 * In-memory file store — used as a fallback when MongoDB is unreachable.
 * This allows the full upload/retrieve flow to work in offline/dev mode.
 * Note: data is lost on server restart when in fallback mode.
 */
const inMemoryFiles: any[] = [];

/**
 * detectType
 * ----------
 * Maps a MIME type string to one of our application's four file categories.
 * This determines how the file is displayed in the UI and which AI
 * recommendation prompts it can appear in.
 */
function detectType(mimeType: string): FileType {
  if (mimeType.startsWith('image/')) return 'image';
  if (mimeType.startsWith('video/')) return 'video';
  if (
    mimeType === 'application/pdf' ||
    mimeType.startsWith('text/') ||
    mimeType.includes('document') ||
    mimeType.includes('sheet') ||
    mimeType.includes('presentation')
  ) return 'document';
  return 'other';
}

/**
 * saveFile
 * --------
 * Persists an uploaded file to local disk (S3 in production) and creates a
 * metadata record in MongoDB. Triggers a simulated moderation pipeline that
 * moves the file status from 'initiated' → 'scanning' → 'approved'.
 *
 * Falls back to in-memory storage if MongoDB is not connected, so uploads
 * still work in fallback mode.
 *
 * @param opts.buffer        Raw file bytes from multer
 * @param opts.originalName  Original filename from the client
 * @param opts.mimeType      MIME type detected by multer
 * @param opts.size          File size in bytes
 */
export async function saveFile(opts: {
  buffer: Buffer;
  originalName: string;
  mimeType: string;
  size: number;
}) {
  // Generate a unique storage key to prevent filename collisions in storage.
  // In production this becomes the S3 object key.
  const ext = path.extname(opts.originalName);
  const storageKey = `${Date.now()}-${Math.random().toString(36).slice(2)}${ext}`;
  const localPath = path.join(UPLOAD_DIR, storageKey);

  // Write to local disk (replace with s3.putObject in production)
  fs.writeFileSync(localPath, opts.buffer);

  const type = detectType(opts.mimeType);

  // Generate a temporary ID so we can reference it in the setTimeout callbacks
  let fileId = new mongoose.Types.ObjectId().toString();
  
  if (mongoose.connection.readyState === 1) {
    // ── Database is live ────────────────────────────────────────────────────
    const file = await File.create({
      filename: opts.originalName,
      originalName: opts.originalName,
      mimeType: opts.mimeType,
      size: opts.size,
      type,
      status: 'initiated',    // File enters the moderation pipeline immediately
      tags: [],               // Tags can be added later via metadata editing
      description: '',
      storageKey,             // The disk key (or S3 key in production)
      localPath,              // Only relevant for local dev — omit in production
    });
    fileId = file._id.toString();

    // Simulate async moderation pipeline with setTimeout.
    // In production: replace with SQS message → Lambda → status update via webhook.
    setTimeout(async () => await File.findByIdAndUpdate(fileId, { status: 'scanning' }), 1000);
    setTimeout(async () => await File.findByIdAndUpdate(fileId, { status: 'approved' }), 4000);

    return file;
  } else {
    // ── Fallback: DB unavailable ────────────────────────────────────────────
    // Construct a plain object mirroring the Mongoose document shape and store
    // it in the module-level inMemoryFiles array. Status goes straight to
    // 'approved' since we cannot run async updates without a DB.
    const file = {
      _id: fileId,
      filename: opts.originalName,
      originalName: opts.originalName,
      mimeType: opts.mimeType,
      size: opts.size,
      type,
      status: 'approved',     // Skip moderation in fallback mode
      tags: [],
      description: '',
      storageKey,
      localPath,
      createdAt: new Date(),
    };
    inMemoryFiles.push(file);
    return file;
  }
}

/**
 * getFiles
 * --------
 * Retrieves files from MongoDB (or the in-memory store in fallback mode),
 * filtered by optional status and type query parameters.
 *
 * IMPORTANT: The AI recommendation layer always calls this with
 * `status: 'approved'` to ensure rejected or pending files are never
 * surfaced to users. This is the enforcement point for content safety.
 *
 * @param query.status  Optional — filter by moderation status
 * @param query.type    Optional — filter by file category (image/video/doc)
 */
export async function getFiles(query: { status?: FileStatus; type?: FileType }) {
  if (mongoose.connection.readyState === 1) {
    // ── Database is live: query MongoDB ────────────────────────────────────
    const filter: Record<string, string> = {};
    if (query.status) filter.status = query.status;  // e.g. { status: 'approved' }
    if (query.type) filter.type = query.type;
    // Sort newest-first so recently uploaded files appear at the top of the picker
    return File.find(filter).sort({ createdAt: -1 }).lean();
  } else {
    // ── Fallback: filter in-memory array ───────────────────────────────────
    return inMemoryFiles.filter(f =>
      (!query.status || f.status === query.status) &&
      (!query.type || f.type === query.type)
    );
  }
}
