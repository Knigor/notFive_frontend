import type { RunStatisticsQuery } from '@/gql/graphql'

import { RunStatisticsDocument } from '@/gql/graphql'
import { ApiError, executeGraphQL } from '@/lib/graphqlClient'

export type RunStatisticsResult = NonNullable<RunStatisticsQuery['runStatistics']>

export const runStatistics = async (
    endpoint: URL,
    runId: string,
    token: string,
    signal?: AbortSignal
): Promise<RunStatisticsResult | null> => {
    const { runStatistics: result } = await executeGraphQL(endpoint, RunStatisticsDocument, { runId }, { token, signal })
    if (result === null) return null
    if (
        !result
        || result.runId?.toLowerCase() !== runId.toLowerCase()
        || !result.counts || !result.search
        || !Array.isArray(result.calls) || !Array.isArray(result.exclusions)
        || !Array.isArray(result.discoverySources) || !Array.isArray(result.evidence)
        || !Array.isArray(result.warnings)
    ) throw new ApiError('INVALID_RESPONSE', 'graphql')
    return result
}
