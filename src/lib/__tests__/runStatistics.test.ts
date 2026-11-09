import { expect, test } from 'vitest'

import { groupedExclusions, stageStatistics, statisticDuration, statisticNumber } from '@/lib/runStatistics'

test('keeps missing and measured-zero metrics distinct and does not invent complete stage totals', () => {
    const stages = stageStatistics([
        { stage: 'search', attempt: 1, model: null, durationMs: 1200, inputTokens: 100, outputTokens: 0 },
        { stage: 'search', attempt: 2, model: null, durationMs: null, inputTokens: null, outputTokens: 5 },
    ])
    expect(stages[0]).toMatchObject({ durationMs: null, inputTokens: null, outputTokens: 5, calls: 2 })
    expect(stages[1]).toMatchObject({ durationMs: null, inputTokens: null, outputTokens: null, calls: 0 })
    expect(statisticNumber(null)).toBe('Нет данных')
    expect(statisticNumber(0)).toBe('0')
    expect(statisticDuration(0)).toBe('0 с')
})

test('filters exclusion reasons by both source and stage before grouping', () => {
    const rows = [
        { code: 'limit', site: 'a.ru', stage: 'collection', count: 7 },
        { code: 'limit', site: 'b.ru', stage: 'collection', count: 2 },
        { code: 'off_topic', site: 'a.ru', stage: 'analysis', count: 3 },
    ]
    expect(groupedExclusions(rows, 'all', 'all').map(row => row.count)).toEqual([9, 3])
    expect(groupedExclusions(rows, 'a.ru', 'analysis')).toEqual([{ code: 'off_topic', label: 'Вне темы', count: 3 }])
    expect(groupedExclusions(rows, 'b.ru', 'analysis')).toEqual([])
})
