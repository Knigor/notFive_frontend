import { ping } from '@/composables/useDigest'

export class ApiClient {
    private readonly baseUrl: URL

    constructor(baseUrl: string) {
        this.baseUrl = new URL(baseUrl)

        if (!this.baseUrl.pathname.endsWith('/')) {
            this.baseUrl.pathname += '/'
        }
    }

    ping(signal?: AbortSignal): Promise<number> {
        return ping(new URL('api/graphql', this.baseUrl), signal)
    }
}

const backendUrl = import.meta.env.VITE_URL_BACKEND

if (!backendUrl) {
    throw new Error('VITE_URL_BACKEND is not configured')
}

export const api = new ApiClient(backendUrl)
