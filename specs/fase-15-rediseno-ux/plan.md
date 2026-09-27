# Plan F15 — Rediseño UX de toda la app

Implementa: [spec.md](spec.md) · Diagnóstico: [auditoria.md](auditoria.md) · Tareas: [tasks.md](tasks.md)

Sigue el orden de `diseñador_ux.md`: **flujos → arquitectura de información → jerarquía → interacción → sistema visual → implementación**. Este plan cubre las cinco primeras; los tokens y componentes de §5–§6 son la sexta.

## 1. Arquitectura de información y navegación (D-15.1)

Clasificación por frecuencia de uso (auditoría §1):

| Frecuencia | Funcionalidad | Dónde vive |
|---|---|---|
| Varias veces al día | Registrar glucosa · estado respecto al rango · marcar toma | **Hoy** (acción visible) |
| Diaria | Cómo voy hoy · medicación · ejercicio | **Hoy** (resumen) → detalle en su pestaña |
| Regular | Historial y tendencia · corregir | **Glucosa** |
| Regular | Lista de medicamentos y tomas · alta/edición | **Medicación** |
| Regular | Actividad y cronómetro | **Actividad** |
| Ocasional | Logros · Educación · Exportar reporte | **Más** |
| Configuración | Perfil y metas · Notificaciones · Cerrar sesión | **Más** |

**Barra de pestañas (5):** Hoy · Glucosa · Medicación · Actividad · Más. Cada una con icono (Ionicons, la familia que ya usa `Icon`) **y** etiqueta; la activa se distingue por color, peso y un indicador (no solo por color).

Estructura de rutas (Expo Router; las carpetas entre paréntesis no cambian la URL):

```
app/(app)/
├── _layout.tsx                 # Stack: (tabs) + pantallas sin barra
├── (tabs)/
│   ├── _layout.tsx             # Tabs
│   ├── index.tsx               # Hoy
│   ├── glucose/index.tsx       # Glucosa (historial)
│   ├── medications/index.tsx   # Medicación
│   ├── exercise/index.tsx      # Actividad
│   └── more.tsx                # Más
├── glucose/new.tsx             # Registrar (sin barra, se cierra al guardar)
├── glucose/[id].tsx            # Editar / borrar
├── medications/form.tsx · exercise/form.tsx · exercise/timer.tsx
└── profile.tsx · notifications.tsx · achievements.tsx · education/*
```

Criterio de navegación: **lo que se consulta vive en pestañas; lo que se hace o se configura se apila encima y oculta la barra** (formularios, cronómetro, perfil), con el botón de cierre en la cabecera. Las rutas públicas existentes (`/profile`, `/notifications`, `/medications`, …) y los *deep links* de la fase 13/14 se conservan.

## 2. Flujos clave (D-15.2)

```text
Registrar glucosa
Hoy ─▶ [Registrar glucosa] ─▶ valor (teclado numérico ya abierto)
  ─▶ (opcional: «Cambiar» hora · momento · nota)
  ─▶ [Guardar medición] ─▶ «Medición guardada · 112 mg/dL · en rango»
  ─▶ vuelve a Hoy, ya actualizado         (2–3 toques; hoy: 5–7 + un Alert)

Corregir una lectura
Glucosa ─▶ toca la fila ─▶ Editar medición (mismo formulario)
  ─▶ [Guardar cambios]                         o
  ─▶ [Borrar medición] (separada, destructiva) ─▶ confirmación ─▶ se quita y se recalcula

Marcar una toma
Hoy ─▶ «Medicación de hoy» ─▶ [Tomé] ─▶ «Toma registrada» ─▶ contador «1 de 2»
```

Pasos eliminados respecto a hoy: buscar el botón (scroll), elegir fecha y hora (3 controles), elegir el momento del día a mano, descartar el `Alert` de éxito.

## 3. Fichas de las pantallas críticas (D-15.3 a D-15.5)

Respuestas a las diez preguntas de «Revisión antes de implementar» de `diseñador_ux.md`.

### 3.1 Hoy

| Pregunta | Respuesta |
|---|---|
| Objetivo | Saber cómo voy hoy y actuar sin buscar. |
| Acción principal | **Registrar glucosa** (un solo botón dominante, arriba). |
| Información prioritaria | 1) última lectura y su estado; 2) lecturas de hoy frente a la meta; 3) tomas pendientes; 4) ejercicio de hoy; 5) resumen de la semana. |
| Qué se elimina | Consejo del día (→ Educación), HbA1c, adherencia de 30 días, tendencias de 14/30 días, y los 7 botones de destinos, Exportar y Cerrar sesión (→ pestañas y «Más»). |
| Cómo llega | Es la pestaña inicial tras iniciar sesión. |
| Qué hará después | Registrar, marcar una toma o ir al detalle (Glucosa/Medicación/Actividad). |
| Si falla | Cada bloque muestra su error con «Reintentar»; los demás siguen visibles. |
| Sin datos | Un único estado vacío con «Registrar mi primera glucosa». |
| Una mano | La acción principal y la barra de pestañas quedan en la mitad inferior/media; el resumen se lee sin tocar. |
| Mientras carga | *Skeletons* con la altura final de cada bloque (sin saltos de layout). |

