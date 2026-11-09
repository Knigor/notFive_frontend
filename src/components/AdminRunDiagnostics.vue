<template>
    <section class="mt-6 border-t border-border pt-6" :aria-labelledby="headingId">
        <h4 :id="headingId" class="text-base font-medium">
            Обработка материалов
        </h4>
        <dl class="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3">
            <div v-for="counter in counters" :key="counter.label" class="rounded-lg border border-border p-4">
                <dt class="text-sm text-muted-foreground">
                    {{ counter.label }}
                </dt>
                <dd class="mt-2 text-2xl font-medium tabular-nums">
                    {{ counter.value }}
                </dd>
            </div>
        </dl>
        <details v-if="diagnostics.warnings.length" class="mt-4 rounded-lg border border-border">
            <summary class="min-h-11 cursor-pointer rounded-lg px-4 py-3 text-sm font-medium focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring">
                Предупреждения: {{ diagnostics.warnings.length }}
            </summary>
            <ul class="space-y-3 px-4 pb-4 text-sm leading-6">
                <li v-for="warning in diagnostics.warnings" :key="warning" class="wrap-anywhere">
                    {{ warning }}
                </li>
            </ul>
        </details>
        <details class="mt-4 rounded-lg border border-border">
            <summary class="min-h-11 cursor-pointer rounded-lg px-4 py-3 text-sm font-medium focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring">
                Материалы и причины обработки: {{ diagnostics.materials.length }}
            </summary>
            <div class="space-y-4 p-4 pt-0">
                <div class="max-w-xs">
                    <label :id="filterLabelId" class="mb-2 block text-sm font-medium" :for="filterId">
                        Статус материала
                    </label>
                    <Select v-model="filter">
                        <SelectTrigger :id="filterId" class="min-h-11 w-full" :aria-labelledby="filterLabelId">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem v-for="option in filters" :key="option.value" :value="option.value">
                                {{ option.label }}
                            </SelectItem>
                        </SelectContent>
                    </Select>
                </div>
                <p class="text-sm text-muted-foreground" role="status">
                    {{ filtered.length ? `Показано ${visible.length} из ${filtered.length}` : 'Материалов с таким статусом пока нет.' }}
                </p>
                <ul v-if="visible.length" class="divide-y divide-border">
                    <li v-for="material in visible" :key="material.id" class="py-4 first:pt-0 last:pb-0">
                        <div class="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm">
                            <span class="font-medium" :class="material.status === 'excluded' ? 'text-muted-foreground' : 'text-primary'">
                                {{ statusLabel(material.status) }}
                            </span>
                            <span class="text-muted-foreground">{{ stageLabel(material.stage) }}</span>
                        </div>
                        <a
                            v-if="sourceHref(material.url)"
                            class="mt-2 inline-flex min-h-11 max-w-full items-center gap-2 rounded-sm text-sm font-medium text-primary underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring"
                            target="_blank"
                            rel="noopener noreferrer"
                            :href="sourceHref(material.url)"
                        >
                            <span class="wrap-anywhere">{{ material.title || material.url }}</span>
                            <ArrowUpRight class="size-4 shrink-0" aria-hidden="true" />
                        </a>
                        <p v-else class="mt-2 text-sm font-medium wrap-anywhere">
                            {{ material.title || material.id }}
                        </p>
                        <p v-if="material.group" class="mt-2 text-sm text-muted-foreground wrap-anywhere">
                            {{ material.group }}
                        </p>
                        <p v-if="material.reason" class="mt-2 text-sm leading-6 wrap-anywhere">
                            {{ material.reason }}
                        </p>
                        <p v-if="material.error" class="mt-2 text-sm leading-6 text-destructive wrap-anywhere">
                            {{ material.error }}
                        </p>
                        <p class="mt-2 font-mono text-xs text-muted-foreground wrap-anywhere">
                            {{ material.id }}
                        </p>
                    </li>
                </ul>
                <Button
                    v-if="visible.length < filtered.length"
                    class="min-h-11"
                    type="button"
                    variant="outline"
                    @click="limit += 50"
                >
                    Показать ещё
                </Button>
            </div>
        </details>
    </section>
</template>

<script setup lang="ts">
import type { RunStatusResult } from '@/api'

import { computed, ref, watch } from 'vue'

import { ArrowUpRight } from '@lucide/vue'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

import { useId } from 'vue'

const props = defineProps<{ diagnostics: RunStatusResult['diagnostics'] }>()
const headingId = useId()
const filterId = useId()
const filterLabelId = useId()
const filter = ref('all')
const limit = ref(50)
const filters = [
    { value: 'all', label: 'Все материалы' },
    { value: 'included', label: 'Включённые' },
    { value: 'merged', label: 'Объединённые' },
    { value: 'excluded', label: 'Исключённые' },
    { value: 'pending', label: 'Ожидают обработки' },
]
const counters = computed(() => {
    const counts = props.diagnostics.counts
    return [
        { label: 'Учтено материалов', value: counts.candidates },
        { label: props.diagnostics.collectionRunId ? 'Прошли сбор' : 'Импортировано', value: props.diagnostics.collectionRunId ? counts.collected : counts.imported },
        { label: 'Включено', value: counts.included },
        { label: 'Объединено', value: counts.merged },
        { label: 'Исключено', value: counts.excluded },
        { label: 'Событий в выпуске', value: counts.events },
    ]
})
const filtered = computed(() => props.diagnostics.materials.filter(material => filter.value === 'all' || material.status === filter.value))
const visible = computed(() => filtered.value.slice(0, limit.value))

const statusLabel = (value: string) => {
    const labels: Record<string, string> = { included: 'Включён', merged: 'Объединён', excluded: 'Исключён', pending: 'Ожидает обработки' }
    return labels[value] ?? 'Другой статус'
}
const stageLabel = (value: string) => {
    const labels: Record<string, string> = { collection: 'Сбор с сайтов', import: 'Импорт данных', analysis: 'Анализ материалов' }
    return labels[value] ?? 'Обработка'
}
const sourceHref = (value: string | null | undefined) => {
    if (!value) return undefined
    try {
        const url = new URL(value)
        return ['https:', 'http:'].includes(url.protocol) ? url.href : undefined
    } catch {
        return undefined
    }
}

watch(filter, () => { limit.value = 50 })
</script>
