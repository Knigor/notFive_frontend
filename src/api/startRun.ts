import type { StartRunMutation } from '@/gql/graphql'

import { StartRunDocument } from '@/gql/graphql'
import { ApiError, executeGraphQL } from '@/lib/graphqlClient'

export type StartRunInput = {
    file?: File
    sourceIds?: string[]
    controlTime?: string
}

export type RunStartResult = StartRunMutation['startRun']

export const startRun = async (
    endpoint: URL,
    input: StartRunInput,
    token: string,
    signal?: AbortSignal
): Promise<RunStartResult> => {
    const { file, ...fields } = input
    const { startRun: result } = await executeGraphQL(endpoint, StartRunDocument, {
        input: file ? { ...fields, file: null } : fields,
    }, {
        token,
        signal,
        ...(file ? { files: { 'variables.input.file': file } } : {}),
    })

    if (
        !result
        || typeof result.runId !== 'string'
        || !result.runId
        || ![result.imported, result.rejected, result.siteCount].every(value => Number.isSafeInteger(value) && value >= 0)
        || typeof result.inputKind !== 'string'
        || typeof result.dispatchStatus !== 'string'
        || typeof result.status !== 'string'
    ) {
        throw new ApiError('INVALID_RESPONSE', 'graphql')
    }

    return result
}