Orden: `[Registrar glucosa]` → **Última lectura** (valor grande, hora, estado con icono + texto) → **Hoy** (lecturas X/4 · medicación con *Tomé* · ejercicio X/30 min) → **Esta semana** (promedio de 7 días, tendencia, racha; enlace «Ver historial»). Datos: los hooks ya existentes (`useDashboardStats`, `useStreak`, `useExerciseSummary`, `medicationsApi.list`) más la última lectura (`glucoseApi.list` con `limit=1`).

### 3.2 Glucosa (historial)

| Pregunta | Respuesta |
|---|---|
| Objetivo | Revisar, entender la tendencia y corregir lo registrado. |
| Acción principal | Registrar glucosa (botón fijo abajo) / tocar una fila para editar. |
| Información prioritaria | Período (7 / 30 días) · promedio, mínimo y máximo · gráfico · lista por día. |
| Se elimina | HbA1c y adherencia (no son de esta pantalla). «Exportar reporte» pasa a «Más». |
| Sin datos | «Aún no hay mediciones en este período» + acción de registrar. |
| Falla / sin conexión | Estado con «Reintentar»; si hay datos previos se muestran con un aviso de que pueden estar desactualizados. |

- **Datos:** `GET /api/glucose?from&limit=200` (paginado; el resumen y el gráfico se calculan sobre lo cargado y, si hay más de 200, se avisa «mostrando las últimas 200»). Lista con `SectionList` agrupada por día local.
- **Gráfico:** línea con `react-native-svg`: puntos por lectura, banda del rango objetivo, eje temporal simple. Función pura `buildChart(readings, size, target)` con tests; el gráfico lleva una descripción accesible («14 lecturas, promedio 112, entre 84 y 160») y **la lista siempre está debajo** como alternativa.
- **Fila:** valor + unidad · hora · momento del día · estado (icono + texto) · nota si existe. Área táctil ≥ 48 dp.

### 3.3 Registrar / editar glucosa

| Pregunta | Respuesta |
|---|---|
| Objetivo | Guardar una lectura en segundos. |
| Acción principal | **Guardar medición**, fija abajo (zona del pulgar). |
| Prioritario | El valor. Todo lo demás tiene un buen valor por defecto. |
| Se elimina | Tarjeta «Niveles de referencia», botón «Usar fecha y hora actual», contador de caracteres visible, `Alert` de éxito. |
| Defaults | Fecha/hora **Ahora** («Cambiar» abre los selectores); momento del día **sugerido por la hora** (función pura `suggestMomentOfDay`); notas plegadas («Agregar nota»). |
| Momento del día | Chips de una sola selección en lugar de `Picker` (un toque, todas las opciones visibles). |
| Si falla | Error junto al campo (rango 20–600) o en el formulario (red), sin perder lo escrito. |
| Mientras guarda | Botón con estado «Guardando…» y deshabilitado. |
| Edición | Mismo formulario precargado; abajo «Guardar cambios» y, **separada**, «Borrar medición» (destructiva, con confirmación). |

## 4. Reglas de interacción (D-15.6)

- **Un solo peso dominante por pantalla:** una acción primaria; el resto secundaria (contorno) o terciaria (texto).
- **Destructivo:** color de peligro, siempre con confirmación, nunca junto a la acción principal.
- **Feedback:** `Toast` no bloqueante para confirmaciones («Medición guardada»); `Alert` solo para confirmar acciones destructivas.
- **Estados:** cargando (*skeleton*), vacío (mensaje + acción), error (mensaje + «Reintentar»), sin conexión (aviso explícito), deshabilitado (con motivo cuando no es evidente).
- **Vocabulario:** verbos concretos («Guardar medición», «Guardar cambios», «Borrar medición», «Registrar toma»); nombres de pestañas y títulos iguales entre sí; mayúscula solo inicial.

## 5. Sistema de diseño (D-15.7)

Un único módulo `src/shared/theme/tokens.ts`; `colors.ts` queda como alias temporal durante la migración y se elimina en 15E.

| Grupo | Valores |
|---|---|
| **Color** | `primary #1D4ED8` (texto, botones, enlaces; 6,70 : 1) · `primarySoft #EFF6FF` · `accent #3B82F6` (solo no textual: barras, iconos ≥ 3 : 1) · `bg #F8FAFC` · `surface #FFFFFF` · `text #111827` (16,96) · `textMuted #4B5563` (7,56) · `border #D1D5DB` (decorativo) · `borderStrong #6B7280` (bordes de controles, 4,83) |
| **Estado** (texto / fondo) | éxito `#047857` / `#ECFDF5` (5,21) · aviso `#B45309` / `#FFFBEB` (4,84) · peligro `#B91C1C` / `#FEF2F2` (5,91) · información = primario. Siempre con icono y texto. |
| **Tipografía** (6 tamaños) | `display` 32/40 (valor de glucosa) · `title` 22/28 · `heading` 18/24 · `body` 16/24 · `label` 14/20 · `caption` 13/18. Sistema tipográfico del dispositivo; nada por debajo de 13. |
| **Espaciado** | 4 · 8 · 12 · 16 · 24 · 32 · 48 |
| **Radio** | 8 (controles) · 12 (tarjetas) · pastilla solo en chips |
| **Elevación** | Ninguna en tarjetas y botones (borde de 1 px); solo *toast* y menús |
| **Táctil** | Alto mínimo 48; `hitSlop` para iconos y acciones compactas |
| **Iconos** | Una sola familia (`Icon`/Ionicons); ningún emoji |

