import { createHash } from 'crypto';
import { NextFunction, Request, Response } from 'express';
import { env } from '../config';
import { prisma } from '../prisma';
import { loginUser, refreshTokens, registerUser } from './auth.services';

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
    if (error instanceof Error && error.message === 'User already exists') {
      return res.status(409).json({ message: error.message });
    }
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
    if (
      error instanceof Error &&
      (error.message === 'User not found' || error.message === 'Invalid password')
    ) {
      return res.status(401).json({ message: 'Email or password incorrect' });
    }
    next(error);
  }
};

// トークンの再発行
export const handleToken = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { refreshToken } = req.cookies;

    if (!refreshToken) {
      return res.status(401).json({ message: 'Refresh token not provided' });
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
    // Service層でエラーが発生した場合 (トークンが無効、期限切れなど)
    // セキュリティのため、クライアント側の無効なCookieをクリアする
    res.clearCookie('refreshToken');
    next(error);
  }
};

// ログアウト
export const handleLogout = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // リクエストのCookieからリフレッシュトークンを取得
    const { refreshToken } = req.cookies;

    // トークンがあれば、DBから削除する
    if (refreshToken) {
      const hashedToken = createHash('sha256').update(refreshToken).digest('hex');

      // ハッシュ化されたトークンをDBから削除
      await prisma.refreshToken.deleteMany({
        where: { hashedToken },
      });
    }

    // クライアント側のCookieもクリア
    res.clearCookie('refreshToken');

    // 成功レスポンスを返す
    res.status(204).send();
  } catch (error) {
    // エラーハンドリングミドルウェアにエラーを渡す
    next(error);
  }
};
