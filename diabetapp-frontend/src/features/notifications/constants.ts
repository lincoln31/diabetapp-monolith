import { NotificationKey } from './types';

/** Canal de Android para todos los recordatorios (spec fase 13, D-13.4). */
export const CHANNEL_ID = 'recordatorios';

/** Hora fija del mensaje motivacional diario (spec fase 13, RF-13.8). */
export const MOTIVATIONAL_TIME = { hour: 9, minute: 0 } as const;

/** Mensajes motivacionales que rotan uno por día (catálogo fijo, como los consejos de la fase 10). */
export const MOTIVATIONAL_MESSAGES: string[] = [
  'Cada lectura que registras es un paso hacia un mejor control. ¡Sigue así!',
  'Hoy es un buen día para cuidarte: pequeños hábitos, grandes resultados.',
  'No tiene que ser perfecto, tiene que ser constante. Tú puedes.',
  'Tu esfuerzo de hoy se nota en tu salud de mañana.',
  'Un paseo corto después de comer también cuenta. ¡Anímate!',
  'Cuidarte no es una carga, es un regalo que te haces todos los días.',
  'Aunque un día no salga como esperabas, mañana empiezas de nuevo con más fuerza.',
  'Beber agua, medir tu glucosa, moverte un poco: tres gestos que suman.',
  'Estás haciendo un trabajo que muchos no ven, pero tu cuerpo lo agradece.',
  'La constancia gana a la intensidad. Un día a la vez.',
  'Celebra lo que sí lograste hoy, por pequeño que sea.',
  'Tu salud es tu mejor inversión. Sigue cuidándola.',
  'Pedir ayuda y hablar con tu equipo médico también es parte del tratamiento.',
  'Hoy puedes elegir una comida que te haga sentir bien. ¡Tú decides!',
  'Los buenos hábitos se construyen con repetición. Ya llevas más camino del que crees.',
  'Respira, organiza tu día y no olvides tus medidas. Todo va a estar bien.',
];

export const NOTIFICATION_OPTIONS: { key: NotificationKey; title: string; description: string }[] =
  [
    {
      key: 'medicationReminders',
      title: 'Recordatorios de medicación',
      description: 'Un aviso a cada hora de tus medicamentos.',
    },
    {
      key: 'glucoseReminders',
      title: 'Recordatorios de glucosa',
      description: 'Un aviso a las horas que elijas para medir tu glucosa.',
    },
    {
      key: 'motivational',
      title: 'Mensaje motivacional',
      description: 'Una frase de ánimo cada día a las 9:00.',
    },
    {
      key: 'achievements',
      title: 'Logros nuevos',
      description: 'Te avisamos cuando desbloqueas un logro (al abrir la app).',
    },
  ];
