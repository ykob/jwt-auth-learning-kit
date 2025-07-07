import { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config';

// ExpressのRequest型に、カスタムプロパティ'user'を追加するための型定義
declare global {
  namespace Express {
    interface Request {
      user?: {
        userId: string;
        role: string;
      };
    }
  }
}

export const protect = (req: Request, res: Response, next: NextFunction) => {
  try {
    // 1. ヘッダーから'Authorization'を取得
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({ message: 'Authentication failed. No token provided.' });
      return;
    }

    // 'Bearer 'の部分を取り除き、トークン本体を取得
    const token = authHeader.split(' ')[1];

    // 2. トークンを検証
    const decoded = jwt.verify(token, env.ACCESS_TOKEN_SECRET) as { userId: string; role: string };

    // 3. リクエストオブジェクトにユーザー情報を格納
    req.user = decoded;

    // 4. 次の処理へ進む
    next();
  } catch (error) {
    // トークンが無効または期限切れの場合
    res.status(401).json({ message: 'Authentication failed. Invalid token.' });
  }
};
