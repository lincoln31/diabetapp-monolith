import { MOTIVATIONAL_MESSAGES } from '../constants';
import { findNewAchievements } from '../newAchievements';
import { buildSchedule, isSameSchedule } from '../schedule';
import { glucoseTimesSchema } from '../schemas';
import { NotificationPreferences, ScheduleMedication } from '../types';

// `schedule.ts` importa el índice de educación, que arrastra pantallas con expo-router
jest.mock('expo-router', () => ({ useRouter: () => ({ back: jest.fn(), push: jest.fn() }) }));

const off: NotificationPreferences = {
  medicationReminders: false,
  glucoseReminders: false,
  motivational: false,
  achievements: false,
};

const medications: ScheduleMedication[] = [
  { id: 'm1', name: 'Metformina', dosage: '850 mg', scheduledTimes: ['08:00', '20:00'] },
  { id: 'm2', name: 'Insulina', dosage: '10 unidades', scheduledTimes: ['22:30'] },
];

const base = {
  medications,
  glucoseReminderTimes: ['07:30', '13:00'],
  today: new Date(2026, 8, 26),
};

describe('buildSchedule', () => {
  it('con todo apagado devuelve una lista vacía', () => {
    expect(buildSchedule({ ...base, preferences: off })).toEqual([]);
  });

  it('crea un recordatorio por horario de cada medicamento, con nombre y dosis', () => {
    const items = buildSchedule({
      ...base,
      preferences: { ...off, medicationReminders: true },
    });

    expect(items).toEqual([
      {
        id: 'med:m1:08:00',
        title: 'Hora de tu medicación',
        body: 'Metformina (850 mg)',
        hour: 8,
        minute: 0,
      },
      {
        id: 'med:m1:20:00',
        title: 'Hora de tu medicación',
        body: 'Metformina (850 mg)',
        hour: 20,
        minute: 0,
      },
      {
        id: 'med:m2:22:30',
        title: 'Hora de tu medicación',
        body: 'Insulina (10 unidades)',
        hour: 22,
        minute: 30,
      },
    ]);
  });

  it('crea un recordatorio por horario de glucosa', () => {
    const items = buildSchedule({ ...base, preferences: { ...off, glucoseReminders: true } });

    expect(items.map((item) => [item.id, item.hour, item.minute])).toEqual([
      ['glucose:07:30', 7, 30],
      ['glucose:13:00', 13, 0],
    ]);
  });

  it('crea un mensaje motivacional diario a las 9:00', () => {
    const items = buildSchedule({ ...base, preferences: { ...off, motivational: true } });

    expect(items).toHaveLength(1);
    expect(items[0]).toMatchObject({ id: 'motivation', hour: 9, minute: 0 });
    expect(MOTIVATIONAL_MESSAGES).toContain(items[0].body);
  });

  it('el mensaje motivacional cambia de un día al siguiente', () => {
    const preferences = { ...off, motivational: true };
    const today = buildSchedule({ ...base, preferences, today: new Date(2026, 8, 26) });
    const tomorrow = buildSchedule({ ...base, preferences, today: new Date(2026, 8, 27) });

    expect(today[0].body).not.toBe(tomorrow[0].body);
  });

  it('no incluye medicamentos si el aviso de medicación está apagado', () => {
    const items = buildSchedule({ ...base, preferences: { ...off, glucoseReminders: true } });

    expect(items.some((item) => item.id.startsWith('med:'))).toBe(false);
  });

  it('los identificadores son estables entre llamadas', () => {
    const preferences = { ...off, medicationReminders: true, glucoseReminders: true };

    expect(buildSchedule({ ...base, preferences }).map((i) => i.id)).toEqual(
      buildSchedule({ ...base, preferences }).map((i) => i.id),
    );
  });
});

describe('isSameSchedule', () => {
  const item = {
    id: 'med:m1:08:00',
    title: 'Hora de tu medicación',
    body: 'Metformina (850 mg)',
    hour: 8,
    minute: 0,
  };
  const same = { title: item.title, body: item.body, hour: 8, minute: 0 };

  it('es igual si título, cuerpo y hora coinciden', () => {
    expect(isSameSchedule(same, item)).toBe(true);
  });

  it.each([
    ['otro título', { ...same, title: 'Otro' }],
    ['otro cuerpo', { ...same, body: 'Metformina (1000 mg)' }],
    ['otra hora', { ...same, hour: 9 }],
    ['otros minutos', { ...same, minute: 30 }],
    ['sin disparador', { title: item.title, body: item.body }],
  ])('es distinta con %s', (_name, existing) => {
    expect(isSameSchedule(existing, item)).toBe(false);
  });
});

describe('findNewAchievements', () => {
  it('en la primera sincronización no avisa de nada', () => {
    expect(findNewAchievements(['A', 'B'], null)).toEqual([]);
  });

  it('avisa solo de los desbloqueados que no se habían visto', () => {
    expect(findNewAchievements(['A', 'B', 'C'], ['A', 'B'])).toEqual(['C']);
  });

  it('no repite un logro ya visto', () => {
    expect(findNewAchievements(['A'], ['A'])).toEqual([]);
  });

  it('sin logros desbloqueados no hay avisos', () => {
    expect(findNewAchievements([], [])).toEqual([]);
  });
});

describe('glucoseTimesSchema', () => {
  it.each([[[]], [['07:30']], [['07:30', '20:00']]])('acepta %j', (times) => {
    expect(glucoseTimesSchema.safeParse(times).success).toBe(true);
  });

  it.each([
    ['horario mal escrito', ['7:30']],
    ['hora inexistente', ['25:00']],
    ['horario vacío', ['']],
    ['repetidos', ['08:00', '08:00']],
    ['más de 6', ['01:00', '02:00', '03:00', '04:00', '05:00', '06:00', '07:00']],
  ])('rechaza %s', (_name, times) => {
    expect(glucoseTimesSchema.safeParse(times).success).toBe(false);
  });
});
