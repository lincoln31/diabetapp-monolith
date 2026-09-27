import React, { useState } from 'react';
import { Linking, StyleSheet, Text, View } from 'react-native';
import {
  Banner,
  Button,
  ErrorView,
  LoadingView,
  Screen,
  SwitchRow,
} from '@/src/shared/components/ui';
import ScreenHeader from '@/src/shared/components/ui/ScreenHeader';
import TimesField from '@/src/shared/components/TimesField';
import { toApiError } from '@/src/shared/api/errors';
import { color, radius, space, type } from '@/src/shared/theme/tokens';
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
  const [unavailable, setUnavailable] = useState(false);
  const [saving, setSaving] = useState(false);

  const toggle = async (key: NotificationKey, value: boolean) => {
    // Al activar se pide el permiso del sistema; si lo deniega, el interruptor no cambia (RF-13.5)
    if (value) {
      const permission = await ensurePermission();
      if (permission === 'unavailable') {
        setUnavailable(true);
        return;
      }
      if (permission === 'denied') {
        setPermissionDenied(true);
        return;
      }
      setPermissionDenied(false);
      setUnavailable(false);
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
    <Screen
      header={<ScreenHeader title="Notificaciones" safeTop={false} />}
      contentStyle={styles.content}
    >
      {unavailable ? (
        <Banner
          tone="warning"
          message="Los avisos no funcionan en Expo Go: hace falta una versión de desarrollo de la app o la app instalada."
        />
      ) : null}

      {permissionDenied ? (
        <View style={styles.denied}>
          <Banner
            tone="warning"
            message="Los avisos están bloqueados en el celular. Habilita las notificaciones de DiabetApp en los ajustes para recibirlos."
          />
          <Button
            title="Abrir ajustes"
            variant="secondary"
            size="small"
            onPress={() => void Linking.openSettings()}
            style={styles.settingsButton}
          />
        </View>
      ) : null}

      {NOTIFICATION_OPTIONS.map((option) => (
        <View key={option.key} style={styles.option}>
          <SwitchRow
            title={option.title}
            description={option.description}
            value={preferences[option.key]}
            onValueChange={(value) => void toggle(option.key, value)}
            disabled={saving}
          />

          {option.key === 'glucoseReminders' && preferences.glucoseReminders ? (
            <View style={styles.times}>
              <Text style={styles.timesLabel}>Horarios (24 horas)</Text>
              <TimesField value={times} onChange={setTimes} error={timesError} allowEmpty />
              <Button
                title="Guardar horarios"
                size="small"
                onPress={saveTimes}
                loading={saving}
                disabled={saving}
                style={styles.saveTimes}
              />
            </View>
          ) : null}
        </View>
      ))}

      <Text style={styles.footnote}>
        Los recordatorios se programan en tu celular y llegan aunque no tengas internet. Abrir la
        app los actualiza.
      </Text>
    </Screen>
  );
};

/** Pantalla «Notificaciones» (spec fase 13, RF-13.4). */
const NotificationsScreen = () => {
  const { status, profile, errorMessage, offline, reload } = useProfile();

  if (status === 'success' && profile) return <NotificationsForm profile={profile} />;

  return (
    <Screen header={<ScreenHeader title="Notificaciones" safeTop={false} />}>
      {status === 'loading' ? <LoadingView /> : null}
      {status === 'error' ? (
        <ErrorView message={errorMessage ?? ''} offline={offline} onRetry={reload} />
      ) : null}
    </Screen>
  );
};

const styles = StyleSheet.create({
  content: { rowGap: space.md },
  denied: { rowGap: space.sm },
  settingsButton: { alignSelf: 'flex-start' },
  option: {
    backgroundColor: color.surface,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: color.border,
    overflow: 'hidden',
  },
  times: {
    padding: space.lg,
    paddingTop: space.md,
    borderTopWidth: 1,
    borderTopColor: color.border,
    rowGap: space.sm,
  },
  timesLabel: {
    fontSize: type.label.fontSize,
    lineHeight: type.label.lineHeight,
    fontWeight: '600',
    color: color.text,
  },
  saveTimes: { alignSelf: 'flex-start' },
  footnote: {
    fontSize: type.caption.fontSize,
    lineHeight: type.caption.lineHeight,
    color: color.textMuted,
    textAlign: 'center',
  },
});

export default NotificationsScreen;
