# Auditoría UX de DiabetApp

Método: `diseñador_ux.md` (UX primero, UI después). Evidencia: lectura del código de las 15 pantallas, mediciones sobre el código y los recorridos en el celular (moto g34 5G, Android 15) de las fases 5–14. **No se ha cambiado nada todavía.**

Prioridades: **P0** bloquea o rompe una tarea · **P1** problema grave de usabilidad · **P2** importante · **P3** mejora secundaria · **P4** detalle visual.

## 1. Usuario y tareas

**Usuario:** persona que vive con diabetes y se controla a diario, con edades muy distintas (incluye adultos mayores), a menudo con una sola mano, con prisa (antes de comer, con la glucosa alta o baja) y a veces con la vista cansada.

| Frecuencia | Tarea |
|---|---|
| **Varias veces al día** | Registrar glucosa · saber si estoy en rango · marcar una toma de medicación |
| **Diaria** | Ver cómo voy hoy (lecturas, tomas, ejercicio) |
| **Semanal / ocasional** | Revisar el historial y la tendencia · corregir un registro · ver logros · consultar educación · exportar el reporte para el médico |
| **Solo al configurar** | Perfil y metas · notificaciones · cuenta |

La tarea más frecuente y más urgente es **registrar glucosa en pocos segundos**. Todo el rediseño se mide contra ella.

## 2. Inventario

| Grupo | Pantallas (15) |
|---|---|
| Acceso | Iniciar sesión · Crear cuenta |
| Núcleo | Dashboard · Nueva medición de glucosa (modal) |
| Tratamiento | Mis medicamentos · Formulario de medicamento · Ejercicio · Registrar actividad · Cronómetro |
| Cuenta | Mi perfil · Notificaciones |
| Motivación / aprendizaje | Mis logros · Educación (hub) · Calculadora de carbohidratos · Guías y FAQs |

- **Navegación:** solo *stack*; todo cuelga del Dashboard. No hay navegación persistente.
- **Componentes compartidos:** `Button`, `Card`, `Input`, `Icon`, `Checkbox`, `FormError`, `Header` (solo acceso), `ScreenHeader`, `CloseButton`, `TimesField`.
- **Acciones sobre datos que existen en la API pero no en la app:** listar, editar y borrar lecturas de glucosa.

## 3. Hallazgos

### P0 — Bloquean una tarea

| # | Problema | Evidencia | Impacto | Solución |
|---|---|---|---|---|
| A1 | **No existe el historial de glucosa.** Se puede registrar pero no ver, corregir ni borrar una lectura. | `app/(app)/glucose/` solo tiene `new.tsx`; `glucoseApi.list/update/remove` no se usan en ninguna pantalla. | Un valor mal tecleado (p. ej. 1100 en vez de 110) queda para siempre y contamina promedios, HbA1c, racha y logros. El paciente tampoco puede revisar lo que registró. | Pantalla **Glucosa** con historial agrupado por día y editar/borrar con confirmación. |

### P1 — Problemas graves de usabilidad

