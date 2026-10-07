import React from 'react';
import { StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { ListRow, Screen } from '@/src/shared/components/ui';
import ScreenHeader from '@/src/shared/components/ui/ScreenHeader';
import type { AppIconName } from '@/src/shared/components/ui';
import { space } from '@/src/shared/theme/tokens';
import TipCard from '../components/TipCard';

const OPTIONS: { title: string; subtitle: string; icon: AppIconName; href: string }[] = [
  {
    title: 'Calculadora de carbohidratos',
    subtitle: 'Calcula los carbohidratos de una porción',
    icon: 'calculator',
    href: '/education/calculator',
  },
  {
    title: 'Calculadora de dosis de insulina',
    subtitle: 'Busca un alimento y calcula tu dosis',
    icon: 'pulse',
    href: '/education/insulin-calculator',
  },
  {
    title: 'Guías y FAQs',
    subtitle: 'Aprende sobre glucosa, HbA1c y más',
    icon: 'book',
    href: '/education/guides',
  },
];

/** Punto de entrada único a la sección educativa (spec fase 10, RF-10.6): consejo del día y accesos. */
const EducationHubScreen = () => {
  const router = useRouter();

  return (
    <Screen
      header={<ScreenHeader title="Educación" safeTop={false} />}
      contentStyle={styles.content}
    >
      <TipCard />
      {OPTIONS.map((option) => (
        <ListRow
          key={option.href}
          title={option.title}
          subtitle={option.subtitle}
          icon={option.icon}
          onPress={() => router.push(option.href as never)}
        />
      ))}
    </Screen>
  );
};

const styles = StyleSheet.create({
  content: { rowGap: space.md },
});

export default EducationHubScreen;
