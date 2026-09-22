# Tareas F4 — Calidad continua

Implementa: [plan.md](plan.md) · Rama sugerida: `ci/fase-4-calidad-continua`

`[P]` = paralelizable dentro del bloque. El bloque B puede empezar cuando la fase 1 esté fusionada; el bloque C, cuando lo esté la fase 3.

## Bloque 0 — Aclaraciones

- [ ] **T4.1** Resolver las aclaraciones de la spec (§8: aprobaciones obligatorias y administrador del repositorio) y anotarlas.

## Bloque A — Base común

- [ ] **T4.2** `.nvmrc` con `24` y `engines` en ambos `package.json`. — RF-4.9
- [ ] **T4.3** Prettier: `.prettierrc.json` y `.prettierignore` en la raíz; `eslint-config-prettier` en ambos proyectos; scripts `format` y `format:check`. — RF-4.7, RF-4.8
- [ ] **T4.4** Commit aislado con `npm run format` en ambos proyectos; añadir su hash a `.git-blame-ignore-revs`. — RNF-4.4 · depende de T4.3

## Bloque B — Backend

- [ ] **T4.5** ESLint con `typescript-eslint` (D-4.5); `tsconfig.build.json` para el build; script `lint` y `typecheck`. Corregir lo que marque. — RF-4.6, RF-4.8
- [ ] **T4.6** BD de pruebas: `docker/init-test-db.sql`, montaje en `docker-compose.yml`, `.env.test` (con su excepción en `.gitignore`) y carga en `env.ts` cuando `NODE_ENV=test`; `BCRYPT_ROUNDS` configurable. — RF-4.1, RNF-4.3
- [ ] **T4.7** Jest + `ts-jest` + `supertest`: `jest.config.ts` con umbral de cobertura, `globalSetup`, `setup` con `TRUNCATE`, helpers y factories. — RF-4.1, RF-4.2, RF-4.4 · depende de T4.6
- [ ] **T4.8 [P]** `auth.register.test.ts` y `auth.login.test.ts`. — RF-4.3 · depende de T4.7
- [ ] **T4.9 [P]** `auth.session.test.ts` y `auth.rateLimit.test.ts`. — RF-4.3 · depende de T4.7 y de la fase 2
- [ ] **T4.10 [P]** `glucose.test.ts`. — RF-4.3 · depende de T4.7
- [ ] **T4.11 [P]** `platform.test.ts`. — RF-4.3 · depende de T4.7
- [ ] **T4.12** Comprobar cobertura ≥ 80 % y que cada test pasa aislado (CA-4.2). — RF-4.4

## Bloque C — Frontend

- [ ] **T4.13** `npx expo install jest-expo`, `@testing-library/react-native`, `axios-mock-adapter`; `jest.config.js`, `jest.setup.js` (mock de `expo-secure-store`); scripts `test` y `typecheck`. — RF-4.5, RF-4.8
- [ ] **T4.14 [P]** Tests de esquemas (auth, glucose) y de `dates`. — RF-4.5 · depende de T4.13
- [ ] **T4.15 [P]** Tests de `toApiError` y de la renovación única del cliente. — RF-4.5 · depende de T4.13
- [ ] **T4.16 [P]** Tests de `Input` y del formulario de registro. — RF-4.5 · depende de T4.13

## Bloque D — CI y repositorio

- [ ] **T4.17** `.github/workflows/ci.yml` según D-4.9 (incluye control de migraciones D-4.8 y `concurrency`). — RF-4.10 – RF-4.12, RF-4.14, RNF-4.2 · depende de T4.5, T4.7, T4.13
- [ ] **T4.18 [P]** `.github/pull_request_template.md`. — RF-4.15
- [ ] **T4.19** Protección de ramas `Develop` y `main` en GitHub (D-4.10). — RF-4.13 · depende de T4.1, T4.17 (las comprobaciones deben haber corrido una vez para poder seleccionarlas)

## Bloque E — Verificación y cierre

- [ ] **T4.20** PR de prueba `ci/prueba` para CA-4.8 – CA-4.12; cerrarlo sin fusionar.
- [ ] **T4.21** Marcar CA-4.1 … CA-4.13 en el PR, cerrar #56 y #57; actualizar `CLAUDE.md` (comandos de test, test aislado, BD de pruebas) y el estado en `specs/README.md`.

## Trazabilidad

| RF / RNF | Tareas | CA |
|---|---|---|
| RF-4.1, RF-4.2 | T4.6, T4.7 | CA-4.1, CA-4.2 |
| RF-4.3 | T4.8 – T4.11 | CA-4.1 |
| RF-4.4 | T4.7, T4.12 | CA-4.3 |
| RF-4.5 | T4.13 – T4.16 | CA-4.4 |
| RF-4.6 | T4.5 | CA-4.5 |
| RF-4.7 | T4.3, T4.4 | CA-4.6 |
| RF-4.8 | T4.3, T4.5, T4.13 | CA-4.7 |
| RF-4.9 | T4.2 | Revisión |
| RF-4.10, RF-4.11 | T4.17 | CA-4.8 |
| RF-4.12, RF-4.14 | T4.17 | CA-4.9, CA-4.10, CA-4.12 |
| RF-4.13 | T4.19 | CA-4.9, CA-4.11 |
| RF-4.15 | T4.18 | CA-4.13 |
| RNF-4.1 – RNF-4.4 | T4.4, T4.6, T4.17 | CA-4.10 |
