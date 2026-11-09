<template>
    <section class="mt-6 min-w-0 border-t border-border pt-6" :aria-labelledby="headingId">
        <div class="flex flex-wrap items-start justify-between gap-4">
            <div>
                <h4 :id="headingId" class="font-serif text-2xl leading-8">
                    Статистика запуска
                </h4>
                <p class="mt-1 text-sm leading-6 text-muted-foreground">
                    Сбор, отбор и работа модели по сохранённому аудиту.
                </p>
            </div>
            <Button
                class="min-h-11"
                type="button"
                variant="outline"
                :disabled="loading"
                @click="load"
            >
                <RefreshCw class="size-4" aria-hidden="true" />
                Обновить статистику
            </Button>
        </div>
        <p v-if="loading" class="mt-4 text-sm text-muted-foreground" role="status">
            Загружаем статистику…
        </p>
        <p v-if="error" class="mt-4 text-sm text-destructive" role="alert">
            {{ error }}
        </p>
        <p v-if="!loading && !error && !statistics" class="mt-4 text-sm text-muted-foreground">
            Статистика этого запуска пока недоступна.
        </p>
        <div v-if="statistics" class="mt-6 space-y-6">
            <p v-if="error" class="text-sm text-muted-foreground">
                Ниже показаны данные последнего успешного обновления.
            </p>
            <ul v-if="statistics.warnings.length" class="space-y-2 rounded-lg border border-border bg-muted/40 p-4 text-sm leading-6">
                <li v-for="warning in statistics.warnings" :key="warning" class="wrap-anywhere">
                    {{ warning }}
                </li>
            </ul>
            <div class="grid min-w-0 gap-6 xl:grid-cols-2">
                <section class="min-w-0 rounded-xl border border-border p-4 sm:p-6" :aria-labelledby="`${headingId}-funnel`">
                    <h5 :id="`${headingId}-funnel`" class="text-base font-medium">
                        Воронка отбора
                    </h5>
                    <RunStatisticsChart :labels="funnel.map(row => row.label)" :series="[{ name: 'Количество', values: funnel.map(row => row.value) }]" />
                    <dl class="grid grid-cols-2 gap-4 text-sm">
                        <div v-for="row in funnel" :key="row.label">
                            <dt class="text-muted-foreground">
                                {{ row.label }}
                            </dt>
                            <dd class="mt-1 font-medium tabular-nums">
                                {{ row.skipped ? 'Пропущено' : number(row.value) }}
                            </dd>
                        </div>
                    </dl>
                    <p class="mt-4 text-xs leading-5 text-muted-foreground">
                        Первые этапы — материалы, последний — события. Несколько материалов могут объединяться в одно событие.
                    </p>
                    <p v-if="statistics.inputMode === 'file'" class="mt-2 text-xs leading-5 text-muted-foreground">
                        Загрузка сайтов пропущена: материалы получены из файла.
                    </p>
                    <dl class="mt-4 grid grid-cols-3 gap-3 border-t border-border pt-4 text-sm">
                        <div v-for="row in decisions" :key="row.label">
                            <dt class="text-muted-foreground">
                                {{ row.label }}
                            </dt>
                            <dd class="mt-1 font-medium tabular-nums">
                                {{ number(row.value) }}
                            </dd>
                        </div>
                    </dl>
                </section>
                <section class="min-w-0 rounded-xl border border-border p-4 sm:p-6" :aria-labelledby="`${headingId}-exclusions`">
                    <h5 :id="`${headingId}-exclusions`" class="text-base font-medium">
                        Причины исключений
                    </h5>
                    <div class="mt-4 grid gap-3 sm:grid-cols-2">
                        <div class="min-w-0">
                            <label :id="`${headingId}-site-label`" class="mb-2 block text-sm" :for="`${headingId}-site`">Сайт</label>
                            <Select v-model="siteFilter">
                                <SelectTrigger :id="`${headingId}-site`" class="min-h-11 w-full" :aria-labelledby="`${headingId}-site-label`">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">
                                        Все сайты
                                    </SelectItem>
                                    <SelectItem v-for="site in sites" :key="site" :value="site">
                                        {{ site === 'unknown' ? 'Источник не указан' : site }}
                                    </SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div class="min-w-0">
                            <label :id="`${headingId}-stage-label`" class="mb-2 block text-sm" :for="`${headingId}-stage`">Этап</label>
                            <Select v-model="stageFilter">
                                <SelectTrigger :id="`${headingId}-stage`" class="min-h-11 w-full" :aria-labelledby="`${headingId}-stage-label`">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">
                                        Все этапы
                                    </SelectItem>
                                    <SelectItem v-for="stage in exclusionStages" :key="stage" :value="stage">
                                        {{ stageLabel(stage) }}
                                    </SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    <RunStatisticsChart v-if="exclusions.length" :labels="exclusions.map(row => row.label)" :series="[{ name: 'Материалы', values: exclusions.map(row => row.count) }]" />
                    <p v-else class="py-8 text-sm text-muted-foreground" role="status">
                        Исключений для выбранных условий нет.
                    </p>
                    <dl class="space-y-2 text-sm" aria-live="polite">
                        <div v-for="row in exclusions" :key="row.code" class="flex justify-between gap-4">
                            <dt>{{ row.label }}</dt><dd class="font-medium tabular-nums">
                                {{ number(row.count) }}
                            </dd>
                        </div>
                    </dl>
                    <p class="mt-4 text-xs leading-5 text-muted-foreground">
                        Подробные причины по каждой публикации находятся в разделе «Обработка материалов».
                    </p>
                </section>
            </div>
            <section class="rounded-xl border border-border p-4 sm:p-6" :aria-labelledby="`${headingId}-generation`">
                <h5 :id="`${headingId}-generation`" class="text-base font-medium">
                    Время и токены модели
                </h5>
                <p class="mt-2 text-sm text-muted-foreground">
                    Ожидание в очереди: <span class="font-medium text-foreground">{{ duration(statistics.queueDurationMs) }}</span>
                </p>
                <div class="mt-4 grid min-w-0 gap-6 xl:grid-cols-2">
                    <div class="min-w-0">
                        <h6 class="text-sm font-medium">
                            Длительность вызовов по этапам
                        </h6>
                        <RunStatisticsChart :labels="stages.map(row => row.label)" :series="[{ name: 'Секунды', values: stages.map(row => row.durationMs === null ? null : row.durationMs / 1000) }]" unit="с" />
                    </div>
                    <div class="min-w-0">
                        <h6 class="text-sm font-medium">
                            Входные и выходные токены
                        </h6>
                        <RunStatisticsChart :labels="stages.map(row => row.label)" :series="tokenSeries" />
                    </div>
                </div>
                <ul class="grid gap-4 md:grid-cols-3">
                    <li v-for="stage in stages" :key="stage.code" class="rounded-lg bg-muted/40 p-4">
                        <h6 class="text-sm font-medium">
                            {{ stage.label }}
                        </h6>
                        <dl class="mt-3 space-y-2 text-sm">
                            <div class="flex justify-between gap-3">
                                <dt class="text-muted-foreground">
                                    Время
                                </dt><dd class="tabular-nums">
                                    {{ duration(stage.durationMs) }}
                                </dd>
                            </div>
                            <div class="flex justify-between gap-3">
                                <dt class="text-muted-foreground">
                                    Вход
                                </dt><dd class="tabular-nums">
                                    {{ number(stage.inputTokens) }}
                                </dd>
                            </div>
                            <div class="flex justify-between gap-3">
                                <dt class="text-muted-foreground">
                                    Выход
                                </dt><dd class="tabular-nums">
                                    {{ number(stage.outputTokens) }}
                                </dd>
                            </div>
                        </dl>
                    </li>
                </ul>
                <p class="mt-4 text-xs leading-5 text-muted-foreground">
                    Время — сумма длительностей вызовов модели, без загрузки сайтов и сохранения в БД. Если данные отсутствуют хотя бы у одного вызова этапа, итог этого показателя не рассчитывается. Ноль означает измеренное значение.
                </p>
                <details v-if="statistics.calls.length" class="mt-4 rounded-lg border border-border">
                    <summary class="min-h-11 cursor-pointer rounded-lg p-4 text-sm focus-visible:outline-2 focus-visible:outline-ring">
                        Отдельные вызовы: {{ statistics.calls.length }}
                    </summary>
                    <ol class="space-y-4 px-4 pb-4">
                        <li v-for="(call, index) in statistics.calls" :key="`${call.stage}-${call.attempt}-${index}`" class="border-t border-border pt-4 text-sm">
                            <p class="font-medium">
                                {{ stageLabel(call.stage) }} · попытка {{ call.attempt }}
                            </p>
                            <p v-if="call.model" class="mt-1 text-xs text-muted-foreground wrap-anywhere">
                                {{ call.model }}
                            </p>
                            <dl class="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-3">
                                <div>
                                    <dt class="text-muted-foreground">
                                        Время
                                    </dt><dd>{{ duration(call.durationMs) }}</dd>
                                </div>
                                <div>
                                    <dt class="text-muted-foreground">
                                        Входные токены
                                    </dt><dd>{{ number(call.inputTokens) }}</dd>
                                </div>
                                <div>
                                    <dt class="text-muted-foreground">
                                        Выходные токены
                                    </dt><dd>{{ number(call.outputTokens) }}</dd>
                                </div>
                            </dl>
                        </li>
                    </ol>
                </details>
            </section>
            <section class="rounded-xl border border-border p-4 sm:p-6" :aria-labelledby="`${headingId}-sources`">
                <h5 :id="`${headingId}-sources`" class="text-base font-medium">
                    Способы сбора источников
                </h5>
                <dl v-if="statistics.inputMode !== 'file'" class="mt-4 grid gap-4 sm:grid-cols-2">
                    <div>
                        <dt class="text-sm text-muted-foreground">
                            Попытки поисковой модели
                        </dt><dd class="mt-1 text-xl tabular-nums">
                            {{ number(statistics.search.modelAttempts) }}
                        </dd>
                    </div>
                    <div>
                        <dt class="text-sm text-muted-foreground">
                            Вызовы Web Search в трассе
                        </dt><dd class="mt-1 text-xl tabular-nums">
                            {{ statistics.search.traceAvailable ? number(statistics.search.webSearchCalls) : 'Нет данных' }}
                        </dd>
                    </div>
                </dl>
                <p class="mt-3 text-xs leading-5 text-muted-foreground">
                    Трасса показывает только вызовы, переданные провайдером; это не счётчик тарификации. RSS/Atom и HTML — отдельные способы получения ссылок.
                </p>
                <p v-if="!statistics.discoverySources.length" class="mt-4 text-sm text-muted-foreground">
                    {{ statistics.inputMode === 'file' ? 'Файловый запуск: поиск и парсинг сайтов не выполнялись.' : 'В аудите нет данных об источниках discovery.' }}
                </p>
                <ul v-else class="mt-4 divide-y divide-border">
                    <li v-for="source in statistics.discoverySources" :key="`${source.kind}-${source.url}`" class="py-4 first:pt-0 last:pb-0">
                        <div class="flex flex-wrap justify-between gap-2 text-sm">
                            <p class="font-medium wrap-anywhere">
                                {{ source.site }}
                            </p>
                            <span class="text-muted-foreground">{{ discoveryKind(source.kind) }} · {{ source.error ? 'Ошибка сбора' : source.attempted ? 'Обработан' : 'Не запускался' }}</span>
                        </div>
                        <a
                            v-if="safeUrl(source.url)"
                            class="mt-2 inline-flex min-h-11 max-w-full items-center rounded-sm text-xs text-primary underline underline-offset-4 wrap-anywhere focus-visible:outline-2 focus-visible:outline-ring"
                            target="_blank"
                            rel="noopener noreferrer"
                            :href="safeUrl(source.url)"
                        >{{ source.url }}</a>
                        <p v-else class="mt-2 text-xs wrap-anywhere">
                            {{ source.url }}
                        </p>
                        <dl class="mt-3 grid grid-cols-2 gap-4 text-sm sm:grid-cols-4">
                            <div>
                                <dt class="text-muted-foreground">
                                    Найдено
                                </dt><dd>{{ number(source.found) }}</dd>
                            </div>
                            <div>
                                <dt class="text-muted-foreground">
                                    Проверено ссылок
                                </dt><dd>{{ number(source.inspectedLinks) }}</dd>
                            </div>
                            <div>
                                <dt class="text-muted-foreground">
                                    Не просмотрено
                                </dt><dd>{{ number(source.uninspectedLinks) }}</dd>
                            </div>
                            <div>
                                <dt class="text-muted-foreground">
                                    Вне периода
                                </dt><dd>{{ number(source.outsideWindow) }}</dd>
                            </div>
                        </dl>
                        <p v-if="source.error" class="mt-3 text-sm text-destructive wrap-anywhere">
                            {{ source.error }}
                        </p>
                    </li>
                </ul>
            </section>
            <section class="rounded-xl border border-border p-4 sm:p-6" :aria-labelledby="`${headingId}-evidence`">
                <h5 :id="`${headingId}-evidence`" class="text-base font-medium">
                    Проверка цитат
                </h5>
                <RunStatisticsChart
                    v-if="availableEvidence.length"
                    stacked
                    :labels="availableEvidence.map(row => stageLabel(row.stage))"
                    :series="evidenceSeries"
                />
                <div class="mt-4 grid gap-4 sm:grid-cols-2">
                    <div v-for="row in statistics.evidence" :key="row.stage" class="rounded-lg bg-muted/40 p-4">
                        <h6 class="text-sm font-medium">
                            {{ stageLabel(row.stage) }}
                        </h6>
                        <p v-if="!row.available" class="mt-3 text-sm text-muted-foreground">
                            Проверки цитат не сохранены: нет данных.
                        </p>
                        <dl v-else class="mt-3 space-y-2 text-sm">
                            <div class="flex justify-between gap-3">
                                <dt>Точное совпадение</dt><dd>{{ number(row.exact) }}</dd>
                            </div>
                            <div class="flex justify-between gap-3">
                                <dt>После нормализации</dt><dd>{{ number(row.normalized) }}</dd>
                            </div>
                            <div class="flex justify-between gap-3">
                                <dt>Цитата не найдена</dt><dd>{{ number(row.notFound) }}</dd>
                            </div>
                            <div v-if="row.other" class="flex justify-between gap-3">
                                <dt>Другой результат</dt><dd>{{ number(row.other) }}</dd>
                            </div>
                        </dl>
                    </div>
                </div>
                <p class="mt-4 text-xs leading-5 text-muted-foreground">
                    Проверки анализа и подготовки текста показаны отдельно: одна цитата может проверяться на обоих этапах. Совпадение цитаты с публикацией не доказывает достоверность события.
                </p>
            </section>
        </div>
    </section>
