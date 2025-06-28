import bcrypt from 'bcryptjs';
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
