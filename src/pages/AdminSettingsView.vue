<template>
    <div class="min-h-dvh bg-background font-sans text-foreground">
        <header class="border-b border-border">
            <div class="mx-auto flex min-h-20 max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-8">
                <RouterLink class="inline-flex items-center font-serif text-3xl" :to="{ name: 'home' }">
                    <BrandLogo />
                </RouterLink>
                <div class="flex items-center gap-2">
                    <span class="hidden rounded-full border px-3 py-1 text-xs text-muted-foreground sm:inline">Администратор</span>
                    <ThemeSwitcher />
                    <Button
                        class="h-11"
                        type="button"
                        variant="outline"
                        @click="signOut"
                    >
                        <LogOut class="size-4" aria-hidden="true" />
                        Выйти
                    </Button>
                </div>
            </div>
        </header>
        <main class="mx-auto max-w-6xl px-4 py-6 sm:px-8 sm:py-10">
            <RouterLink class="inline-flex min-h-11 items-center gap-2 rounded-sm text-sm text-muted-foreground hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring" :to="{ name: 'home' }">
                <ArrowLeft class="size-4" aria-hidden="true" />
                На сайт
            </RouterLink>
            <div class="mt-4 mb-8">
                <h1 class="font-serif text-4xl leading-tight text-primary sm:text-5xl">
                    Настройки
                </h1>
            </div>
            <div class="grid gap-6 lg:grid-cols-[224px_minmax(0,1fr)] lg:gap-8">
                <nav class="grid grid-cols-2 content-start gap-2 lg:grid-cols-1" aria-label="Способ загрузки материалов">
                    <RouterLink
                        class="flex min-h-16 items-center gap-3 rounded-lg border p-3 text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring sm:p-4"
                        :class="isSources ? 'border-transparent text-muted-foreground hover:bg-muted hover:text-foreground' : 'border-border bg-card text-primary shadow-xs'"
                        :to="{ name: 'admin-settings' }"
                    >
                        <FileJson class="size-5 shrink-0" aria-hidden="true" />
                        <span>Файл news.json</span>
                    </RouterLink>
                    <RouterLink
                        class="flex min-h-16 items-center gap-3 rounded-lg border p-3 text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring sm:p-4"
                        :class="isSources ? 'border-border bg-card text-primary shadow-xs' : 'border-transparent text-muted-foreground hover:bg-muted hover:text-foreground'"
                        :to="{ name: 'admin-sources' }"
                    >
                        <Globe class="size-5 shrink-0" aria-hidden="true" />
                        <span>Сайты для сбора</span>
                    </RouterLink>
                </nav>
                <section class="min-w-0 rounded-xl border border-border bg-card p-5 shadow-xs sm:p-8" aria-labelledby="input-heading">
                    <div class="mb-6 flex items-start gap-4">
                        <span class="flex size-12 shrink-0 items-center justify-center rounded-lg bg-secondary text-primary">
                            <Globe v-if="isSources" class="size-6" aria-hidden="true" />
                            <FileJson v-else class="size-6" aria-hidden="true" />
                        </span>
                        <div class="min-w-0">
                            <h2 id="input-heading" class="font-serif text-2xl leading-8 sm:text-3xl">
                                {{ isSources ? 'Сбор с сайтов' : 'Готовый набор новостей' }}
                            </h2>
                            <p class="mt-2 text-sm leading-6 text-muted-foreground">
                                {{ isSources ? 'Выберите источники из приложения 1 к заданию, чтобы собрать материалы для дайджеста.' : 'Загрузите news.json с материалами и контрольным временем. Исходные данные сохраняются без изменений.' }}
                            </p>
                        </div>
                    </div>
                    <div
                        v-if="isSubmitting || submitError || runResult"
                        class="mb-6 rounded-lg border bg-muted/50 p-4 text-sm leading-6"
                        role="status"
                        aria-live="polite"
                        :aria-busy="isSubmitting"
                    >
                        <p v-if="isSubmitting" class="flex items-center gap-2 text-primary">
                            <LoaderCircle class="size-4 shrink-0 animate-spin motion-reduce:animate-none" aria-hidden="true" />
                            Обрабатываем материалы. Это может занять несколько минут…
                        </p>
                        <p v-else-if="submitError" class="text-destructive">
                            {{ submitError }}
                        </p>
                        <template v-else-if="runResult">
                            <p class="font-medium" :class="runResult.dispatchStatus === 'failed' ? 'text-destructive' : 'text-primary'">
                                {{ runResult.dispatchStatus === 'failed' ? 'Запуск создан, но сбор завершился ошибкой.' : runResult.dispatchStatus === 'completed' ? 'Сбор завершён, материалы переданы на обработку.' : 'Запуск создан и ожидает обработки.' }}
                            </p>
                            <p class="mt-2 text-muted-foreground wrap-anywhere">
                                Номер запуска: {{ runResult.runId }}
                            </p>
                            <p class="mt-1">
                                Материалов: {{ runResult.imported }}. Отклонено: {{ runResult.rejected }}. Сайтов: {{ runResult.siteCount }}.
                            </p>
                        </template>
                    </div>
                    <form v-show="!isSources" :aria-busy="isSubmitting" @submit.prevent="submitFile">
                        <div
                            class="rounded-lg"
                            @dragover.prevent="isDragging = true"
                            @dragleave.prevent="isDragging = false"
                            @drop.prevent="onFileDrop"
                        >
                            <input
                                id="news-upload"
                                ref="fileInput"
                                class="peer sr-only"
                                type="file"
                                accept=".json,application/json"
                                aria-describedby="file-hint file-status"
                                :disabled="isSubmitting"
                                :aria-invalid="Boolean(fileError)"
                                @change="onFileChange"
                            >
                            <label
                                class="flex min-h-56 cursor-pointer flex-col items-center justify-center gap-3 rounded-lg border border-dashed px-4 py-8 text-center transition-colors hover:border-primary hover:bg-secondary/50 peer-focus-visible:outline-2 peer-focus-visible:outline-offset-4 peer-focus-visible:outline-ring"
                                for="news-upload"
                                :class="isDragging ? 'border-primary bg-secondary' : 'border-border bg-muted/30'"
                            >
                                <Upload class="size-8 text-primary" aria-hidden="true" />
                                <span class="font-medium text-primary">{{ selectedFile ? 'Выбрать другой файл' : 'Выбрать файл' }}</span>
                                <span id="file-hint" class="max-w-sm text-sm leading-6 text-muted-foreground">Или перетащите сюда один JSON-файл с набором новостей.</span>
                                <span class="rounded-md border bg-background px-3 py-1 font-mono text-xs text-muted-foreground">news.json</span>
                            </label>
                        </div>
                        <div v-if="selectedFile" class="mt-4 flex items-start gap-3 rounded-lg border p-4">
                            <FileJson class="mt-1 size-5 shrink-0 text-primary" aria-hidden="true" />
                            <div class="min-w-0 flex-1">
                                <p class="text-sm font-medium wrap-anywhere">
                                    {{ selectedFile.name }}
                                </p>
                                <p class="mt-1 text-xs text-muted-foreground">
                                    {{ formatSize(selectedFile.size) }}
                                </p>
                            </div>
                            <Button
                                class="size-11 shrink-0"
                                type="button"
                                variant="ghost"
                                size="icon"
                                aria-label="Удалить выбранный файл"
                                :disabled="isSubmitting"
                                @click="clearFile"
                            >
                                <X class="size-4" aria-hidden="true" />
                            </Button>
                        </div>
                        <div
                            id="file-status"
                            class="mt-4 text-sm leading-6"
                            role="status"
                            aria-live="polite"
                            :aria-busy="isReading"
                        >
                            <p v-if="isReading" class="text-muted-foreground">
                                Проверяем файл…
                            </p>
                            <p v-else-if="fileError" class="text-destructive">
                                {{ inputErrorMessages[fileError] }}
                            </p>
                            <p v-else-if="dataset" class="flex items-center gap-2 text-primary">
                                <CircleCheck class="size-4 shrink-0" aria-hidden="true" />
                                Формат набора проверен
                            </p>
                        </div>
                        <dl v-if="dataset" class="mt-4 grid gap-4 rounded-lg bg-muted/50 p-4 text-sm sm:grid-cols-2">
                            <div>
                                <dt class="text-muted-foreground">
                                    Материалов в наборе
                                </dt>
                                <dd class="mt-1 font-medium">
                                    {{ dataset.articleCount }}
                                </dd>
                            </div>
                            <div>
                                <dt class="text-muted-foreground">
                                    Название набора
                                </dt>
                                <dd class="mt-1 font-medium wrap-anywhere">
                                    {{ dataset.dataset }}
                                </dd>
                            </div>
                            <div>
                                <dt class="text-muted-foreground">
                                    Контрольное время · МСК
                                </dt>
                                <dd class="mt-1 font-medium">
                                    {{ formatDate(dataset.controlTime) }}
                                </dd>
                            </div>
                            <div>
                                <dt class="text-muted-foreground">
                                    Начало периода · МСК
                                </dt>
                                <dd class="mt-1 font-medium">
                                    {{ formatDate(dataset.periodStart) }}
                                </dd>
                            </div>
                        </dl>
                        <div class="mt-6 border-t pt-6">
                            <Button
                                class="min-h-11 w-full whitespace-normal sm:w-auto"
                                type="submit"
                                :disabled="isSubmitting || isReading || !dataset || !selectedFile"
                            >
                                {{ isSubmitting ? 'Обрабатываем…' : 'Отправить на обработку' }}
                                <LoaderCircle v-if="isSubmitting" class="size-4 animate-spin motion-reduce:animate-none" aria-hidden="true" />
                                <ArrowRight v-else class="size-4" aria-hidden="true" />
                            </Button>
                        </div>
                    </form>
                    <form
                        v-show="isSources"
                        class="space-y-6"
                        novalidate
                        :aria-busy="isSubmitting"
                        @submit.prevent="submitSources"
                    >
                        <div>
                            <p v-if="isLoadingSources" class="text-sm text-muted-foreground" role="status">
                                Загружаем доступные сайты…
                            </p>
                            <div v-else-if="catalogError" class="space-y-2 text-sm" role="alert">
                                <p class="text-destructive">
                                    {{ catalogError }}
                                </p>
                                <Button type="button" variant="outline" @click="loadSources">
                                    Повторить
                                </Button>
                            </div>
                            <label class="mb-2 block text-sm font-medium" for="source-select">Сайты для сбора</label>
                            <AdminSourceSelect
                                id="source-select"
                                v-model="selectedSourceIds"
                                aria-describedby="sources-hint sources-status"
                                :sources="availableSources"
                                :aria-invalid="Boolean(sourceError)"
                                :disabled="isSubmitting || isLoadingSources || Boolean(catalogError)"
                                @update:model-value="resetSources"
                            />
                            <p id="sources-hint" class="mt-2 text-xs leading-5 text-muted-foreground">
                                Выберите до пяти сайтов. Для демонстрации по заданию нужно согласовать 3–5 источников. Сбор выполняется по домену сайта.
                            </p>
                        </div>
                        <div class="max-w-sm">
                            <label class="mb-2 block text-sm font-medium" for="control-time">Контрольное время · МСК</label>
                            <AdminDateTimePicker
                                id="control-time"
                                v-model="controlTime"
                                :disabled="isSubmitting"
                                :aria-describedby="timeError ? 'time-hint time-error' : 'time-hint'"
                                :aria-invalid="Boolean(timeError)"
                                @update:model-value="resetSources"
                            />
                            <p id="time-hint" class="mt-2 text-xs leading-5 text-muted-foreground">
                                Для отбора используются материалы за 24 часа до этого момента. Время московское.
                            </p>
                            <p v-if="timeError" id="time-error" class="mt-2 text-sm text-destructive">
                                Укажите корректные дату и время.
                            </p>
                        </div>
                        <div
                            id="sources-status"
                            class="text-sm leading-6"
                            role="status"
                            aria-live="polite"
                        >
                            <p v-if="sourceError" class="text-destructive">
                                {{ inputErrorMessages[sourceError] }}
                            </p>
                            <div v-if="unavailableSources.length" class="space-y-3 rounded-lg border border-border bg-muted/50 p-4">
                                <p>
                                    Сбор ещё не подключён для выбранных источников. Запуск станет доступен после их подключения.
                                </p>
                                <p class="text-muted-foreground wrap-anywhere">
                                    {{ unavailableSources.map(source => source.name).join(', ') }}
                                </p>
                                <Button
                                    class="min-h-11 whitespace-normal"
                                    type="button"
                                    variant="outline"
                                    :disabled="isLoadingSources || isSubmitting"
                                    @click="loadSources"
                                >
                                    Обновить каталог
                                </Button>
                            </div>
                        </div>
                        <div class="border-t pt-6">
                            <Button
                                class="min-h-11 w-full whitespace-normal sm:w-auto"
                                type="submit"
                                :disabled="isSubmitting || isLoadingSources || Boolean(catalogError) || !sourceSelection.ok"
                            >
                                {{ isSubmitting ? 'Обрабатываем…' : 'Собрать материалы' }}
                                <LoaderCircle v-if="isSubmitting" class="size-4 animate-spin motion-reduce:animate-none" aria-hidden="true" />
                                <ArrowRight v-else class="size-4" aria-hidden="true" />
                            </Button>
                        </div>
                    </form>
                </section>
            </div>
        </main>
    </div>
