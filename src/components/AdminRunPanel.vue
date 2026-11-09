<template>
    <section v-if="runId" class="mt-6 border-t border-border pt-6" :aria-labelledby="headingId">
        <div class="flex flex-wrap items-start justify-between gap-4">
            <div class="min-w-0">
                <h3 :id="headingId" class="font-serif text-xl leading-8 sm:text-2xl">
                    Результат обработки
                </h3>
                <p class="mt-2 text-xs text-muted-foreground wrap-anywhere">
                    Номер запуска: {{ runId }}
                </p>
            </div>
            <Button
                class="min-h-11"
                type="button"
                variant="outline"
                :disabled="loading || actionPending"
                @click="refresh"
            >
                <RefreshCw class="size-4" aria-hidden="true" />
                Обновить статус
            </Button>
        </div>
        <div class="mt-5 text-sm leading-6" role="status" aria-live="polite">
            <p v-if="loading && !run" class="flex items-center gap-2 text-muted-foreground">
                <LoaderCircle class="size-4 animate-spin motion-reduce:animate-none" aria-hidden="true" />
                Получаем состояние запуска…
            </p>
            <p v-if="statusError" class="text-destructive">
                {{ statusError }}
            </p>
            <template v-if="run">
                <p class="flex items-center gap-2 font-medium" :class="run.status === 'failed' ? 'text-destructive' : 'text-primary'">
                    <CircleCheck v-if="run.status === 'completed'" class="size-5 shrink-0" aria-hidden="true" />
                    <LoaderCircle v-else-if="isProcessing" class="size-4 shrink-0 animate-spin motion-reduce:animate-none" aria-hidden="true" />
                    {{ statusLabel }}
                </p>
                <p v-if="run.error" class="mt-2 text-destructive wrap-anywhere">
                    {{ run.error }}
                </p>
                <p v-if="isProcessing && !statusError" class="mt-2 text-muted-foreground">
                    {{ pollingPaused ? 'Автоматическое обновление приостановлено. Нажмите «Обновить статус», чтобы продолжить.' : 'Состояние обновляется автоматически каждые 5 секунд. Можно вернуться к запуску по его номеру.' }}
                </p>
                <p v-else-if="!isProcessing && run.status !== 'completed' && run.status !== 'failed'" class="mt-2 text-muted-foreground">
                    Сервер вернул новое состояние. Нажмите «Обновить статус», чтобы проверить его ещё раз.
                </p>
            </template>
        </div>
        <dl v-if="run" class="mt-5 grid gap-4 text-sm sm:grid-cols-3">
            <div>
                <dt class="text-muted-foreground">
                    Создан · МСК
                </dt>
                <dd class="mt-1">
                    {{ formatTime(run.createdAt) }}
                </dd>
            </div>
            <div v-if="run.startedAt">
                <dt class="text-muted-foreground">
                    Обработка началась · МСК
                </dt>
                <dd class="mt-1">
                    {{ formatTime(run.startedAt) }}
                </dd>
            </div>
            <div v-if="run.finishedAt">
                <dt class="text-muted-foreground">
                    Завершён · МСК
                </dt>
                <dd class="mt-1">
                    {{ formatTime(run.finishedAt) }}
                </dd>
            </div>
        </dl>
        <AdminRunStatistics
            v-if="run"
            :run-id="run.runId"
            :status="run.status"
            @unauthorized="unauthorized"
        />
        <AdminRunDiagnostics v-if="run" :key="run.runId" :diagnostics="run.diagnostics" />
        <div v-if="run?.status === 'completed'" class="mt-6 border-t pt-6">
            <h4 class="text-base font-medium">
                Файлы выпуска
            </h4>
            <p v-if="!filesReady" class="mt-2 text-sm leading-6 text-muted-foreground">
                Сервер ещё не предоставил полный комплект файлов. Обновите статус позже.
            </p>
            <ul class="mt-4 grid gap-3 sm:grid-cols-2">
                <li v-for="file in artifactFiles" :key="file.name">
                    <Button
                        class="min-h-16 w-full justify-start px-4 py-3 text-left"
                        type="button"
                        variant="outline"
                        :disabled="!canUseArtifacts || actionPending"
                        :aria-label="`Скачать ${file.name}`"
                        @click="download(file.name)"
                    >
                        <LoaderCircle v-if="activeDownload === file.name" class="size-4 shrink-0 animate-spin motion-reduce:animate-none" aria-hidden="true" />
                        <Download v-else class="size-4 shrink-0" aria-hidden="true" />
                        <span class="min-w-0">
                            <span class="block">{{ file.label }}</span>
                            <span class="mt-1 block font-mono text-xs text-muted-foreground">{{ file.name }}</span>
                        </span>
                    </Button>
                </li>
            </ul>
            <Button
                class="mt-4 min-h-11 w-full sm:w-auto"
                type="button"
                variant="outline"
                :disabled="!canUseArtifacts || actionPending"
                @click="download('zip')"
            >
                <LoaderCircle v-if="activeDownload === 'zip'" class="size-4 animate-spin motion-reduce:animate-none" aria-hidden="true" />
                <Download v-else class="size-4" aria-hidden="true" />
                Скачать всё в ZIP
            </Button>
            <p v-if="downloadError" class="mt-3 text-sm leading-6 text-destructive" role="alert">
                {{ downloadError }}
            </p>
            <p v-if="downloadNotice" class="mt-3 text-sm leading-6 text-muted-foreground" role="status">
                {{ downloadNotice }}
            </p>
        </div>
        <div v-if="run?.status === 'completed'" class="mt-6 border-t pt-6">
            <template v-if="publication">
                <p class="font-medium text-primary" role="status">
                    {{ publication.alreadyPublished ? 'Выпуск уже опубликован' : 'Выпуск опубликован' }}
                </p>
                <p class="mt-2 text-sm leading-6 text-muted-foreground">
                    {{ formatTime(publication.publishedAt) }} МСК. Писем отправлено: {{ publication.emailSent }}. В очереди: {{ publication.emailPending }}. Ошибок отправки: {{ publication.emailFailed }}.
                </p>
                <RouterLink class="mt-3 inline-flex min-h-11 items-center gap-2 rounded-sm text-sm text-primary underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring" :to="{ name: 'home' }">
                    Перейти к выпускам
                    <ArrowRight class="size-4" aria-hidden="true" />
                </RouterLink>
            </template>
            <template v-else>
                <p class="mb-4 text-sm leading-6 text-muted-foreground">
                    После публикации выпуск появится на сайте, а подписчики получат письмо.
                </p>
                <DialogRoot :open="confirmOpen" @update:open="setConfirmOpen">
                    <DialogTrigger as-child>
                        <Button class="min-h-11 w-full sm:w-auto" type="button" :disabled="!canUseArtifacts || actionPending">
                            <Send class="size-4" aria-hidden="true" />
                            Опубликовать выпуск
                        </Button>
                    </DialogTrigger>
                    <DialogPortal>
                        <DialogOverlay class="fixed inset-0 z-50 bg-foreground/40 backdrop-blur-sm dark:bg-background/80" />
                        <DialogContent class="fixed top-1/2 left-1/2 z-50 max-h-[calc(100dvh-2rem)] w-[calc(100%-2rem)] max-w-md -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-xl border border-border bg-background p-6 font-sans text-foreground shadow-xl sm:p-8">
                            <DialogTitle class="font-serif text-3xl leading-tight text-primary">
                                Опубликовать выпуск?
                            </DialogTitle>
                            <DialogDescription class="mt-3 text-sm leading-6 text-muted-foreground">
                                Выпуск станет доступен всем посетителям сайта. Подтверждённым подписчикам будет отправлено письмо с дайджестом.
                            </DialogDescription>
                            <p v-if="publicationError" class="mt-4 text-sm leading-6 text-destructive" role="alert">
                                {{ publicationError }}
                            </p>
                            <div class="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                                <DialogClose as-child>
                                    <Button
                                        class="min-h-11"
                                        type="button"
                                        variant="outline"
                                        :disabled="publishing"
                                    >
                                        Отмена
                                    </Button>
                                </DialogClose>
                                <Button
                                    class="min-h-11"
                                    type="button"
                                    :disabled="publishing || !canUseArtifacts"
                                    @click="publish"
                                >
                                    <LoaderCircle v-if="publishing" class="size-4 animate-spin motion-reduce:animate-none" aria-hidden="true" />
                                    {{ publishing ? 'Публикуем…' : 'Опубликовать и отправить' }}
                                </Button>
                            </div>
                        </DialogContent>
                    </DialogPortal>
                </DialogRoot>
            </template>
        </div>
    </section>
