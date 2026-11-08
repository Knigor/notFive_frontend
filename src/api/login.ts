import type { AdminLoginInput, AdminLoginMutation } from '@/gql/graphql'

import { AdminLoginDocument } from '@/gql/graphql'
import { ApiError, executeGraphQL } from '@/lib/graphqlClient'

export type AdminLoginResult = AdminLoginMutation['login']
export type { AdminLoginInput } from '@/gql/graphql'

export const login = async (
    endpoint: URL,
    input: AdminLoginInput,
    signal?: AbortSignal
): Promise<AdminLoginResult> => {
    const { login: result } = await executeGraphQL(endpoint, AdminLoginDocument, { input }, { signal })

    if (!result || typeof result.token !== 'string' || !result.token || !Number.isSafeInteger(result.expiresIn) || result.expiresIn <= 0) {
        throw new ApiError('INVALID_RESPONSE', 'graphql')
    }

    return result
}