</template>

<script setup lang="ts">
import type { RunStatisticsResult } from '@/api'

import { computed, defineAsyncComponent, onBeforeUnmount, ref, shallowRef, watch } from 'vue'

import { RefreshCw } from '@lucide/vue'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

import { useId } from 'vue'
import { useAdminAuth } from '@/composables/useAdminAuth'

import { api } from '@/api'
import { isUnauthorizedError } from '@/lib/graphqlClient'
import { groupedExclusions, stageStatistics, statisticDuration as duration, statisticNumber as number, statisticStageLabel as stageLabel } from '@/lib/runStatistics'

const RunStatisticsChart = defineAsyncComponent(() => import('@/components/RunStatisticsChart.vue'))
const props = defineProps<{ runId: string, status: string }>()
const emit = defineEmits<{ unauthorized: [] }>()
const headingId = useId()
const { getToken } = useAdminAuth()
const statistics = shallowRef<RunStatisticsResult | null>(null)
const loading = ref(false)
const error = ref('')
const siteFilter = ref('all')
const stageFilter = ref('all')
let activeRequest: AbortController | null = null
const funnel = computed(() => {
    if (!statistics.value) return []
    const { counts, inputMode } = statistics.value
    return [
        { label: 'Кандидаты', value: counts.candidates },
        { label: 'Собрано', value: inputMode === 'file' ? null : counts.collected, skipped: inputMode === 'file' },
        { label: 'Импортировано', value: counts.imported },
        { label: 'События', value: counts.events },
    ]
})
const decisions = computed(() => statistics.value ? [
    { label: 'Включено', value: statistics.value.counts.included },
    { label: 'Объединено', value: statistics.value.counts.merged },
    { label: 'Исключено', value: statistics.value.counts.excluded },
] : [])
const sites = computed(() => [...new Set(statistics.value?.exclusions.map(row => row.site) ?? [])].sort())
const exclusionStages = computed(() => [...new Set(statistics.value?.exclusions.map(row => row.stage) ?? [])])
const exclusions = computed(() => groupedExclusions(statistics.value?.exclusions ?? [], siteFilter.value, stageFilter.value))
const stages = computed(() => stageStatistics(statistics.value?.calls ?? []))
const tokenSeries = computed(() => [
    { name: 'Вход', values: stages.value.map(row => row.inputTokens) },
    { name: 'Выход', values: stages.value.map(row => row.outputTokens) },
])
const availableEvidence = computed(() => statistics.value?.evidence.filter(row => row.available) ?? [])
const evidenceSeries = computed(() => [
    { name: 'Точное', values: availableEvidence.value.map(row => row.exact) },
    { name: 'Нормализовано', values: availableEvidence.value.map(row => row.normalized) },
    { name: 'Не найдено', values: availableEvidence.value.map(row => row.notFound) },
    { name: 'Другое', values: availableEvidence.value.map(row => row.other) },
])
const discoveryLabels: Record<string, string> = { feed: 'RSS / Atom', html: 'HTML', unknown: 'Тип неизвестен' }
const discoveryKind = (kind: string) => discoveryLabels[kind] ?? kind
const safeUrl = (url: string): string | undefined => {
    try {
        const parsed = new URL(url)
        return ['https:', 'http:'].includes(parsed.protocol) && !parsed.username && !parsed.password ? parsed.href : undefined
    } catch { return undefined }
}
const load = async () => {
    activeRequest?.abort()
    const token = getToken()
    if (!token) return emit('unauthorized')
    const request = new AbortController()
    activeRequest = request
    const id = props.runId
    loading.value = true
    error.value = ''
    try {
        const result = await api.runStatistics(id, token, request.signal)
        if (activeRequest !== request || request.signal.aborted) return
        statistics.value = result
    } catch (failure) {
        if (activeRequest !== request || request.signal.aborted) return
        if (isUnauthorizedError(failure)) emit('unauthorized')
        else error.value = 'Не удалось получить статистику. Повторите запрос кнопкой «Обновить статистику».'
    } finally {
        if (activeRequest === request) loading.value = false
    }
}
watch(() => [props.runId, props.status], ([id], previous) => {
    if (previous?.[0] !== id) {
        statistics.value = null
        siteFilter.value = 'all'
        stageFilter.value = 'all'
    }
    void load()
}, { immediate: true })
onBeforeUnmount(() => activeRequest?.abort())
</script>
