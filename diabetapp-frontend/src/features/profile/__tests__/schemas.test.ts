import { formValuesToInput, profileFormSchema, profileToFormValues } from '../schemas';
import { Profile } from '../types';

const valid = {
  typeOfDiabetes: '' as const,
  activityLevel: '' as const,
  targetGlucoseMin: '',
  targetGlucoseMax: '',
  targetHba1c: '',
  dailyGlucoseChecks: '4',
  exerciseGoalMinutes: '30',
  phone: '',
  birthDate: '',
  weight: '',
  height: '',
  insulinCarbRatio: '',
  insulinSensitivityFactor: '',
};

const messagesFor = (values: typeof valid, path: string) => {
  const result = profileFormSchema.safeParse(values);
  return result.success
    ? []
    : result.error.issues.filter((i) => i.path[0] === path).map((i) => i.message);
};

describe('profileFormSchema', () => {
  it('acepta el formulario con todo vacío', () => {
    expect(profileFormSchema.safeParse(valid).success).toBe(true);
  });

  it('acepta un perfil completo y válido', () => {
    const result = profileFormSchema.safeParse({
      typeOfDiabetes: 'TYPE_2',
      activityLevel: 'MODERATE',
      targetGlucoseMin: '90',
      targetGlucoseMax: '140',
      targetHba1c: '6,5',
      dailyGlucoseChecks: '5',
      exerciseGoalMinutes: '45',
      phone: '300 123 4567',
      birthDate: '20/05/1990',
      weight: '72.5',
      height: '170',
      insulinCarbRatio: '10',
      insulinSensitivityFactor: '40',
    });

    expect(result.success).toBe(true);
  });

  it('rechaza un mínimo mayor o igual que el máximo, señalando el máximo', () => {
    expect(
      messagesFor(
        { ...valid, targetGlucoseMin: '200', targetGlucoseMax: '100' },
        'targetGlucoseMax',
      ),
    ).toContain('El mínimo del rango debe ser menor que el máximo');
    expect(
      messagesFor(
        { ...valid, targetGlucoseMin: '100', targetGlucoseMax: '100' },
        'targetGlucoseMax',
      ),
    ).toHaveLength(1);
  });

  it('rechaza valores fuera de límites o que no son números', () => {
    expect(messagesFor({ ...valid, targetGlucoseMin: '10' }, 'targetGlucoseMin')).toHaveLength(1);
    expect(messagesFor({ ...valid, targetHba1c: '20' }, 'targetHba1c')).toHaveLength(1);
    expect(messagesFor({ ...valid, weight: '5' }, 'weight')).toHaveLength(1);
    expect(messagesFor({ ...valid, height: '300' }, 'height')).toHaveLength(1);
    expect(messagesFor({ ...valid, weight: 'abc' }, 'weight')).toHaveLength(1);
    expect(messagesFor({ ...valid, insulinCarbRatio: '0' }, 'insulinCarbRatio')).toHaveLength(1);
    expect(
      messagesFor({ ...valid, insulinSensitivityFactor: '500' }, 'insulinSensitivityFactor'),
    ).toHaveLength(1);
  });

  it('permite elegir la meta diaria (4, 5, 1…) y exige un entero entre 1 y 20', () => {
    for (const ok of ['1', '4', '5', '20']) {
      expect(messagesFor({ ...valid, dailyGlucoseChecks: ok }, 'dailyGlucoseChecks')).toHaveLength(
        0,
      );
    }
    for (const bad of ['0', '21', '2.5', 'abc']) {
      expect(messagesFor({ ...valid, dailyGlucoseChecks: bad }, 'dailyGlucoseChecks')).toHaveLength(
        1,
      );
    }
  });

  it('no permite dejar vacía la meta diaria', () => {
    expect(messagesFor({ ...valid, dailyGlucoseChecks: '' }, 'dailyGlucoseChecks')).toContain(
      'Indica la meta diaria',
    );
  });

  it('valida el teléfono y la fecha de nacimiento cuando se escriben', () => {
    expect(messagesFor({ ...valid, phone: '123' }, 'phone')).toHaveLength(1);
    expect(messagesFor({ ...valid, birthDate: '31/02/1990' }, 'birthDate')).toHaveLength(1);
    expect(messagesFor({ ...valid, birthDate: '01/01/2999' }, 'birthDate')).toHaveLength(1);
  });

  it('exige enteros en el rango de glucosa', () => {
    expect(messagesFor({ ...valid, targetGlucoseMin: '80.5' }, 'targetGlucoseMin')).toHaveLength(1);
  });
});

describe('formValuesToInput', () => {
  it('envía null en los campos vacíos y números en los llenos', () => {
    expect(
      formValuesToInput({
        ...valid,
        targetGlucoseMin: '90',
        targetHba1c: '6,5',
        typeOfDiabetes: 'TYPE_1',
      }),
    ).toEqual({
      typeOfDiabetes: 'TYPE_1',
      activityLevel: null,
      targetGlucoseMin: 90,
      targetGlucoseMax: null,
      targetHba1c: 6.5,
      dailyGlucoseChecks: 4,
      exerciseGoalMinutes: 30,
      phone: null,
      birthDate: null,
      weight: null,
      height: null,
      insulinCarbRatio: null,
      insulinSensitivityFactor: null,
    });
  });

  it('convierte teléfono y fecha al contrato de la API', () => {
    expect(
      formValuesToInput({ ...valid, phone: ' 300 123 4567 ', birthDate: '20/05/1990' }),
    ).toMatchObject({ phone: '300 123 4567', birthDate: '1990-05-20T00:00:00.000Z' });
  });
});

describe('profileToFormValues', () => {
  it('convierte el perfil en texto y los null en vacío', () => {
    const profile: Profile = {
      typeOfDiabetes: null,
      targetGlucoseMin: 80,
      targetGlucoseMax: 180,
      targetHba1c: null,
      dailyGlucoseChecks: 5,
      exerciseGoalMinutes: 45,
      weight: 72.5,
      height: null,
      activityLevel: 'ACTIVE',
      phone: null,
      birthDate: '1990-05-20T00:00:00.000Z',
      insulinCarbRatio: 10,
      insulinSensitivityFactor: null,
      onboardingCompleted: true,
      notificationPreferences: {
        medicationReminders: false,
        glucoseReminders: false,
        motivational: false,
        achievements: false,
      },
      glucoseReminderTimes: [],
    };

    expect(profileToFormValues(profile)).toEqual({
      typeOfDiabetes: '',
      activityLevel: 'ACTIVE',
      targetGlucoseMin: '80',
      targetGlucoseMax: '180',
      targetHba1c: '',
      dailyGlucoseChecks: '5',
      exerciseGoalMinutes: '45',
      phone: '',
      birthDate: '20/05/1990',
      weight: '72.5',
      height: '',
      insulinCarbRatio: '10',
      insulinSensitivityFactor: '',
    });
  });
});
