export interface NewsDatasetPreview {
    articleCount: number
    controlTime: string
    periodStart: string
    timezone: string
    dataset: string
}

export interface AdminSiteSource {
    id: string
    name: string
    taskUrl: string
    searchDomain: string
    status: string
}

type NewsDatasetResult =
    | { ok: true, value: NewsDatasetPreview }
    | { ok: false, error: 'invalidJson' | 'invalidDataset' | 'invalidItems' }

type ResolvedSourcesResult =
    | { ok: true, sources: AdminSiteSource[] }
    | { ok: false, error: 'required' | 'tooManySources' | 'unknownSources' | 'unavailableSources' | 'duplicateDomains' }

const isRecord = (value: unknown): value is Record<string, unknown> => (
    typeof value === 'object' && value !== null && !Array.isArray(value)
)

const isTimestamp = (value: unknown): value is string => {
    if (typeof value !== 'string') return false
    if (!/^\d{4}-\d{2}-\d{2}T(?:[01]\d|2[0-3]):[0-5]\d:[0-5]\d(?:Z|[+-](?:[01]\d|2[0-3]):[0-5]\d)$/.test(value)) return false
    if (!Number.isFinite(Date.parse(value))) return false

    const calendarDate = new Date(`${value.slice(0, 10)}T00:00:00Z`)
    return Number.isFinite(calendarDate.getTime()) && calendarDate.toISOString().slice(0, 10) === value.slice(0, 10)
}

export const parseNewsDataset = (content: string): NewsDatasetResult => {
    let value: unknown

    try {
        value = JSON.parse(content)
    } catch {
        return { ok: false, error: 'invalidJson' }
    }

    if (
        !isRecord(value)
        || (value.dataset !== undefined && value.dataset !== null && typeof value.dataset !== 'string')
        || !isTimestamp(value.control_time)
        || !isTimestamp(value.period_start)
        || Date.parse(value.control_time) - Date.parse(value.period_start) !== 24 * 60 * 60 * 1000
        || (value.timezone !== undefined && value.timezone !== null && value.timezone !== 'Europe/Moscow')
    ) {
        return { ok: false, error: 'invalidDataset' }
    }

    if (!Array.isArray(value.items)) {
        return { ok: false, error: 'invalidItems' }
    }

    return {
        ok: true,
        value: {
            articleCount: value.items.length,
            controlTime: value.control_time,
            periodStart: value.period_start,
            timezone: 'Europe/Moscow',
            dataset: value.dataset ?? '—',
        },
    }
}

export const resolveSourceIds = (ids: string[], sources: AdminSiteSource[]): ResolvedSourcesResult => {
    const uniqueIds = [...new Set(ids)]
    if (!uniqueIds.length) return { ok: false, error: 'required' }
    if (uniqueIds.length > 5) return { ok: false, error: 'tooManySources' }

    const catalog = new Map(sources.map(source => [source.id, source]))
    const resolved: AdminSiteSource[] = []
    const domains = new Set<string>()

    for (const id of uniqueIds) {
        const source = catalog.get(id)
        if (!source) return { ok: false, error: 'unknownSources' }
        if (source.status !== 'ready') return { ok: false, error: 'unavailableSources' }

        const domain = source.searchDomain.toLowerCase()
        if (domains.has(domain)) return { ok: false, error: 'duplicateDomains' }

        resolved.push(source)
        domains.add(domain)
    }

    return { ok: true, sources: resolved }
}
