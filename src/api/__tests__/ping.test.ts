import { afterEach, expect, test, vi } from 'vitest'

import { ping } from '@/api/ping'

afterEach(() => {
    vi.unstubAllGlobals()
})

test('returns the typed ping result', async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify({ data: { ping: 1 } }), { status: 200 }))
    vi.stubGlobal('fetch', fetchMock)

    await expect(ping()).resolves.toBe(1)

    const [, request] = fetchMock.mock.calls[0] as [string, RequestInit]
    expect(JSON.parse(request.body as string)).toEqual({
        query: 'query Ping {\n  ping\n}',
        variables: {}
    })
})
