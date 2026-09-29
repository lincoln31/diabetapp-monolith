// https://docs.expo.dev/guides/using-eslint/
const { defineConfig } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');

module.exports = defineConfig([
  expoConfig,
  {
    ignores: ['dist/*', 'node_modules/*'],
  },
  {
    // Los colores salen de `theme/tokens.ts` (spec fase 15, RNF-15.4): ningún hex suelto.
    files: ['src/**/*.{ts,tsx}', 'app/**/*.{ts,tsx}'],
    ignores: ['src/shared/theme/tokens.ts'],
    rules: {
      'no-restricted-syntax': [
        'error',
        {
          selector: 'Literal[value=/^#[0-9A-Fa-f]{3,8}$/]',
          message: 'Usa un color de theme/tokens.ts en vez de un hex literal.',
        },
      ],
    },
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
              target: './src/features/dashboard',
              from: './src/features/auth',
              except: ['./index.ts'],
              message: 'Importa otra funcionalidad solo desde su index.ts.',
            },
            {
              target: './src/features/dashboard',
              from: './src/features/glucose',
              except: ['./index.ts'],
              message: 'Importa otra funcionalidad solo desde su index.ts.',
            },
            {
              target: './src/features/glucose',
              from: './src/features/notifications',
              except: ['./index.ts'],
              message: 'Importa otra funcionalidad solo desde su index.ts.',
            },
          ],
        },
      ],
    },
  },
]);
