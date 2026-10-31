import js from '@eslint/js'
import boundaries from 'eslint-plugin-boundaries'
import reactHooks from 'eslint-plugin-react-hooks'
import globals from 'globals'
import tseslint from 'typescript-eslint'

/*
 * Regla de dependencias (clean architecture): las flechas apuntan hacia adentro.
 *   presentation -> application -> domain      infrastructure -> application, domain
 * Los módulos no se importan entre sí por dentro: solo a través de su `index.ts`.
 * `app` (composition root) es el único que conoce todas las capas.
 */
export default tseslint.config(
  { ignores: ['dist', 'node_modules'] },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ['src/**/*.{ts,tsx}'],
    languageOptions: { globals: globals.browser },
    plugins: { 'react-hooks': reactHooks, boundaries },
    settings: {
      'boundaries/elements': [
        { type: 'domain', pattern: 'src/modules/*/domain', capture: ['modulo'] },
        { type: 'application', pattern: 'src/modules/*/application', capture: ['modulo'] },
        { type: 'infrastructure', pattern: 'src/modules/*/infrastructure', capture: ['modulo'] },
        { type: 'presentation', pattern: 'src/modules/*/presentation', capture: ['modulo'] },
        { type: 'module-root', pattern: 'src/modules/*', capture: ['modulo'] },
        { type: 'shared', pattern: 'src/shared' },
        { type: 'app', pattern: 'src/app' },
        { type: 'test-setup', pattern: 'src/test' },
      ],
      'boundaries/include': ['src/**/*'],
      'import/resolver': { typescript: { project: './tsconfig.json' } },
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      '@typescript-eslint/consistent-type-imports': 'error',
      'boundaries/no-unknown-files': 'error',
      'boundaries/dependencies': [
        'error',
        {
          default: 'disallow',
          policies: [
            // Dentro de un módulo, cada capa solo mira hacia adentro
            ...[
              ['domain', ['domain']],
              ['application', ['domain', 'application']],
              ['infrastructure', ['domain', 'application', 'infrastructure']],
              ['presentation', ['domain', 'application', 'presentation']],
            ].map(([capa, destinos]) => ({
              from: { element: { type: capa } },
              allow: {
                to: {
                  element: { types: { anyOf: destinos }, captured: { modulo: '{{from.captured.modulo}}' } },
                },
              },
            })),
            // Entre módulos solo se usa la API pública (index.ts)
            { from: { element: { type: 'presentation' } }, allow: { to: { element: { type: 'module-root' } } } },
            { from: { element: { types: { anyOf: ['infrastructure', 'presentation'] } } }, allow: { to: { element: { type: 'shared' } } } },
            { from: { element: { type: 'module-root' } }, allow: { to: { element: { types: { anyOf: ['domain', 'application', 'infrastructure', 'presentation', 'shared'] } } } } },
            { from: { element: { type: 'shared' } }, allow: { to: { element: { type: 'shared' } } } },
            { from: { element: { type: 'app' } }, allow: { to: { element: { types: { anyOf: ['module-root', 'shared', 'app'] } } } } },
          ],
        },
      ],
    },
  },
)
