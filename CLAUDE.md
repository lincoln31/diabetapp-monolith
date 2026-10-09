# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Visión general

DiabetApp es una app móvil para el seguimiento de la diabetes (lecturas de glucosa, perfil médico, metas). Monorepo con dos proyectos independientes, cada uno con su propio `package.json` y `node_modules` (no hay workspaces):

- `diabetapp-backend/` — API REST: Express 5 + TypeScript (CommonJS) + Prisma + PostgreSQL, validación con Zod 4, JWT + bcrypt.
- `diabetapp-frontend/` — App Expo (SDK 57, React Native 0.86, React 19.2) con Expo Router, Axios y AsyncStorage.

El código, los comentarios y los mensajes al usuario están en español.

## Proceso de trabajo

El plan de mejora se sigue con especificaciones (SDD) en `specs/`: `specs/README.md` explica el flujo (spec → plan → tareas → implementación → verificación) y `specs/constitucion.md` los principios obligatorios. Antes de cambiar arquitectura, contrato de API o estructura de carpetas, consulta la spec de la fase correspondiente; si el cambio no está previsto, actualiza primero la spec.

La CI (`.github/workflows/ci.yml`) ejecuta en cada PR hacia `Develop` o `main`: formato, lint, tipos, migraciones y tests, en dos trabajos (`backend` y `frontend`). Node se fija con `.nvmrc`.

## Comandos

### Probar en el celular por USB (desde la raíz)

Requiere `make` (`winget install ezwinports.make`), Docker Desktop y la **depuración USB** activada en el celular Android. Se ejecuta desde Git Bash.

```bash
make doctor          # comprueba Node, Docker, dependencias y si el celular está listo
make up              # PostgreSQL + backend + app en el celular (Metro queda en primer plano)
make build           # compila e instala la development build (solo para notificaciones; la 1.ª vez tarda)
make up DEV_CLIENT=1 # igual que make up, pero abre la development build en vez de Expo Go
make release         # app standalone contra producción: funciona sola, sin PC ni Metro (spec fase 16)
make logs            # en otra terminal: logs del celular (JS y errores), también en .logs/device.log
make report          # guarda .logs/report-<fecha>.txt con celular, backend y Docker
make stop            # detiene backend y Metro (make down también apaga PostgreSQL)
make help            # lista completa
```

- El celular se conecta por **WiFi**: debe estar en la misma red que el PC. `make doctor`/`make app` detectan la IP del PC en la red local (`Get-NetIPAddress`; se puede fijar con `LAN_IP=<ip>`) y arrancan Metro con `--lan`, pasando `EXPO_PUBLIC_API_URL=http://<ip-del-pc>:3000/api` y `--clear` (Metro cachea la URL ya incrustada en el bundle). Se eligió WiFi en vez de `adb reverse` porque el túnel USB fue inestable en pruebas (`ERR_EMPTY_RESPONSE` intermitente); `make reverse` queda como alternativa si el celular no puede unirse a la red del PC.
- **Expo Go y el SDK**: Expo Go solo abre proyectos de su propio SDK y la Play Store instala siempre la última, así que el proyecto debe seguir al SDK más reciente (hoy 57). `make doctor` avisa si el Expo Go del celular es de otro SDK; en ese caso `make app` ofrece instalar la versión correcta (responde Y) y, si falla por ser una versión anterior, `make reinstall-expo-go` desinstala la actual.
- **Development build** (spec fase 14): `expo-notifications` **no se puede importar en Expo Go** (Android, SDK 53+), así que los avisos solo funcionan en la build propia con `expo-dev-client` (`com.diabetapp.app`). Expo Go sigue siendo el modo por defecto para todo lo demás. `make build` usa el JDK de Android Studio (sin instalar otro; `JAVA_HOME`/`ANDROID_HOME` solo dentro del script) y el NDK lo descarga Gradle. **Se compila en una copia mínima con ruta corta (`BUILD_DIR`, por defecto `C:/dpb`)**: con la ruta del repo, CMake/Ninja fallan en Windows (`ninja: manifest 'build.ninja' still dirty after 100 tries`) y `subst` no sirve (Node resuelve la ruta real). Las carpetas `android/` e `ios/` se generan con `expo prebuild` y están ignoradas por git; cambiar `app.json`/`package.json` las regenera en el siguiente `make build`. Para borrar `C:/dpb` (rutas largas) usa PowerShell con el prefijo `\\?\C:\dpb`.
- **Depuración USB**: Android revoca la autorización tras un tiempo. Si `make doctor` dice `unauthorized`, desbloquea el celular y acepta «Permitir depuración USB» (marca «Permitir siempre»).
- Con varios celulares conectados: `make up SERIAL=<id>` (el id sale de `make devices`).
- La lógica vive en `scripts/dev.sh` (también usable sin make: `bash scripts/dev.sh doctor`); el Makefile solo enruta, porque `make` en Windows rompe acentos y emojis al pasar texto a bash. `.gitattributes` fuerza saltos de línea LF en ambos.
- `adb logcat` se **cuelga** con un celular sin autorizar (no falla): por eso los comandos de logs comprueban antes el estado del dispositivo.
- Los logs quedan en `.logs/` (ignorado por git).

