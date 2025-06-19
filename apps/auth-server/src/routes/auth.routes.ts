import bcrypt from "bcryptjs";
import { Router } from "express";
import jwt from "jsonwebtoken";
import { env } from "../config"; // configのインポートパスを修正
import { prisma } from "../prisma"; // prismaのインポートパスを修正

const router: Router = Router();

// ユーザー登録エンドポイント
router.post("/register", async (req, res, next) => {
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

router.post("/login", async (req, res, next) => {
  try {
    // 1. リクエストボディからemailとpasswordを取得
    const { email, password } = req.body;
    if (!email || !password) {
      res.status(400).json({ message: "Email and password are required" });
      return;
    }

    // 2. emailを元にユーザーを検索
    const user = await prisma.user.findUnique({
      where: { email },
    });
    if (!user) {
      // ユーザーが存在しない場合、セキュリティのために「Email or password incorrect」のように
      // どちらが間違っているか分からないようにメッセージを返すのが一般的
      res.status(401).json({ message: "Email or password incorrect" });
      return;
    }

    // 3. パスワードを照合
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      res.status(401).json({ message: "Email or password incorrect" });
      return;
    }

    // 4. JWTを生成
    // アクセストークン（短命）
    const accessToken = jwt.sign(
      { userId: user.id, role: user.role }, // ペイロード
      env.JWT_SECRET!, // 秘密鍵
      { expiresIn: env.ACCESS_TOKEN_EXPIRES_IN } // 有効期限
    );

    // リフレッシュトークン（長命）
    const refreshToken = jwt.sign(
      { userId: user.id }, // ペイロード（シンプルでOK）
      env.JWT_SECRET!, // ※ 本来は別の秘密鍵を使うのがよりセキュア
      { expiresIn: env.REFRESH_TOKEN_EXPIRES_IN }
    );
    // TODO: リフレッシュトークンをDBに保存する処理も後で追加

    // 5. トークンをクライアントに返す
    // リフレッシュトークンをHttpOnly Cookieにセット
    res.cookie("refreshToken", refreshToken, {
      httpOnly: true, // JavaScriptからアクセスできないようにする
      secure: process.env.NODE_ENV === "production", // 本番環境ではHTTPSのみ
      maxAge: env.REFRESH_TOKEN_EXPIRES_IN,
    });

    // アクセストークンをJSONレスポンスで返す
    res.status(200).json({ accessToken });
  } catch (error) {
    next(error);
  }
});

export default router;
