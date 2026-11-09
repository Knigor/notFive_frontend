import type { RunStatusQuery } from '@/gql/graphql'

import { RunStatusDocument } from '@/gql/graphql'
import { ApiError, executeGraphQL } from '@/lib/graphqlClient'

export type RunStatusResult = NonNullable<RunStatusQuery['runStatus']>

export const runStatus = async (
    endpoint: URL,
    runId: string,
    token: string,
    signal?: AbortSignal
): Promise<RunStatusResult | null> => {
    const { runStatus: result } = await executeGraphQL(endpoint, RunStatusDocument, { runId }, { token, signal })

    if (result === null) return null

    if (
        !result
        || typeof result.runId !== 'string'
        || result.runId.toLowerCase() !== runId.toLowerCase()
        || typeof result.status !== 'string'
        || !result.status
        || typeof result.createdAt !== 'string'
        || !Number.isFinite(Date.parse(result.createdAt))
        || ![result.startedAt, result.finishedAt].every(value => value === null || (typeof value === 'string' && Number.isFinite(Date.parse(value))))
        || !(result.error === null || typeof result.error === 'string')
        || !Array.isArray(result.files)
        || !result.files.every(filename => typeof filename === 'string')
        || !result.diagnostics
        || !result.diagnostics.counts
        || typeof result.diagnostics.counts !== 'object'
        || !['candidates', 'collected', 'imported', 'included', 'merged', 'excluded', 'events'].every(key => {
            const value = Reflect.get(result.diagnostics.counts, key)
            return typeof value === 'number' && Number.isSafeInteger(value) && value >= 0
        })
        || !Array.isArray(result.diagnostics.warnings)
        || !result.diagnostics.warnings.every(warning => typeof warning === 'string')
        || !Array.isArray(result.diagnostics.materials)
        || !result.diagnostics.materials.every(material => material
            && typeof material.id === 'string'
            && typeof material.status === 'string'
            && typeof material.stage === 'string'
            && [material.title, material.url, material.group, material.reason, material.error].every(value => value === null || typeof value === 'string'))
    ) {
        throw new ApiError('INVALID_RESPONSE', 'graphql')
    }

    return result
}
