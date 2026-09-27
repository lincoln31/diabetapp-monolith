import React from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Card, ListRow, Screen } from '@/src/shared/components/ui';
import { color, space, type } from '@/src/shared/theme/tokens';
import { useSession } from '@/src/features/auth';
import { ExportReportButton } from '@/src/features/dashboard';

const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <View style={styles.section}>
    <Text style={styles.sectionTitle} accessibilityRole="header">
      {title}
    </Text>
    {children}
  </View>
);

/**
 * «Más» (spec fase 15, RF-15.2): perfil, notificaciones, logros, educación y reportes, con
 * «Cerrar sesión» separada al final para que nunca quede junto a una acción normal.
 */
const MoreScreen = () => {
  const router = useRouter();
  const { user, signOut } = useSession();

  const confirmSignOut = () =>
    Alert.alert('Cerrar sesión', '¿Seguro que quieres salir de tu cuenta?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Cerrar sesión', style: 'destructive', onPress: () => void signOut() },
    ]);

  return (
    <Screen insetBottom={false} contentStyle={styles.content}>
      <View>
        <Text style={styles.title} accessibilityRole="header">
          Más
        </Text>
        {user ? (
          <Text style={styles.account}>
            {[user.firstName, user.email].filter(Boolean).join(' · ')}
          </Text>
        ) : null}
      </View>

      <Section title="Mi cuenta">
        <ListRow
          title="Perfil y metas"
          subtitle="Tus rangos, peso y tipo de diabetes"
          icon="person"
          onPress={() => router.push('/profile')}
        />
        <ListRow
          title="Notificaciones"
          subtitle="Recordatorios y avisos"
          icon="notifications"
          onPress={() => router.push('/notifications')}
        />
      </Section>

      <Section title="Explorar">
        <ListRow
          title="Logros"
          subtitle="Tu constancia y tus metas"
          icon="trophy"
          onPress={() => router.push('/achievements')}
        />
        <ListRow
          title="Educación"
          subtitle="Consejos, calculadora y guías"
          icon="book"
          onPress={() => router.push('/education')}
        />
      </Section>

      <Section title="Reportes">
        <Card padding="medium">
          <Text style={styles.hint}>
            Descarga tu historial de glucosa para llevarlo a tu consulta.
          </Text>
          <ExportReportButton style={styles.export} />
        </Card>
      </Section>

      <View style={styles.danger}>
        <ListRow
          title="Cerrar sesión"
          icon="logout"
          destructive
          hideChevron
          onPress={confirmSignOut}
        />
      </View>
    </Screen>
  );
};

const styles = StyleSheet.create({
  content: { rowGap: space.xl },
  title: {
    fontSize: type.title.fontSize,
    lineHeight: type.title.lineHeight,
    fontWeight: '700',
    color: color.text,
  },
  account: {
    fontSize: type.label.fontSize,
    lineHeight: type.label.lineHeight,
    color: color.textMuted,
  },
  section: { rowGap: space.sm },
  sectionTitle: {
    fontSize: type.label.fontSize,
    lineHeight: type.label.lineHeight,
    fontWeight: '600',
    color: color.textMuted,
  },
  hint: {
    fontSize: type.body.fontSize,
    lineHeight: type.body.lineHeight,
    color: color.text,
    marginBottom: space.md,
  },
  export: { alignSelf: 'stretch' },
  danger: {
    marginTop: space.xl,
    paddingTop: space.xl,
    borderTopWidth: 1,
    borderTopColor: color.border,
  },
});

export default MoreScreen;
