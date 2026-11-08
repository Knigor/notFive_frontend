import type { AvailableSiteSourcesQuery } from '@/gql/graphql'

import { AvailableSiteSourcesDocument } from '@/gql/graphql'
import { ApiError, executeGraphQL } from '@/lib/graphqlClient'

export type SiteSource = AvailableSiteSourcesQuery['availableSiteSources'][number]

export const availableSiteSources = async (
    endpoint: URL,
    token: string,
    signal?: AbortSignal
): Promise<SiteSource[]> => {
    const { availableSiteSources: sources } = await executeGraphQL(endpoint, AvailableSiteSourcesDocument, {}, { token, signal })

    if (!Array.isArray(sources) || !sources.every(source => (
        source
        && typeof source.id === 'string'
        && typeof source.name === 'string'
        && typeof source.taskUrl === 'string'
        && typeof source.searchDomain === 'string'
        && typeof source.status === 'string'
    ))) {
        throw new ApiError('INVALID_RESPONSE', 'graphql')
    }

    return sources
}
