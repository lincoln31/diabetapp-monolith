import { useEffect } from 'react';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { AuthProvider, useSession } from '../src/session/AuthProvider';

// La pantalla de carga se mantiene hasta saber si hay sesión (spec fase 2, RF-2.16)
void SplashScreen.preventAutoHideAsync();

function RootNavigator() {
  const { status } = useSession();

  useEffect(() => {
    if (status !== 'loading') {
      void SplashScreen.hideAsync();
    }
  }, [status]);

  if (status === 'loading') {
    return null; // Sigue visible el splash
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      {/* Rutas privadas: solo con sesión iniciada (RF-2.18) */}
      <Stack.Protected guard={status === 'authenticated'}>
        <Stack.Screen name="(app)" />
      </Stack.Protected>

      {/* Login y registro: solo sin sesión */}
      <Stack.Protected guard={status === 'unauthenticated'}>
        <Stack.Screen name="(auth)" />
      </Stack.Protected>
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <RootNavigator />
    </AuthProvider>
  );
}
