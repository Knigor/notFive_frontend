import type { DigestPublicationResult, RunArtifactFilename, RunStatusResult } from '@/api'

import userEvent from '@testing-library/user-event'
import { cleanup, render, screen, waitFor, within } from '@testing-library/vue'
import { afterEach, beforeEach, expect, test, vi } from 'vitest'
import { createMemoryHistory, createRouter } from 'vue-router'

import AdminRunPanel from '@/components/AdminRunPanel.vue'

const { runStatus, publishDigest, downloadRunArtifact, downloadRunArchive } = vi.hoisted(() => ({
    runStatus: vi.fn<(id: string, token: string, signal?: AbortSignal) => Promise<RunStatusResult | null>>(),
    publishDigest: vi.fn<(id: string, token: string, signal?: AbortSignal) => Promise<DigestPublicationResult>>(),
    downloadRunArtifact: vi.fn<(id: string, name: RunArtifactFilename, token: string, signal?: AbortSignal) => Promise<Blob>>(),
    downloadRunArchive: vi.fn<(id: string, token: string, signal?: AbortSignal) => Promise<Blob>>(),
}))

vi.mock('@/api', () => ({
    api: { runStatus, publishDigest, downloadRunArtifact, downloadRunArchive },
    RUN_ARTIFACT_FILENAMES: ['digest.md', 'post.md', 'email.md', 'journal.csv'],
}))
vi.mock('@/composables/useAdminAuth', () => ({ useAdminAuth: () => ({ getToken: () => 'admin-token' }) }))

const runId = '605b6a5b-9108-4415-8fb1-f0cf3986cccb'
const secondId = '705b6a5b-9108-4415-8fb1-f0cf3986cccb'
const completed: RunStatusResult = {
    runId,
    status: 'completed',
    error: null,
    createdAt: '2026-11-08T15:30:00Z',
    startedAt: '2026-11-08T15:30:01Z',
    finishedAt: '2026-11-08T15:31:00Z',
    files: ['digest.md', 'post.md', 'email.md', 'journal.csv'],
    diagnostics: {
        collectionRunId: null,
        digestRunId: null,
        counts: { candidates: 0, collected: 0, imported: 0, included: 0, merged: 0, excluded: 0, events: 0 },
        warnings: [],
        materials: [],
    },
}

const renderPanel = () => render(AdminRunPanel, {
    props: { runId },
    global: {
        plugins: [createRouter({
            history: createMemoryHistory(),
            routes: [{ path: '/', name: 'home', component: { template: '<div />' } }],
        })],
    },
})

beforeEach(() => {
    vi.resetAllMocks()
})

afterEach(() => {
    cleanup()
    vi.useRealTimers()
    vi.restoreAllMocks()
})

test('polls queued runs until completion and stops once files become available', async () => {
    vi.useFakeTimers()
    runStatus.mockResolvedValueOnce({ ...completed, status: 'queued', files: [], startedAt: null, finishedAt: null })
        .mockResolvedValueOnce(completed)
    renderPanel()
    await vi.waitFor(() => expect(screen.getByText('Ожидает обработки')).toBeTruthy())
    expect(screen.queryByRole('button', { name: 'Скачать digest.md' })).toBeNull()

    await vi.advanceTimersByTimeAsync(5000)
    expect(screen.getByText('Выпуск готов')).toBeTruthy()
    expect(screen.getByRole<HTMLButtonElement>('button', { name: 'Скачать digest.md' }).disabled).toBe(false)
    expect(screen.getByRole<HTMLButtonElement>('button', { name: 'Скачать всё в ZIP' }).disabled).toBe(false)
    await vi.advanceTimersByTimeAsync(15_000)
    expect(runStatus).toHaveBeenCalledTimes(2)
    expect(publishDigest).not.toHaveBeenCalled()
})

test('aborts the previous run and ignores its late response after selecting another run', async () => {
    let resolvePrevious: (value: RunStatusResult) => void = () => { throw new Error('Request not initialized') }
    runStatus.mockReturnValueOnce(new Promise<RunStatusResult>(resolve => { resolvePrevious = resolve }))
        .mockResolvedValueOnce({ ...completed, runId: secondId, files: ['digest.md'] })
    const { rerender } = renderPanel()
    const previousSignal = runStatus.mock.calls[0]?.[2]

    await rerender({ runId: secondId })
    await screen.findByText('Сервер ещё не предоставил полный комплект файлов. Обновите статус позже.')
    expect(previousSignal?.aborted).toBe(true)
    resolvePrevious(completed)
    await waitFor(() => expect(screen.getByRole<HTMLButtonElement>('button', { name: 'Скачать digest.md' }).disabled).toBe(true))
    expect(screen.getByRole<HTMLButtonElement>('button', { name: 'Опубликовать выпуск' }).disabled).toBe(true)
    expect(downloadRunArtifact).not.toHaveBeenCalled()
})

test('publishes only after confirmation and prevents a repeated submit while pending', async () => {
    runStatus.mockResolvedValue(completed)
    let finishPublication: (value: DigestPublicationResult) => void = () => { throw new Error('Request not initialized') }
    publishDigest.mockReturnValueOnce(new Promise<DigestPublicationResult>(resolve => { finishPublication = resolve }))
    const user = userEvent.setup()
    renderPanel()
    await screen.findByText('Выпуск готов')

    await user.click(screen.getByRole('button', { name: 'Опубликовать выпуск' }))
    let dialog = within(await screen.findByRole('dialog', { name: 'Опубликовать выпуск?' }))
    expect(publishDigest).not.toHaveBeenCalled()
    await user.click(dialog.getByRole('button', { name: 'Отмена' }))
    expect(publishDigest).not.toHaveBeenCalled()

    await user.click(screen.getByRole('button', { name: 'Опубликовать выпуск' }))
    dialog = within(await screen.findByRole('dialog', { name: 'Опубликовать выпуск?' }))
    await user.dblClick(dialog.getByRole('button', { name: 'Опубликовать и отправить' }))
    expect(publishDigest).toHaveBeenCalledTimes(1)
    expect(publishDigest).toHaveBeenCalledWith(runId, 'admin-token', expect.any(AbortSignal))
    expect(dialog.getByRole<HTMLButtonElement>('button', { name: 'Публикуем…' }).disabled).toBe(true)
    finishPublication({ runId, publishedAt: '2026-11-08T15:32:00Z', alreadyPublished: false, emailSent: 2, emailFailed: 0, emailPending: 1 })
    await screen.findByText('Выпуск опубликован')
    expect(screen.queryByRole('dialog')).toBeNull()
    expect(screen.getByText(/Писем отправлено: 2. В очереди: 1. Ошибок отправки: 0/)).toBeTruthy()
})
