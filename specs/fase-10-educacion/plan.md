# Plan técnico F10 — Contenido educativo

Implementa: [spec.md](spec.md) · Tareas: [tasks.md](tasks.md)

## 1. Decisiones

### D-10.1 Todo el contenido vive en el frontend, sin módulo de backend (resuelve la aclaración de la spec §8)

```
src/features/education/
├── constants.ts        # TIPS (≥15), GUIDES, FAQS — catálogos fijos
├── carbCalculator.ts   # función pura calculateCarbs()
├── hooks/useTipOfTheDay.ts
├── components/TipCard.tsx
├── screens/
│   ├── EducationHubScreen.tsx     # RF-10.6: entrada a Calculadora y Guías
│   ├── CarbCalculatorScreen.tsx
│   └── GuidesScreen.tsx
├── schemas.ts           # esquema Zod del formulario de la calculadora
└── index.ts
```

No hay `api.ts`: nada de esta funcionalidad llama al backend (D-10.1, RNF-10.1). Es la primera funcionalidad del frontend sin ese archivo; el resto de la forma estándar (fase 3) se mantiene igual.

### D-10.2 Selección del tip del día (resuelve la aclaración de la spec §8)

```ts
export const TIPS: string[] = [ /* ≥ 15 strings */ ];

const dayOfYear = (date: Date): number => {
  const start = new Date(date.getFullYear(), 0, 0);
  return Math.floor((date.getTime() - start.getTime()) / 86_400_000);
};

export const getTipOfTheDay = (tips: string[], date: Date): string =>
  tips[dayOfYear(date) % tips.length];
```

- `date` la da quien llama (`new Date()` en producción, una fecha fija en los tests) — función pura y testeable (RNF-10.3).
- Usa la **fecha local del dispositivo** (`Date` de JavaScript ya está en hora local): sin `Intl`/zona horaria explícita, a diferencia de la racha del servidor (fase 8). Mismo tip todo el día (CA-10.2), rota al día siguiente (CA-10.3), y vuelve a empezar el catálogo al agotarlo (RF-10.2).
- `useTipOfTheDay()` es un hook mínimo: `useMemo(() => getTipOfTheDay(TIPS, new Date()), [])`. No hace falta `useEffect` ni estado de carga: no hay nada que esperar.

### D-10.3 Calculadora de carbohidratos

```ts
export interface CarbResult {
  totalCarbs: number;   // gramos
  portions: number;     // raciones de 10 g, con un decimal
}

export const calculateCarbs = (carbsPer100g: number, gramsEaten: number): CarbResult => {
  const totalCarbs = Math.round((carbsPer100g * gramsEaten) / 100);
  return { totalCarbs, portions: Math.round((totalCarbs / 10) * 10) / 10 };
};
```

- Formulario con `react-hook-form` + `zod` (patrón de la fase 3): dos campos de texto (`carbsPer100g`, `gramsEaten`), ambos obligatorios, numéricos y `> 0` (RF-10.4, RNF-10.2). Mismo patrón de `optionalNumber` de `profile/schemas.ts`, pero obligatorio y sin permitir cero ni negativos.
- El resultado se recalcula con `useWatch` (como el aviso de rango de la fase 7): no hace falta un botón «Calcular» aparte; si los campos son inválidos, no se muestra resultado (CA-10.5, CA-10.6).
- No se guarda nada: es una herramienta de un solo uso, sin persistencia (alcance de la spec).

### D-10.4 Guías y FAQs

```ts
export const GUIDES: { title: string; body: string }[] = [ /* 3-5 guías cortas */ ];
export const FAQS: { question: string; answer: string }[] = [ /* 6-10 preguntas */ ];
```

`GuidesScreen` lista las guías (texto plano, sin plegar) y debajo las preguntas frecuentes como un acordeón simple: un `useState<string | null>` con la pregunta abierta, se cierra la anterior al abrir otra (RF-10.5, CA-10.7). Sin librería de acordeón nueva: es un `TouchableOpacity` + render condicional, como el selector de fecha/hora de `AddGlucoseScreen`.

### D-10.5 Navegación (resuelve la aclaración de la spec §8)

- `DashboardScreen` suma **una** tarjeta (`TipCard`, siempre visible, no depende de sesión de datos como las demás) y **un** botón «Educación» junto a los existentes (RF-10.6): no se agregan botones para la calculadora ni las guías directamente en el dashboard.
- `EducationHubScreen` (ruta `app/(app)/education/index.tsx`) es una pantalla simple con dos tarjetas pulsables: «Calculadora de carbohidratos» → `app/(app)/education/calculator.tsx`; «Guías y FAQs» → `app/(app)/education/guides.tsx`.
- Las tres rutas nuevas se agregan a `(app)/_layout.tsx` como pantallas normales (no modales).

## 2. Contrato de endpoints tras la fase

Ninguno: esta fase no toca el backend (D-10.1).

## 3. Verificación

| CA | Cómo |
|---|---|
| CA-10.1 – CA-10.3 | Tests unitarios de `getTipOfTheDay` con fechas fijas: mismo día → mismo tip; día siguiente → puede cambiar; día `length + 1` → vuelve al primero. |
| CA-10.4 – CA-10.6 | Tests unitarios de `calculateCarbs` (25 y 80 → 20 g y 2 raciones) y del esquema del formulario (vacío, texto, negativo). |
| CA-10.7, CA-10.8 | Recorrido en dispositivo. |
| CA-10.9 | Recorrido en dispositivo con el backend apagado: las tres pantallas deben verse iguales que con el backend arriba. |

## 4. Riesgos

| Riesgo | Mitigación |
|---|---|
| El catálogo de tips se siente repetitivo con pocos elementos | RF-10.2 exige al menos 15; ampliarlo después es agregar strings, sin migración ni deploy de backend. |
| La calculadora no reemplaza el criterio médico | El resultado es una operación aritmética simple, sin ninguna recomendación de dosis; el alcance lo dice explícito. |
| Mezclar contenido estático con las demás funcionalidades que sí llaman al backend | `education/` no tiene `api.ts` a propósito (D-10.1): cualquier código nuevo que necesite el backend en el futuro (p. ej. contenido editable) es una spec aparte que sí lo agregaría. |
