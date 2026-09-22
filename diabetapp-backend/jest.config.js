/**
 * Tests de integración contra la BD de pruebas (spec fase 4, D-4.3).
 * @type {import('jest').Config}
 */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  globalSetup: '<rootDir>/test/globalSetup.ts',
  setupFilesAfterEnv: ['<rootDir>/test/setup.ts'],
  testMatch: ['<rootDir>/test/**/*.test.ts'],
  collectCoverageFrom: ['src/modules/**/*.ts', 'src/shared/**/*.ts'],
  coverageThreshold: {
    global: { lines: 80 },
  },
  // Los tests comparten una base de datos: se ejecutan en serie
  maxWorkers: 1,
};
