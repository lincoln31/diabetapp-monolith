import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Banner, Button } from '@/src/shared/components/ui';
import { space } from '@/src/shared/theme/tokens';

/** Error de un bloque de «Hoy» con su reintento; los demás bloques siguen visibles. */
const BlockError = ({ message, onRetry }: { message: string; onRetry: () => void }) => (
  <View style={styles.container}>
    <Banner tone="danger" message={message} />
    <Button title="Reintentar" variant="secondary" icon="refresh" onPress={onRetry} />
  </View>
);

const styles = StyleSheet.create({ container: { rowGap: space.xs } });

export default BlockError;
