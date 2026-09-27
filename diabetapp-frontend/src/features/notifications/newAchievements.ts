/**
 * Códigos de logros desbloqueados que aún no se han avisado (spec fase 13, RF-13.9).
 * `seenCodes === null` es la primera sincronización: no se avisa de nada, solo se registran.
 */
export const findNewAchievements = (
  unlockedCodes: string[],
  seenCodes: string[] | null,
): string[] =>
  seenCodes === null ? [] : unlockedCodes.filter((code) => !seenCodes.includes(code));
