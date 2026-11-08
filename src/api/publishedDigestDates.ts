import { PublishedDigestDatesDocument } from '@/gql/graphql'
import { ApiError, executeGraphQL } from '@/lib/graphqlClient'

export const publishedDigestDates = async (
    endpoint: URL,
    signal?: AbortSignal
): Promise<string[]> => {
    const response = await executeGraphQL(endpoint, PublishedDigestDatesDocument, {}, { signal })

    if (!Array.isArray(response.publishedDigestDates)
        || !response.publishedDigestDates.every(date => typeof date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(date))) {
        throw new ApiError('INVALID_RESPONSE', 'graphql')
    }

    return response.publishedDigestDates
}
