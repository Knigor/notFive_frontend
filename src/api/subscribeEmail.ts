import type { SubscribeEmailMutation } from '@/gql/graphql'

import { SubscribeEmailDocument } from '@/gql/graphql'
import { ApiError, executeGraphQL } from '@/lib/graphqlClient'

export type EmailSubscriptionResult = SubscribeEmailMutation['subscribeEmail']

export type EmailSubscriptionOptions = {
    signal?: AbortSignal
}

export const subscribeEmail = async (
    endpoint: URL,
    email: string,
    options: EmailSubscriptionOptions = {}
): Promise<EmailSubscriptionResult> => {
    const { subscribeEmail: result } = await executeGraphQL(endpoint, SubscribeEmailDocument, { email }, options)

    if (!result || typeof result.status !== 'string' || !result.status || typeof result.message !== 'string' || !result.message) {
        throw new ApiError('INVALID_RESPONSE', 'graphql')
    }

    return result
}
