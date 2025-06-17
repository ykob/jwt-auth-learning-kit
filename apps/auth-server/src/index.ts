// src/index.ts

import dotenv from "dotenv";
import express from "express";

// .env ファイルを読み込む
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// リクエストボディのJSONをパースするためのミドルウェア
app.use(express.json());

// サーバーが正常に動作しているか確認するためのヘルスチェック用エンドポイント
app.get("/health", (req, res) => {
  res.status(200).send("Auth Server is healthy!");
});

// サーバーを起動
app.listen(PORT, () => {
  console.log(`Auth Server is running at http://localhost:${PORT}`);
});
