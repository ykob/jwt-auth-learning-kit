import bcrypt from 'bcryptjs';
import { createHash } from 'crypto';
import { Router } from 'express';
import jwt from 'jsonwebtoken';
import { env, jwtPayloadSchema } from '../config';
import { prisma } from '../prisma';

const router: Router = Router();

// ユーザー登録
router.post('/register', async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // 簡単なバリデーション
    if (!email || !password) {
      res.status(400).json({ message: 'Email and password are required' });
      return;
    }

    // ユーザーが既に存在するか確認
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      res.status(409).json({ message: 'User already exists' });
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

// ログイン
router.post('/login', async (req, res, next) => {
  try {
    // リクエストボディからemailとpasswordを取得
    const { email, password } = req.body;
    if (!email || !password) {
      res.status(400).json({ message: 'Email and password are required' });
      return;
    }

    // emailを元にユーザーを検索
    const user = await prisma.user.findUnique({
      where: { email },
    });
    if (!user) {
      // ユーザーが存在しない場合、セキュリティのために「Email or password incorrect」のように
      // どちらが間違っているか分からないようにメッセージを返すのが一般的
      res.status(401).json({ message: 'Email or password incorrect' });
      return;
    }

    // パスワードを照合
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      res.status(401).json({ message: 'Email or password incorrect' });
      return;
    }

    // JWTを生成
    // アクセストークン（短命）
    const accessToken = jwt.sign({ userId: user.id, role: user.role }, env.ACCESS_TOKEN_SECRET!, {
      expiresIn: env.ACCESS_TOKEN_EXPIRES_IN,
    });

    // リフレッシュトークン（長命）
    const refreshToken = jwt.sign({ userId: user.id }, env.REFRESH_TOKEN_SECRET!, {
      expiresIn: env.REFRESH_TOKEN_EXPIRES_IN,
    });

    // リフレッシュトークンをハッシュ化
    const hashedToken = createHash('sha256').update(refreshToken).digest('hex');

    // ハッシュ化したトークンをDBに保存
    await prisma.refreshToken.create({
      data: {
        hashedToken: hashedToken,
        userId: user.id,
      },
    });

    // トークンをクライアントに返す
    // リフレッシュトークンをHttpOnly Cookieにセット
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true, // JavaScriptからアクセスできないようにする
      secure: process.env.NODE_ENV === 'production', // 本番環境ではHTTPSのみ
      sameSite: 'strict',
      maxAge: env.REFRESH_TOKEN_EXPIRES_IN,
    });

    // アクセストークンをJSONレスポンスで返す
    res.status(200).json({ accessToken });
  } catch (error) {
    // 予期せぬ例外をエラーハンドリングミドルウェアに渡す
    next(error);
  }
});

// トークンの再発行
router.post('/token', async (req, res, next) => {
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
});

// ログアウト
router.post('/logout', async (req, res, next) => {
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
});

export default router;
