import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Button } from '@/src/shared/components/ui';
import { COLORS } from '@/src/shared/theme/colors';

/** Cabecera con botón de cerrar, igual a la de «Mis Logros». */
const ScreenHeader = ({ title }: { title: string }) => {
  const router = useRouter();

  return (
    <View style={styles.header}>
      <Button
        variant="outline"
        size="small"
        style={styles.closeButton}
        onPress={() => router.back()}
        title="✕"
      />
      <Text style={styles.title}>{title}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 30,
    paddingBottom: 10,
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginRight: 15,
    padding: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: { fontSize: 20, fontWeight: 'bold', color: COLORS.gray[800], flex: 1 },
});

export default ScreenHeader;
