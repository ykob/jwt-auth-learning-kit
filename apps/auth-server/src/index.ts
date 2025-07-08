// src/index.ts

import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import express from 'express';
import authRouter from './api/auth/auth.routes';
import { env } from './config';
import { errorHandler } from './middlewares/error-handler.middleware';

// .env ファイルを読み込む
dotenv.config();

const app = express();

// --- ミドルウェアの設定 ---
// ここに並べるミドルウェアは、上から順番に実行される
app.use(express.json());
app.use(cookieParser());
app.use('/api/auth', authRouter);
app.use(errorHandler);

// サーバーが正常に動作しているか確認するためのヘルスチェック用エンドポイント
app.get('/health', (_, res) => {
  res.status(200).send('Auth Server is healthy!');
});

// サーバーを起動
app.listen(env.PORT, () => {
  console.log(`Auth Server is running at http://localhost:${env.PORT}`);
});
