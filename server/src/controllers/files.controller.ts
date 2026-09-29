import { Request, Response, NextFunction } from 'express';
import multer from 'multer';
import { saveFile, getFiles } from '../services/files/file.service';
import type { FileStatus, FileType } from '../types';

// Multer: memory storage (we handle writing ourselves)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024 }, // 50 MB
  fileFilter: (_req, file, cb) => {
    const allowed = [
      'image/jpeg','image/png','image/gif','image/webp',
      'video/mp4','video/quicktime','video/webm',
      'application/pdf',
      'text/plain',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    ];
    cb(null, allowed.includes(file.mimetype));
  },
});

// GET /api/files
export const listFiles = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const status = req.query.status as FileStatus | undefined;
    const type = req.query.type as FileType | undefined;
    const files = await getFiles({ status, type });
    res.json(files);
  } catch (err) {
    next(err);
  }
};

// POST /api/files/upload
export const uploadFile = [
  upload.single('file'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.file) return res.status(400).json({ error: 'No file provided' });

      const saved = await saveFile({
        buffer: req.file.buffer,
        originalName: req.file.originalname,
        mimeType: req.file.mimetype,
        size: req.file.size,
      });

      res.status(201).json(saved);
    } catch (err) {
      next(err);
    }
  },
];
