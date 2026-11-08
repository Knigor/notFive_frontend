import type { DigestResult } from '@/api/digest'

import { cleanup, render, waitFor } from '@testing-library/vue'
import { afterEach, beforeEach, expect, test, vi } from 'vitest'
import { defineComponent, nextTick } from 'vue'

import { usePublishedDigest } from '@/composables/usePublishedDigest'

const { publishedDigestDates, digest } = vi.hoisted(() => ({
    publishedDigestDates: vi.fn<(signal?: AbortSignal) => Promise<string[]>>(),
    digest: vi.fn<(date: string, signal?: AbortSignal) => Promise<DigestResult | null>>(),
}))

vi.mock('@/api', () => ({ api: { publishedDigestDates, digest } }))

const issue = (date: string): DigestResult => ({
    runId: `run-${date}`,
    controlTime: `${date}T10:00:00+03:00`,
    periodStart: `${date === '2026-11-09' ? '2026-11-08' : '2026-11-07'}T10:00:00+03:00`,
    timezone: 'Europe/Moscow',
    language: 'ru',
    publishedAt: `${date}T10:05:00+03:00`,
    totalMaterials: 0,
    events: [],
    files: null,
})

const deferredDigest = () => {
    let resolve: (result: DigestResult | null) => void = () => {
        throw new Error('The deferred request is not initialized')
    }
    const promise = new Promise<DigestResult | null>(fulfill => { resolve = fulfill })
    return { promise, resolve }
}

const mountDigest = () => {
    let state: ReturnType<typeof usePublishedDigest> | undefined
    render(defineComponent({
        setup() {
            state = usePublishedDigest()
            return () => null
        },
    }))
    if (!state) throw new Error('The digest composable did not mount')
    return state
}

beforeEach(() => {
    publishedDigestDates.mockReset()
    digest.mockReset()
})

afterEach(cleanup)

test('loads the latest published date and switches to another available issue', async () => {
    publishedDigestDates.mockResolvedValue(['2026-11-09', '2026-11-08'])
    digest.mockResolvedValueOnce(issue('2026-11-09')).mockResolvedValueOnce(issue('2026-11-08'))
    const state = mountDigest()

    await waitFor(() => expect(state.pending.value).toBe(false))
    expect(state.selectedDate.value).toBe('2026-11-09')
    expect(state.digest.value).toEqual(issue('2026-11-09'))
    expect(digest).toHaveBeenNthCalledWith(1, '2026-11-09', expect.any(AbortSignal))

    await state.selectDate('2026-11-08')
    expect(state.selectedDate.value).toBe('2026-11-08')
    expect(state.digest.value).toEqual(issue('2026-11-08'))
    expect(digest).toHaveBeenNthCalledWith(2, '2026-11-08', expect.any(AbortSignal))
    expect(publishedDigestDates).toHaveBeenCalledTimes(1)

    await state.selectDate('2026-11-07')
    expect(state.selectedDate.value).toBe('2026-11-08')
    expect(digest).toHaveBeenCalledTimes(2)
})

test('aborts the previous request and ignores its late result after selecting another day', async () => {
    const previous = deferredDigest()
    const current = deferredDigest()
    publishedDigestDates.mockResolvedValue(['2026-11-09', '2026-11-08'])
    digest.mockReturnValueOnce(previous.promise).mockReturnValueOnce(current.promise)
    const state = mountDigest()
    await waitFor(() => expect(digest).toHaveBeenCalledTimes(1))
    const previousSignal = digest.mock.calls[0]?.[1]
    expect(previousSignal?.aborted).toBe(false)

    const changed = state.selectDate('2026-11-08')
    expect(previousSignal?.aborted).toBe(true)
    expect(state.pending.value).toBe(true)
    current.resolve(issue('2026-11-08'))
    await changed
    expect(state.digest.value).toEqual(issue('2026-11-08'))

    previous.resolve(issue('2026-11-09'))
    await previous.promise
    await nextTick()
    expect(state.digest.value).toEqual(issue('2026-11-08'))
    expect(state.selectedDate.value).toBe('2026-11-08')
    expect(state.pending.value).toBe(false)
    expect(state.error.value).toBe('')
})

test('does not request an issue when there are no published dates', async () => {
    publishedDigestDates.mockResolvedValue([])
    const state = mountDigest()

    await waitFor(() => expect(state.pending.value).toBe(false))
    expect(state.dates.value).toEqual([])
    expect(state.selectedDate.value).toBe('')
    expect(state.digest.value).toBeNull()
    expect(state.error.value).toBe('')
    expect(digest).not.toHaveBeenCalled()
})

test('shows a loading error and recovers when refresh is retried', async () => {
    publishedDigestDates.mockResolvedValue(['2026-11-08'])
    digest.mockRejectedValueOnce(new Error('Network unavailable')).mockResolvedValueOnce(issue('2026-11-08'))
    const state = mountDigest()

    await waitFor(() => expect(state.pending.value).toBe(false))
    expect(state.error.value).toBe('Не удалось загрузить выпуск. Проверьте соединение и попробуйте ещё раз.')
    expect(state.digest.value).toBeNull()

    await state.refresh()
    expect(state.error.value).toBe('')
    expect(state.pending.value).toBe(false)
    expect(state.digest.value).toEqual(issue('2026-11-08'))
    expect(publishedDigestDates).toHaveBeenCalledTimes(2)
    expect(digest).toHaveBeenCalledTimes(2)
})