</template>

<script setup lang="ts">
import type { RunStartResult, SiteSource, StartRunInput } from '@/api'
import type { NewsDatasetPreview } from '@/lib/adminInputs'

import { computed, onBeforeUnmount, onMounted, ref, shallowRef } from 'vue'

import { ArrowLeft, ArrowRight, CircleCheck, FileJson, Globe, LoaderCircle, LogOut, Upload, X } from '@lucide/vue'
import { RouterLink } from 'vue-router'
import AdminDateTimePicker from '@/components/AdminDateTimePicker.vue'
import AdminSourceSelect from '@/components/AdminSourceSelect.vue'
import BrandLogo from '@/components/BrandLogo.vue'
import ThemeSwitcher from '@/components/ThemeSwitcher.vue'
import { Button } from '@/components/ui/button'

import { useRoute, useRouter } from 'vue-router'
import { useAdminAuth } from '@/composables/useAdminAuth'

import { api } from '@/api'
import { parseNewsDataset, resolveSourceIds } from '@/lib/adminInputs'
import { ApiError, isUnauthorizedError } from '@/lib/graphqlClient'

const inputErrorMessages: Record<string, string> = {
    jsonFile: 'Выберите файл с расширением .json.',
    fileTooLarge: 'Размер файла не должен превышать 50 МБ.',
    singleFile: 'Загрузите один news.json за раз.',
    readFile: 'Не удалось прочитать файл. Выберите его повторно.',
    invalidJson: 'Файл содержит некорректный JSON. Проверьте его содержимое.',
    invalidDataset: 'Нужны control_time и period_start в формате ISO 8601 с секундами и часовым поясом, период ровно 24 часа. Допустимый timezone — Europe/Moscow.',
    invalidItems: 'В наборе news.json должен быть массив items.',
    unknownSources: 'Выбранный сайт отсутствует в каталоге. Обновите каталог и выберите источники заново.',
    tooManySources: 'За один запуск можно выбрать не более пяти разных сайтов.',
    required: 'Выберите хотя бы один сайт.',
    unavailableSources: 'Сбор для выбранных источников ещё не подключён.',
    duplicateDomains: 'Выберите сайты с разными доменами.',
}

