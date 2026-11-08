import type { TypedDocumentNode } from '@graphql-typed-document-node/core'

import { print } from 'graphql'

type GraphQLError = {
    message: string
    extensions?: Record<string, unknown>
}

type ApiErrorKind = 'network' | 'http' | 'graphql' | 'unauthorized'

export class ApiError extends Error {
    public readonly kind: ApiErrorKind
    public readonly status?: number

    constructor(
        message: string,
        kind: ApiErrorKind,
        status?: number
    ) {
        super(message)
        this.kind = kind
        this.status = status
    }
}

type RequestOptions = {
    signal?: AbortSignal
    token?: string
    files?: Record<string, File>
}

const isRecord = (value: unknown): value is Record<string, unknown> => (
    typeof value === 'object' && value !== null && !Array.isArray(value)
)

const isGraphQLError = (value: unknown): value is GraphQLError => (
    isRecord(value)
    && typeof value.message === 'string'
    && (value.extensions === undefined || isRecord(value.extensions))
)

const isForbidden = (error: GraphQLError) => (
    error.extensions?.code === 'UNAUTHENTICATED'
    || error.extensions?.code === 'FORBIDDEN'
    || error.message === 'Для этого действия требуется вход администратора.'
    || error.message === 'Administrator sign-in is required for this action.'
)

export const isUnauthorizedError = (error: unknown): error is ApiError => (
    error instanceof ApiError && error.kind === 'unauthorized'
)

export const executeGraphQL = async <TData, TVariables>(
    endpoint: URL,
    document: TypedDocumentNode<TData, TVariables>,
    variables: TVariables,
    options: RequestOptions = {}
): Promise<TData> => {
    const operations = JSON.stringify({ query: print(document), variables })
    const files = Object.entries(options.files ?? {})
    let body: string | FormData = operations

    if (files.length) {
        const form = new FormData()
        form.append('operations', operations)
        form.append('map', JSON.stringify(Object.fromEntries(files.map(([path], index) => [String(index), [path]]))))
        files.forEach(([, file], index) => form.append(String(index), file))
        body = form
    }

    let response: Response
    try {
        response = await fetch(endpoint, {
            method: 'POST',
            headers: {
                ...(!files.length ? { 'Content-Type': 'application/json' } : {}),
                ...(options.token ? { Authorization: `Bearer ${options.token}` } : {})
            },
            body,
            signal: options.signal
        })
    } catch (error) {
        if (error instanceof DOMException && error.name === 'AbortError') throw error
        throw new ApiError('NETWORK_ERROR', 'network')
    }

    if (!response.ok) {
        const kind = response.status === 401 || response.status === 403 ? 'unauthorized' : 'http'
        throw new ApiError('HTTP_ERROR', kind, response.status)
    }

    let payload: unknown
    try {
        payload = await response.json()
    } catch {
        throw new ApiError('INVALID_RESPONSE', 'network')
    }

    if (!isRecord(payload)) throw new ApiError('INVALID_RESPONSE', 'graphql')

    if (payload.errors !== undefined) {
        if (!Array.isArray(payload.errors) || !payload.errors.every(isGraphQLError)) {
            throw new ApiError('INVALID_RESPONSE', 'graphql')
        }
        if (payload.errors.length) {
            const kind = payload.errors.some(isForbidden) ? 'unauthorized' : 'graphql'
            throw new ApiError(payload.errors.map(error => error.message).join('; '), kind)
        }
    }

    if (!isRecord(payload.data)) throw new ApiError('INVALID_RESPONSE', 'graphql')

    return payload.data as TData
}
