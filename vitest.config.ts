import { configDefaults, defineConfig, mergeConfig } from 'vitest/config'

import viteConfig from './vite.config'

export default mergeConfig(viteConfig, defineConfig({
    test: {
        environment: 'jsdom',
        include: ['src/**/__tests__/**/*.test.ts'],
        exclude: [...configDefaults.exclude, 'src/components/ui/**'],
        restoreMocks: true,
        coverage: {
            provider: 'istanbul',
            reporter: ['text', 'html', 'lcov'],
            include: ['src/components/**/*.vue', 'src/pages/**/*.vue', 'src/lib/**/*.ts'],
            exclude: ['src/components/ui/**', 'src/**/__tests__/**', 'src/**/__fixtures__/**'],
        },
    },
}))
