import bcrypt from 'bcryptjs';
import { createHash } from 'crypto';
import jwt from 'jsonwebtoken';
import { env, jwtPayloadSchema } from '../config';
import { prisma } from '../prisma';

export const registerUser = async (email: string, password: string) => {
  // ユーザーが既に存在するか確認
  const existingUser = await prisma.user.findUnique({ where: { email } });
  if (existingUser) {
    throw new Error('User already exists');
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
  return userWithoutPassword;
};

export const loginUser = async (email: string, password: string) => {
  // emailを元にユーザーを検索
  const user = await prisma.user.findUnique({
    where: { email },
  });
  if (!user) {
    throw new Error('User not found');
  }

  // パスワードを照合
  const isPasswordValid = await bcrypt.compare(password, user.password);
  if (!isPasswordValid) {
    throw new Error('Invalid password');
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

  return {
    accessToken,
    refreshToken,
  };
};

export const refreshTokens = async (refreshToken: string) => {
  // 受け取ったリフレッシュトークンをハッシュ化してDB検索に使う
  const hashedToken = createHash('sha256').update(refreshToken).digest('hex');

  // DBでハッシュ化されたトークンを検索（失効済みでないかもチェック）
  const dbToken = await prisma.refreshToken.findUnique({
    where: { hashedToken: hashedToken, revoked: false },
  });

  if (!dbToken) {
    // 使用済み、または不正なトークンが使われた可能性がある
    throw new Error('Refresh token not found or revoked');
  }

  // 古いトークンを失効させる（トークンローテーション）
  await prisma.refreshToken.update({
    where: { id: dbToken.id },
    data: { revoked: true },
  });

  // リフレッシュトークンを検証
  const decoded = jwt.verify(refreshToken, env.REFRESH_TOKEN_SECRET);
  const payload = jwtPayloadSchema.parse(decoded);

  // ペイロードからユーザーを検索
  const user = await prisma.user.findUnique({
    where: { id: payload.userId },
  });

  if (!user) {
    throw new Error('User not found');
  }

  // 新しいアクセストークンとリフレッシュトークンを両方生成
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

  // 8. 新しいトークンペアを返す
  return { accessToken: newAccessToken, refreshToken: newRefreshToken };
};
