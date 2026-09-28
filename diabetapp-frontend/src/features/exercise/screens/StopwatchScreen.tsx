import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Button } from '@/src/shared/components/ui';
import ScreenHeader from '@/src/shared/components/ui/ScreenHeader';
import { COLORS } from '@/src/shared/theme/colors';
import { useStopwatch } from '../hooks/useStopwatch';
import { formatElapsed, toMinutes } from '../timer';

/** Cronómetro de actividad (spec fase 12, RF-12.11): al terminar abre el formulario con los minutos. */
const StopwatchScreen = () => {
  const router = useRouter();
  const { running, elapsed, start, pause, finish } = useStopwatch();
  const started = elapsed > 0;

  const handleFinish = () => {
    const minutes = toMinutes(finish());
    router.replace({ pathname: '/exercise/form', params: { minutes: String(minutes) } });
  };

  return (
    <View style={styles.container}>
      <ScreenHeader title="Cronómetro" />

      <View style={styles.body}>
        <Text style={styles.time} accessibilityRole="timer">
          {formatElapsed(elapsed)}
        </Text>

        <View style={styles.actions}>
          {running ? (
            <Button title="Pausar" variant="outline" onPress={pause} style={styles.action} />
          ) : (
            <Button
              title={started ? 'Reanudar' : 'Iniciar'}
              onPress={start}
              style={styles.action}
            />
          )}

          <Button
            title="Terminar y guardar"
            onPress={handleFinish}
            disabled={!started}
            style={styles.action}
          />
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  body: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 24 },
  time: {
    fontSize: 64,
    fontWeight: 'bold',
    color: COLORS.gray[900],
    fontVariant: ['tabular-nums'],
    marginBottom: 40,
  },
  actions: { alignSelf: 'stretch', rowGap: 12 },
  action: { alignSelf: 'stretch' },
});

export default StopwatchScreen;
