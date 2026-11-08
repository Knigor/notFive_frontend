import type { Router } from 'vue-router'

import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'
import { createMemoryHistory } from 'vue-router'

import { useAdminAuth } from '@/composables/useAdminAuth'

import { createAppRouter } from '@/router'

vi.mock('@/pages/HomeView.vue', () => ({ default: { render: () => null } }))
vi.mock('@/pages/AdminLoginView.vue', () => ({ default: { render: () => null } }))
vi.mock('@/pages/AdminSettingsView.vue', () => ({ default: { render: () => null } }))

let router: Router

beforeEach(() => {
    useAdminAuth().clearSession()
    vi.stubGlobal('scrollTo', vi.fn())
    router = createAppRouter(createMemoryHistory())
})

afterEach(() => {
    useAdminAuth().clearSession()
    vi.useRealTimers()
    router.options.history.destroy()
    vi.unstubAllGlobals()
})

describe('admin authentication navigation', () => {
    test.each([
        ['/admin/settings', 'settings'],
        ['/admin/sources', 'sources'],
        ['/admin', 'settings'],
    ])('opening %s requires sign in and retains the destination', async (path, next) => {
        await router.push(path)

        expect(router.currentRoute.value.name).toBe('admin-login')
        expect(router.currentRoute.value.query).toEqual({ next })
    })

    test('a session opens both settings pages and signing out blocks subsequent navigation', async () => {
        const { setSession, clearSession } = useAdminAuth()
        setSession('test-session-token', 3600)

        await router.push('/admin/settings')
        expect(router.currentRoute.value.name).toBe('admin-settings')

        await router.push('/admin/sources')
        expect(router.currentRoute.value.name).toBe('admin-sources')

        clearSession()
        await router.push('/admin/settings')

        expect(router.currentRoute.value.name).toBe('admin-login')
        expect(router.currentRoute.value.query.next).toBe('settings')
    })

    test('an expired session redirects to sign in', async () => {
        vi.useFakeTimers({ toFake: ['Date'] })
        useAdminAuth().setSession('expired-session-token', 1)
        vi.setSystemTime(Date.now() + 2000)

        await router.push('/admin/sources')

        expect(router.currentRoute.value.name).toBe('admin-login')
        expect(useAdminAuth().getToken()).toBeNull()
    })

    test('the public digest remains accessible without authentication', async () => {
        await router.push('/')

        expect(router.currentRoute.value.name).toBe('home')
        expect(useAdminAuth().getToken()).toBeNull()
    })
})
