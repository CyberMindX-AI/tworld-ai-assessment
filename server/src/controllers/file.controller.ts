import { Request, Response } from 'express';
import { getFiles } from '../services/file.service';

export async function files(req: Request, res: Response) {
  const type = req.query.type as any;
  const status = (req.query.status as any) || undefined;
  res.json(await getFiles({ type, status }));
}

