import React from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Button, Card } from '@/src/shared/components/ui';
import { COLORS } from '@/src/shared/theme/colors';
import { useSession } from '@/src/features/auth';

const HomeScreen = () => {
  const { user, signOut } = useSession();
  const router = useRouter();

  const handleSignOut = () => {
    Alert.alert('Cerrar sesión', '¿Seguro que quieres salir de tu cuenta?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Cerrar sesión', style: 'destructive', onPress: () => void signOut() },
    ]);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.greeting}>Hola{user?.firstName ? `, ${user.firstName}` : ''} 👋</Text>

      <Card variant="motivation" style={styles.card}>
        <Text style={styles.cardText}>💙 Registra tu glucosa para llevar el control de tu día</Text>
      </Card>

      <Button
        title="Registrar glucosa"
        onPress={() => router.push('/glucose/new')}
        style={styles.action}
      />

      <Button
        title="Cerrar sesión"
        variant="outline"
        onPress={handleSignOut}
        style={styles.action}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
    backgroundColor: COLORS.background,
  },
  greeting: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.gray[800],
    marginBottom: 20,
    textAlign: 'center',
  },
  card: {
    marginBottom: 28,
  },
  cardText: {
    color: COLORS.blue[700],
    fontSize: 16,
    fontWeight: '500',
    textAlign: 'center',
  },
  action: {
    marginBottom: 12,
  },
});

export default HomeScreen;
