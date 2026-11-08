<template>
    <div class="min-w-0 space-y-3">
        <ComboboxRoot
            multiple
            open-on-focus
            open-on-click
            :model-value="model"
            :disabled="disabled"
            @update:model-value="updateSelection"
        >
            <ComboboxAnchor class="relative">
                <Search class="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
                <ComboboxInput
                    :id="id"
                    v-model="search"
                    as-child
                    v-bind="$attrs"
                    :disabled="disabled"
                    :placeholder="t('search')"
                >
                    <Input v-model="search" class="pr-12 pl-10" />
                </ComboboxInput>
                <ComboboxTrigger as-child :aria-label="t('showOptions')">
                    <Button
                        class="absolute top-0 right-0 size-11 rounded-l-none"
                        type="button"
                        variant="ghost"
                        size="icon"
                        :disabled="disabled"
                    >
                        <ChevronsUpDown class="size-4 text-muted-foreground" aria-hidden="true" />
                    </Button>
                </ComboboxTrigger>
            </ComboboxAnchor>
            <ComboboxPortal>
                <ComboboxContent
                    class="z-50 w-(--reka-combobox-trigger-width) max-w-[calc(100vw-2rem)] overflow-hidden rounded-lg border bg-popover p-1 font-sans text-popover-foreground shadow-md"
                    position="popper"
                    align="start"
                    :aria-label="t('sites')"
                    :side-offset="8"
                    :collision-padding="16"
                >
                    <ComboboxViewport class="max-h-[min(20rem,var(--reka-combobox-content-available-height))]">
                        <ComboboxEmpty class="px-3 py-6 text-center text-sm text-muted-foreground">
                            {{ t('noResults') }}
                        </ComboboxEmpty>
                        <ComboboxItem
                            v-for="source in sources"
                            :key="source.id"
                            class="flex min-h-16 cursor-pointer items-center gap-3 rounded-md px-3 py-2 text-sm outline-none data-[disabled]:cursor-not-allowed data-[disabled]:opacity-50 data-[highlighted]:bg-accent data-[highlighted]:text-accent-foreground"
                            :value="source.id"
                            :text-value="`${source.name} ${source.searchDomain}`"
                            :disabled="isOptionDisabled(source)"
                            :aria-disabled="isOptionDisabled(source)"
                        >
                            <span class="flex size-5 shrink-0 items-center justify-center rounded border" :class="model.includes(source.id) ? 'border-primary bg-primary text-primary-foreground' : 'border-input'" aria-hidden="true">
                                <ComboboxItemIndicator>
                                    <Check class="size-4" aria-hidden="true" />
                                </ComboboxItemIndicator>
                            </span>
                            <span class="min-w-0 flex-1">
                                <span class="block font-medium wrap-anywhere">{{ source.name }}</span>
                                <span class="block text-xs leading-5 text-muted-foreground wrap-anywhere">{{ source.searchDomain }}</span>
                            </span>
                        </ComboboxItem>
                    </ComboboxViewport>
                </ComboboxContent>
            </ComboboxPortal>
        </ComboboxRoot>
        <div class="flex flex-wrap items-center justify-between gap-x-4 gap-y-1">
            <p class="text-xs leading-5 text-muted-foreground" role="status" aria-live="polite">
                {{ t('selectedCount', { count: model.length, max }) }}
            </p>
            <Button
                v-if="model.length"
                class="min-h-11 px-2 text-xs text-muted-foreground"
                type="button"
                variant="ghost"
                :disabled="disabled"
                @click="model = []"
            >
                {{ t('clear') }}
            </Button>
        </div>
        <ul v-if="selectedSources.length" class="flex flex-wrap gap-2" :aria-label="t('selectedSites')">
            <li v-for="source in selectedSources" :key="source.id" class="min-w-0 max-w-full">
                <Button
                    class="min-h-11 max-w-full gap-2 bg-secondary px-3 py-2 text-xs whitespace-normal"
                    type="button"
                    variant="outline"
                    :disabled="disabled"
                    :aria-label="t('remove', { site: source.searchDomain })"
                    @click="removeSource(source.id)"
                >
                    <span class="min-w-0 wrap-anywhere">{{ source.searchDomain }}</span>
                    <X class="size-4 shrink-0" aria-hidden="true" />
                </Button>
            </li>
        </ul>
        <p v-if="isFull" class="text-xs leading-5 text-muted-foreground">
            {{ t('limit', { max }) }}
        </p>
    </div>
</template>

<script setup lang="ts">
import type { SiteSource } from '@/api'

import { computed, ref } from 'vue'

import { Check, ChevronsUpDown, Search, X } from '@lucide/vue'
import {
    ComboboxAnchor,
    ComboboxContent,
    ComboboxEmpty,
    ComboboxInput,
    ComboboxItem,
    ComboboxItemIndicator,
    ComboboxPortal,
    ComboboxRoot,
    ComboboxTrigger,
    ComboboxViewport,
} from 'reka-ui'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

import { useI18n } from 'vue-i18n'

defineOptions({ inheritAttrs: false })

const props = withDefaults(defineProps<{
    id: string
    sources: SiteSource[]
    disabled?: boolean
    max?: number
}>(), { disabled: false, max: 5 })
const model = defineModel<string[]>({ required: true })
const { t } = useI18n({ useScope: 'local' })
const search = ref('')
const selectedSources = computed(() => model.value.flatMap(id => props.sources.filter(source => source.id === id)))
const isFull = computed(() => model.value.length >= props.max)
const isOptionDisabled = (source: SiteSource) => props.disabled || (!model.value.includes(source.id) && (isFull.value || source.status === 'disabled'))

const updateSelection = (value: unknown) => {
    if (props.disabled || !Array.isArray(value) || !value.every((id): id is string => typeof id === 'string')) return
    const ids = [...new Set(value)]
    if (ids.length > props.max) return
    if (ids.some(id => !props.sources.some(source => source.id === id && (source.status !== 'disabled' || model.value.includes(id))))) return
    model.value = ids
}

const removeSource = (id: string) => {
    if (!props.disabled) model.value = model.value.filter(value => value !== id)
}
</script>

<i18n lang="json">
{
    "ru-RU": {
        "search": "Поиск по названию или домену",
        "sites": "Сайты",
        "showOptions": "Показать список сайтов",
        "noResults": "Сайты не найдены. Попробуйте другой запрос.",
        "selectedCount": "Выбрано: {count} из {max}",
        "selectedSites": "Выбранные сайты",
        "clear": "Снять выбор",
        "remove": "Убрать {site}",
        "limit": "Выбрано максимум {max} сайтов. Уберите один, чтобы выбрать другой."
    },
    "en-GB": {
        "search": "Search by name or domain",
        "sites": "Websites",
        "showOptions": "Show website list",
        "noResults": "No websites found. Try another search.",
        "selectedCount": "Selected: {count} of {max}",
        "selectedSites": "Selected websites",
        "clear": "Clear selection",
        "remove": "Remove {site}",
        "limit": "You have selected the maximum of {max} websites. Remove one to choose another."
    }
}
</i18n>
