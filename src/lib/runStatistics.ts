import type { RunStatisticsResult } from '@/api/runStatistics'

export const statisticStages = [
    { code: 'search', label: 'Поиск' },
    { code: 'analysis', label: 'Анализ' },
    { code: 'export', label: 'Подготовка текста' },
]

const stageLabels: Record<string, string> = {
    search: 'Поиск', analysis: 'Анализ', export: 'Подготовка текста',
    collection: 'Сбор', discovery: 'Поиск ссылок', fetch: 'Загрузка',
    import: 'Импорт', limit: 'Лимит',
}

export const statisticStageLabel = (stage: string) => stageLabels[stage] ?? stage

export const exclusionLabels: Record<string, string> = {
    outside_window: 'Вне периода', date_unconfirmed: 'Дата не подтверждена',
    download_error: 'Ошибка загрузки', off_topic: 'Вне темы',
    limit: 'Лимит сбора', other: 'Другие причины',
}

export const statisticNumber = (value: number | null | undefined) => value == null
    ? 'Нет данных'
    : new Intl.NumberFormat('ru-RU', { maximumFractionDigits: 1 }).format(value)

export const statisticDuration = (milliseconds: number | null | undefined) => milliseconds == null
    ? 'Нет данных'
    : `${statisticNumber(milliseconds / 1000)} с`

export const stageStatistics = (calls: RunStatisticsResult['calls']) => statisticStages.map(stage => {
    const matching = calls.filter(call => call.stage === stage.code)
    const sum = (key: 'durationMs' | 'inputTokens' | 'outputTokens') => {
        if (!matching.length || matching.some(call => call[key] == null)) return null
        return matching.reduce((total, call) => total + (call[key] ?? 0), 0)
    }
    return { ...stage, calls: matching.length, durationMs: sum('durationMs'), inputTokens: sum('inputTokens'), outputTokens: sum('outputTokens') }
})

export const groupedExclusions = (rows: RunStatisticsResult['exclusions'], site: string, stage: string) => {
    const grouped = new Map<string, number>()
    for (const row of rows) {
        if ((site !== 'all' && row.site !== site) || (stage !== 'all' && row.stage !== stage)) continue
        grouped.set(row.code, (grouped.get(row.code) ?? 0) + row.count)
    }
    return [...grouped].map(([code, count]) => ({ code, label: exclusionLabels[code] ?? code, count }))
        .sort((a, b) => b.count - a.count)
}
