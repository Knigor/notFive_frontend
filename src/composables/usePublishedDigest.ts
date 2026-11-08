import type { DigestResult } from '@/api/digest'

import { onBeforeUnmount, onMounted, ref, shallowRef } from 'vue'

import { api } from '@/api'

export const usePublishedDigest = () => {
    const dates = ref<string[]>([])
    const selectedDate = ref('')
    const digest = shallowRef<DigestResult | null>(null)
    const pending = ref(false)
    const error = ref('')
    let activeRequest: AbortController | null = null

    const load = async (reloadDates: boolean) => {
        activeRequest?.abort()
        const request = new AbortController()
        activeRequest = request
        pending.value = true
        error.value = ''
        digest.value = null

        try {
            if (reloadDates) {
                const available = await api.publishedDigestDates(request.signal)
                if (activeRequest !== request) return
                dates.value = available
                if (!available.includes(selectedDate.value)) selectedDate.value = available[0] ?? ''
            }
            if (!selectedDate.value) return
            const result = await api.digest(selectedDate.value, request.signal)
            if (activeRequest === request) digest.value = result
        } catch {
            if (activeRequest !== request || request.signal.aborted) return
            error.value = 'Не удалось загрузить выпуск. Проверьте соединение и попробуйте ещё раз.'
        } finally {
            if (activeRequest === request) {
                activeRequest = null
                pending.value = false
            }
        }
    }

    const refresh = () => load(true)
    const selectDate = (date: string) => {
        if (!dates.value.includes(date)) return
        selectedDate.value = date
        return load(false)
    }

    onMounted(refresh)
    onBeforeUnmount(() => {
        activeRequest?.abort()
        activeRequest = null
    })

    return { dates, selectedDate, digest, pending, error, refresh, selectDate }
}
