// app/index.tsx
import { useAuth } from '@/providers/AuthProvider';
import { Redirect } from 'expo-router';

export default function Index() {
  const { user } = useAuth();
  return <Redirect href={user ? '/(tabs)' : '/(auth)/sign-in'} />;
}
