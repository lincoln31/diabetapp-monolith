import { useMemo } from 'react';
import { TIPS } from '../constants';
import { getTipOfTheDay } from '../tips';

/** Consejo de hoy según la fecha local del celular (spec fase 10, D-10.2). */
export const useTipOfTheDay = (): string => useMemo(() => getTipOfTheDay(TIPS, new Date()), []);
