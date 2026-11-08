import type { AdminLoginInput, AdminLoginResult } from '@/api/login'
import type { SiteSource } from '@/api/availableSiteSources'
import type { RunStartResult, StartRunInput } from '@/api/startRun'

import { ping } from '@/composables/useDigest'

import { availableSiteSources } from '@/api/availableSiteSources'
import { login } from '@/api/login'
import { startRun } from '@/api/startRun'

export type { AdminLoginInput, AdminLoginResult, RunStartResult, SiteSource, StartRunInput }

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

    login(input: AdminLoginInput, signal?: AbortSignal): Promise<AdminLoginResult> {
        return login(new URL('api/graphql', this.baseUrl), input, signal)
    }

    availableSiteSources(token: string, signal?: AbortSignal): Promise<SiteSource[]> {
        return availableSiteSources(new URL('api/graphql', this.baseUrl), token, signal)
    }

    startRun(input: StartRunInput, token: string, signal?: AbortSignal): Promise<RunStartResult> {
        return startRun(new URL('api/graphql', this.baseUrl), input, token, signal)
    }
}

const backendUrl = import.meta.env.VITE_URL_BACKEND

if (!backendUrl) {
    throw new Error('VITE_URL_BACKEND is not configured')
}

export const api = new ApiClient(backendUrl)
