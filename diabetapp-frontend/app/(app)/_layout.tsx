import { Stack } from 'expo-router';

export default function AppLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="profile" />
      <Stack.Screen name="achievements" />
      <Stack.Screen name="education/index" />
      <Stack.Screen name="education/calculator" />
      <Stack.Screen name="education/guides" />
      {/* El registro de glucosa se abre como modal sobre la pantalla principal */}
      <Stack.Screen name="glucose/new" options={{ presentation: 'modal' }} />
    </Stack>
  );
}
