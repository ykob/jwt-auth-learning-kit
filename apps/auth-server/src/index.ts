// src/index.ts

import dotenv from "dotenv";
import express from "express";
import { JsonWebTokenError, TokenExpiredError } from "jsonwebtoken";
import { env } from "./config";
import authRouter from "./routes/auth.routes";

// .env ファイルを読み込む
dotenv.config();

const app = express();

// リクエストボディのJSONをパースするためのミドルウェア
app.use(express.json());

// サーバーが正常に動作しているか確認するためのヘルスチェック用エンドポイント
app.get("/health", (_, res) => {
  res.status(200).send("Auth Server is healthy!");
});

app.use("/api/auth", authRouter);

// --- 中央エラーハンドリングミドルウェア ---
// Expressでは、4つの引数を持つミドルウェアはエラーハンドラとして扱われる
app.use((req, res, next) => {
  // 開発中はエラーの詳細をコンソールに出力するとデバッグしやすい
  console.error(req);

  // jwt.verifyが投げるエラーをここでハンドリング
  if (req instanceof TokenExpiredError) {
    // 有効期限切れのエラー
    res.status(401).json({ message: "Authentication failed. Token expired." });
    return;
  }
  if (req instanceof JsonWebTokenError) {
    // 署名が不正な場合など、トークン自体が無効なエラー
    res.status(403).json({ message: "Authentication failed. Invalid token." });
    return;
  }

  // その他の予期せぬエラーはすべて500 Internal Server Error
  // これが最終的なフォールバックとなる
  res.status(500).json({ message: "Internal Server Error" });
});

// サーバーを起動
app.listen(env.PORT, () => {
  console.log(`Auth Server is running at http://localhost:${env.PORT}`);
});
