<template>
    <Popover v-model:open="isOpen">
        <PopoverTrigger as-child>
            <Button
                v-bind="$attrs"
                :id="id"
                class="h-11 w-full justify-between gap-3 px-3 text-left font-normal"
                type="button"
                variant="outline"
                :disabled="disabled"
            >
                <span class="truncate">{{ formattedValue }}</span>
                <CalendarDays class="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
            </Button>
        </PopoverTrigger>
        <PopoverContent class="w-80 p-0 font-sans" :aria-label="t('title')">
            <Calendar
                initial-focus
                prevent-deselect
                fixed-weeks
                :model-value="selectedDate"
                :default-placeholder="today('Europe/Moscow')"
                :locale="locale"
                :week-starts-on="1"
                :previous-label="t('previousMonth')"
                :next-label="t('nextMonth')"
                :calendar-label="t('date')"
                @update:model-value="setDate"
            />
            <div class="space-y-3 border-t border-border p-3">
                <div class="flex items-center gap-3">
                    <label class="min-w-0 flex-1 text-sm font-medium" :for="`${id}-time`">{{ t('time') }}</label>
                    <Input
                        :id="`${id}-time`"
                        v-model="selectedTime"
                        class="w-32"
                        type="time"
                        step="60"
                    />
                </div>
                <Button class="h-11 w-full" type="button" @click="isOpen = false">
                    {{ t('done') }}
                </Button>
            </div>
        </PopoverContent>
    </Popover>
</template>

<script setup lang="ts">
import type { DateValue } from '@internationalized/date'

import { parseDate, today } from '@internationalized/date'
import { computed, ref } from 'vue'

import { CalendarDays } from '@lucide/vue'
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import { Input } from '@/components/ui/input'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'

import { useI18n } from 'vue-i18n'

defineOptions({ inheritAttrs: false })

defineProps<{
    id: string
    disabled?: boolean
}>()
const model = defineModel<string>({ required: true })
const { t } = useI18n({ useScope: 'local' })
const { locale } = useI18n({ useScope: 'global' })
const isOpen = ref(false)

const selectedDate = computed(() => {
    const date = model.value.split('T')[0]
    if (!date) return undefined
    try {
        return parseDate(date)
    } catch {
        return undefined
    }
})

const selectedTime = computed({
    get: () => model.value.split('T')[1]?.slice(0, 5) ?? '',
    set: (time: string) => {
        const date = selectedDate.value ?? today('Europe/Moscow')
        model.value = `${date.toString()}T${time}`
    },
})

const formattedValue = computed(() => {
    if (!selectedDate.value) return t('placeholder')
    const date = new Intl.DateTimeFormat(locale.value, {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
        timeZone: 'Europe/Moscow',
    }).format(selectedDate.value.toDate('Europe/Moscow'))
    return selectedTime.value ? `${date}, ${selectedTime.value}` : date
})

const setDate = (date: DateValue | undefined) => {
    if (!date) return
    model.value = `${date.toString()}T${selectedTime.value || '00:00'}`
}
</script>

<i18n lang="json">
{
    "ru-RU": {
        "title": "Контрольные дата и время",
        "date": "Контрольная дата",
        "time": "Время · МСК",
        "previousMonth": "Предыдущий месяц",
        "nextMonth": "Следующий месяц",
        "placeholder": "Выберите дату и время",
        "done": "Готово"
    },
    "en-GB": {
        "title": "Cut-off date and time",
        "date": "Cut-off date",
        "time": "Time · MSK",
        "previousMonth": "Previous month",
        "nextMonth": "Next month",
        "placeholder": "Choose date and time",
        "done": "Done"
    }
}
</i18n>
