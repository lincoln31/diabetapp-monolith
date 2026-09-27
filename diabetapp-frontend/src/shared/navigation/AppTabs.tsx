import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Tabs } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Icon, { AppIconName } from '../components/ui/Icon';
import { color, radius, space, type } from '../theme/tokens';

/**
 * Barra de pestañas (spec fase 15, RF-15.1, D-15.1): Hoy · Glucosa · Medicación · Actividad · Más.
 * Cada destino lleva icono **y** etiqueta; el activo se distingue por color, peso de la letra y
 * una «píldora» tras el icono (no solo por color). Altura ≥ 56 dp más el área segura inferior.
 */
const TABS: { name: string; title: string; icon: AppIconName }[] = [
  { name: 'index', title: 'Hoy', icon: 'today' },
  { name: 'glucose/index', title: 'Glucosa', icon: 'drop' },
  { name: 'medications/index', title: 'Medicación', icon: 'medication' },
  { name: 'exercise/index', title: 'Actividad', icon: 'walk' },
  { name: 'more', title: 'Más', icon: 'more' },
];

const AppTabs = () => {
  const insets = useSafeAreaInsets();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: color.primary,
        tabBarInactiveTintColor: color.textMuted,
        tabBarStyle: {
          backgroundColor: color.surface,
          borderTopColor: color.border,
          height: 64 + insets.bottom,
          paddingBottom: insets.bottom + space.xs,
          paddingTop: space.xs,
        },
      }}
    >
      {TABS.map((tab) => (
        <Tabs.Screen
          key={tab.name}
          name={tab.name}
          options={{
            title: tab.title,
            tabBarAccessibilityLabel: tab.title,
            tabBarLabel: ({ focused, color: tint }) => (
              <Text style={[styles.label, { color: tint, fontWeight: focused ? '700' : '500' }]}>
                {tab.title}
              </Text>
            ),
            tabBarIcon: ({ focused, color: tint }) => (
              <View style={[styles.pill, focused && styles.pillActive]}>
                <Icon name={tab.icon} size={24} color={String(tint)} />
              </View>
            ),
          }}
        />
      ))}
    </Tabs>
  );
};

const styles = StyleSheet.create({
  label: { fontSize: type.caption.fontSize, lineHeight: type.caption.lineHeight },
  pill: {
    width: 56,
    height: 32,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pillActive: { backgroundColor: color.primarySoft },
});

export default AppTabs;
