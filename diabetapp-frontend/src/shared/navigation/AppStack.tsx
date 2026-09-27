import React from 'react';
import { Stack } from 'expo-router';

/**
 * Las pestañas siempre quedan debajo, incluso al entrar por un *deep link* directo (p. ej. la
 * notificación que abre «Notificaciones»): así «Hoy» y su sincronización siguen montados y
 * «Cerrar» vuelve a la app en vez de dejar la pantalla sola (spec fase 15, D-15.1).
 */
export const unstable_settings = { initialRouteName: '(tabs)' };

/**
 * Pantallas que se apilan sobre las pestañas y ocultan la barra: lo que se hace o se
 * configura (formularios, cronómetro, perfil, educación); lo que se consulta vive en pestañas.
 */
const AppStack = () => <Stack screenOptions={{ headerShown: false }} />;

export default AppStack;
