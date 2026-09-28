import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Button, Screen } from '@/src/shared/components/ui';
import ScreenHeader from '@/src/shared/components/ui/ScreenHeader';
import { color, space, type } from '@/src/shared/theme/tokens';
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
    <Screen
      scroll={false}
      header={<ScreenHeader title="Cronómetro" safeTop={false} />}
      contentStyle={styles.body}
      footer={
        <View style={styles.actions}>
          {running ? (
            <Button title="Pausar" variant="secondary" size="large" onPress={pause} />
          ) : (
            <Button
              title={started ? 'Reanudar' : 'Iniciar'}
              size="large"
              onPress={start}
              variant={started ? 'secondary' : 'primary'}
            />
          )}

          <Button
            title="Terminar y guardar"
            size="large"
            onPress={handleFinish}
            disabled={!started}
            variant={started ? 'primary' : 'secondary'}
          />
        </View>
      }
    >
      <Text style={styles.time} accessibilityRole="timer">
        {formatElapsed(elapsed)}
      </Text>
    </Screen>
  );
};

const styles = StyleSheet.create({
  body: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  time: { ...type.timer, color: color.text, fontVariant: ['tabular-nums'] },
  actions: { rowGap: space.sm },
});

export default StopwatchScreen;
