import { NextFunction, Request, Response } from 'express';
import { JsonWebTokenError, TokenExpiredError } from 'jsonwebtoken';
import { AppError } from '../errors/app-error';

/**
 * Expressのミドルウェアは、この4つの引数を持つことで、
 * 通常のミドルウェアではなく、エラーハンドリングミドルウェアとして認識される。
 */
export const errorHandler = (err: Error, _req: Request, res: Response, _next: NextFunction) => {
  // 開発中はエラーの詳細をコンソールに出力してデバッグしやすくする
  console.error(err);

  // AppErrorクラス（またはそのサブクラス）のインスタンスかチェック
  if (err instanceof AppError) {
    res.status(err.statusCode).json({ message: err.message });
    return;
  }

  // JWTの有効期限切れエラーをチェック
  if (err instanceof TokenExpiredError) {
    res.status(401).json({ message: 'Authentication failed. Token has expired.' });
    return;
  }

  // その他のJWT関連のエラー（署名が不正など）をチェック
  if (err instanceof JsonWebTokenError) {
    res.status(401).json({ message: 'Authentication failed. Token is invalid.' });
    return;
  }

  // 上記のいずれでもない、予期せぬサーバーエラー
  res.status(500).json({ message: 'An unexpected internal server error occurred.' });
  return;
};
