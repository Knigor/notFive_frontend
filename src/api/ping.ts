import { PingDocument } from '@/gql/graphql'
import { graphqlClient } from '@/lib/graphqlClient'

export async function ping(signal?: AbortSignal): Promise<number> {
    const response = await graphqlClient.query(PingDocument, {}, { signal })
    return response.ping
}
