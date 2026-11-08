import type { DigestQuery } from '@/gql/graphql'

import { DigestDocument } from '@/gql/graphql'
import { ApiError, executeGraphQL } from '@/lib/graphqlClient'

export type DigestResult = NonNullable<DigestQuery['digest']>

export const digest = async (
    endpoint: URL,
    date: string,
    signal?: AbortSignal
): Promise<DigestResult | null> => {
    const response = await executeGraphQL(endpoint, DigestDocument, { date }, { signal })

    if (response.digest === undefined) {
        throw new ApiError('INVALID_RESPONSE', 'graphql')
    }

    return response.digest
}