</template>

<script setup lang="ts">
import type { DigestPublicationResult, RunArtifactFilename, RunStatusResult } from '@/api'

import { computed, onBeforeUnmount, ref, shallowRef, watch } from 'vue'

import { ArrowRight, CircleCheck, Download, LoaderCircle, RefreshCw, Send } from '@lucide/vue'
import { DialogClose, DialogContent, DialogDescription, DialogOverlay, DialogPortal, DialogRoot, DialogTitle, DialogTrigger } from 'reka-ui'
import { RouterLink } from 'vue-router'
import { Button } from '@/components/ui/button'
import AdminRunDiagnostics from '@/components/AdminRunDiagnostics.vue'
import AdminRunStatistics from '@/components/AdminRunStatistics.vue'

import { useId } from 'vue'
import { useAdminAuth } from '@/composables/useAdminAuth'

import { api, RUN_ARTIFACT_FILENAMES } from '@/api'
import { ApiError, isUnauthorizedError } from '@/lib/graphqlClient'

const props = defineProps<{ runId: string }>()
const emit = defineEmits<{ unauthorized: [] }>()
const headingId = useId()
const { getToken } = useAdminAuth()
const run = shallowRef<RunStatusResult | null>(null)
const loading = ref(false)
const statusError = ref('')
const pollingPaused = ref(false)
const activeDownload = ref<RunArtifactFilename | 'zip' | null>(null)
const downloadError = ref('')
const downloadNotice = ref('')
const confirmOpen = ref(false)
const publishing = ref(false)
const publicationError = ref('')
const publication = shallowRef<DigestPublicationResult | null>(null)
const actionPending = computed(() => Boolean(activeDownload.value) || publishing.value)
const isProcessing = computed(() => run.value?.status === 'queued' || run.value?.status === 'running')
const filesReady = computed(() => run.value?.status === 'completed' && RUN_ARTIFACT_FILENAMES.every(name => run.value?.files.includes(name)))
const canUseArtifacts = computed(() => filesReady.value && !statusError.value)
const statusLabel = computed(() => {
    const labels: Record<string, string> = {
        queued: 'Ожидает обработки',
        running: 'Обработка выполняется',
        completed: 'Выпуск готов',
        failed: 'Обработка завершилась ошибкой',
    }
    return run.value ? labels[run.value.status] ?? `Состояние: ${run.value.status}` : ''
})
const artifactFiles: { name: RunArtifactFilename, label: string }[] = [
    { name: 'digest.md', label: 'Дайджест' },
    { name: 'post.md', label: 'Пост' },
    { name: 'email.md', label: 'Письмо' },
    { name: 'journal.csv', label: 'Журнал обработки' },
]
let statusRequest: AbortController | null = null
let actionRequest: AbortController | null = null
let pollTimer: ReturnType<typeof setTimeout> | undefined
let pollingDeadline = 0
const objectUrls = new Map<string, ReturnType<typeof setTimeout>>()

