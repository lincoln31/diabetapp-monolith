# Tareas F15 — Rediseño UX de toda la app

Implementa: [plan.md](plan.md) · Ramas: `feat/fase-15a-fundaciones` … `feat/fase-15e-cierre`

`[P]` = paralelizable dentro del bloque.

## Bloque 0 — Aprobación

- [x] **T15.1** Resolver las 7 aclaraciones de la spec (§8) y anotarlas.

## 15A — Fundaciones (A4, A5, A6, A7, A10, A12, A15)

- [x] **T15.2** `theme/tokens.ts` (color, estado, tipografía, espaciado, radio, táctil) y `colors.ts` como alias temporal. — RNF-15.1, RNF-15.3 · depende de T15.1
- [x] **T15.3** `Screen` con áreas seguras, desplazamiento, refresco y teclado. — RF-15.13
- [x] **T15.4** `Button` (4 variantes, ≥ 48, *loading/disabled*, `Pressable`) y `Card` plana. — RNF-15.2, RNF-15.4
- [x] **T15.5** `Field/Input` con etiqueta encima, ayuda y error; `Chips`; `SwitchRow`/`ListRow`. — RNF-15.4
- [x] **T15.6** `Banner`, `StateView` (*skeleton*, vacío, error, sin conexión) y `Toast` con `useToast` montado en el layout raíz. — RF-15.9, RF-15.14
- [x] **T15.7** Sustituir emojis por `Icon` y ampliar el catálogo de iconos. — RF-15.15
- [x] **T15.8** Login sin tarjetas decorativas ni falso enlace; Registro con 4 campos (el resto pasa al perfil). — RF-15.11, RF-15.12
- [x] **T15.9** `userInterfaceStyle: "light"` en `app.json`. — A19
- [x] **T15.10 [P]** Tests de los componentes base (roles, alto ≥ 48, estados) y de Login/Registro. — CA-15.13, CA-15.14, CA-15.18
- [x] **T15.11** Verificar 15A (celular, development build). — CA-15.13 – CA-15.15, CA-15.18

## 15B — Navegación (A3, A13)

- [x] **T15.12** `(tabs)/_layout.tsx` con Hoy · Glucosa · Medicación · Actividad · Más; mover las pantallas existentes; conservar las URLs. — RF-15.1
- [x] **T15.13** Pantalla «Más» (Perfil y metas, Notificaciones, Logros, Educación, Exportar reporte, Cerrar sesión separada). — RF-15.2
- [x] **T15.14** Cabecera única (`ScreenHeader` sobre `Screen`) en todas las pantallas apiladas; vocabulario de títulos unificado. — RF-15.13
- [x] **T15.15** El Dashboard actual pasa a «Hoy» sin los botones de destino. — RF-15.3
- [x] **T15.16** Actualizar tests y *deep links* (`diabetapp://notifications`, etc.). — RNF-15.6
- [x] **T15.17** Verificar 15B (celular, navegación de 5 pestañas). — CA-15.1, CA-15.15

## 15C — Núcleo de glucosa (A1, A2, A8, A9, A14, A16, A17, A18)

- [x] **T15.18** `suggestMomentOfDay(date)` (pura) con tests. — RF-15.8
- [x] **T15.19** `GlucoseForm` (crear/editar): valor grande y enfocado, «Ahora» + «Cambiar», *chips* de momento, nota plegada, botón fijo abajo, `Toast` y cierre automático. — RF-15.8, RF-15.9
- [x] **T15.20** Ruta `glucose/[id]` (editar) con «Borrar medición» separada y confirmación. — RF-15.6
- [x] **T15.21** `buildChart` (pura) con tests y `GlucoseChart` con `react-native-svg` (+ descripción accesible). — RF-15.7
- [x] **T15.22** Pantalla **Glucosa**: período 7/30, resumen, gráfico y `SectionList` por día, paginación, estados. — RF-15.5, RF-15.10, RF-15.14
- [x] **T15.23** «Hoy» rediseñado: acción primaria, última lectura, bloque «Hoy» (lecturas, *Tomé*, ejercicio), «Esta semana»; *skeletons* de altura fija. — RF-15.3, RF-15.4, RF-15.14
- [x] **T15.24 [P]** Tests de componente: formulario (defaults, errores, guardado), historial (agrupación, editar, borrar), «Hoy» (vacío, con datos, *Tomé*). — CA-15.2 – CA-15.12
- [x] **T15.25** `make build` (react-native-svg) y verificar 15C en el celular. — CA-15.2 – CA-15.12, CA-15.16

## 15D — Tratamiento y cuenta (A13, A20, A21)

- [x] **T15.26** Medicación y su formulario en el sistema nuevo. — RF-15.13
- [x] **T15.27** Actividad (lista, formulario, cronómetro) en el sistema nuevo. — RF-15.13
- [x] **T15.28** Perfil agrupado por secciones (metas · datos médicos · notificaciones) con los campos que salen del registro (teléfono, fecha de nacimiento). — RF-15.11
- [x] **T15.29** Notificaciones, Logros, Educación (hub, calculadora, guías) en el sistema nuevo. — RF-15.13
- [x] **T15.30 [P]** Actualizar tests de estas pantallas. — RNF-15.6
- [x] **T15.31** Verificar 15D (celular).

## 15E — Cierre (A11, A14)

- [x] **T15.32** Auditoría de accesibilidad: `accessibilityRole/Label/State` en todos los controles, orden de foco, región *live* de los `Toast`. — RNF-15.4, CA-15.20
- [x] **T15.33** Prueba con texto del sistema al 200 % (celular): sin recortes reales; el único solape visto era la burbuja de herramientas de Expo (solo en desarrollo). — CA-15.17
- [x] **T15.34** Estados que falten (sin conexión, *skeletons*, refresco en listas). — RF-15.14
- [x] **T15.35** Limpieza: eliminar `COLORS`, componentes y estilos antiguos; regla de lint contra literales de estilo. — RNF-15.3, CA-15.19
- [x] **T15.36** Recorrido con TalkBack en el celular (activado por ADB): navegación fluida, confirmado por el usuario. — CA-15.1 – CA-15.20
- [x] **T15.37** `CLAUDE.md` (tokens, componentes, navegación) y `specs/README.md` (estado `Implementada`).

## Trazabilidad

| RF / RNF | Tareas | CA |
|---|---|---|
| RF-15.1, RF-15.2 | T15.12, T15.13 | CA-15.1 |
| RF-15.3, RF-15.4 | T15.15, T15.23 | CA-15.2 – CA-15.4 |
| RF-15.5, RF-15.6, RF-15.7 | T15.20 – T15.22 | CA-15.5 – CA-15.8 |
| RF-15.8, RF-15.9 | T15.18, T15.19 | CA-15.9 – CA-15.11 |
| RF-15.10 | T15.22 | CA-15.12 |
| RF-15.11, RF-15.12 | T15.8, T15.28 | CA-15.13, CA-15.14 |
| RF-15.13 | T15.3, T15.14, T15.26 – T15.29 | CA-15.15 |
| RF-15.14 | T15.6, T15.34 | CA-15.16 |
| RF-15.15 | T15.7 | CA-15.14 |
| RNF-15.1 | T15.2 | CA-15.19 |
| RNF-15.2 | T15.4 | CA-15.18 |
| RNF-15.3 | T15.2, T15.35 | CA-15.19 |
| RNF-15.4 | T15.4, T15.5, T15.32, T15.33 | CA-15.17, CA-15.20 |
