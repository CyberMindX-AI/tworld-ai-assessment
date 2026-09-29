/**
 * files.routes.ts
 * ---------------
 * Express router for the Files & Docs module endpoints.
 *
 * These routes handle the ingestion and retrieval of user media (images,
 * documents, videos) which serve as context for the AI post generation.
 *
 * Endpoint summary:
 *
 *  GET /api/files
 *    Accepts: ?status=approved&type=image (query parameters)
 *    Returns: File[] (array of file metadata records)
 *    Purpose: Lists files. The UI uses this to show the user their library.
 *             The AI layer uses this to fetch candidate files for recommendation.
 *
 *  POST /api/files/upload
 *    Accepts: multipart/form-data (with a 'file' field)
 *    Returns: File (the created metadata record)
 *    Purpose: Ingests a new file, writes it to disk (simulating S3), and
 *             starts the simulated async moderation pipeline.
 */

import { Router } from 'express';
import { listFiles, uploadFile } from '../controllers/files.controller';

const router = Router();

// Route handlers are mapped from the files controller.
// Note: file uploads require `multer` middleware, but we handle that
// directly inside the uploadFile controller to keep the route definition clean.
router.get('/', listFiles);
router.post('/upload', uploadFile);

export default router;
