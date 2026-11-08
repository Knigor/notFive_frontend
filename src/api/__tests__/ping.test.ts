import { afterEach, beforeEach, expect, test, vi } from 'vitest'

beforeEach(() => {
    vi.resetModules()
    vi.stubEnv('VITE_URL_BACKEND', 'http://api.example.test/')
})

afterEach(() => {
    vi.unstubAllGlobals()
    vi.unstubAllEnvs()
})

test.each([
    ['http://api.example.test/', 'http://api.example.test/api/graphql'],
    ['http://api.example.test', 'http://api.example.test/api/graphql'],
    ['https://api.example.test/backend', 'https://api.example.test/backend/api/graphql'],
    ['https://api.example.test/backend/', 'https://api.example.test/backend/api/graphql']
])('sends ping through the shared API instance configured with %s', async (baseUrl, expectedUrl) => {
    vi.stubEnv('VITE_URL_BACKEND', baseUrl)
    const { api } = await import('@/api')
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify({ data: { ping: 1 } }), { status: 200 }))
    vi.stubGlobal('fetch', fetchMock)
    const controller = new AbortController()

    await expect(api.ping(controller.signal)).resolves.toBe(1)

    const [url, request] = fetchMock.mock.calls[0] as [URL, RequestInit]
    expect(url.href).toBe(expectedUrl)
    expect(request.signal).toBe(controller.signal)
    expect(JSON.parse(request.body as string)).toEqual({
        query: 'query Ping {\n  ping\n}',
        variables: {}
    })
})

test('allows a separate client to target another backend', async () => {
    const { api, ApiClient } = await import('@/api')
    const otherApi = new ApiClient('https://other.example.test/')
    const fetchMock = vi.fn().mockImplementation(async () => new Response(JSON.stringify({ data: { ping: 1 } }), { status: 200 }))
    vi.stubGlobal('fetch', fetchMock)

    await otherApi.ping()
    await api.ping()

    const urls = fetchMock.mock.calls.map(([url]) => String(url))
    expect(urls).toEqual([
        'https://other.example.test/api/graphql',
        'http://api.example.test/api/graphql'
    ])
})

test('reports missing backend configuration', async () => {
    vi.stubEnv('VITE_URL_BACKEND', undefined)

    await expect(import('@/api')).rejects.toThrow('VITE_URL_BACKEND is not configured')
})
