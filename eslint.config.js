import js from '@eslint/js'
import globals from 'globals'
import pluginTs from 'typescript-eslint'
import pluginVue from 'eslint-plugin-vue'
import stylistic from '@stylistic/eslint-plugin'
import {
    defineConfig,
} from 'eslint/config'

import importGroups from './eslint/rules/import-groups.js'

export default defineConfig([
    {
        files: ['**/*.{js,mjs,cjs,ts,mts,cts,vue}'],
        plugins: {
            '@stylistic': stylistic,
            js,
            local: { rules: { 'import-groups': importGroups } },
        },
        extends: ['js/recommended'],

        languageOptions: {
            globals: globals.browser
        },
        rules: {
            'local/import-groups': 'error',
            '@stylistic/indent': ['error', 4, {
                SwitchCase: 1,
            }],
            '@stylistic/quotes': ['error', 'single'],
            '@stylistic/comma-spacing': ['error', {
                'before': false, 'after': true
            }],
            '@stylistic/array-bracket-spacing': ['error', 'never'],
            '@stylistic/block-spacing': ['error'],
            '@stylistic/space-before-blocks': ['error'],
            '@stylistic/no-trailing-spaces': ['error'],
        },
    },
    pluginTs.configs.recommended,
    pluginVue.configs['flat/recommended'],
    {
        files: ['**/*.{ts,mts,cts,tsx,vue}'],
        rules: {
            '@typescript-eslint/consistent-type-imports': ['error', {
                prefer: 'type-imports',
                fixStyle: 'separate-type-imports',
            }],
            'no-restricted-syntax': ['error', {
                selector: 'ImportSpecifier[importKind="type"]',
                message: 'Используйте отдельный import type вместо inline type.',
            }],
        },
    },
    {
        name: 'Vue',
        files: ['**/*.vue'],
        rules: {
            'vue/block-order': ['error', { order: ['template', 'script', 'style', 'i18n'] }],
            'vue/html-indent': ['error', 4],
            'vue/max-attributes-per-line': ['error', {
                singleline: {
                    max: 3
                },
                multiline: {
                    max: 1
                }
            }],
            'vue/require-default-prop': ['off'],
            'vue/multi-word-component-names': ['error', {
                'ignores': [
                    'Button',
                    'Select'
                ]
            }]
        },
        languageOptions: {
            parserOptions: {
                parser: pluginTs.parser
            }
        }
    },
    {
        ignores: ['dist/**', 'coverage/**', '.vitest/**']
    },
]);
