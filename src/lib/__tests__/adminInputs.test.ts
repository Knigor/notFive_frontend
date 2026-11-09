import type { AdminSiteSource } from '@/lib/adminInputs'

import { describe, expect, test } from 'vitest'

import { parseNewsDataset, resolveSourceIds } from '@/lib/adminInputs'

const dataset = {
    dataset: 'train',
    control_time: '2026-11-06T10:00:00+03:00',
    period_start: '2026-11-05T10:00:00+03:00',
    timezone: 'Europe/Moscow',
    items: [
        {
            id: 'TR-20',
            title: 'Материал без даты',
            text: 'Исходный текст',
            source: 'Источник',
            url: 'https://source.example/news',
            published_at: null,
            missing: ['published_at'],
            error: null,
        },
        {
            id: 'TR-28',
            title: 'Материал без текста',
            text: null,
            source: 'Источник',
            url: 'https://source.example/other',
            published_at: '2026-11-06T09:40:00+03:00',
            missing: ['text'],
            error: 'Не удалось загрузить текст',
        },
    ],
}

describe('parseNewsDataset', () => {
    test('previews the organiser format while retaining articles with missing source data', () => {
        expect(parseNewsDataset(JSON.stringify(dataset))).toEqual({
            ok: true,
            value: {
                articleCount: 2,
                controlTime: dataset.control_time,
                periodStart: dataset.period_start,
                timezone: dataset.timezone,
                dataset: dataset.dataset,
            },
        })
    })

    test('accepts an empty collection without treating it as a parsing failure', () => {
        expect(parseNewsDataset(JSON.stringify({ ...dataset, items: [] }))).toMatchObject({
            ok: true,
            value: { articleCount: 0 },
        })
    })

    test.each([undefined, null])('accepts omitted or null optional metadata: %s', (value) => {
        expect(parseNewsDataset(JSON.stringify({ ...dataset, dataset: value, timezone: value }))).toMatchObject({
            ok: true,
            value: { dataset: '—', timezone: 'Europe/Moscow' },
        })
    })

    test('compares the period by instant when timestamps use different offsets', () => {
        expect(parseNewsDataset(JSON.stringify({ ...dataset, period_start: '2026-11-05T07:00:00Z' }))).toMatchObject({
            ok: true,
        })
    })

    test('distinguishes invalid JSON from invalid dataset metadata', () => {
        expect(parseNewsDataset('{')).toEqual({ ok: false, error: 'invalidJson' })
        expect(parseNewsDataset('null')).toEqual({ ok: false, error: 'invalidDataset' })
        expect(parseNewsDataset('[]')).toEqual({ ok: false, error: 'invalidDataset' })
        expect(parseNewsDataset('{}')).toEqual({ ok: false, error: 'invalidDataset' })
    })

    test.each([
        { control_time: 'not-a-date' },
        { control_time: '2026-11-06T10:00:00' },
        { control_time: '2026-11-06T10:00+03:00' },
        { control_time: '2026-11-06T10:00:00.000+03:00' },
        { control_time: '2026-11-06' },
        { control_time: '2026-02-30T10:00:00+03:00' },
        { control_time: '2026-11-06T24:00:00+03:00' },
        { period_start: '2026-11-07T10:00:00+03:00' },
        { period_start: dataset.control_time },
        { period_start: '2026-11-05T09:59:59+03:00' },
        { period_start: '2026-11-05T10:00:01+03:00' },
        { timezone: 'UTC' },
        { dataset: 123 },
    ])('rejects invalid time metadata: %j', (metadata) => {
        expect(parseNewsDataset(JSON.stringify({ ...dataset, ...metadata }))).toEqual({
            ok: false,
            error: 'invalidDataset',
        })
    })

    test.each([
        undefined,
        null,
        {},
        'articles',
    ])('rejects malformed article collections: %j', (items) => {
        expect(parseNewsDataset(JSON.stringify({ ...dataset, items }))).toEqual({
            ok: false,
            error: 'invalidItems',
        })
    })

    test('leaves malformed articles and duplicate IDs for the backend rejection journal', () => {
        const items = [null, 'article', { id: '' }, { id: 'TR-01', text: 123 }, { id: 'TR-01', missing: 'text' }]
        expect(parseNewsDataset(JSON.stringify({ ...dataset, items }))).toMatchObject({
            ok: true,
            value: { articleCount: 5 },
        })
    })
})

const createSource = (domain: string, overrides: Partial<AdminSiteSource> = {}): AdminSiteSource => ({
    id: domain,
    name: domain,
    taskUrl: `https://${domain}/news`,
    searchDomain: domain,
    status: 'ready',
    ...overrides,
})

describe('resolveSourceIds', () => {
    test('resolves catalog entries and preserves the selected order', () => {
        const first = createSource('first.example', { id: 'first-id' })
        const second = createSource('second.example', { id: 'second-id' })

        expect(resolveSourceIds([second.id, first.id], [first, second])).toEqual({
            ok: true,
            sources: [second, first],
        })
    })

    test('does not start the default collection when the selection is empty', () => {
        expect(resolveSourceIds([], [createSource('source.example')])).toEqual({
            ok: false,
            error: 'required',
        })
    })

    test('rejects a removed selection instead of silently collecting from the remaining sites', () => {
        const source = createSource('source.example')
        expect(resolveSourceIds([source.id, 'removed-id'], [source])).toEqual({
            ok: false,
            error: 'unknownSources',
        })
    })

    test('starts collection from candidate and ready sources without a manual connection step', () => {
        const ready = createSource('ready.example')
        const candidate = createSource('candidate.example', { status: 'candidate' })

        expect(resolveSourceIds([candidate.id, ready.id], [ready, candidate])).toEqual({
            ok: true,
            sources: [candidate, ready],
        })
    })

    test('rejects a selected source disabled after the catalog refresh', () => {
        const ready = createSource('ready.example')
        const unavailable = createSource('unavailable.example', { status: 'candidate' })
        const selection = [ready.id, unavailable.id]

        expect(resolveSourceIds(selection, [ready, unavailable]).ok).toBe(true)

        expect(resolveSourceIds(selection, [ready, { ...unavailable, status: 'disabled' }])).toEqual({
            ok: false,
            error: 'unavailableSources',
        })
    })

    test('enforces the limit of five distinct source IDs', () => {
        const sources = Array.from({ length: 6 }, (_, index) => createSource(`source${index}.example`))
        const ids = sources.map(source => source.id)

        expect(resolveSourceIds(ids, sources)).toEqual({ ok: false, error: 'tooManySources' })
        expect(resolveSourceIds([...ids.slice(0, 5), ...ids.slice(0, 1)], sources)).toEqual({
            ok: true,
            sources: sources.slice(0, 5),
        })
    })

    test('deduplicates repeated IDs without changing selection order', () => {
        const first = createSource('first.example')
        const second = createSource('second.example')

        expect(resolveSourceIds([second.id, first.id, second.id], [first, second])).toEqual({
            ok: true,
            sources: [second, first],
        })
    })

    test.each(['shared.example', 'SHARED.EXAMPLE'])('rejects different IDs targeting the same domain: %s', (domain) => {
        const first = createSource('shared.example', { id: 'first' })
        const second = createSource(domain, { id: 'second' })

        expect(resolveSourceIds([first.id, second.id], [first, second])).toEqual({
            ok: false,
            error: 'duplicateDomains',
        })
    })
})
