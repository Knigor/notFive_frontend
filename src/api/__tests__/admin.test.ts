import { afterEach, beforeEach, expect, test, vi } from 'vitest'

import { isUnauthorizedError } from '@/lib/graphqlClient'

const runResult = {
    runId: 'run-123',
    imported: 30,
    rejected: 0,
    siteCount: 0,
    inputKind: 'dataset',
    dispatchStatus: 'completed',
    status: 'queued',
}

const respondWith = (payload: unknown, status = 200) => {
    const fetchMock = vi.fn<(url: RequestInfo | URL, request?: RequestInit) => Promise<Response>>(async () => (
        new Response(JSON.stringify(payload), { status })
    ))
    vi.stubGlobal('fetch', fetchMock)
    return fetchMock
}

beforeEach(() => {
    vi.stubEnv('VITE_URL_BACKEND', 'https://api.example.test/')
})

afterEach(() => {
    vi.unstubAllGlobals()
    vi.unstubAllEnvs()
})

test('signs in with a username and password without attaching authorization', async () => {
    const { api } = await import('@/api')
    const fetchMock = respondWith({ data: { login: { token: 'session-token', expiresIn: 3600 } } })
    const controller = new AbortController()

    await expect(api.login({ username: 'operator', password: 'sample-password' }, controller.signal)).resolves.toEqual({
        token: 'session-token',
        expiresIn: 3600,
    })

    const [url, request] = fetchMock.mock.calls[0]!
    expect(String(url)).toBe('https://api.example.test/api/graphql')
    expect(request?.signal).toBe(controller.signal)
    expect(new Headers(request?.headers).get('Authorization')).toBeNull()
    expect(new Headers(request?.headers).get('Content-Type')).toBe('application/json')
    expect(typeof request?.body).toBe('string')
    if (typeof request?.body !== 'string') throw new Error('Expected JSON request')
    expect(JSON.parse(request.body)).toMatchObject({
        variables: { input: { username: 'operator', password: 'sample-password' } },
    })
})

test('loads the source catalogue with the current bearer token', async () => {
    const { api } = await import('@/api')
    const source = {
        id: 'source-1',
        name: 'Example',
        taskUrl: 'https://example.test/news',
        searchDomain: 'example.test',
        status: 'ready',
    }
    const fetchMock = respondWith({ data: { availableSiteSources: [source] } })

    await expect(api.availableSiteSources('session-token')).resolves.toEqual([source])

    const request = fetchMock.mock.calls[0]?.[1]
    expect(new Headers(request?.headers).get('Authorization')).toBe('Bearer session-token')
})

test('uploads the original JSON file using the GraphQL multipart map', async () => {
    const { api } = await import('@/api')
    const fetchMock = respondWith({ data: { startRun: runResult } })
    const file = new File(['{"dataset":"train","items":[]}'], 'news.json', { type: 'application/json' })
    const controller = new AbortController()

    await expect(api.startRun({ file }, 'session-token', controller.signal)).resolves.toEqual(runResult)

    const request = fetchMock.mock.calls[0]?.[1]
    expect(new Headers(request?.headers).get('Authorization')).toBe('Bearer session-token')
    expect(new Headers(request?.headers).has('Content-Type')).toBe(false)
    expect(request?.signal).toBe(controller.signal)
    expect(request?.body).toBeInstanceOf(FormData)
    if (!(request?.body instanceof FormData)) throw new Error('Expected multipart request')
    expect(request.body.get('0')).toBe(file)
    expect(request.body.get('map')).toBe('{"0":["variables.input.file"]}')
    const operations = request.body.get('operations')
    if (typeof operations !== 'string') throw new Error('Expected GraphQL operations')
    expect(JSON.parse(operations)).toMatchObject({ variables: { input: { file: null } } })
})

test('submits catalogue source IDs and the explicit Moscow offset as JSON', async () => {
    const { api } = await import('@/api')
    const input = { sourceIds: ['source-1'], controlTime: '2026-11-08T10:00:00+03:00' }
    const fetchMock = respondWith({ data: { startRun: { ...runResult, inputKind: 'sites', siteCount: 1 } } })

    await api.startRun(input, 'session-token')

    const request = fetchMock.mock.calls[0]?.[1]
    expect(new Headers(request?.headers).get('Content-Type')).toBe('application/json')
    expect(new Headers(request?.headers).get('Authorization')).toBe('Bearer session-token')
    if (typeof request?.body !== 'string') throw new Error('Expected JSON request')
    expect(JSON.parse(request.body)).toMatchObject({ variables: { input } })
})

test('preserves a failed dispatch response for the interface to report', async () => {
    const { api } = await import('@/api')
    const result = { ...runResult, dispatchStatus: 'failed', status: 'failed' }
    respondWith({ data: { startRun: result } })

    await expect(api.startRun({ sourceIds: ['source-1'] }, 'session-token')).resolves.toEqual(result)
})

test.each([401, 403])('classifies HTTP %s as a session error', async status => {
    const { api } = await import('@/api')
    respondWith({ message: 'Not authorized' }, status)

    await expect(api.availableSiteSources('expired-token')).rejects.toMatchObject({ kind: 'unauthorized', status })
})

test.each([
    { message: 'Для этого действия требуется вход администратора.' },
    { message: 'Administrator sign-in is required for this action.' },
    { message: 'Session expired', extensions: { code: 'UNAUTHENTICATED' } },
    { message: 'Access denied', extensions: { code: 'FORBIDDEN' } },
])('classifies a protected GraphQL error as a session error: $message', async error => {
    const { api } = await import('@/api')
    respondWith({ errors: [error], data: null })

    const result = await api.availableSiteSources('expired-token').catch(value => value)
    expect(isUnauthorizedError(result)).toBe(true)
    expect(result).toMatchObject({ message: error.message })
})

test('keeps invalid credentials as a login error instead of a session expiry', async () => {
    const { api } = await import('@/api')
    respondWith({ errors: [{ message: 'Неверный логин или пароль.' }] })

    await expect(api.login({ username: 'operator', password: 'wrong' })).rejects.toMatchObject({
        kind: 'graphql',
        message: 'Неверный логин или пароль.',
    })
})

test.each([null, [], { data: null }, { errors: [null] }, { errors: 'error' }])('rejects malformed GraphQL payload %j', async payload => {
    const { api } = await import('@/api')
    respondWith(payload)

    await expect(api.availableSiteSources('session-token')).rejects.toMatchObject({ message: 'INVALID_RESPONSE' })
})

test('rejects an empty token returned by the server', async () => {
    const { api } = await import('@/api')
    respondWith({ data: { login: { token: '', expiresIn: 3600 } } })

    await expect(api.login({ username: 'operator', password: 'sample-password' })).rejects.toMatchObject({ message: 'INVALID_RESPONSE' })
})

test('rejects malformed catalogue entries', async () => {
    const { api } = await import('@/api')
    respondWith({ data: { availableSiteSources: [{ id: 'source-1' }] } })

    await expect(api.availableSiteSources('session-token')).rejects.toMatchObject({ message: 'INVALID_RESPONSE' })
})

test('rejects invalid run counts', async () => {
    const { api } = await import('@/api')
    respondWith({ data: { startRun: { ...runResult, imported: -1 } } })

    await expect(api.startRun({ sourceIds: ['source-1'] }, 'session-token')).rejects.toMatchObject({ message: 'INVALID_RESPONSE' })
})