| # | Problema | Evidencia | Impacto | Solución |
|---|---|---|---|---|
| A2 | **La acción principal está enterrada.** «Registrar glucosa» es el último bloque del Dashboard, tras hasta 6 tarjetas. | Capturas: con datos queda en y≈1240 de 1600 px (bajo el pliegue); en el estado vacío aparece **dos veces**. | La tarea más frecuente exige hacer scroll cada vez. | Acción primaria fija y visible arriba en «Hoy» y en «Glucosa». |
| A3 | **El Dashboard no tiene jerarquía ni navegación.** 8 botones con el mismo peso (`outline`) más 5–6 tarjetas apiladas; Perfil, Logros, Educación, Exportar y Cerrar sesión compiten con Registrar. «Cerrar sesión» está pegado a «Exportar reporte». | `DashboardScreen.tsx`; capturas de la fase 12. Cada función obliga a volver al Dashboard. | Carga cognitiva alta; acciones destructivas junto a acciones normales; sin sentido de «dónde estoy». | **Barra de pestañas** (Hoy · Glucosa · Medicación · Actividad · Más) y Dashboard reducido a lo que importa hoy. |
| A4 | **Falso enlace:** «¿Olvidaste tu contraseña?» parece un enlace y no hace nada. | `LoginScreen.tsx:111`: es un `<Text>` sin `onPress`. | El usuario toca y no pasa nada; genera desconfianza. No hay flujo de recuperación en el backend. | Quitarlo hasta que exista el flujo (o explicar cómo recuperarla). |
| A5 | **Contraste insuficiente en elementos clave** (referencia 4,5 : 1). | Calculado: azul primario sobre blanco **3,68** (botón principal, enlaces, botón *outline*); verde «Mejorando» **2,54**; ámbar **2,15**; gris 400 (placeholders, contador) **2,54**; error **3,76**; botón deshabilitado **3,28**. | Ilegible al sol, con vista cansada o para adultos mayores. | Paleta accesible (tokens) y estados con **icono + texto**, no solo color. |
| A6 | **Áreas táctiles pequeñas.** Los botones `small` miden ≈ 35–39 px de alto; el ✕ mide 32 px. | `Button.tsx` (`small`: 8 px de padding vertical). Se usan para *Editar*, **Borrar**, *Quitar*, *Agregar horario*, *Reintentar*, *Guardar horarios*. | Errores de toque, sobre todo con una mano; **Borrar** queda junto a contenido tocable. | Mínimo 48 px de alto (o `hitSlop` que lo garantice) y separación de las acciones destructivas. |
| A7 | **Sin manejo de áreas seguras.** | `react-native-safe-area-context` está instalado y se usa **0** veces; las cabeceras usan `paddingTop` fijo (10–30 px). | Riesgo de solaparse con la barra de estado, la cámara o la barra de gestos (en las capturas «Exportar reporte» quedaba pegado al borde). | `useSafeAreaInsets` en un contenedor de pantalla común. |

### P2 — Importantes

| # | Problema | Evidencia | Solución |
|---|---|---|---|
| A8 | **El registro de glucosa tiene fricción y valores por defecto erróneos.** «Momento del día» arranca en *Antes del desayuno* sin importar la hora; fecha, hora y «Usar fecha y hora actual» son **3 controles** para algo que casi siempre es «ahora»; notas y contador siempre visibles; una tarjeta fija «Normal: 70–140» **contradice** el rango personal del perfil (por defecto 80–180); al guardar aparece un `Alert` modal «¡Éxito!» que hay que cerrar. | `AddGlucoseScreen.tsx` | Valor grande arriba con teclado numérico; momento inferido de la hora; «Ahora» por defecto con «Cambiar»; notas plegadas; sin tarjeta de referencia; confirmación no bloqueante y regreso automático. |
| A9 | **Feedback inconsistente:** 8 `Alert.alert` (éxito bloqueante, confirmaciones, errores) mezclados con errores en línea. | `grep Alert.alert` | Un componente `Toast/Snackbar` para confirmaciones y `Alert` solo para acciones destructivas. |
| A10 | **Emojis como iconos e información:** 📅 🕐 ℹ️ 💪 🔒 🌟 👋 y «✕» como texto. | `AddGlucoseScreen`, `LoginScreen`, `RegisterScreen`, `DashboardScreen` | Iconografía única (`Icon`); el lector de pantalla los lee mal («reloj»). |
| A11 | **Accesibilidad casi ausente:** solo 6 de 44 archivos con `accessibilityLabel/Role`; 0 `Pressable` (20 `TouchableOpacity` sin rol); `Switch` y `Picker` sin etiqueta asociada; alturas fijas (`Input` 56, `Picker` 50) que pueden recortar con texto grande. | `grep` | Componentes base accesibles por defecto y prueba con texto al 200 %. |
| A12 | **Acceso con ruido y demasiados campos:** Login apila cabecera + tarjeta motivacional + formulario + tarjeta de seguridad; el registro muestra **8 campos** (nombre, apellido, correo, teléfono, fecha de nacimiento, contraseña, confirmación, términos) cuando el backend solo exige correo y contraseña. | `LoginScreen`, `RegisterScreen`, `auth.schemas.ts` | Registro mínimo (correo, contraseña, nombre y términos) y el resto se pide después, en el perfil. |
| A13 | **Inconsistencia de estructura y nombres:** cabeceras hechas de 4 formas (`Header`, `ScreenHeader`, cabecera propia en Glucosa/Perfil/Logros); títulos «Mi perfil», «Mis Logros», «Mis Medicamentos», «Ejercicio»; «Nueva Medición de Glucosa» vs. botón «Registrar Glucosa»; Glucosa se abre como modal y el resto por *push* sin criterio. | Capturas y código | Una sola cabecera, un vocabulario y un criterio de navegación. |
| A14 | **Estados incompletos y saltos de layout.** Cada tarjeta del Dashboard aparece o desaparece según su propia petición, así que la pantalla «salta» al cargar; solo hay spinner (sin *skeletons*); no hay *pull-to-refresh* fuera del Dashboard; el modo sin conexión no se distingue de otros errores. | `DashboardScreen.tsx` | Espacio reservado (*skeleton*), estado «sin conexión» explícito y refresco en las listas. |
| A15 | **No hay sistema de diseño en la práctica.** 13 tamaños de fuente distintos (12, 13, 14, 15, 16, 17, 18, 20, 24, 28, 32, 36, 64); espaciados fuera de escala (15, 14, 10, 6, 30, 50); radios y sombras a mano; colores sueltos (`#FEF3C7`, `#FFFBEB`). | `grep` sobre `src/` | Tokens de color, tipografía, espaciado, radio y elevación. |

