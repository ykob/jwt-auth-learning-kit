import dotenv from "dotenv";
import { z } from "zod";

// .envファイルを読み込む
dotenv.config();

// 環境変数のスキーマ（あるべき姿）を定義
const envSchema = z.object({
  DATABASE_URL: z.string().url("DATABASE_URL must be a valid URL."),
  PORT: z.coerce.number().default(3001), // 文字列を数値に変換し、なければデフォルト値3001
  JWT_SECRET: z.string().min(1, "JWT_SECRET is required."),
  ACCESS_TOKEN_EXPIRES_IN: z.coerce
    .number()
    .min(1, "ACCESS_TOKEN_EXPIRES_IN is required."),
  REFRESH_TOKEN_EXPIRES_IN: z.coerce
    .number()
    .min(1, "REFRESH_TOKEN_EXPIRES_IN is required."),
});

// process.env をスキーマでパース（検証）する
// 検証に失敗した場合、アプリケーションは起動せずにエラーを投げる
export const env = envSchema.parse(process.env);

// これで、envオブジェクトのプロパティはスキーマで定義した型（例: env.PORTはnumber）になる
