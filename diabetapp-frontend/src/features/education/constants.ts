/**
 * Contenido educativo fijo (spec fase 10, D-10.1): no hay tabla ni endpoint,
 * ampliarlo es agregar elementos a estas listas.
 */

/** Consejos que rotan uno por día (RF-10.2: al menos 15). */
export const TIPS: string[] = [
  'Mide tu glucosa a las mismas horas cada día: así es más fácil ver patrones.',
  'Beber agua ayuda a tu cuerpo a eliminar el exceso de glucosa por la orina.',
  'Caminar 10 a 15 minutos después de comer ayuda a bajar la glucosa posterior a las comidas.',
  'Revisa tus pies todos los días: una herida pequeña puede complicarse si no se atiende.',
  'Dormir bien ayuda a controlar la glucosa: la falta de sueño aumenta la resistencia a la insulina.',
  'Lee las etiquetas de los alimentos: los carbohidratos por porción son el dato más útil.',
  'Rota los sitios de inyección de insulina para evitar endurecimientos en la piel.',
  'Lleva siempre contigo algo de azúcar de acción rápida por si tienes una hipoglucemia.',
  'El estrés puede subir tu glucosa: respirar profundo unos minutos ayuda a calmarlo.',
  'Combina los carbohidratos con proteína o fibra para que la glucosa suba más despacio.',
  'Las verduras sin almidón (lechuga, brócoli, pepino) casi no afectan tu glucosa.',
  'Ten al día tus revisiones de ojos, riñones y pies con tu equipo médico.',
  'No te saltes comidas si usas insulina o medicamentos: pueden causar hipoglucemia.',
  'Los jugos y bebidas azucaradas suben la glucosa muy rápido; prefiere agua o infusiones sin azúcar.',
  'Anota cómo te sientes junto a tus lecturas: ayuda a tu médico a entender tu control.',
  'Cuando estés enfermo, sigue midiendo tu glucosa: la infección suele subirla.',
  'Cuidar tu salud dental también es parte de cuidar tu diabetes.',
];

export interface Guide {
  title: string;
  body: string;
}

export const GUIDES: Guide[] = [
  {
    title: '¿Qué es la HbA1c?',
    body: 'Es un examen de laboratorio que refleja tu glucosa promedio de los últimos 2 a 3 meses. Para la mayoría de las personas con diabetes la meta ronda el 7 %, pero tu médico define la tuya.',
  },
  {
    title: 'Hipoglucemia (glucosa baja)',
    body: 'Se considera glucosa baja por debajo de 70 mg/dL. Síntomas: temblor, sudor frío, mareo, hambre repentina. Toma 15 g de azúcar de acción rápida (medio vaso de jugo o 3 tabletas de glucosa), espera 15 minutos y vuelve a medir.',
  },
  {
    title: 'Hiperglucemia (glucosa alta)',
    body: 'Glucosa sostenida por encima de tu meta. Síntomas: mucha sed, orinar seguido, cansancio, visión borrosa. Bebe agua, sigue las indicaciones de tu médico y consulta si se mantiene alta o tienes náuseas.',
  },
  {
    title: 'Contar carbohidratos',
    body: 'Los carbohidratos son el nutriente que más sube la glucosa. Usa la calculadora de esta sección con el dato «carbohidratos por 100 g» del empaque para estimar cuánto comes en cada porción.',
  },
  {
    title: 'Cuándo buscar ayuda urgente',
    body: 'Acude a urgencias si tienes confusión, pérdida del conocimiento, vómito persistente, respiración rápida con aliento a fruta, o glucosa muy alta que no baja.',
  },
];

export interface Faq {
  id: string;
  question: string;
  answer: string;
}

export const FAQS: Faq[] = [
  {
    id: 'frecuencia',
    question: '¿Cuántas veces al día debo medir mi glucosa?',
    answer:
      'Depende de tu tratamiento: quien usa insulina suele medir varias veces al día; otros, menos. Tu médico te indica la frecuencia y puedes fijar tu meta diaria en tu perfil.',
  },
  {
    id: 'rango',
    question: '¿Cuál es un rango normal de glucosa?',
    answer:
      'En ayunas, entre 70 y 100 mg/dL en personas sin diabetes. Para quien vive con diabetes, el rango objetivo lo define su médico; puedes guardarlo en tu perfil.',
  },
  {
    id: 'dulces',
    question: '¿Puedo comer dulces si tengo diabetes?',
    answer:
      'En pequeñas cantidades y dentro de un plan de comidas, sí. Lo importante es contar los carbohidratos totales y no comerlos con el estómago vacío.',
  },
  {
    id: 'ejercicio',
    question: '¿El ejercicio baja la glucosa?',
    answer:
      'Sí, la actividad física ayuda a que el cuerpo use mejor la glucosa. Mide antes y después de hacer ejercicio, sobre todo si usas insulina, para evitar hipoglucemias.',
  },
  {
    id: 'ayuno',
    question: '¿Qué es la glucosa en ayunas?',
    answer:
      'Es la que se mide después de al menos 8 horas sin comer. Es una referencia clave para evaluar tu control de base.',
  },
  {
    id: 'alcohol',
    question: '¿Puedo tomar alcohol?',
    answer:
      'Consulta a tu médico. El alcohol puede causar hipoglucemia horas después de beber, sobre todo si no comes; si lo tomas, hazlo con moderación y con comida.',
  },
  {
    id: 'reporte',
    question: '¿Cómo llevo mis datos a la consulta?',
    answer:
      'Desde el inicio de la app usa «Exportar reporte» para generar un CSV o PDF con todo tu historial y compartirlo.',
  },
];
