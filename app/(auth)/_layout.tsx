// app/(auth)/_layout.tsx
import { useAuth } from '@/providers/AuthProvider';
import { Redirect, Slot } from 'expo-router';
export default function AuthLayout() {
  const { user } = useAuth();
  if (user) return <Redirect href="/(tabs)" />;
  return <Slot />;
}
