# Plan técnico F4 — Calidad continua

Implementa: [spec.md](spec.md) · Tareas: [tasks.md](tasks.md)

## 1. Decisiones

### D-4.1 Herramientas

| Necesidad | Backend | Frontend |
|---|---|---|
| Tests | Jest + `ts-jest` + `supertest` | `jest-expo` + `@testing-library/react-native` |
| Lint | ESLint 9 (flat config) + `typescript-eslint` (con tipos) | `eslint-config-expo` (ya existe) |
| Formato | Prettier (config compartida en la raíz) | Prettier |
| Tipos | `tsc --noEmit` | `tsc --noEmit` |

### D-4.2 Base de datos de pruebas

- Misma instancia de `docker-compose.yml` (puerto 5433), base distinta: `diabetapp_test`. Se añade un script SQL de inicialización del contenedor que la crea (`docker/init-test-db.sql`, montado en `/docker-entrypoint-initdb.d`).
- `diabetapp-backend/.env.test` (versionado, sin secretos reales):
  ```
  NODE_ENV=test
  DATABASE_URL=postgresql://user:password@localhost:5433/diabetapp_test
  JWT_SECRET=test_secret_de_al_menos_32_caracteres_para_tests
  RATE_LIMIT_REGISTER_MAX=1000
  RATE_LIMIT_REFRESH_MAX=1000
  ```
  Se versiona como excepción explícita en `.gitignore` (`!diabetapp-backend/.env.test`): sus valores solo sirven para tests locales y de CI.
- `env.ts` carga `.env.test` cuando `NODE_ENV=test`.
- Jest `globalSetup`: `prisma migrate deploy` sobre `diabetapp_test`.
- `beforeEach` global (`setupFilesAfterEnv`): `TRUNCATE "refresh_tokens", "glucose_readings", "users" RESTART IDENTITY CASCADE` (RF-4.2).
- `--runInBand`: los tests comparten una BD, se ejecutan en serie. Con ~60 tests se espera < 30 s.

### D-4.3 Estructura de tests del backend

```
diabetapp-backend/
├── jest.config.ts                # preset ts-jest, coverageThreshold { lines: 80 } sobre src/modules y src/shared
└── test/
    ├── globalSetup.ts
    ├── setup.ts                  # truncate + cierre de Prisma
    ├── helpers/
    │   ├── api.ts                # request(app) de supertest
    │   └── factories.ts          # createUser(), loginAs(), createReading()
    ├── auth.register.test.ts
    ├── auth.login.test.ts
    ├── auth.session.test.ts
    ├── auth.rateLimit.test.ts    # usa jest.isolateModules para crear la app con límites por defecto
    ├── glucose.test.ts
    └── platform.test.ts          # health, 404, JSON mal formado, 413
```

Las peticiones de `requests.http` (fases 1 y 2) se convierten en estos tests; después `requests.http` queda solo como ayuda manual.

### D-4.4 Tests del frontend

```
diabetapp-frontend/
├── jest.config.js                # preset jest-expo
└── src/…/__tests__/              # junto al código que prueban
    ├── features/auth/__tests__/schemas.test.ts
    ├── features/auth/__tests__/RegisterScreen.test.tsx   # errores por campo (RNTL)
    ├── features/glucose/__tests__/schemas.test.ts
    ├── shared/utils/__tests__/dates.test.ts
    ├── shared/api/__tests__/errors.test.ts
    ├── shared/api/__tests__/client.refresh.test.ts       # axios-mock-adapter: 3 peticiones → 1 refresh
    └── shared/components/ui/__tests__/Input.test.tsx
```

`expo-secure-store` se simula con un mock en memoria en `jest.setup.js`.

### D-4.5 ESLint del backend

```js
// diabetapp-backend/eslint.config.mjs
export default tseslint.config(
  eslint.configs.recommended,
  tseslint.configs.recommendedTypeChecked,
  { languageOptions: { parserOptions: { projectService: true } } },
  { rules: {
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/no-floating-promises': 'error',
      '@typescript-eslint/no-misused-promises': ['error', { checksVoidReturn: { arguments: false } }], // handlers async de Express 5
  } },
  { ignores: ['dist/', 'node_modules/', 'prisma/migrations/'] },
);
```

`tsconfig.json` del backend incluye `test/` para el lint con tipos (el `build` usa un `tsconfig.build.json` que solo incluye `src/`).

### D-4.6 Prettier

`/.prettierrc.json` en la raíz, aplicado a ambos proyectos:

```json
{ "singleQuote": true, "semi": true, "trailingComma": "all", "printWidth": 100 }
```

`eslint-config-prettier` desactiva en ESLint las reglas de estilo que chocan con Prettier. El primer `npm run format` va en un commit aislado (RNF-4.4) y su hash se añade a `.git-blame-ignore-revs`.

### D-4.7 Versión de Node

`.nvmrc` en la raíz con `24` (LTS actual; es la que ya usa el equipo en local) y `"engines": { "node": ">=24 <25" }` en ambos `package.json`. La CI lee la versión con `node-version-file: .nvmrc`.

