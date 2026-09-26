import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useRouter } from 'expo-router';
import Icon from './Icon';
import { COLORS } from '../../theme/colors';

/**
 * Cabecera de pantallas secundarias: botón de cerrar + título. El botón es un icono
 * propio (no `Button` pequeño): el texto «✕» del botón de 32 px quedaba recortado.
 */
const ScreenHeader = ({ title }: { title: string }) => {
  const router = useRouter();

  return (
    <View style={styles.header}>
      <TouchableOpacity
        accessibilityRole="button"
        accessibilityLabel="Cerrar"
        onPress={() => router.back()}
        style={styles.closeButton}
      >
        <Icon name="close" size={20} color={COLORS.gray[700]} />
      </TouchableOpacity>
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
    borderWidth: 1,
    borderColor: COLORS.gray[300],
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: { fontSize: 20, fontWeight: 'bold', color: COLORS.gray[800], flex: 1 },
});

export default ScreenHeader;
