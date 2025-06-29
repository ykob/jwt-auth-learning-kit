import { createHash } from 'crypto';
import { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { env, jwtPayloadSchema } from '../config';
import { prisma } from '../prisma';
import { loginUser, registerUser } from './auth.services';

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
    // リクエストのCookieからリフレッシュトークンを取得
    const { refreshToken } = req.cookies;

    // リフレッシュトークンが存在しない場合は認証エラー
    if (!refreshToken) {
      res.status(401).json({ message: 'Authorization denied. No refresh token.' });
      return;
    }

    // 受け取ったリフレッシュトークンをハッシュ化してDB検索に使う
    const hashedToken = createHash('sha256').update(refreshToken).digest('hex');

    // DBでハッシュ化されたトークンを検索（失効済みでないかもチェック）
    const dbToken = await prisma.refreshToken.findUnique({
      where: { hashedToken: hashedToken, revoked: false },
    });

    if (!dbToken) {
      throw new Error('Refresh token not found in DB or revoked.');
    }

    // 古いトークンをrevoked=trueに更新
    // これがローテーションの核。一度使ったトークンは無効化する。
    await prisma.refreshToken.update({
      where: { id: dbToken.id },
      data: { revoked: true },
    });

    // リフレッシュトークンを検証
    // jwt.verifyは、トークンが不正または期限切れの場合にエラーをthrowします
    const decoded = jwt.verify(refreshToken, env.REFRESH_TOKEN_SECRET);

    // zodスキーマでペイロードを検証・型付けする
    // 検証に失敗した場合、zodがエラーを投げるので、自動的にcatchブロックに移行する
    const payload = jwtPayloadSchema.parse(decoded);

    // ペイロードのuserIdを元にユーザーを検索
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
    });

    if (!user) {
      res.status(401).json({ message: 'Authorization denied. User not found.' });
      return;
    }

    // 新しいアクセストークンと新しいリフレッシュトークンを両方生成
    const newAccessToken = jwt.sign({ userId: user.id, role: user.role }, env.ACCESS_TOKEN_SECRET, {
      expiresIn: env.ACCESS_TOKEN_EXPIRES_IN,
    });
    const newRefreshToken = jwt.sign({ userId: user.id }, env.REFRESH_TOKEN_SECRET, {
      expiresIn: env.REFRESH_TOKEN_EXPIRES_IN,
    });

    // 新しいリフレッシュトークンのハッシュをDBに保存
    const newHashedToken = createHash('sha256').update(newRefreshToken).digest('hex');

    await prisma.refreshToken.create({
      data: {
        hashedToken: newHashedToken,
        userId: user.id,
      },
    });

    // 新しいアクセストークンをクライアントに返す
    res.cookie('refreshToken', newRefreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: env.REFRESH_TOKEN_EXPIRES_IN,
    });
    res.status(200).json({ accessToken: newAccessToken });
  } catch (error) {
    // jwt.verifyがエラーを投げた場合 (トークンが不正、期限切れなど)
    // クライアント側に残っている無効なCookieをクリアする
    res.clearCookie('refreshToken');
    // エラーハンドリングミドルウェアにエラーを渡す
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
