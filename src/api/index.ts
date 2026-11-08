import type { AdminLoginInput, AdminLoginResult } from '@/api/login'
import type { DigestResult } from '@/api/digest'
import type { DigestPublicationResult } from '@/api/publishDigest'
import type { EmailSubscriptionOptions, EmailSubscriptionResult } from '@/api/subscribeEmail'
import type { SiteSource } from '@/api/availableSiteSources'
import type { RunStartResult, StartRunInput } from '@/api/startRun'

import { ping } from '@/composables/useDigest'

import { availableSiteSources } from '@/api/availableSiteSources'
import { login } from '@/api/login'
import { digest } from '@/api/digest'
import { publishDigest } from '@/api/publishDigest'
import { publishedDigestDates } from '@/api/publishedDigestDates'
import { subscribeEmail } from '@/api/subscribeEmail'
import { startRun } from '@/api/startRun'

export type {
    AdminLoginInput,
    AdminLoginResult,
    DigestResult,
    DigestPublicationResult,
    EmailSubscriptionOptions,
    EmailSubscriptionResult,
    RunStartResult,
    SiteSource,
    StartRunInput,
}

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

    publishedDigestDates(signal?: AbortSignal): Promise<string[]> {
        return publishedDigestDates(new URL('api/graphql', this.baseUrl), signal)
    }

    digest(date: string, signal?: AbortSignal): Promise<DigestResult | null> {
        return digest(new URL('api/graphql', this.baseUrl), date, signal)
    }

    subscribeEmail(email: string, options: EmailSubscriptionOptions = {}): Promise<EmailSubscriptionResult> {
        return subscribeEmail(new URL('api/graphql', this.baseUrl), email, options)
    }

    publishDigest(runId: string, token: string, signal?: AbortSignal): Promise<DigestPublicationResult> {
        return publishDigest(new URL('api/graphql', this.baseUrl), runId, token, signal)
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
