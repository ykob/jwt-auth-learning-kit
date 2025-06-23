import dotenv from "dotenv";
import { z } from "zod";

dotenv.config();

const envSchema = z.object({
  DATABASE_URL: z.string().url("DATABASE_URL must be a valid URL."),
  PORT: z.coerce.number().default(3001),
  JWT_SECRET: z.string().min(1, "JWT_SECRET is required."),
  ACCESS_TOKEN_EXPIRES_IN: z.coerce
    .number()
    .min(1, "ACCESS_TOKEN_EXPIRES_IN is required."),
  REFRESH_TOKEN_EXPIRES_IN: z.coerce
    .number()
    .min(1, "REFRESH_TOKEN_EXPIRES_IN is required."),
});

export const env = envSchema.parse(process.env);

export const jwtPayloadSchema = z.object({
  userId: z.string(),
  role: z.string().optional(),
  iat: z.number(),
  exp: z.number(),
});
