import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Card, Icon } from '@/src/shared/components/ui';
import type { AppIconName } from '@/src/shared/components/ui';
import { COLORS } from '@/src/shared/theme/colors';
import ScreenHeader from '../components/ScreenHeader';

const OPTIONS: { title: string; subtitle: string; icon: AppIconName; href: string }[] = [
  {
    title: 'Calculadora de carbohidratos',
    subtitle: 'Calcula los carbohidratos de una porción',
    icon: 'calculator',
    href: '/education/calculator',
  },
  {
    title: 'Guías y FAQs',
    subtitle: 'Aprende sobre glucosa, HbA1c y más',
    icon: 'book',
    href: '/education/guides',
  },
];

/** Punto de entrada único a la sección educativa (spec fase 10, RF-10.6). */
const EducationHubScreen = () => {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <ScreenHeader title="Educación" />
      <View style={styles.list}>
        {OPTIONS.map((option) => (
          <TouchableOpacity
            key={option.href}
            activeOpacity={0.7}
            onPress={() => router.push(option.href as never)}
          >
            <Card padding="large" style={styles.row}>
              <View style={styles.iconCircle}>
                <Icon name={option.icon} size={24} color={COLORS.primary} />
              </View>
              <View style={styles.rowText}>
                <Text style={styles.name}>{option.title}</Text>
                <Text style={styles.subtitle}>{option.subtitle}</Text>
              </View>
              <Icon name="arrow-right" size={20} color={COLORS.gray[400]} />
            </Card>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  list: { padding: 20, paddingTop: 4 },
  row: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  iconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
    backgroundColor: COLORS.gray[100],
  },
  rowText: { flex: 1 },
  name: { fontSize: 16, fontWeight: '700', color: COLORS.gray[900] },
  subtitle: { fontSize: 13, color: COLORS.gray[500], marginTop: 2 },
});

export default EducationHubScreen;
