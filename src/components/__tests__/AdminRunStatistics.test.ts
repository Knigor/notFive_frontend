import type { RunStatisticsResult } from '@/api'

import userEvent from '@testing-library/user-event'
import { cleanup, render, screen, waitFor } from '@testing-library/vue'
import { afterEach, beforeEach, expect, test, vi } from 'vitest'

import AdminRunStatistics from '@/components/AdminRunStatistics.vue'

const { runStatistics } = vi.hoisted(() => ({
    runStatistics: vi.fn<(id: string, token: string, signal?: AbortSignal) => Promise<RunStatisticsResult | null>>(),
}))
vi.mock('@/api', () => ({ api: { runStatistics } }))
vi.mock('@/composables/useAdminAuth', () => ({ useAdminAuth: () => ({ getToken: () => 'admin-token' }) }))

const runId = '605b6a5b-9108-4415-8fb1-f0cf3986cccb'
const secondId = '705b6a5b-9108-4415-8fb1-f0cf3986cccb'
const statistics: RunStatisticsResult = {
    runId, status: 'completed', inputMode: 'file', queueDurationMs: 1500,
    counts: { candidates: 30, collected: 0, imported: 30, included: 5, merged: 8, excluded: 17, events: 5 },
    exclusions: [{ code: 'off_topic', stage: 'analysis', site: 'a.ru', count: 17 }],
    calls: [{ stage: 'analysis', attempt: 1, model: 'model', durationMs: 2000, inputTokens: null, outputTokens: 0 }],
    discoverySources: [],
    evidence: [
        { stage: 'analysis', available: true, exact: 4, normalized: 1, notFound: 0, other: 0 },
        { stage: 'export', available: false, exact: 0, normalized: 0, notFound: 0, other: 0 },
    ],
    search: { modelAttempts: 0, webSearchCalls: null, traceAvailable: false }, warnings: [],
}

beforeEach(() => vi.resetAllMocks())
afterEach(() => { cleanup(); vi.restoreAllMocks() })

test('shows file collection as skipped and missing metrics without inventing zero tokens or evidence', async () => {
    runStatistics.mockResolvedValue(statistics)
    render(AdminRunStatistics, { props: { runId, status: 'completed' }, global: { stubs: { RunStatisticsChart: true } } })
    await screen.findByText('Загрузка сайтов пропущена: материалы получены из файла.')
    expect(screen.getByText('Файловый запуск: поиск и парсинг сайтов не выполнялись.')).toBeTruthy()
    expect(screen.getByText('Проверки цитат не сохранены: нет данных.')).toBeTruthy()
    expect(screen.getAllByText('Нет данных').length).toBeGreaterThan(0)
    expect(screen.getByText('Вне темы')).toBeTruthy()
    expect(runStatistics).toHaveBeenCalledWith(runId, 'admin-token', expect.any(AbortSignal))
})

test('allows retry after a statistics error without changing the run', async () => {
    runStatistics.mockRejectedValueOnce(new Error('offline')).mockResolvedValueOnce(statistics)
    const user = userEvent.setup()
    render(AdminRunStatistics, { props: { runId, status: 'completed' }, global: { stubs: { RunStatisticsChart: true } } })
    await screen.findByRole('alert')
    await user.click(screen.getByRole('button', { name: 'Обновить статистику' }))
    await screen.findByText('Воронка отбора')
    expect(screen.queryByRole('alert')).toBeNull()
    expect(runStatistics).toHaveBeenCalledTimes(2)
})

test('aborts stale requests and refreshes when the selected run finishes', async () => {
    let finish: (value: RunStatisticsResult) => void = () => { throw new Error('Request not initialized') }
    runStatistics.mockImplementationOnce(() => new Promise(resolve => { finish = resolve }))
        .mockResolvedValue({ ...statistics, runId: secondId, warnings: ['Новый запуск'] })
    const view = render(AdminRunStatistics, { props: { runId, status: 'running' }, global: { stubs: { RunStatisticsChart: true } } })
    const oldSignal = runStatistics.mock.calls[0]?.[2]
    await view.rerender({ runId: secondId, status: 'running' })
    await screen.findByText('Новый запуск')
    expect(oldSignal?.aborted).toBe(true)
    finish({ ...statistics, warnings: ['Старый запуск'] })
    await waitFor(() => expect(screen.queryByText('Старый запуск')).toBeNull())
    await view.rerender({ runId: secondId, status: 'completed' })
    await waitFor(() => expect(runStatistics).toHaveBeenCalledTimes(3))
})
