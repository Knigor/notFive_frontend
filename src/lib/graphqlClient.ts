import type { TypedDocumentNode } from '@graphql-typed-document-node/core'

import { print } from 'graphql'

type GraphQLError = {
    message: string
}

type GraphQLResponse<T> = {
    data?: T
    errors?: GraphQLError[]
}

export class ApiError extends Error {
    public readonly kind: 'network' | 'http' | 'graphql'
    public readonly status?: number

    constructor(
        message: string,
        kind: 'network' | 'http' | 'graphql',
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
}

export const executeGraphQL = async <TData, TVariables>(
    endpoint: URL,
    document: TypedDocumentNode<TData, TVariables>,
    variables: TVariables,
    options: RequestOptions = {}
): Promise<TData> => {
    let response: Response
    try {
        response = await fetch(endpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                ...(options.token ? { Authorization: `Bearer ${options.token}` } : {})
            },
            body: JSON.stringify({ query: print(document), variables }),
            signal: options.signal
        })
    } catch (error) {
        if (error instanceof DOMException && error.name === 'AbortError') throw error
        throw new ApiError('NETWORK_ERROR', 'network')
    }

    if (!response.ok) throw new ApiError('HTTP_ERROR', 'http', response.status)

    let payload: GraphQLResponse<TData>
    try {
        payload = await response.json() as GraphQLResponse<TData>
    } catch {
        throw new ApiError('INVALID_RESPONSE', 'network')
    }

    if (payload.errors?.length) {
        throw new ApiError(payload.errors.map(error => error.message).join('; '), 'graphql')
    }

    if (payload.data === undefined) throw new ApiError('INVALID_RESPONSE', 'graphql')

    return payload.data
}
