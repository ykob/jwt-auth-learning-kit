// src/index.ts

import dotenv from "dotenv";
import express from "express";
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

// サーバーを起動
app.listen(env.PORT, () => {
  console.log(`Auth Server is running at http://localhost:${env.PORT}`);
});
