import { NextFunction, Request, Response } from 'express';
import { env } from '../../config';
import { loginUser, logoutUser, refreshTokens, registerUser } from './auth.services';

// ユーザー登録
export const handleRegister = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({ message: 'Email and password are required' });
      return;
    }

    const user = await registerUser(email, password);

    res.status(201).json(user);
  } catch (error) {
    next(error);
  }
};

// ユーザーログイン
export const handleLogin = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({ message: 'Email and password are required' });
      return;
    }

    const { accessToken, refreshToken } = await loginUser(email, password);

    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: env.REFRESH_TOKEN_EXPIRES_IN,
    });
    res.status(200).json({ accessToken });
  } catch (error) {
    next(error);
  }
};

// トークンの再発行
export const handleToken = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { refreshToken } = req.cookies;

    if (!refreshToken) {
      res.status(401).json({ message: 'Refresh token not provided' });
      return;
    }

    const newTokens = await refreshTokens(refreshToken);

    res.cookie('refreshToken', newTokens.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: env.REFRESH_TOKEN_EXPIRES_IN,
    });
    res.status(200).json({ accessToken: newTokens.accessToken });
  } catch (error) {
    res.clearCookie('refreshToken');
    next(error);
  }
};

// ログアウト
export const handleLogout = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { refreshToken } = req.cookies;

    logoutUser(refreshToken);
    res.clearCookie('refreshToken');
    res.status(204).send();
  } catch (error) {
    next(error);
  }
};