const route = useRoute()
const router = useRouter()
const { getToken, clearSession } = useAdminAuth()
const isSources = computed(() => route.name === 'admin-sources')
const fileInput = ref<HTMLInputElement | null>(null)
const selectedFile = shallowRef<File | null>(null)
const dataset = ref<NewsDatasetPreview | null>(null)
const fileError = ref('')
const isReading = ref(false)
const isDragging = ref(false)
const defaultSourceDomains = ['securitylab.ru', 'xakep.ru', 'habr.com', 'ptsecurity.com', 'kaspersky.ru']
const selectedSourceIds = ref<string[]>([])
const sourceError = ref('')
const availableSources = ref<SiteSource[]>([])
const sourceSelection = computed(() => resolveSourceIds(selectedSourceIds.value, availableSources.value))
const unavailableSources = computed(() => availableSources.value.filter(source => (
    selectedSourceIds.value.includes(source.id) && source.status !== 'ready'
)))
let sourcesInitialized = false
const isLoadingSources = ref(false)
const catalogError = ref('')
const isSubmitting = ref(false)
const submitError = ref('')
const runResult = ref<RunStartResult | null>(null)
const catalogRequest = new AbortController()
let runRequest: AbortController | null = null
const timeError = ref(false)
const controlTime = ref(new Intl.DateTimeFormat('sv-SE', {
    timeZone: 'Europe/Moscow',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
}).format(new Date()).replace(' ', 'T'))
let fileReadVersion = 0

