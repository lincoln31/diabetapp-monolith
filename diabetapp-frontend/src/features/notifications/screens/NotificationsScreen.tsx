import React, { useState } from 'react';
import {
  ActivityIndicator,
  Linking,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
} from 'react-native';
import { Button, Card } from '@/src/shared/components/ui';
import ScreenHeader from '@/src/shared/components/ui/ScreenHeader';
import TimesField from '@/src/shared/components/TimesField';
import { toApiError } from '@/src/shared/api/errors';
import { COLORS } from '@/src/shared/theme/colors';
import { showError } from '@/src/shared/utils/showError';
import { profileApi, useProfile } from '@/src/features/profile';
import type { Profile } from '@/src/features/profile';
import { NOTIFICATION_OPTIONS } from '../constants';
import { ensurePermission } from '../notifier';
import { glucoseTimesSchema } from '../schemas';
import { syncNotifications } from '../sync';
import { NotificationKey, NotificationPreferences } from '../types';

/** Contenido de la pantalla con el perfil ya cargado (spec fase 13, D-13.6). */
const NotificationsForm = ({ profile }: { profile: Profile }) => {
  const [preferences, setPreferences] = useState<NotificationPreferences>(
    profile.notificationPreferences,
  );
  const [times, setTimes] = useState<string[]>(profile.glucoseReminderTimes);
  const [timesError, setTimesError] = useState<string | undefined>();
  const [permissionDenied, setPermissionDenied] = useState(false);
  const [saving, setSaving] = useState(false);

  const toggle = async (key: NotificationKey, value: boolean) => {
    // Al activar se pide el permiso del sistema; si lo deniega, el interruptor no cambia (RF-13.5)
    if (value) {
      if ((await ensurePermission()) === 'denied') {
        setPermissionDenied(true);
        return;
      }
      setPermissionDenied(false);
    }

    const previous = preferences;
    setPreferences({ ...preferences, [key]: value });
    setSaving(true);

    try {
      await profileApi.update({ notificationPreferences: { [key]: value } });
      await syncNotifications();
    } catch (error) {
      setPreferences(previous);
      showError(toApiError(error), 'No se pudo guardar');
    } finally {
      setSaving(false);
    }
  };

  const saveTimes = async () => {
    const parsed = glucoseTimesSchema.safeParse(times);
    if (!parsed.success) {
      setTimesError(parsed.error.issues[0].message);
      return;
    }

    setTimesError(undefined);
    setSaving(true);

    try {
      await profileApi.update({ glucoseReminderTimes: parsed.data });
      await syncNotifications();
    } catch (error) {
      showError(toApiError(error), 'No se pudieron guardar los horarios');
    } finally {
      setSaving(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.content}>
      {permissionDenied && (
        <Card padding="large" style={styles.warning}>
          <Text style={styles.warningText}>
            Los avisos están bloqueados en el celular. Habilita las notificaciones de DiabetApp en
            los ajustes para recibirlos.
          </Text>
          <Button
            title="Abrir ajustes"
            variant="outline"
            size="small"
            onPress={() => void Linking.openSettings()}
            style={styles.settingsButton}
          />
        </Card>
      )}

      {NOTIFICATION_OPTIONS.map((option) => (
        <Card key={option.key} padding="large" style={styles.option}>
          <View style={styles.optionRow}>
            <View style={styles.optionText}>
              <Text style={styles.optionTitle}>{option.title}</Text>
              <Text style={styles.optionDescription}>{option.description}</Text>
            </View>
            <Switch
              accessibilityLabel={option.title}
              value={preferences[option.key]}
              onValueChange={(value) => void toggle(option.key, value)}
              disabled={saving}
            />
          </View>

          {option.key === 'glucoseReminders' && preferences.glucoseReminders && (
            <View style={styles.times}>
              <Text style={styles.timesLabel}>Horarios (24 horas)</Text>
              <TimesField value={times} onChange={setTimes} error={timesError} allowEmpty />
              <Button
                title="Guardar horarios"
                size="small"
                onPress={saveTimes}
                disabled={saving}
                style={styles.saveTimes}
              />
            </View>
          )}
        </Card>
      ))}

      <Text style={styles.footnote}>
        Los recordatorios se programan en tu celular y llegan aunque no tengas internet. Abrir la
        app los actualiza.
      </Text>
    </ScrollView>
  );
};

/** Pantalla «Notificaciones» (spec fase 13, RF-13.4). */
const NotificationsScreen = () => {
  const { status, profile, errorMessage, reload } = useProfile();

  return (
    <View style={styles.container}>
      <ScreenHeader title="Notificaciones" />

      {status === 'loading' && (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      )}

      {status === 'error' && (
        <View style={styles.centered}>
          <Text style={styles.errorText}>{errorMessage}</Text>
          <Button title="Reintentar" variant="outline" onPress={reload} />
        </View>
      )}

      {status === 'success' && profile && <NotificationsForm profile={profile} />}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 20 },
  errorText: { fontSize: 14, color: COLORS.error, textAlign: 'center', marginBottom: 16 },
  content: { padding: 20, paddingTop: 4 },
  warning: { marginBottom: 12, backgroundColor: '#FFFBEB' },
  warningText: { fontSize: 14, lineHeight: 20, color: COLORS.gray[700] },
  settingsButton: { marginTop: 10, alignSelf: 'flex-start' },
  option: { marginBottom: 12 },
  optionRow: { flexDirection: 'row', alignItems: 'center', columnGap: 12 },
  optionText: { flex: 1 },
  optionTitle: { fontSize: 16, fontWeight: '700', color: COLORS.gray[900] },
  optionDescription: { fontSize: 13, color: COLORS.gray[500], marginTop: 2 },
  times: { marginTop: 14, paddingTop: 14, borderTopWidth: 1, borderTopColor: COLORS.gray[100] },
  timesLabel: { fontSize: 14, fontWeight: '600', color: COLORS.gray[700], marginBottom: 6 },
  saveTimes: { marginTop: 4, alignSelf: 'flex-start' },
  footnote: { fontSize: 12, color: COLORS.gray[500], textAlign: 'center', marginTop: 8 },
});

export default NotificationsScreen;