### Backend (`cd diabetapp-backend`)

```bash
docker compose up -d        # PostgreSQL en localhost:5433 (user/password, db diabetapp_dev)
npm run dev                 # nodemon + ts-node sobre src/server.ts (puerto 3000 o $PORT)
npm run build               # tsc -> dist/
npm start                   # node dist/server.js
npx prisma migrate dev --name <nombre>   # crear/aplicar migración tras editar schema.prisma
npx prisma generate         # regenerar el cliente
npx prisma studio
npx ts-node prisma/seed-perf.ts <email>   # solo local: 10 000 lecturas para medir rendimiento
```

Requiere `.env` (ignorado por git; parte de `env.example`) con `DATABASE_URL` (p. ej. `postgresql://user:password@localhost:5433/diabetapp_dev`) y `JWT_SECRET`.

```bash
npm test                     # jest: tests de integración contra diabetapp_test
npm test -- -t "login"       # un test concreto por su nombre
npm test -- --coverage       # cobertura (umbral: 80 % de líneas)
npm run lint                 # eslint con tipos
npm run typecheck            # tsc --noEmit
npm run format:check         # prettier
```

Los tests usan `.env.test` y la base `diabetapp_test` del mismo contenedor; cada test arranca con las tablas vacías. `requests.http` sirve para probar a mano.

### Frontend (`cd diabetapp-frontend`)

```bash
npm start            # expo start
npm run android | ios | web
npm run lint         # expo lint (eslint-config-expo + reglas de dependencia)
npm run typecheck    # tsc --noEmit
```

```bash
npm test                     # jest-expo + @testing-library/react-native
npm run format:check         # prettier
```

Requiere `.env` con `EXPO_PUBLIC_API_URL` (parte de `.env.example`).

### Backend en producción (spec fase 16)

El backend ya está desplegado en `https://diabetapp-backend.onrender.com` (`/api` es el prefijo de siempre, p. ej. `.../api/health`), verificado con registro y login reales contra la base de Neon. El backend puede correr fuera del PC, gratis: **Render** (Web Service, blueprint en `render.yaml` de la raíz) + **Neon** (Postgres administrado; se eligió sobre el Postgres gratuito de Render porque ese expira y el de Neon no). El despliegue es automático al hacer push a `main` (`autoDeploy: true` en el blueprint). El plan gratuito de Render **no admite** `preDeployCommand` (falla el Blueprint con "pre-deploy command is not supported for free tier services": es solo de los planes pagos), así que la migración va en `startCommand` (`npx prisma migrate deploy && npm start`); es seguro porque `migrate deploy` no hace nada si el esquema ya está al día. Crear las cuentas y pegar los secretos en el panel de Render es manual (no lo puede hacer el asistente) — ver `specs/fase-16-infraestructura/plan.md`, «Pasos manuales».

**`NODE_ENV=production` durante el build rompe `npm ci`**: esa variable está presente también al construir, no solo al ejecutar, y `npm ci` la respeta saltándose **todas** las `devDependencies` — `typescript`, los `@types/*` y `prisma` (el CLI) lo son, así que el build fallaba (primero por `@types/jest`, corregido quitando `"jest"` de `types` en `tsconfig.build.json`; después por `@types/express`/`@types/jsonwebtoken`, que sí hacían falta de verdad). El `buildCommand` de `render.yaml` usa `npm ci --include=dev` para forzar la instalación sin importar `NODE_ENV`.

**`DATABASE_URL` vs `DIRECT_URL`**: Neon da por defecto una conexión con *pooler* (PgBouncer, host con `-pooler` en el nombre), que es la correcta para las consultas normales pero que `prisma migrate` no puede usar (PgBouncer en modo *transaction* no soporta los bloqueos que usan las migraciones). Por eso `schema.prisma` declara `directUrl = env("DIRECT_URL")` además de `url = env("DATABASE_URL")`: en producción, `DATABASE_URL` lleva el host con `-pooler` y `DIRECT_URL` la misma cadena sin ese sufijo; en local y en tests valen lo mismo (no hay *pooler*). Si falta `DIRECT_URL`, `prisma generate`/`validate`/`migrate` fallan con `Environment variable not found: DIRECT_URL`, aunque la app nunca la lea directamente (Prisma Client en tiempo de ejecución solo usa `url`).

