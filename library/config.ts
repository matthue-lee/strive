// lib/config.ts
import Constants from 'expo-constants';
import { z } from 'zod';

const schema = z.object({
  APP_ENV: z.enum(['development', 'staging', 'production']),
  EXPO_PUBLIC_SUPABASE_URL: z.string().url(),
  EXPO_PUBLIC_SUPABASE_ANON_KEY: z.string().min(20),
});

const extra = (Constants.expoConfig?.extra ?? {}) as Record<string, unknown>;
export const CONFIG = schema.parse(extra);