const formatDate = (value: string) => new Intl.DateTimeFormat('ru-RU', {
    timeZone: 'Europe/Moscow',
    dateStyle: 'short',
    timeStyle: 'short',
}).format(new Date(value))

const formatSize = (bytes: number) => `${new Intl.NumberFormat('ru-RU', { maximumFractionDigits: 1 }).format(bytes / 1024)} КБ`

const clearFile = () => {
    fileReadVersion += 1
    selectedFile.value = null
    dataset.value = null
    fileError.value = ''
    isReading.value = false
    if (fileInput.value) fileInput.value.value = ''
}

const inspectFile = async (file: File) => {
    if (isSubmitting.value) return
    const version = ++fileReadVersion
    selectedFile.value = file
    dataset.value = null
    fileError.value = ''
    runResult.value = null
    submitError.value = ''
    isReading.value = false

    if (!file.name.toLowerCase().endsWith('.json')) {
        fileError.value = 'jsonFile'
        return
    }

    if (file.size > 50 * 1024 * 1024) {
        fileError.value = 'fileTooLarge'
        return
    }

    isReading.value = true

    try {
        const content = await file.text()
        if (version !== fileReadVersion) return
        const result = parseNewsDataset(content)
        if (result.ok) dataset.value = result.value
        else fileError.value = result.error
    } catch {
        if (version === fileReadVersion) fileError.value = 'readFile'
    } finally {
        if (version === fileReadVersion) isReading.value = false
    }
}

