import { afterEach, beforeEach, expect, test, vi } from 'vitest'

const runId = '605b6a5b-9108-4415-8fb1-f0cf3986cccb'

beforeEach(() => vi.stubEnv('VITE_URL_BACKEND', 'https://api.example.test/'))
afterEach(() => { vi.unstubAllGlobals(); vi.unstubAllEnvs() })

test('reads statistics with bearer authorization and cancellation without changing the run', async () => {
    const { api } = await import('@/api')
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify({ data: { runStatistics: null } })))
    vi.stubGlobal('fetch', fetchMock)
    const controller = new AbortController()
    await expect(api.runStatistics(runId, 'session-token', controller.signal)).resolves.toBeNull()
    const [url, request] = fetchMock.mock.calls[0]!
    expect(String(url)).toBe('https://api.example.test/api/graphql')
    expect(new Headers(request.headers).get('Authorization')).toBe('Bearer session-token')
    expect(new Headers(request.headers).get('Accept-Language')).toBe('ru')
    expect(request.signal).toBe(controller.signal)
    const body = JSON.parse(request.body)
    expect(body.query).toContain('query RunStatistics')
    expect(body.variables).toEqual({ runId })
})

test('rejects a mismatched run rather than rendering another run statistics', async () => {
    const { api } = await import('@/api')
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(JSON.stringify({
        data: { runStatistics: { runId: 'other-run' } },
    }))))
    await expect(api.runStatistics(runId, 'session-token')).rejects.toMatchObject({ message: 'INVALID_RESPONSE' })
})
