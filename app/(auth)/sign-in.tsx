// app/(auth)/sign-in.tsx
import { supabase } from '@/library/supabase';
import { useState } from 'react';
import { Alert, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

export default function SignIn() {
  const [mode, setMode] = useState<'in' | 'up'>('in');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);

  const go = async () => {
    if (!email || !password) return Alert.alert('Missing info', 'Email and password are required.');
    setBusy(true);
    try {
      const fn =
        mode === 'in'
          ? supabase.auth.signInWithPassword({ email, password })
          : supabase.auth.signUp({ email, password });

      const { error } = await fn;
      if (error) throw error;
      // AuthProvider will pick up session change and gate will route.
    } catch (e: any) {
      Alert.alert('Auth error', e.message ?? String(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <View style={styles.wrap}>
      <Text style={styles.title}>Welcome</Text>
      <TextInput
        style={styles.input}
        autoCapitalize="none"
        inputMode="email"
        placeholder="you@email.com"
        value={email}
        onChangeText={setEmail}
      />
      <TextInput
        style={styles.input}
        secureTextEntry
        placeholder="Password"
        value={password}
        onChangeText={setPassword}
      />

      <TouchableOpacity style={[styles.btn, busy && { opacity: 0.7 }]} onPress={go} disabled={busy}>
        <Text style={styles.btnText}>{busy ? 'Please wait…' : mode === 'in' ? 'Sign in' : 'Create account'}</Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={() => setMode(mode === 'in' ? 'up' : 'in')}>
        <Text style={styles.link}>
          {mode === 'in' ? "New here? Create an account" : 'Already have an account? Sign in'}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, padding: 16, justifyContent: 'center', gap: 12 },
  title: { fontSize: 24, fontWeight: '800', marginBottom: 8, textAlign: 'center' },
  input: {
    borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 10, padding: 12, fontSize: 16, backgroundColor: '#fff',
  },
  btn: { backgroundColor: '#277da1', paddingVertical: 12, borderRadius: 10, alignItems: 'center' },
  btnText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  link: { textAlign: 'center', color: '#277da1', marginTop: 8, fontWeight: '600' },
});