const onFileChange = (event: Event) => {
    if (!(event.target instanceof HTMLInputElement)) return
    const file = event.target.files?.[0]
    if (file) void inspectFile(file)
}

const onFileDrop = (event: DragEvent) => {
    isDragging.value = false
    if (isSubmitting.value) return
    const files = event.dataTransfer?.files
    if (!files?.length) return
    clearFile()
    if (files.length !== 1) {
        fileError.value = 'singleFile'
        return
    }
    const file = files.item(0)
    if (file) void inspectFile(file)
}

const resetSources = () => {
    sourceError.value = ''
    timeError.value = false
}

const requireSignIn = async () => {
    clearSession()
    await router.replace({ name: 'admin-login', query: { next: isSources.value ? 'sources' : 'settings' } })
}

const errorMessage = (error: unknown) => error instanceof ApiError && error.kind === 'graphql'
    ? error.message
    : 'Не удалось получить данные. Проверьте соединение и повторите попытку.'

const loadSources = async () => {
    const token = getToken()
    if (!token) return requireSignIn()
    isLoadingSources.value = true
    catalogError.value = ''
    try {
        availableSources.value = await api.availableSiteSources(token, catalogRequest.signal)
        if (!sourcesInitialized && availableSources.value.length) {
            selectedSourceIds.value = defaultSourceDomains.flatMap(domain => {
                const source = availableSources.value.find(item => item.searchDomain === domain && item.status !== 'disabled')
                return source ? [source.id] : []
            })
            sourcesInitialized = true
        }
    } catch (error) {
        if (catalogRequest.signal.aborted) return
        if (isUnauthorizedError(error)) await requireSignIn()
        else catalogError.value = errorMessage(error)
    } finally {
        isLoadingSources.value = false
    }
}

const startRun = async (input: StartRunInput) => {
    if (isSubmitting.value) return
    const token = getToken()
    if (!token) return requireSignIn()
    isSubmitting.value = true
    submitError.value = ''
    runResult.value = null
    runRequest = new AbortController()
    try {
        runResult.value = await api.startRun(input, token, runRequest.signal)
    } catch (error) {
        if (runRequest.signal.aborted) return
        if (isUnauthorizedError(error)) await requireSignIn()
        else submitError.value = error instanceof ApiError && error.kind === 'graphql' ? error.message : 'Ответ сервера не получен. Запуск мог быть создан; проверьте его состояние перед повторной отправкой.'
    } finally {
        isSubmitting.value = false
    }
}

const submitFile = async () => {
    if (!selectedFile.value || !dataset.value || isReading.value) return
    await startRun({ file: selectedFile.value })
}

const submitSources = async () => {
    resetSources()
    timeError.value = !controlTime.value || !Number.isFinite(Date.parse(controlTime.value + ':00+03:00'))
    const result = sourceSelection.value
    if (!result.ok) {
        sourceError.value = result.error
        return
    }
    if (timeError.value || isLoadingSources.value || catalogError.value) return
    await startRun({ sourceIds: result.sources.map(source => source.id), controlTime: `${controlTime.value}:00+03:00` })
}

const signOut = async () => {
    clearFile()
    selectedSourceIds.value = []
    resetSources()
    clearSession()
    await router.replace({ name: 'admin-login' })
}

onMounted(loadSources)
onBeforeUnmount(() => {
    catalogRequest.abort()
    runRequest?.abort()
})
</script>
