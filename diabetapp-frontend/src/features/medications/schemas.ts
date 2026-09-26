import { z } from 'zod';
import { Medication, MedicationInput } from './types';

const TIME_REGEX = /^([01]\d|2[0-3]):[0-5]\d$/;

/** Mismas reglas que `medications.schemas.ts` del backend (spec fase 11, RF-11.10). */
export const medicationFormSchema = z.object({
  name: z.string().trim().min(1, 'El nombre es obligatorio').max(80, 'Máximo 80 caracteres'),
  dosage: z.string().trim().min(1, 'La dosis es obligatoria').max(40, 'Máximo 40 caracteres'),
  scheduledTimes: z
    .array(z.string().trim())
    .min(1, 'Indica al menos un horario')
    .max(10, 'No puedes indicar más de 10 horarios')
    .refine(
      (times) => times.every((time) => TIME_REGEX.test(time)),
      'Cada horario debe tener formato HH:mm (24 horas), p. ej. 08:00',
    )
    .refine((times) => new Set(times).size === times.length, 'Los horarios no pueden repetirse'),
  notes: z.string().trim().max(300, 'Máximo 300 caracteres'),
});

export type MedicationFormValues = z.infer<typeof medicationFormSchema>;

export const emptyMedicationForm: MedicationFormValues = {
  name: '',
  dosage: '',
  scheduledTimes: [''],
  notes: '',
};

export const medicationToFormValues = (medication: Medication): MedicationFormValues => ({
  name: medication.name,
  dosage: medication.dosage,
  scheduledTimes: medication.scheduledTimes,
  notes: medication.notes ?? '',
});

export const formValuesToInput = (values: MedicationFormValues): MedicationInput => ({
  name: values.name.trim(),
  dosage: values.dosage.trim(),
  scheduledTimes: values.scheduledTimes.map((time) => time.trim()),
  notes: values.notes.trim() === '' ? null : values.notes.trim(),
});
