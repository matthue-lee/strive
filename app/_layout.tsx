// app/_layout.tsx


import { AuthProvider } from '@/providers/AuthProvider';
import { ActionSheetProvider } from '@expo/react-native-action-sheet';
import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import { createAsyncStoragePersister } from '@tanstack/query-async-storage-persister';
import {
  QueryClient,
  QueryClientProvider,
  focusManager,
  onlineManager,
} from '@tanstack/react-query';
import { persistQueryClient } from '@tanstack/react-query-persist-client';
import { Stack } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { AppState } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

export default function RootLayout() {
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: { queries: { staleTime: 5 * 60_000, gcTime: 30 * 60_000, retry: 2 } },
  }));

  useEffect(() => {
    const sub = AppState.addEventListener('change', s => focusManager.setFocused(s === 'active'));
    return () => sub.remove();
  }, []);
  useEffect(() => {
    const unsub = NetInfo.addEventListener(st => onlineManager.setOnline(!!st.isConnected));
    return () => unsub();
  }, []);
  useEffect(() => {
    const persister = createAsyncStoragePersister({ storage: AsyncStorage, key: 'rq-cache', throttleTime: 2000 });
    persistQueryClient({ queryClient, persister, maxAge: 24 * 60 * 60 * 1000 });
  }, [queryClient]);

  return (
    <ActionSheetProvider>
      <SafeAreaProvider>
        <AuthProvider>
          <QueryClientProvider client={queryClient}>
            <Stack screenOptions={{ headerShown: false }} />
          </QueryClientProvider>
        </AuthProvider>
      </SafeAreaProvider>
    </ActionSheetProvider>
  );
}