Para probar la app contra ese backend en vez del PC local, cambia `EXPO_PUBLIC_API_URL` en `diabetapp-frontend/.env` a la URL pública (termina en `/api`) y reinicia `npm start`; no hace falta `make up` ni Docker. El plan gratuito de Render "duerme" el servicio tras ~15 min sin tráfico: la primera petición después de eso tarda unos 30-50 s (*cold start*), es un trade-off aceptado, no un bug.

**`make release`: app standalone, sin PC ni Metro** (spec fase 16). Instala en el celular una build que trae el JavaScript empaquetado adentro y `EXPO_PUBLIC_API_URL` fija al backend de producción (`API_URL=<otra-url> make release` para apuntar a otra); a diferencia de `make build` (development build: siempre necesita Metro para el JS), esta funciona sola, sin el PC ni su WiFi — verificado apagando Metro y abriendo la app desde el ícono. Dos particularidades encontradas al implementarla:
- `sync_build_dir` (en `scripts/dev.sh`) copiaba a `BUILD_DIR` (`C:/dpb`) solo config y assets, nunca `app/`/`src/`: bastaba para las development builds (cargan el JS en vivo desde Metro, corriendo en el repo real), pero la build release empaqueta el JS como parte del build de Gradle **leyendo el código de esa copia** — sin él, el bundle queda vacío y la app se cae con `Error: No routes found` al abrirla. Ahora `sync_build_dir` también sincroniza `app/`, `src/` y `tsconfig.json` en cada build.
- El build release se quedaba sin memoria en el *dexing* (`mergeDexRelease`, `OutOfMemoryError: Java heap space`): el debug no minifica ni optimiza tanto, así que no lo sufre. Como `android/` se regenera con `expo prebuild` en cualquier cambio relevante de `app.json`/`package.json`, la memoria de Gradle no puede fijarse a mano en `android/gradle.properties` (se perdería); `diabetapp-frontend/plugins/withGradleHeap.js` es un plugin de Expo (`withGradleProperties`) que sube `org.gradle.jvmargs` a 4096m en cada prebuild, registrado en `app.json`.
- Firma con el keystore de debug (no hay uno de release configurado): sirve para instalarla por USB, no para subirla a la Play Store — coherente con la decisión de la fase 16 de no distribuir todavía.

**Actualizar el SDK de Expo** (se hizo 53 → 57): sube de uno en uno (`npm install expo@^N.0.0`, `npx expo install --fix`, `npx expo-doctor`), lee las notas de cada SDK y comprueba tipos, lint, tests y `npx expo export --platform android` en cada salto. Si el árbol queda mal hoisteado, borra `node_modules` y `package-lock.json` y reinstala. Particularidades vigentes:

- `.npmrc` con `legacy-peer-deps=true`: `datetimepicker` declara un peer opcional (`react-native-windows`) que choca con el React fijado por Expo. Efecto colateral: npm **no instala los peers solos**, así que los que hagan falta van explícitos (`test-renderer`, `expo-asset`, `react-native-worklets`). `npx expo-doctor` valida la compatibilidad real.
- `@react-native/jest-preset` debe tener **la misma versión que `react-native`** (se actualiza a mano con cada salto).
- `tsconfig.json` declara `"types": ["jest"]`: TypeScript 6 ya no incluye automáticamente los `@types/*`.
- No instalar `@react-navigation/*` (expo-router ya no es compatible) ni `expo-modules-core` (doctor lo rechaza).
- Los tests con `waitFor` usan 5 s de margen: con la caché de Jest fría (siempre en la CI) el primer render supera el segundo por defecto.

## Arquitectura del backend

```
src/
├── app.ts                 # crea la app Express (sin escuchar): logger → cors → json → módulos → notFound → errorHandler
├── server.ts              # solo hace listen
├── config/                # env.ts (única lectura de process.env, validada con Zod) y db.ts (PrismaClient)
├── shared/
│   ├── errors/            # errorCodes.ts (catálogo) y AppError
│   ├── http/respond.ts    # ok(res, data, { status, meta })
│   └── middleware/        # authenticate, validate, errorHandler, notFound, requestLogger
├── modules/
│   ├── index.ts           # registerModules(): una línea por módulo
│   └── <dominio>/         # <d>.routes.ts → <d>.controller.ts → <d>.service.ts + <d>.schemas.ts
└── types/express.d.ts     # req.user y req.validated
```