### Componentes base (`src/shared/components/ui/`)

| Componente | Notas |
|---|---|
| `Screen` | Área segura (`useSafeAreaInsets`), desplazamiento, refresco, teclado; sustituye a los `ScrollView` y `paddingTop` sueltos |
| `Button` | Variantes `primary`, `secondary`, `tertiary`, `destructive`; alto ≥ 48; estados *loading* y *disabled*; `Pressable` con rol y retroalimentación |
| `Card` | Superficie plana con borde, sin sombra |
| `Field` / `Input` | Etiqueta **encima** (no solo placeholder), ayuda, error junto al campo, sufijo/icono; alto flexible con texto grande |
| `Chips` | Selección única accesible (`radio`) |
| `ListRow` · `SwitchRow` | Filas táctiles ≥ 48 con etiqueta y estado |
| `Banner` | `info/success/warning/danger`, siempre icono + texto |
| `StateView` | `Loading` (*skeleton*), `Empty`, `Error`, `Offline` |
| `Toast` (+ `useToast`) | No bloqueante, `accessibilityLiveRegion` |
| `ScreenHeader` | Cabecera única con cierre/atrás y área segura |

**Migración:** primero se crean tokens y componentes nuevos (15A) conviviendo con los actuales; cada etapa migra sus pantallas; al final (15E) se borran los componentes y `COLORS` antiguos. Los tests existentes se actualizan con cada pantalla.

## 6. Etapas de implementación (D-15.8)

| Etapa | Contenido | Cierra |
|---|---|---|
| **15A** Fundaciones | Tokens, componentes base, `Toast`, `Screen`/áreas seguras, reemplazo de emojis, `userInterfaceStyle: light`; **Login y Registro** (registro mínimo, sin falso enlace ni tarjetas decorativas) | A4, A5, A6, A7, A10, A12, A15, A19 (parcial) |
| **15B** Navegación | `(tabs)`, «Más», cabecera única, pantallas movidas a su pestaña; el Dashboard actual pasa a «Hoy» sin botones de destino | A3, A13 |
| **15C** Núcleo de glucosa | «Hoy» rediseñado, **historial + gráfico**, registrar/editar/borrar, `suggestMomentOfDay` | A1, A2, A8, A9, A14, A16, A17, A18 |
| **15D** Tratamiento y cuenta | Medicación (con *Tomé* en «Hoy»), Actividad, Perfil agrupado, Notificaciones, Logros, Educación en el sistema nuevo | A13, A20, A21 |
| **15E** Cierre | Accesibilidad (etiquetas, texto al 200 %), estados que falten (sin conexión, *skeletons*), limpieza de lo antiguo, revisión final con la lista de `diseñador_ux.md`, recorrido completo en el celular | A11, A14 |

Cada etapa: rama y PR propios, tests/lint/`tsc` en verde y verificación en el celular antes de fusionar.

## 7. Verificación

| CA | Cómo |
|---|---|
| CA-15.1 – CA-15.4, CA-15.15, CA-15.16 | Recorrido en el celular |
| CA-15.5 – CA-15.7, CA-15.9 – CA-15.12 | Tests de componente (con la API simulada) + recorrido |
| CA-15.8 | Tests unitarios de `buildChart` + recorrido |
| CA-15.9 | Test unitario de `suggestMomentOfDay` |
| CA-15.13, CA-15.14 | Tests de componente de Login y Registro |
| CA-15.17 | `adb shell settings put system font_scale 2.0` y recorrido |
| CA-15.18 | Prueba de componentes base (alto ≥ 48) + medición en dispositivo |
| CA-15.19 | Regla ESLint o `grep` en CI: sin literales de estilo fuera de `tokens.ts` |
| CA-15.20 | TalkBack en «Hoy» y «Registrar glucosa» |

## 8. Riesgos

| Riesgo | Mitigación |
|---|---|
| Alcance muy grande (15 pantallas, sistema nuevo) | Cinco etapas con PR propio; cada una deja la app funcionando |
| Reestructurar rutas rompe *deep links* y tests | Las URLs públicas se conservan (grupos entre paréntesis); se actualizan los tests junto a cada pantalla |
| `react-native-svg` es una dependencia nativa | Viene con Expo; en la *development build* exige un `make build` una vez |
| Cambio visible de marca (azul más oscuro) | Aprobado como decisión; el azul actual sigue como acento |
| Los tests dependen de textos y roles actuales | Se migran por pantalla; los nuevos usan roles accesibles |
| Cambio de textos rompe la memoria del usuario | Vocabulario unificado y documentado; sin cambios de significado |
