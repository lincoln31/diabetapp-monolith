import AsyncStorage from '@react-native-async-storage/async-storage';

const KEY = 'diabetapp.seenAchievements';

/** Logros ya avisados en este celular; `null` si nunca se ha sincronizado (spec fase 13, D-13.5). */
export const getSeenAchievements = async (): Promise<string[] | null> => {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    if (raw === null) return null;

    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed)
      ? parsed.filter((item): item is string => typeof item === 'string')
      : null;
  } catch {
    return null;
  }
};

export const saveSeenAchievements = async (codes: string[]): Promise<void> => {
  try {
    await AsyncStorage.setItem(KEY, JSON.stringify([...new Set(codes)]));
  } catch {
    // Sin almacenamiento no hay memoria de lo avisado: peor caso, se vuelve a avisar una vez
  }
};
