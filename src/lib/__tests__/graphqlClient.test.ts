import type { TypedDocumentNode } from '@graphql-typed-document-node/core'

import type { ApiError } from '@/lib/graphqlClient'

import { parse } from 'graphql'
import { afterEach, expect, test, vi } from 'vitest'

import { graphqlClient } from '@/lib/graphqlClient'

const document: TypedDocumentNode<{ item: null }, { id: string }> = parse('query Item($id: ID!) { item(id: $id) { id } }')

afterEach(() => {
    vi.unstubAllGlobals()
})

test('sends typed query variables and supports cancellation', async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify({ data: { item: null } }), { status: 200 }))
    vi.stubGlobal('fetch', fetchMock)
    const controller = new AbortController()

    const result = await graphqlClient.query(document, { id: 'item-1' }, { signal: controller.signal })

    expect(result).toEqual({ item: null })
    const [, request] = fetchMock.mock.calls[0] as [string, RequestInit]
    expect(request.signal).toBe(controller.signal)
    expect(JSON.parse(request.body as string)).toMatchObject({ variables: { id: 'item-1' } })
})

test('exposes GraphQL errors separately from HTTP errors', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(JSON.stringify({ errors: [{ message: 'UNAUTHORIZED' }] }), { status: 200 })))

    await expect(graphqlClient.query(document, { id: 'item-1' })).rejects.toMatchObject({
        kind: 'graphql',
        message: 'UNAUTHORIZED'
    } satisfies Partial<ApiError>)
})

test('exposes HTTP status for failed requests', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('', { status: 503 })))

    await expect(graphqlClient.query(document, { id: 'item-1' })).rejects.toMatchObject({
        kind: 'http',
        status: 503
    } satisfies Partial<ApiError>)
})

test('preserves request cancellation', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new DOMException('Aborted', 'AbortError')))

    await expect(graphqlClient.query(document, { id: 'item-1' })).rejects.toMatchObject({
        name: 'AbortError'
    })
})