const formatTime = (value: string) => {
    const date = new Date(value)
    return Number.isFinite(date.getTime())
        ? new Intl.DateTimeFormat('ru-RU', { timeZone: 'Europe/Moscow', dateStyle: 'short', timeStyle: 'short' }).format(date)
        : 'Время не указано'
}

const stopPolling = () => {
    clearTimeout(pollTimer)
    pollTimer = undefined
}

const unauthorized = () => {
    stopPolling()
    statusRequest?.abort()
    actionRequest?.abort()
    emit('unauthorized')
}

const loadStatus = async () => {
    stopPolling()
    statusRequest?.abort()
    if (!props.runId) return
    if (!/^[0-9a-f]{8}-(?:[0-9a-f]{4}-){3}[0-9a-f]{12}$/i.test(props.runId)) {
        statusError.value = 'Укажите корректный номер запуска.'
        return
    }
    const token = getToken()
    if (!token) return unauthorized()
    const request = new AbortController()
    statusRequest = request
    loading.value = true
    statusError.value = ''
    try {
        const result = await api.runStatus(props.runId, token, request.signal)
        if (statusRequest !== request || request.signal.aborted) return
        run.value = result
        if (!result) statusError.value = 'Запуск не найден. Проверьте его номер.'
        else if (isProcessing.value) {
            if (Date.now() < pollingDeadline) pollTimer = setTimeout(() => { void loadStatus() }, 5000)
            else pollingPaused.value = true
        }
    } catch (error) {
        if (statusRequest !== request || request.signal.aborted) return
        if (isUnauthorizedError(error)) unauthorized()
        else statusError.value = 'Не удалось обновить статус. Проверьте соединение и повторите попытку.'
    } finally {
        if (statusRequest === request) loading.value = false
    }
}