### P3 — Mejoras secundarias

| # | Problema | Solución |
|---|---|---|
| A16 | **Sin gráfico de tendencia** del dato central de la app (la glucosa). Hoy solo hay números. | Un gráfico de línea simple en el historial (el documento lo permite cuando ayuda a comprender) con la tabla como alternativa. |
| A17 | **Información repetida en el Dashboard:** promedio de 7 días, tendencias de 14 y 30 días con «Sin datos suficientes» dos veces, proyección de HbA1c y adherencia compiten por el mismo espacio. | Resumen corto en «Hoy» y el detalle en «Glucosa». |
| A18 | El **consejo del día** ocupa el primer lugar, por encima de los datos del paciente. | Pasarlo al final o a «Educación». |
| A19 | `userInterfaceStyle: "automatic"` sin tema oscuro. | Declarar `light` hasta que exista un tema oscuro. |

### P4 — Detalles visuales

| # | Problema |
|---|---|
| A20 | Sombras en tarjetas y botones, bordes de 2 px en los botones *outline* y radios grandes: exceso de decoración para una app de salud. |
| A21 | Capitalización inconsistente («Registrar Glucosa» / «Registrar glucosa»). |

## 4. Lo que funciona y se conserva

- Validación **junto al campo** y mensajes claros en español (`applyServerErrors`, `FormError`).
- Estados de carga, vacío y error con **reintento** en casi todas las pantallas.
- `RangeAlert`: comunica el estado con **icono + texto + color**, no solo color.
- Flujos cortos en Medicación, Ejercicio y Notificaciones.
- Confirmación antes de acciones destructivas (archivar, borrar).
- Componentes con estados reales probados con tests y en dispositivo.

## 5. Revisión por pantalla (propósito · acción principal · veredicto)

| Pantalla | Propósito | Acción principal | Veredicto |
|---|---|---|---|
| Login | Entrar | Iniciar sesión | Correcto en esencia; ruido (A4, A10, A12) |
| Registro | Crear cuenta | Crear cuenta | Demasiados campos (A12) |
| Dashboard | Saber cómo voy hoy | Registrar glucosa | **Sin propósito claro**: mezcla resumen, atajos y ajustes (A2, A3, A17, A18) |
| Nueva glucosa | Guardar una lectura | Guardar medición | Fricción y defaults (A8) |
| Medicamentos | Ver/marcar tomas | Registrar toma | Bien; falta acceso desde «Hoy» |
| Form medicamento | Alta/edición | Guardar | Bien |
| Ejercicio / actividad / cronómetro | Registrar actividad | Registrar actividad | Bien; nombres inconsistentes (A13) |
| Perfil | Metas y datos | Guardar cambios | Formulario largo sin agrupar; botón «Notificaciones» perdido al final |
| Notificaciones | Elegir avisos | Interruptores | Bien |
| Logros | Motivar | — | Solo lectura; no accionable, ocasional |
| Educación (hub, calculadora, guías) | Aprender | — | Ocasional; bien resuelto |
