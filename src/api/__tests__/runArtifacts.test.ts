import { afterEach, beforeEach, expect, test, vi } from 'vitest'

const runId = '605b6a5b-9108-4415-8fb1-f0cf3986cccb'
const run = {
    runId,
    status: 'completed',
    error: null,
    createdAt: '2026-11-08T12:00:00+03:00',
    startedAt: '2026-11-08T12:01:00+03:00',
    finishedAt: '2026-11-08T12:05:00+03:00',
    files: ['digest.md', 'post.md', 'email.md', 'journal.csv'],
    diagnostics: {
        collectionRunId: null,
        digestRunId: null,
        counts: { candidates: 0, collected: 0, imported: 0, included: 0, merged: 0, excluded: 0, events: 0 },
        warnings: [],
        materials: [],
    },
}

beforeEach(() => {
    vi.stubEnv('VITE_URL_BACKEND', 'https://api.example.test/')
})

afterEach(() => {
    vi.unstubAllGlobals()
    vi.unstubAllEnvs()
})

test('reads the protected run status and distinguishes a missing run', async () => {
    const { api } = await import('@/api')
    const fetchMock = vi.fn<(url: RequestInfo | URL, request?: RequestInit) => Promise<Response>>()
        .mockResolvedValueOnce(new Response(JSON.stringify({ data: { runStatus: run } })))
        .mockResolvedValueOnce(new Response(JSON.stringify({ data: { runStatus: null } })))
    vi.stubGlobal('fetch', fetchMock)

    await expect(api.runStatus(runId, 'session-token')).resolves.toEqual(run)
    await expect(api.runStatus(runId, 'session-token')).resolves.toBeNull()
    const request = fetchMock.mock.calls[0]?.[1]
    expect(new Headers(request?.headers).get('Authorization')).toBe('Bearer session-token')
    expect(JSON.parse(String(request?.body))).toMatchObject({ variables: { runId } })
})

test('rejects a mismatched run response', async () => {
    const { api } = await import('@/api')
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(JSON.stringify({
        data: { runStatus: { ...run, runId: 'other-run' } },
    }))))

    await expect(api.runStatus(runId, 'session-token')).rejects.toMatchObject({ message: 'INVALID_RESPONSE' })
})

test('rejects malformed diagnostics instead of displaying misleading totals', async () => {
    const { api } = await import('@/api')
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(JSON.stringify({
        data: { runStatus: { ...run, diagnostics: { ...run.diagnostics, counts: { ...run.diagnostics.counts, excluded: -1 } } } },
    }))))

    await expect(api.runStatus(runId, 'session-token')).rejects.toMatchObject({ message: 'INVALID_RESPONSE' })
})

test.each([
    ['digest.md', 'text/markdown'],
    ['post.md', 'text/markdown'],
    ['email.md', 'text/markdown'],
    ['journal.csv', 'text/csv'],
] as const)('downloads %s with authorization without adding credentials to the URL', async (filename, contentType) => {
    const { api } = await import('@/api')
    const content = 'Сохранённый результат'
    const fetchMock = vi.fn<(url: RequestInfo | URL, request?: RequestInit) => Promise<Response>>()
        .mockResolvedValue(new Response(content, { headers: { 'Content-Type': `${contentType}; charset=utf-8` } }))
    vi.stubGlobal('fetch', fetchMock)
    const controller = new AbortController()

    const file = await api.downloadRunArtifact(runId, filename, 'session-token', controller.signal)

    expect(await file.text()).toBe(content)
    const [url, request] = fetchMock.mock.calls[0]!
    expect(String(url)).toBe(`https://api.example.test/api/runs/${runId}/artifacts/${filename}`)
    expect(new Headers(request?.headers).get('Authorization')).toBe('Bearer session-token')
    expect(new Headers(request?.headers).get('Accept-Language')).toBe('ru')
    expect(request?.signal).toBe(controller.signal)
    expect(request?.cache).toBe('no-store')
})

test('preserves ZIP bytes from the archive endpoint', async () => {
    const { api } = await import('@/api')
    const bytes = new Uint8Array([80, 75, 3, 4, 0, 255])
    const fetchMock = vi.fn<(url: RequestInfo | URL, request?: RequestInit) => Promise<Response>>()
        .mockResolvedValue(new Response(bytes, { headers: { 'Content-Type': 'application/zip' } }))
    vi.stubGlobal('fetch', fetchMock)

    const file = await api.downloadRunArchive(runId, 'session-token')

    expect(new Uint8Array(await file.arrayBuffer())).toEqual(bytes)
    expect(String(fetchMock.mock.calls[0]?.[0])).toBe(`https://api.example.test/api/runs/${runId}/artifacts.zip`)
})

test.each([401, 403, 404])('reports artifact HTTP %s without saving an error body', async status => {
    const { api } = await import('@/api')
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('', { status })))

    await expect(api.downloadRunArtifact(runId, 'digest.md', 'session-token')).rejects.toMatchObject({
        status,
        kind: status === 404 ? 'http' : 'unauthorized',
    })
})

test('keeps cancellation distinct from network failure', async () => {
    const { api } = await import('@/api')
    const error = new DOMException('Aborted', 'AbortError')
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(error))

    await expect(api.downloadRunArchive(runId, 'session-token')).rejects.toBe(error)
})

test('does not download an HTML error page as a digest', async () => {
    const { api } = await import('@/api')
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('<html>Error</html>', {
        headers: { 'Content-Type': 'text/html' },
    })))

    await expect(api.downloadRunArtifact(runId, 'digest.md', 'session-token')).rejects.toMatchObject({ message: 'INVALID_RESPONSE' })
})
