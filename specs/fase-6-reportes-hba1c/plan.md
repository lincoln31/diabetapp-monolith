# Plan técnico F6 — Reportes exportables y proyección de HbA1c

Implementa: [spec.md](spec.md) · Tareas: [tasks.md](tasks.md)

## 1. Decisiones

### D-6.1 Endpoint separado para la proyección de HbA1c

`GET /api/glucose/hba1c`, sin parámetros. Se mantiene separado de `GET /api/glucose/stats` (en vez de agregarle un cuarto periodo) porque:
- Conceptualmente son features distintas (issues distintos: #19/#20 vs. #49/#50).
- `/glucose/stats` ya tiene un contrato publicado desde la fase 5; no hace falta tocarlo para esto.
- Cada tarjeta del dashboard pide sus propios datos (ver D-6.7) — mantiene la promesa de RF-5.14 de que sumar una tarjeta es añadir una pieza, no acoplar endpoints.

Contrato de la respuesta (`data`):

```jsonc
{
  "average90": 142.3,        // number | null — promedio de los últimos 90 días
  "sampleCount": 47,         // cantidad de lecturas usadas
  "sufficientData": true,    // false si sampleCount < umbral (D-6.2)
  "projectedHba1c": 6.4,     // number | null — null si sufficientData es false
  "targetHba1c": 6.5         // number | null — User.targetHba1c, tal cual
}
```

### D-6.2 Fórmula y umbral mínimo (resuelve la aclaración de la spec §8)

Fórmula ADAG estándar (Nathan et al., *Translating the A1C Assay*, Diabetes Care 2008):

```
HbA1c (%) = (promedio_mg/dL + 46.7) / 28.7
```

- Ventana: últimos 90 días completos desde el momento de la petición, sobre `timestamp` (igual criterio que RF-5.2 de la fase 5).
- Umbral: `sampleCount >= 10` para considerar el dato confiable (`sufficientData: true`). Con menos, `average90`, `projectedHba1c` quedan en `null` pero `sampleCount` sigue informando cuántas hay, para que el frontend pueda decir «te faltan N lecturas» si quiere.
- Se redondea `projectedHba1c` a un decimal (igual que `average` en `/glucose/stats`).

Es una fórmula documentada y aislada en una función pura `projectHba1c(readings)`, igual que `summarize`/`calculateTrend` de la fase 5 — cambiar el umbral o la fórmula más adelante no toca el resto del endpoint.

### D-6.3 Cálculo en una sola consulta

Mismo patrón que `GlucoseService.getStats` (D-5.2 de la fase 5): una consulta trae `value` y `timestamp` de los últimos 90 días (aprovecha el índice `(userId, timestamp)`), y una función pura calcula el promedio y la proyección en memoria. Una segunda consulta (o la misma transacción) trae `targetHba1c` del usuario.

```ts
async getHba1cProjection(userId: string): Promise<Hba1cProjection> {
  const since90 = daysAgo(90);
  const [readings, user] = await prisma.$transaction([
    prisma.glucoseReading.findMany({
      where: { userId, timestamp: { gte: since90 } },
      select: { value: true },
    }),
    prisma.user.findUniqueOrThrow({ where: { id: userId }, select: { targetHba1c: true } }),
  ]);

  return { ...projectHba1c(readings), targetHba1c: user.targetHba1c };
}
```

### D-6.4 Generación de reportes: CSV a mano, PDF con `pdfkit`

- **CSV** (RF-6.5): se construye con código propio (unas pocas líneas: encabezado + una fila por lectura, separador `,`, comillas si una nota contiene `,` o `"`). No hace falta ninguna dependencia nueva (principio P8).
- **PDF** (RF-6.6): se usa **`pdfkit`** (`npm install pdfkit` + `@types/pdfkit`). Generar un PDF con tabla, cabecera y paginación a mano no es razonable con "poco código propio y claro" (P8 lo permite cuando el problema lo justifica); `pdfkit` es una librería madura, sin dependencias nativas, que genera el PDF por streaming directo a la respuesta HTTP (no hace falta un archivo temporal en disco).
- Ambos endpoints comparten una consulta: traer **todas** las lecturas del usuario (`select: { value, timestamp, momentOfDay, notes }`, `orderBy: timestamp asc`) y el `firstName`/`lastName` del usuario para la cabecera del PDF.
- Content-Type y nombre de archivo:
  - CSV: `Content-Type: text/csv; charset=utf-8`, `Content-Disposition: attachment; filename="glucosa-<fecha>.csv"`.
  - PDF: `Content-Type: application/pdf`, `Content-Disposition: attachment; filename="glucosa-<fecha>.pdf"`.

### D-6.5 Rutas

```
GET /api/glucose/hba1c          → getHba1cProjectionController
GET /api/glucose/export/csv     → exportGlucoseCsvController
GET /api/glucose/export/pdf     → exportGlucosePdfController
```

Las tres van **antes** de `GET /api/glucose/:id` en `glucose.routes.ts` (mismo motivo que `/stats` en la fase 5, D-5.4: si no, Express interpretaría `hba1c`/`export` como un `:id`).

### D-6.6 Frontend: guardar y compartir el archivo (resuelve la aclaración de la spec §8)

El proyecto no tiene hoy ninguna forma de escribir ni compartir archivos fuera del sandbox de la app. Se agregan dos dependencias nuevas, el patrón estándar de Expo para este caso exacto:

- **`expo-file-system`**: escribe la respuesta del backend (texto para CSV, base64 para PDF) en un archivo temporal dentro del sandbox de la app.
- **`expo-sharing`**: abre la hoja de compartir del sistema sobre ese archivo (guardar en Drive/Archivos, enviar por WhatsApp/correo, etc.) — es la forma nativa en iOS/Android de "exportar" sin necesitar permisos de almacenamiento amplios.

Flujo (`useExportReport(format)`):
1. `get<string>('/glucose/export/csv', { responseType: 'text' })` o `get<string>('/glucose/export/pdf', { responseType: 'arraybuffer' })` sobre el cliente ya autenticado (`shared/api/client.ts`) — el CSV se guarda tal cual; el PDF se convierte a base64 antes de escribirlo.
2. `FileSystem.writeAsStringAsync(path, contenido, { encoding: format === 'pdf' ? Base64 : UTF8 })`.
3. `Sharing.shareAsync(path)`.
4. Si `Sharing.isAvailableAsync()` es `false` (poco común, algunos emuladores), se avisa con `showError`-like feedback en vez de fallar en silencio.

`shared/api/client.ts` gana un modo de respuesta binaria/texto sin tocar el contrato ya tipado de `get<T>` (se añade un helper específico, p. ej. `getFile(url, responseType)`, en vez de sobrecargar `get` con casos especiales — mantiene el resto de la app sin cambios).

### D-6.7 Estructura del frontend

Cada tarjeta nueva gestiona sus propios datos, igual que planteaba RF-5.14 de la fase 5:

```
src/features/dashboard/
├── api.ts                       # + hba1cApi.getProjection(), + exportApi.download(format)
├── types.ts                     # + Hba1cProjection
├── hooks/
│   ├── useDashboardStats.ts     # (fase 5, sin cambios)
│   ├── useHba1cProjection.ts    # mismo patrón que useDashboardStats, su propio loading/error
│   └── useExportReport.ts       # estado de la exportación (idle/loading/error), sin polling
├── components/
│   ├── GlucoseAveragesCard.tsx  # (fase 5, sin cambios)
│   ├── EmptyState.tsx           # (fase 5, sin cambios)
│   ├── Hba1cCard.tsx            # RF-6.9 – RF-6.11
│   └── ExportReportButton.tsx   # RF-6.12 – RF-6.14: botón + selector CSV/PDF
├── screens/DashboardScreen.tsx  # suma <Hba1cCard /> y <ExportReportButton /> a la lista de tarjetas
└── index.ts
```

`Hba1cCard` no se muestra si `status === 'empty'` del dashboard general (no tiene sentido proyectar HbA1c en una cuenta sin ninguna lectura); si hay lecturas pero por debajo del umbral de 90 días, muestra el mensaje de "datos insuficientes" (RF-6.10) en vez de ocultarse, para que el paciente entienda que le faltan registros.

`ExportReportButton` se ubica al final de la lista de tarjetas (fuera del `ScrollView` de datos, junto a «Registrar glucosa»/«Cerrar sesión»): abre un `Alert`/hoja simple con dos opciones (CSV / PDF) y dispara `useExportReport`.

## 2. Contrato de endpoints tras la fase

| Método y ruta | Auth | Entrada | Éxito |
|---|---|---|---|
| `GET /api/glucose/hba1c` | Sí | — | `{ average90, sampleCount, sufficientData, projectedHba1c, targetHba1c }` |
| `GET /api/glucose/export/csv` | Sí | — | Archivo `text/csv` (descarga) |
| `GET /api/glucose/export/pdf` | Sí | — | Archivo `application/pdf` (descarga) |

## 3. Verificación

| CA | Cómo |
|---|---|
| CA-6.1, CA-6.2, CA-6.3 | Tests de integración: usuario con ≥ 10 lecturas en 90 días, usuario con menos, dos usuarios distintos. |
| CA-6.4 | Test de integración: pedir `/export/csv`, parsear la respuesta y comprobar filas/columnas. |
| CA-6.5 | Test de integración: pedir `/export/pdf`, comprobar `Content-Type` y que el buffer empieza con la cabecera `%PDF-`. |
| CA-6.6 | Mismos tests anteriores con un usuario recién registrado, sin lecturas. |
| CA-6.7, CA-6.8 | Expo Go en dispositivo: cuenta con ≥ 10 lecturas en 90 días, cuenta con menos. |
| CA-6.9 | Expo Go en dispositivo: tocar «Exportar reporte», elegir CSV y PDF, confirmar que se abre la hoja de compartir del sistema. |
| CA-6.10 | Expo Go en dispositivo con el backend apagado: tocar «Exportar reporte» y confirmar el mensaje de error. |

## 4. Riesgos

| Riesgo | Mitigación |
|---|---|
| La fórmula ADAG es una estimación, no un valor de laboratorio | Se etiqueta explícitamente en la UI como «proyección estimada», nunca como un resultado clínico. |
| `pdfkit` agrega peso al bundle del backend | El backend no tiene límite de tamaño de bundle (no es código que viaje al celular); impacto solo en `npm install` y en el tamaño de la imagen de despliegue. |
| `expo-file-system`/`expo-sharing` son dependencias nuevas del lado del celular | Ambas son paquetes oficiales de Expo (mismo mantenedor que el resto de `expo-*` ya instalados), sin dependencias nativas adicionales más allá de las que Expo ya gestiona. |
| Generar el PDF completo en memoria con miles de lecturas | `pdfkit` escribe por streaming a la respuesta; no arma el PDF completo en un buffer antes de enviarlo. Si en el futuro hace falta paginar el reporte, se puede acotar por rango de fechas sin cambiar el contrato del endpoint. |
| El umbral de 10 lecturas en 90 días es arbitrario | Aislado en una constante de `glucose.hba1c.ts`; cambiarlo no afecta el resto del cálculo ni el contrato de la respuesta. |
