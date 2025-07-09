import { Router } from 'express';
import { protect } from '../../middlewares/auth.middleware';
import { getMyProfile } from './profiles.controller';

const router: Router = Router();

// `protect`ミドルウェアをこのルートに適用し、認証済みユーザーのみがアクセスできるようにする
router.get('/me', protect, getMyProfile);

export default router;
