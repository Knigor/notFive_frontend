import { PingDocument } from '@/gql/graphql'
import { executeGraphQL } from '@/lib/graphqlClient'

export const ping = async (endpoint: URL, signal?: AbortSignal): Promise<number> => {
    const response = await executeGraphQL(endpoint, PingDocument, {}, { signal })
    return response.ping
}
