import { afterEach, beforeEach, expect, test, vi } from 'vitest'

const storageKey = 'notfive.admin.session'
const now = new Date('2026-11-08T12:00:00Z').getTime()

beforeEach(() => {
    vi.resetModules()
    sessionStorage.clear()
    vi.useFakeTimers({ toFake: ['Date'] })
    vi.setSystemTime(now)
})

afterEach(() => {
    vi.restoreAllMocks()
    sessionStorage.clear()
    vi.useRealTimers()
})

test('restores an unexpired session after the module is reloaded', async () => {
    const { useAdminAuth } = await import('@/composables/useAdminAuth')
    useAdminAuth().setSession('session-token', 3600)

    expect(JSON.parse(sessionStorage.getItem(storageKey) ?? 'null')).toEqual({
        token: 'session-token',
        expiresAt: now + 3600000,
    })

    vi.resetModules()
    const reloaded = await import('@/composables/useAdminAuth')

    expect(reloaded.useAdminAuth().getToken()).toBe('session-token')
    expect(reloaded.useAdminAuth().session.value?.expiresAt).toBe(now + 3600000)
})

test('expires the token at its deadline and removes it from storage', async () => {
    const { useAdminAuth } = await import('@/composables/useAdminAuth')
    const auth = useAdminAuth()
    auth.setSession('session-token', 60)

    vi.setSystemTime(now + 59999)
    expect(auth.getToken()).toBe('session-token')

    vi.setSystemTime(now + 60000)
    expect(auth.getToken()).toBeNull()
    expect(auth.session.value).toBeNull()
    expect(sessionStorage.getItem(storageKey)).toBeNull()
})

test('does not restore an expired stored session', async () => {
    sessionStorage.setItem(storageKey, JSON.stringify({ token: 'expired-token', expiresAt: now }))

    const { useAdminAuth } = await import('@/composables/useAdminAuth')

    expect(useAdminAuth().session.value).toBeNull()
    expect(useAdminAuth().getToken()).toBeNull()
    expect(sessionStorage.getItem(storageKey)).toBeNull()
})

test('signing out clears memory and prevents restoration on reload', async () => {
    const { useAdminAuth } = await import('@/composables/useAdminAuth')
    const auth = useAdminAuth()
    auth.setSession('session-token', 3600)
    auth.clearSession()

    expect(auth.getToken()).toBeNull()
    expect(auth.session.value).toBeNull()
    expect(sessionStorage.getItem(storageKey)).toBeNull()

    vi.resetModules()
    const reloaded = await import('@/composables/useAdminAuth')
    expect(reloaded.useAdminAuth().getToken()).toBeNull()
})

test.each([
    '{',
    'null',
    '[]',
    '{}',
    JSON.stringify({ token: '', expiresAt: now + 1000 }),
    JSON.stringify({ token: 123, expiresAt: now + 1000 }),
    JSON.stringify({ token: 'session-token', expiresAt: String(now + 1000) }),
])('treats malformed stored data as signed out: %s', async stored => {
    sessionStorage.setItem(storageKey, stored)

    const { useAdminAuth } = await import('@/composables/useAdminAuth')

    expect(useAdminAuth().getToken()).toBeNull()
    expect(useAdminAuth().session.value).toBeNull()
    expect(sessionStorage.getItem(storageKey)).toBeNull()
})

test.each([0, -1, NaN, Infinity])('rejects invalid expiry %s and clears any previous session', async expiresIn => {
    const { useAdminAuth } = await import('@/composables/useAdminAuth')
    const auth = useAdminAuth()
    auth.setSession('old-token', 3600)

    expect(() => auth.setSession('new-token', expiresIn)).toThrow('INVALID_SESSION')
    expect(auth.getToken()).toBeNull()
    expect(sessionStorage.getItem(storageKey)).toBeNull()
})

test('rejects an empty token', async () => {
    const { useAdminAuth } = await import('@/composables/useAdminAuth')

    expect(() => useAdminAuth().setSession('', 3600)).toThrow('INVALID_SESSION')
    expect(useAdminAuth().getToken()).toBeNull()
})

test('allows the current session to work when browser storage is unavailable', async () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => { throw new Error('Storage denied') })
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw new Error('Storage denied') })
    vi.spyOn(Storage.prototype, 'removeItem').mockImplementation(() => { throw new Error('Storage denied') })

    const { useAdminAuth } = await import('@/composables/useAdminAuth')
    const auth = useAdminAuth()

    expect(auth.getToken()).toBeNull()
    expect(() => auth.setSession('memory-token', 3600)).not.toThrow()
    expect(auth.getToken()).toBe('memory-token')
    expect(() => auth.clearSession()).not.toThrow()
    expect(auth.getToken()).toBeNull()
})
