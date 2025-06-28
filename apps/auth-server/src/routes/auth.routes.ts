import { Router } from 'express';
import { handleLogin, handleLogout, handleRegister, handleToken } from './auth.controller';

const router: Router = Router();

router.post('/register', handleRegister);
router.post('/login', handleLogin);
router.post('/token', handleToken);
router.post('/logout', handleLogout);

export default router;