### D-4.8 Control de migraciones

En la CI, tras levantar Postgres:

```bash
npx prisma migrate deploy                                   # RF-4.11
npx prisma migrate diff \
  --from-migrations prisma/migrations \
  --to-schema-datamodel prisma/schema.prisma \
  --shadow-database-url "$SHADOW_DATABASE_URL" \
  --exit-code                                               # RF-4.10: código 2 si hay diferencias
```

`SHADOW_DATABASE_URL` apunta a otra base vacía del mismo servicio Postgres de la CI.

### D-4.9 Workflow de GitHub Actions

```yaml
# .github/workflows/ci.yml
name: CI
on:
  pull_request:
    branches: [Develop, main]
  push:
    branches: [Develop, main]

concurrency:                                    # RF-4.14
  group: ci-${{ github.event.pull_request.number || github.ref }}
  cancel-in-progress: true

jobs:
  backend:
    runs-on: ubuntu-latest
    defaults: { run: { working-directory: diabetapp-backend } }
    services:
      postgres:
        image: postgres:16
        env: { POSTGRES_USER: user, POSTGRES_PASSWORD: password, POSTGRES_DB: diabetapp_test }
        ports: ['5433:5432']
        options: >-
          --health-cmd pg_isready --health-interval 5s --health-timeout 5s --health-retries 10
    env:
      NODE_ENV: test
      DATABASE_URL: postgresql://user:password@localhost:5433/diabetapp_test
      SHADOW_DATABASE_URL: postgresql://user:password@localhost:5433/diabetapp_shadow
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version-file: .nvmrc, cache: npm, cache-dependency-path: diabetapp-backend/package-lock.json }
      - run: npm ci
      - run: npx prisma generate
      - run: npm run format:check
      - run: npm run lint
      - run: npm run typecheck
      - run: psql postgresql://user:password@localhost:5433/postgres -c 'CREATE DATABASE diabetapp_shadow'
      - run: npx prisma migrate deploy
      - run: npx prisma migrate diff --from-migrations prisma/migrations --to-schema-datamodel prisma/schema.prisma --shadow-database-url "$SHADOW_DATABASE_URL" --exit-code
      - run: npm test -- --ci --coverage

  frontend:
    runs-on: ubuntu-latest
    defaults: { run: { working-directory: diabetapp-frontend } }
    env:
      EXPO_PUBLIC_API_URL: http://localhost:3000/api   # solo para que config/env.ts no falle en los tests
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version-file: .nvmrc, cache: npm, cache-dependency-path: diabetapp-frontend/package-lock.json }
      - run: npm ci
      - run: npm run format:check
      - run: npm run lint
      - run: npm run typecheck
      - run: npm test -- --ci
```

Los secretos de la CI son valores de prueba escritos en el propio workflow (RNF-4.2). Los dos trabajos se ejecutan siempre (sin filtros por carpeta) para que las comprobaciones obligatorias de la protección de ramas nunca queden "pendientes".

### D-4.10 Protección de ramas (manual)

En GitHub → Settings → Branches → reglas para `Develop` y `main`:
- *Require a pull request before merging* (aprobaciones según la aclaración §8).
- *Require status checks to pass*: `backend`, `frontend`; *Require branches to be up to date*.
- *Do not allow bypassing the above settings*.

### D-4.11 Plantilla de PR

`.github/pull_request_template.md`:

```markdown
## Spec
- Spec: specs/fase-X-…/spec.md
- Tareas: T?.?, T?.?

## Criterios de aceptación verificados
- [ ] CA-?.? …

## Cómo se probó

## Notas para la revisión
```

## 2. Scripts resultantes

| Script | Backend | Frontend |
|---|---|---|
| `lint` | `eslint .` | `expo lint` |
| `typecheck` | `tsc --noEmit` | `tsc --noEmit` |
| `test` | `jest --runInBand` | `jest` |
| `format` | `prettier --write .` | `prettier --write .` |
| `format:check` | `prettier --check .` | `prettier --check .` |

## 3. Verificación

| CA | Cómo |
|---|---|
| CA-4.1 – CA-4.7 | En local, siguiendo cada caso de la spec. |
| CA-4.8 – CA-4.12 | PR de prueba (rama `ci/prueba`) con cada situación; cerrar sin fusionar. |
| CA-4.13 | Abrir cualquier PR tras fusionar la plantilla. |

## 4. Riesgos

| Riesgo | Mitigación |
|---|---|
| El primer `format` genera un diff enorme | Commit aislado + `.git-blame-ignore-revs` (D-4.6). |
| Lint con tipos marca muchos errores en código existente | Se corrigen en esta fase; si alguno exige un refactor grande, se desactiva esa regla **solo** en ese archivo con un comentario que enlace a un issue. |
| Tests lentos por la BD real | `TRUNCATE` en lugar de migrar en cada test; `--runInBand`; bcrypt con coste bajo en tests (`BCRYPT_ROUNDS=4` vía `env`). |
| `jest-expo` desalineado con el SDK de Expo | Instalar con `npx expo install jest-expo` para obtener la versión compatible. |
