/** API pública de la funcionalidad de perfil (spec fase 7, D-7.5). */
export { profileApi } from './api';
export { useProfile } from './hooks/useProfile';
export { default as ProfileScreen } from './screens/ProfileScreen';
export type { ActivityLevel, Profile, UpdateProfileInput } from './types';
