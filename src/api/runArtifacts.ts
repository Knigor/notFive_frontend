import { ApiError } from '@/lib/graphqlClient'

export const RUN_ARTIFACT_FILENAMES = ['digest.md', 'post.md', 'email.md', 'journal.csv'] as const

export type RunArtifactFilename = typeof RUN_ARTIFACT_FILENAMES[number]

const download = async (
    endpoint: URL,
    contentType: string,
    token: string,
    signal?: AbortSignal
): Promise<Blob> => {
    let response: Response

    try {
        response = await fetch(endpoint, {
            method: 'GET',
            headers: {
                Authorization: `Bearer ${token}`,
                Accept: contentType,
                'Accept-Language': 'ru',
            },
            cache: 'no-store',
            redirect: 'error',
            signal,
        })
    } catch (error) {
        if (error instanceof DOMException && error.name === 'AbortError') throw error
        throw new ApiError('NETWORK_ERROR', 'network')
    }

    if (!response.ok) {
        const kind = response.status === 401 || response.status === 403 ? 'unauthorized' : 'http'
        throw new ApiError('HTTP_ERROR', kind, response.status)
    }

    if (response.headers.get('Content-Type')?.split(';')[0]?.trim().toLowerCase() !== contentType) {
        throw new ApiError('INVALID_RESPONSE', 'http', response.status)
    }

    try {
        return await response.blob()
    } catch (error) {
        if (error instanceof DOMException && error.name === 'AbortError') throw error
        throw new ApiError('NETWORK_ERROR', 'network')
    }
}

const runPath = (runId: string): string => {
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(runId)) {
        throw new TypeError('INVALID_RUN_ID')
    }

    return `api/runs/${runId}`
}

export const downloadRunArtifact = (
    baseUrl: URL,
    runId: string,
    filename: RunArtifactFilename,
    token: string,
    signal?: AbortSignal
): Promise<Blob> => {
    if (!RUN_ARTIFACT_FILENAMES.includes(filename)) throw new TypeError('INVALID_ARTIFACT_FILENAME')

    return download(
        new URL(`${runPath(runId)}/artifacts/${filename}`, baseUrl),
        filename === 'journal.csv' ? 'text/csv' : 'text/markdown',
        token,
        signal
    )
}

export const downloadRunArchive = (
    baseUrl: URL,
    runId: string,
    token: string,
    signal?: AbortSignal
): Promise<Blob> => download(new URL(`${runPath(runId)}/artifacts.zip`, baseUrl), 'application/zip', token, signal)
