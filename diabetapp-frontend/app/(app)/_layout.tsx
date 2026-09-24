import { Stack } from 'expo-router';

export default function AppLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="profile" />
      {/* El registro de glucosa se abre como modal sobre la pantalla principal */}
      <Stack.Screen name="glucose/new" options={{ presentation: 'modal' }} />
    </Stack>
  );
}
