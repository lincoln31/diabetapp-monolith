import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import CloseButton from './CloseButton';
import { COLORS } from '../../theme/colors';

/** Cabecera de pantallas secundarias: botón de cerrar + título. */
const ScreenHeader = ({ title }: { title: string }) => (
  <View style={styles.header}>
    <CloseButton />
    <Text style={styles.title}>{title}</Text>
  </View>
);

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 30,
    paddingBottom: 10,
  },
  title: { fontSize: 20, fontWeight: 'bold', color: COLORS.gray[800], flex: 1 },
});

export default ScreenHeader;
