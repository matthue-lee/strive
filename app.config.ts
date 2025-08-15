// app.config.ts
import 'dotenv/config';

const APP_ENV = process.env.APP_ENV ?? 'development'; // dev | staging | production

export default {
  expo: {
    name: 'Strive',
    slug: 'Strive',
    scheme: "Strive",
    icon: "assets/images/logo.png",
    splash: {
      image: 'assets/images/logo.png',   // can be any non-transparent image you want on the splash
      backgroundColor: '#ffffff',
      resizeMode: 'contain',
    },
    ios: { bundleIdentifier: "com.matth.strive" },
    android: {
    "package": "com.matth.strive"
    },
    updates: { url: "https://u.expo.dev/c16bfa58-8f77-4232-af1e-0616a4ce5ea0" },
    runtimeVersion: { policy: 'appVersion' },
    extra: {
      eas: {
        "projectId": "c16bfa58-8f77-4232-af1e-0616a4ce5ea0"
      },
      APP_ENV,
      EXPO_PUBLIC_SUPABASE_URL: process.env.EXPO_PUBLIC_SUPABASE_URL,
      EXPO_PUBLIC_SUPABASE_ANON_KEY: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY,
    },
  },
};
