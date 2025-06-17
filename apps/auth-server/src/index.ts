// src/index.ts

import bcrypt from "bcryptjs";
import dotenv from "dotenv";
import express from "express";
import { prisma } from "./prisma";

// .env ファイルを読み込む
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// リクエストボディのJSONをパースするためのミドルウェア
app.use(express.json());

// サーバーが正常に動作しているか確認するためのヘルスチェック用エンドポイント
app.get("/health", (_, res) => {
  res.status(200).send("Auth Server is healthy!");
});

// ユーザー登録エンドポイント
app.post("/register", async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // 簡単なバリデーション
    if (!email || !password) {
      res.status(400).json({ message: "Email and password are required" });
      return;
    }

    // ユーザーが既に存在するか確認
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      res.status(409).json({ message: "User already exists" });
      return;
    }

    // パスワードをハッシュ化
    const hashedPassword = await bcrypt.hash(password, 10);

    // ユーザーをデータベースに作成
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
      },
    });

    // パスワードはレスポンスに含めない
    const { password: _, ...userWithoutPassword } = user;
    res.status(201).json(userWithoutPassword);
  } catch (error) {
    // 予期せぬ例外をエラーハンドリングミドルウェアに渡す
    next(error);
  }
});

// サーバーを起動
app.listen(PORT, () => {
  console.log(`Auth Server is running at http://localhost:${PORT}`);
});
