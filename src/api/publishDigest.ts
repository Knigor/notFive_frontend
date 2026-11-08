import type { PublishDigestMutation } from '@/gql/graphql'

import { PublishDigestDocument } from '@/gql/graphql'
import { ApiError, executeGraphQL } from '@/lib/graphqlClient'

export type DigestPublicationResult = PublishDigestMutation['publishDigest']

export const publishDigest = async (
    endpoint: URL,
    runId: string,
    token: string,
    signal?: AbortSignal
): Promise<DigestPublicationResult> => {
    const { publishDigest: result } = await executeGraphQL(endpoint, PublishDigestDocument, { runId }, { token, signal })

    if (
        !result
        || typeof result.runId !== 'string'
        || !result.runId
        || typeof result.publishedAt !== 'string'
        || !result.publishedAt
        || typeof result.alreadyPublished !== 'boolean'
        || ![result.emailSent, result.emailFailed, result.emailPending].every(value => Number.isSafeInteger(value) && value >= 0)
    ) {
        throw new ApiError('INVALID_RESPONSE', 'graphql')
    }

    return result
}
