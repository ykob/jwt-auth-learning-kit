import dotenv from 'dotenv';
import { z } from 'zod';

if (process.env.NODE_ENV !== 'production') {
  dotenv.config();
}

const envSchema = z.object({
  DATABASE_URL: z.string().url('DATABASE_URL must be a valid URL.'),
  PORT: z.coerce.number().default(3001),
  ACCESS_TOKEN_SECRET: z.string().min(1, 'ACCESS_TOKEN_SECRET is required.'),
  REFRESH_TOKEN_SECRET: z.string().min(1, 'REFRESH_TOKEN_SECRET is required.'),
});

export const env = envSchema.parse(process.env);
