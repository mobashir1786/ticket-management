const path = require('path');
const dotenv = require('dotenv');
const { z } = require('zod');

dotenv.config({ path: path.join(__dirname, '../../.env') });

const isProduction = process.env.NODE_ENV === 'production';
const dbUriName = isProduction ? 'DB_URI_PROD' : 'DB_URI';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().default(5000),
  DB_URI: z.string({ required_error: `${dbUriName} is required` }).trim().min(1, `${dbUriName} is required`),
  JWT_SECRET: z.string().min(10, 'JWT_SECRET must be at least 10 characters'),
  JWT_EXPIRES_IN: z.string().default('7d'),
  CLIENT_URL: z.string().default('http://localhost:5173'),
});

const parsed = envSchema.safeParse({
  ...process.env,
  DB_URI: process.env[dbUriName],
});

if (!parsed.success) {
  console.error('Invalid environment variables:', parsed.error.flatten().fieldErrors);
  process.exit(1);
}

module.exports = parsed.data;
