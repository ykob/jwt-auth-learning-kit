import { Router } from 'express';
import { handleLogin, handleLogout, handleRegister, handleToken } from './auth.controller';

const router: Router = Router();

// ユーザー登録
router.post('/register', handleRegister);

// ログイン
router.post('/login', handleLogin);

// トークンの再発行
router.post('/token', handleToken);

// ログアウト
router.post('/logout', handleLogout);

export default router;