const refresh = () => {
    pollingDeadline = Date.now() + 15 * 60 * 1000
    pollingPaused.value = false
    void loadStatus()
}

const download = async (filename: RunArtifactFilename | 'zip') => {
    if (!canUseArtifacts.value || actionPending.value) return
    const token = getToken()
    if (!token) return unauthorized()
    const request = new AbortController()
    actionRequest = request
    activeDownload.value = filename
    downloadError.value = ''
    downloadNotice.value = ''
    const id = props.runId
    try {
        const blob = filename === 'zip'
            ? await api.downloadRunArchive(id, token, request.signal)
            : await api.downloadRunArtifact(id, filename, token, request.signal)
        if (actionRequest !== request || request.signal.aborted) return
        const url = URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = url
        link.download = filename === 'zip' ? `digest-${id}.zip` : filename
        document.body.append(link)
        link.click()
        link.remove()
        objectUrls.set(url, setTimeout(() => {
            URL.revokeObjectURL(url)
            objectUrls.delete(url)
        }, 30_000))
        downloadNotice.value = `Файл ${link.download} передан браузеру для скачивания.`
    } catch (error) {
        if (actionRequest !== request || request.signal.aborted) return
        if (isUnauthorizedError(error)) unauthorized()
        else downloadError.value = error instanceof ApiError && error.status === 404
            ? 'Файл пока недоступен. Обновите статус запуска.'
            : 'Не удалось скачать файл. Повторите попытку.'
    } finally {
        if (actionRequest === request) activeDownload.value = null
    }
}

const setConfirmOpen = (value: boolean) => {
    if (publishing.value) return
    publicationError.value = ''
    confirmOpen.value = value
}

const publish = async () => {
    if (!confirmOpen.value || !canUseArtifacts.value || actionPending.value || publication.value) return
    const token = getToken()
    if (!token) return unauthorized()
    const request = new AbortController()
    actionRequest = request
    publishing.value = true
    publicationError.value = ''
    try {
        const result = await api.publishDigest(props.runId, token, request.signal)
        if (actionRequest !== request || request.signal.aborted) return
        publication.value = result
        confirmOpen.value = false
    } catch (error) {
        if (actionRequest !== request || request.signal.aborted) return
        if (isUnauthorizedError(error)) unauthorized()
        else publicationError.value = 'Не удалось получить подтверждение публикации. Проверьте сайт перед повторной попыткой: запрос мог выполниться.'
    } finally {
        if (actionRequest === request) publishing.value = false
    }
}

watch(() => props.runId, () => {
    stopPolling()
    statusRequest?.abort()
    actionRequest?.abort()
    statusRequest = null
    actionRequest = null
    run.value = null
    loading.value = false
    statusError.value = ''
    activeDownload.value = null
    downloadError.value = ''
    downloadNotice.value = ''
    publishing.value = false
    publication.value = null
    publicationError.value = ''
    confirmOpen.value = false
    refresh()
}, { immediate: true })

onBeforeUnmount(() => {
    stopPolling()
    statusRequest?.abort()
    actionRequest?.abort()
    objectUrls.forEach((timer, url) => {
        clearTimeout(timer)
        URL.revokeObjectURL(url)
    })
    objectUrls.clear()
})
</script>
