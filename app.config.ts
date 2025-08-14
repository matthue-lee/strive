// app.config.ts
import 'dotenv/config';

const APP_ENV = process.env.APP_ENV ?? 'development'; // dev | staging | production

export default {
  expo: {
    name: 'Strive',
    slug: 'Strive',
    scheme: "Strive",
    ios: { bundleIdentifier: "com.yourco.yourapp" },
    android: {
    "package": "com.yourco.yourapp"
    },
    runtimeVersion: { policy: 'appVersion' },
    extra: {
      APP_ENV,
      EXPO_PUBLIC_SUPABASE_URL: process.env.EXPO_PUBLIC_SUPABASE_URL,
      EXPO_PUBLIC_SUPABASE_ANON_KEY: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY,
    },
  },
};
