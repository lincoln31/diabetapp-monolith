// https://docs.expo.dev/guides/using-eslint/
const { defineConfig } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');

module.exports = defineConfig([
  expoConfig,
  {
    ignores: ['dist/*', 'node_modules/*'],
  },
  {
    // Reglas de dependencia entre carpetas (spec fase 3, RF-3.1):
    // shared no puede depender de features, y una feature no puede entrar
    // en los archivos internos de otra (solo en su index.ts).
    rules: {
      'import/no-restricted-paths': [
        'error',
        {
          zones: [
            {
              target: './src/shared',
              from: './src/features',
              message: 'shared/ no puede depender de features/: mueve lo común a shared/.',
            },
            {
              target: './src/features/auth',
              from: './src/features/glucose',
              except: ['./index.ts'],
              message: 'Importa otra funcionalidad solo desde su index.ts.',
            },
            {
              target: './src/features/glucose',
              from: './src/features/auth',
              except: ['./index.ts'],
              message: 'Importa otra funcionalidad solo desde su index.ts.',
            },
            {
              target: './src/features/home',
              from: './src/features/auth',
              except: ['./index.ts'],
              message: 'Importa otra funcionalidad solo desde su index.ts.',
            },
            {
              target: './src/features/home',
              from: './src/features/glucose',
              except: ['./index.ts'],
              message: 'Importa otra funcionalidad solo desde su index.ts.',
            },
          ],
        },
      ],
    },
  },
]);
