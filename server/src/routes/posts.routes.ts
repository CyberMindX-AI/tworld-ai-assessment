import { Router } from 'express';
import { publishPost, listPosts } from '../controllers/posts.controller';

const router = Router();

router.get('/', listPosts);
router.post('/', publishPost);

export default router;