- **Contrato de API**: éxito `{ success: true, data, meta? }`; error `{ success: false, error: { code, message, fields? } }`. Un `field` vacío dentro de `fields` significa que el error es del formulario completo, no de un campo.
- **Códigos de error** (`shared/errors/errorCodes.ts`): `VALIDATION_ERROR` 400; `INVALID_CREDENTIALS`, `UNAUTHENTICATED` y `TOKEN_EXPIRED` 401; `FORBIDDEN` 403; `NOT_FOUND` 404; `EMAIL_IN_USE` y `CONFLICT` 409; `INTERNAL_ERROR` 500. La app decide por `code`, nunca por el mensaje ni por el status.
- **Errores**: cualquier capa lanza `new AppError('CODIGO')` y el `errorHandler` lo traduce (mapea Prisma P2002 → `CONFLICT` y P2025 → `NOT_FOUND`). Los controladores **no** llevan `try/catch`: Express 5 envía al manejador las promesas rechazadas.
- **Validación**: `validate({ body, query, params })` en la ruta. El `body` validado reemplaza a `req.body`; query y params se leen con `validatedQuery<T>(req)` y `validatedParams<T>(req)`, porque en Express 5 son de solo lectura. Los tipos se infieren del esquema con `z.infer`.
- **Módulos**: `health`, `auth` (register, login, refresh, logout, me) y `glucose` (CRUD en `/api/glucose` con `?from&to&page&limit` y `meta` de paginación; `GET /api/glucose/stats` con los promedios de 7/14/30 días para el dashboard — spec fase 5; `GET /api/glucose/hba1c` con la proyección de HbA1c sobre el promedio de 90 días, y `GET /api/glucose/export/{csv,pdf}` con el historial completo descargable — spec fase 6, con `pdfkit` para el PDF; `GET /api/glucose/streak` con la racha de días seguidos, la mejor racha y el avance de hoy contra la meta diaria — spec fase 8: la base agrupa por día local del usuario según `User.timezone`, la racha se calcula en `glucose.streak.ts` sobre esa lista y no se guarda; sigue viva hasta que termina el día en curso; `insulinUnits` en cada lectura, opcional (0.5–100), para anotar cuánta insulina rápida se aplicó junto a esa medición — spec fase 19, el efecto sobre la siguiente lectura se calcula en el frontend, no aquí). `achievements` (`GET /api/achievements`: catálogo fijo de 6 logros — racha de 3/7/30 días, 10/50/100 lecturas en total — spec fase 9; sin tabla en la BD, el desbloqueo se recalcula en cada petición porque ninguna de las dos métricas baja con el tiempo). `medications` (`/api/medications`: CRUD de medicamentos con horarios `HH:mm` — "dejar de usar" **archiva** (`active=false`) para conservar las tomas —, `POST /:id/intakes` para registrar una toma y `GET /adherence` con el % de 7/30 días; esperadas = horarios × días desde que se creó el medicamento, cumplidas con tope por día; días según `User.timezone` — spec fase 11; #35 recordatorios queda para la fase de notificaciones. `POST /:id/intakes` también acepta `taken: false` con un `skipReason` opcional — "no tomé esta dosis"—; `MedicationIntake.taken` por defecto `true`, y tanto `list()` como `getAdherence()` filtran `taken = true`, así que una dosis marcada como no tomada no cuenta como cumplida). `exercise` (`/api/exercise`: `POST` y `GET` paginado de actividades, `DELETE /:id`, y `GET /summary` con minutos de hoy, de 7 días y la meta, más la comparación de glucosa de los días con y sin ejercicio de los últimos 30 días — `exercise.correlation.ts`, pura; sin comparación si algún grupo tiene menos de 5 lecturas — spec fase 12; sin gráficos a propósito). `profile` (`GET`/`PUT /api/profile`: metas de glucosa y HbA1c, tipo de diabetes, meta diaria de lecturas `dailyGlucoseChecks` (1 a 20, editable, no nula), meta de ejercicio `exerciseGoalMinutes` (5 a 300 min, no nula), preferencias de avisos `notificationPreferences` (cuatro booleanos, apagados por defecto, con *merge* dentro del JSON) y `glucoseReminderTimes` (hasta 6 horarios `HH:mm`) en las columnas JSON existentes, normalizadas al leer (spec fase 13), peso, altura, actividad, teléfono y fecha de nacimiento (opcionales, `null` los borra) del usuario de la sesión; actualización parcial donde `null` borra el campo y el rango min < max se valida contra el valor guardado — spec fase 7; `insulinCarbRatio` (1–100 g de CHO por unidad) e `insulinSensitivityFactor` (1–200 mg/dL por unidad), opcionales y editables igual que el resto, para la calculadora de dosis de insulina del frontend — spec fase 17). Añadir un módulo = carpeta en `modules/` más una línea en `modules/index.ts`.
- **Sesión**: token de acceso JWT de 15 min (solo `sub`, sin datos personales) + token de renovación opaco de 30 días, del que la BD guarda **solo el hash SHA-256** (`refresh_tokens`). Cada `POST /auth/refresh` rota el token; si llega uno ya usado se revoca toda la cadena de sesión (`familyId`). `logout` revoca y es idempotente.
- **Protección**: `express-rate-limit` en login (5 fallos por IP+correo/15 min), registro (5 por IP/hora) y refresh (30 por IP/15 min) → `RATE_LIMITED`; `helmet()`; body máximo 100 KB → `PAYLOAD_TOO_LARGE`. El login siempre compara un hash, exista o no el correo, para no revelar qué cuentas existen.
- **Recursos de usuario**: se consultan y modifican filtrando por `userId` en la misma operación (`updateMany` / `deleteMany`); una lectura de otro usuario responde `NOT_FOUND`.
- **Prisma**: enums nativos `MomentOfDay`, `DiabetesType`, `ActivityLevel` e `InsulinType`; los esquemas Zod los importan de `@prisma/client` para tener una sola lista de valores. `glucose_readings` tiene índice `(userId, timestamp)`.
- **Logs**: una línea por petición solo en desarrollo, sin body ni cabeceras; el SQL de Prisma solo con `PRISMA_LOG_QUERIES=true`.

## Arquitectura del frontend

- Las rutas viven en `app/` (Expo Router, file-based) en dos grupos: `(auth)/login.tsx` y `(auth)/register.tsx` (solo sin sesión) y `(app)` (solo con sesión). `(app)/_layout.tsx` es un `Stack` (`shared/navigation/AppStack.tsx`, con `initialRouteName: '(tabs)'`) cuyo primer destino es `(app)/(tabs)`, con **5 pestañas** (`AppTabs.tsx`): Hoy (`index`), Glucosa, Medicación, Actividad y Más; las pantallas de formulario y detalle (`glucose/new`, `glucose/[id]`, `medications/form`, `exercise/form`, `profile`, etc.) viven en el `Stack` y ocultan la barra. `app/_layout.tsx` monta `<AuthProvider>`, el `ToastProvider` y `Stack.Protected` con el estado de sesión; mantiene el splash hasta saber si hay sesión.
- Los archivos de `app/` son **finos**: solo layout y `export { Pantalla as default } from '@/src/features/...'`. Nunca llevan lógica ni estilos.

```
src/
├── features/                    # una carpeta por funcionalidad, todas con la misma forma
│   ├── auth/                    # AuthProvider.tsx, api.ts, schemas.ts, types.ts, screens/, index.ts
│   ├── glucose/                 # api.ts, schemas.ts, types.ts, constants.ts, screens/, index.ts
│   ├── profile/                 # api.ts, types.ts, schemas.ts, constants.ts, hooks/useProfile.ts, screens/ProfileScreen.tsx, index.ts
│   ├── achievements/             # api.ts, types.ts, hooks/useAchievements.ts, screens/AchievementsScreen.tsx, index.ts
│   └── dashboard/                # api.ts, types.ts, hooks/, components/, screens/DashboardScreen.tsx, index.ts
└── shared/
    ├── api/                     # client.ts (get/post/put/del tipados), errors.ts (ApiError), types.ts
    ├── session/                 # tokenStorage.ts (expo-secure-store) y sessionEvents.ts
    ├── components/ui/           # Button, Card, Input, Banner, StateView (Loading/Empty/Error/Skeleton), Toast, Screen, Chips, ListRow/SwitchRow, ProgressBar, Checkbox, Icon, Header, FormError
    ├── config/                  # env.ts (EXPO_PUBLIC_API_URL) y app.ts
    ├── forms/applyServerErrors.ts
    ├── cache/                   # queryCache.ts (AsyncStorage) y useStaleQuery.ts (spec fase 18)
    ├── theme/tokens.ts          # color, space, radius, type, touch: única fuente de estilo (spec fase 15)
    └── utils/                   # dates.ts, showError.ts
```

- **Reglas de dependencia** (las vigila ESLint con `import/no-restricted-paths`): `shared/` nunca importa de `features/`, y una funcionalidad solo importa de otra a través de su `index.ts`.
- **Llamadas a la API**: siempre por el servicio de la funcionalidad (`authApi`, `glucoseApi`), que devuelve el `data` ya tipado. Las pantallas no importan el cliente HTTP ni axios.
- **Errores**: el cliente convierte todo en `ApiError` (`code`, `message`, `fields`) y **no muestra alertas**. En formularios, `applyServerErrors` coloca cada mensaje bajo su campo y lo demás va a `<FormError>`; fuera de formularios, `showError()`.
- **Formularios**: `react-hook-form` + `zod` (`zodResolver`). Los esquemas de cada funcionalidad repiten las reglas del backend; si cambia una, cámbiala en ambos lados.
- **Configuración**: `EXPO_PUBLIC_API_URL` en `.env` (hay `.env.example`). Si falta, la app falla al arrancar con un mensaje explicativo. Tras editar `.env` hay que reiniciar `npm start`.
- **Imports** con el alias `@/` (p. ej. `@/src/shared/components/ui`); los relativos solo dentro de la misma carpeta.
- **Caché local del dashboard para el *cold start*** (spec fase 18): `shared/cache/useStaleQuery.ts` es un hook genérico (`readCache`/`writeCache` sobre `AsyncStorage` en `shared/cache/queryCache.ts`) que usan los cinco hooks de «Hoy» (`useDashboardStats`, `useStreak`, `useHba1cProjection`, `useLatestReading`, `useTodayMedications`, en `features/dashboard/hooks/`): al abrir la pantalla, si hay datos guardados de la visita anterior se muestran de inmediato (sin el esqueleto de carga) mientras se pide la versión real en segundo plano; si ese pedido falla y ya hay algo en pantalla, se queda tal cual — el `status` solo pasa a `error` cuando no hay nada que mostrar. Pensado para el *cold start* del backend gratuito de Render (spec fase 16, ~30-50 s la primera vez): antes, cada apertura de la app con el backend dormido dejaba el dashboard en la pantalla de carga todo ese tiempo. `fetcher`/`getErrorMessage` se guardan en una `ref` dentro del hook (no como dependencia de `useCallback`) para que `load` no cambie de identidad en cada render y `useFocusEffect` no se dispare de más. La sesión (login) no usa este mecanismo: sigue dependiendo de la respuesta del servidor, ya cubierta por la regla de no cerrar sesión ante `NETWORK_ERROR` (spec fase 2). `useExerciseSummary` (en `features/exercise`, también parte de «Hoy») se dejó fuera de esta fase.
- **Aviso de rango al registrar glucosa** (spec fase 7): `glucose/rangeStatus.ts` (`getRangeStatus`, función pura) y `RangeAlert` leen el rango del perfil con `useProfile()` (`@/src/features/profile`); si el perfil no carga, no se avisa y el registro funciona igual. Solo informa, no bloquea.
- **Contenido educativo** (spec fase 10): `features/education` es la única funcionalidad **sin backend ni `api.ts`**: consejos (`TIPS`), guías y FAQs son listas fijas en `constants.ts` (ampliarlas = agregar elementos). El consejo del día sale de `getTipOfTheDay(tips, date)` (pura, por día del año local del celular); la calculadora (`calculateCarbs`) recalcula con `useWatch` y no guarda nada. Un único botón «Educación» en el dashboard lleva a `app/(app)/education/{index,calculator,guides,insulin-calculator}`.
- **Calculadora de dosis de insulina** (spec fase 17): también en `features/education`, sin backend propio (lee `insulinCarbRatio`/`insulinSensitivityFactor`/`targetGlucoseMin`/`targetGlucoseMax` de `features/profile` vía `useProfile()`). `foodTable.ts` tiene ~130 alimentos (tabla de equivalencias de carbohidratos compartida por el usuario) con `searchFood(query)`; al elegir uno se precargan sus gramos de CHO, o se escriben a mano. `insulinCalculator.ts` (`calculateInsulinDose`, pura) suma dosis por comida (`carbohidratos ÷ ratio`) y de corrección (`(glucosa − meta) ÷ factor`, nunca negativa; la meta es el punto medio de `targetGlucoseMin`/`Max`), redondeada a 0.5 u. Sin ratio, factor o rango configurados, la pantalla no calcula y enlaza a «Mi perfil» en vez de mostrar un número. `GlucoseForm` tiene un botón «Calcular dosis de insulina» que navega a `/education/insulin-calculator` con la glucosa ya escrita como parámetro (`glucose`); esto agrega una zona `glucose → education` en `import/no-restricted-paths` (igual patrón que `glucose → notifications` de la fase 13).
- **Registrar la insulina aplicada y ver su efecto** (spec fase 19): `GlucoseForm` tiene un campo plegado «Agregar unidades de insulina aplicadas» (mismo patrón que «Agregar nota»; 0.5–100, opcional) que se guarda junto a la lectura (`GlucoseReading.insulinUnits`, backend). Al **crear** una lectura nueva, pide las 2 más recientes (`glucoseApi.list({ page: 1, limit: 2 })`) y usa `glucose/insulinEffect.ts` (`calculateInsulinEffect`, pura) para comparar con la anterior: si esa anterior tenía insulina registrada y el tiempo entre ambas cae entre 1 y 4 horas (pensado para el recordatorio «en 2 horas» de la fase 13), el toast de guardado muestra cuánto bajó (o subió) y el ritmo por unidad (`formatInsulinEffectMessage`) en vez del mensaje genérico; si la consulta falla, no bloquea el guardado — se queda el mensaje genérico. Solo al crear, no al editar.
- **Cabecera de pantallas secundarias**: `ScreenHeader` (título + ✕; `showClose={false}` en las raíces de pestaña) y `CloseButton` (solo el ✕, para cabeceras propias como «Mi perfil») viven en `shared/components/ui/` y **se importan por su ruta**, no desde el barril `ui/index.ts`: usa `expo-router`, y exportarlo ahí obligaría a mockearlo en todos los tests que importan `Card`.
- **Cronómetro** (spec fase 12): `exercise/timer.ts` es lógica pura con marcas de tiempo (`startedAt` + `accumulatedMs`); el `setInterval` de `useStopwatch` solo repinta y el valor sale de `Date.now()`, así el tiempo es correcto tras pasar a segundo plano. No sobrevive a que el sistema cierre la app.
- **Fechas ISO opcionales en Zod 4**: valida con `.refine` **antes** de `.transform((v) => new Date(v))`. Con un texto inválido, el `transform` recibe el texto crudo y un `.refine` posterior que llame a `date.getTime()` lanza una excepción (500 en vez de 400).
- **Notificaciones** (spec fase 13): **locales**, sin FCM ni servidor (#51 se descartó). `features/notifications`: `schedule.ts` (`buildSchedule`, pura) arma la lista diaria (medicación, glucosa, motivacional 9:00), `notifier.ts` es la **única** capa que toca `expo-notifications` (permiso, canal de Android, `cancelAll` + reprogramar, todo en `try/catch`) y `sync.ts` reprograma desde perfil + medicamentos al recuperar el foco del dashboard y al volver la app a primer plano (`useNotificationSync`); si una petición falla no toca lo ya programado. **`syncSchedule` es diferencial** (cancela lo que sobra y reprograma solo lo nuevo o cambiado): las alarmas diarias son inexactas (llegan hasta ~1,5 min tarde) y cancelar y reprogramar dentro de esa ventana las mueve a mañana y pierde el aviso. El aviso de logro nuevo se detecta al abrir la app (`findNewAchievements` + AsyncStorage; la primera vez solo registra). `scheduleReminder` (también en `notifier.ts`) programa un aviso **puntual** en una fecha exacta (`SchedulableTriggerInputTypes.DATE`), distinto de `syncSchedule` (diario) y `notifyNow` (inmediata): lo usa el checkbox opcional «Recordármelo en 2 horas» al registrar o editar una glucosa (`GlucoseForm`), para `timestamp + 2 h`; si esa hora ya pasó, no programa nada. Las preferencias se editan en `app/(app)/notifications.tsx`, accesible desde «Mi perfil». `TimesField` es compartido (`shared/components/TimesField.tsx`); tras verificar en dispositivo que escribir `HH:mm` a mano no dejaba claro si una hora era a. m. o p. m. (spec fase 15), cada horario se elige con `@react-native-community/datetimepicker` en `mode="time"` (reloj nativo del sistema, con a. m./p. m.) y se sigue guardando como `HH:mm` de 24 horas.
- **`expo-notifications` no funciona en Expo Go** (Android, desde el SDK 53): importarlo lanza un error no capturado. Por eso `notifier.ts` lo carga con `require` perezoso solo fuera de Expo Go y, dentro, devuelve `unavailable` (los avisos no se programan y la pantalla «Notificaciones» lo explica). Los avisos reales se prueban con la development build (`make build`, `make up DEV_CLIENT=1`).
- **Iconos**: `Icon` con nombres semánticos tipados (`AppIconName`) sobre Ionicons de `@expo/vector-icons`.
- **Icono de la app y de las notificaciones**: hasta ahora `assets/images/icon.png` era el marcador de posición que trae Expo por defecto (la cuadrícula de guía), nunca reemplazado. `scripts/generate-icons.ps1` genera `icon.png`, `adaptive-icon.png`, `favicon.png`, `splash-icon.png` y `notification-icon.png` a partir del mismo glifo `heart`/`heart-outline` de Ionicons que ya usa `Header.tsx` (dibuja el glifo con `System.Drawing` cargando `Ionicons.ttf` como fuente privada, sin depender de un editor de imágenes): fondo azul de marca (`#1D4ED8`) + corazón blanco para el icono principal y el splash, y silueta blanca **rellena** sobre transparente (sin color) para `notification-icon.png`, porque Android exige que el icono de notificación sea una silueta simple, no una imagen a color, y la pinta él mismo con el `color` del plugin `expo-notifications` en `app.json`. Repetir `scripts/generate-icons.ps1` si cambia el color de marca. Como son recursos nativos (icono del lanzador, icono adaptativo, icono de notificación), un cambio aquí solo se ve tras `make build` (o `npx expo prebuild --clean` + reinstalar), igual que cualquier otro cambio de `app.json` — no alcanza con recargar Metro.
- **Sistema de diseño** (spec fase 15): colores, espacios (4/8/12/16/24/32/48), radios y escala tipográfica salen de `shared/theme/tokens.ts`; ESLint prohíbe hex literales fuera de ese archivo. Todos los tonos verificados con contraste WCAG AA (primario `#1D4ED8`). Cada pantalla se monta sobre `Screen` (áreas seguras, teclado, pie fijo con la acción principal, refresco) y comunica estado con icono + texto, nunca solo con color. Táctiles ≥ 48 dp, sin `Picker` (se usan `Chips`), avisos de éxito con `useToast()`, borrados con confirmación. Solo tema claro (`userInterfaceStyle: light`). Tras crear `app/(app)/(tabs)` o rutas nuevas, regenera los tipos (borra `.expo/types/router.d.ts` y arranca Metro). `react-native-svg` (gráfico de tendencia) exige `make build` una vez para la development build **cada vez que se agrega una dependencia nativa nueva**: si no se recompila, la pantalla que la usa (Glucosa) falla en el dispositivo con `IllegalViewOperationException: Can't find ViewManager`, no con un error de Metro (verificado en dispositivo). `Chips` necesita `numberOfLines={1}` en su `Text`: sin eso, en Android el chip que abre una fila nueva del `flexWrap` puede medir mal su ancho disponible y recortar una etiqueta larga a la mitad sin avisar ni mostrar `…` (p. ej. «Antes del almuerzo» se veía «Antes del»); con una sola línea fija, el chip que no cabe pasa entero a la fila siguiente en vez de partir su propio texto (bug de medición de Yoga en `flexWrap`, no de `gap` ni de `flexShrink`, aunque ambos se probaron primero). Verificado en dispositivo con TalkBack y con el texto del sistema al 200 % (`adb shell settings put system font_scale 2.0`): sin recortes reales — el único solape visible era la burbuja «Tools» de Expo, que solo existe en development builds.
- **Descargar y compartir archivos** (spec fase 6: exportar el reporte de glucosa): `getFile()` en `shared/api/client.ts` pide una respuesta de texto o `arraybuffer` (no sigue el contrato `{ success, data }`, porque el body es el archivo tal cual); `expo-file-system/legacy` (`writeAsStringAsync`) escribe el archivo temporal y `expo-sharing` abre la hoja de compartir del sistema. Se usa el subpath `/legacy` porque la API nueva de `expo-file-system` (clases `File`/`Directory`) es más difícil de verificar sin dispositivo; no hay `btoa` en React Native, así que el PDF (binario) se codifica a base64 a mano (`features/dashboard/utils/base64.ts`).

## Contrato frontend ↔ backend

- El frontend valida los formularios con las mismas reglas que los esquemas Zod del backend (contraseña 8+ con mayúscula, minúscula y número; teléfono opcional 10–20 caracteres). Ambos usan Zod 4: si cambias una regla, cámbiala en `src/features/<x>/schemas.ts` y en el `*.schemas.ts` del backend.
- Fechas: la app captura `DD/MM/YYYY` y envía ISO (`shared/utils/dates.ts`); el backend recibe `birthDate` en ISO. El campo se llama `dateOfBirth` en el formulario y `birthDate` en la API (hay un alias al mapear errores).
- Registro y login devuelven `data: { user, accessToken, refreshToken, requiresOnboarding }`; `AuthProvider` guarda ambos tokens en el almacenamiento seguro. Las contraseñas se envían tal cual las escribe el usuario (sin `trim`).
- **Restaurar sesión sin red** (spec fase 18, verificado en dispositivo con modo avión): al abrir la app, `AuthProvider` llama a `GET /auth/me` para confirmar el token guardado. Si esa llamada falla por `NETWORK_ERROR`, el token **no se borra** (ya existía) y **tampoco manda al login**: entra como `authenticated` con `user: null`, para que la app (y la caché de «Hoy» de la fase 18) sea útil sin conexión; antes entraba igual a `unauthenticated` pese a conservar el token, lo que en la práctica anulaba la caché del dashboard porque nunca se llegaba a esa pantalla. Solo se cierra sesión y se pide login cuando el servidor sí respondió diciendo que el token ya no sirve (cualquier otro código de error).
- Errores: la app los normaliza con `toApiError(error)` de `src/shared/api/errors.ts` y decide por `code`.
- `momentOfDay` usa los valores del enum `MomentOfDay` del backend.
