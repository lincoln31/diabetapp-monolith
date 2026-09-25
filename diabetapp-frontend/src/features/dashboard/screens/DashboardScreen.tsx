import React from 'react';
import {
  ActivityIndicator,
  Alert,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSession } from '@/src/features/auth';
import { Button } from '@/src/shared/components/ui';
import { COLORS } from '@/src/shared/theme/colors';
import EmptyState from '../components/EmptyState';
import ExportReportButton from '../components/ExportReportButton';
import GlucoseAveragesCard from '../components/GlucoseAveragesCard';
import Hba1cCard from '../components/Hba1cCard';
import { useDashboardStats } from '../hooks/useDashboardStats';
import { useHba1cProjection } from '../hooks/useHba1cProjection';

/** Pantalla principal tras iniciar sesión (spec fase 5, RF-5.7, D-5.5/D-5.6). */
const DashboardScreen = () => {
  const { user, signOut } = useSession();
  const router = useRouter();
  const { status, stats, errorMessage, refreshing, refresh } = useDashboardStats();
  const hba1c = useHba1cProjection();

  const goToRegister = () => router.push('/glucose/new');

  // Deslizar hacia abajo refresca todas las tarjetas, no solo la de promedios
  // (spec fase 6, D-6.7 / RF-5.13 de la fase 5).
  const refreshAll = () => Promise.all([refresh(), hba1c.refresh()]);

  const handleSignOut = () => {
    Alert.alert('Cerrar sesión', '¿Seguro que quieres salir de tu cuenta?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Cerrar sesión', style: 'destructive', onPress: () => void signOut() },
    ]);
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refreshAll} />}
    >
      <Text style={styles.greeting}>Hola{user?.firstName ? `, ${user.firstName}` : ''} 👋</Text>

      {status === 'loading' && (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      )}

      {status === 'error' && (
        <View style={styles.centered}>
          <Text style={styles.errorText}>{errorMessage}</Text>
          <Button
            title="Reintentar"
            variant="outline"
            onPress={refresh}
            style={styles.retryButton}
          />
        </View>
      )}

      {status === 'empty' && <EmptyState onRegister={goToRegister} />}

      {status === 'success' && stats && (
        <>
          <GlucoseAveragesCard stats={stats} />
          {hba1c.status === 'success' && hba1c.projection && (
            <Hba1cCard projection={hba1c.projection} />
          )}
        </>
      )}

      <Button title="Registrar glucosa" onPress={goToRegister} style={styles.action} />
      <ExportReportButton style={styles.action} />
      <Button
        title="Cerrar sesión"
        variant="outline"
        onPress={handleSignOut}
        style={styles.action}
      />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  content: {
    paddingHorizontal: 24,
    paddingTop: 32,
    paddingBottom: 24,
  },
  greeting: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.gray[800],
    marginBottom: 20,
    textAlign: 'center',
  },
  centered: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  errorText: {
    fontSize: 14,
    color: COLORS.error,
    textAlign: 'center',
    marginBottom: 16,
  },
  retryButton: {
    alignSelf: 'stretch',
  },
  action: {
    marginTop: 12,
  },
});

export default DashboardScreen;
