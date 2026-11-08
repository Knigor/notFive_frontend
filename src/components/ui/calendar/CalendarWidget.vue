<template>
    <CalendarRoot
        v-slot="{ grid, weekDays }"
        v-bind="forwarded"
        data-slot="calendar"
        :class="cn('p-3', props.class)"
    >
        <CalendarHeader class="mb-3 flex items-center justify-between gap-2">
            <CalendarPrev as-child>
                <Button
                    class="size-9"
                    type="button"
                    variant="outline"
                    :aria-label="previousLabel"
                >
                    <ChevronLeft class="size-4" aria-hidden="true" />
                </Button>
            </CalendarPrev>
            <CalendarHeading class="text-center text-sm font-medium capitalize" />
            <CalendarNext as-child>
                <Button
                    class="size-9"
                    type="button"
                    variant="outline"
                    :aria-label="nextLabel"
                >
                    <ChevronRight class="size-4" aria-hidden="true" />
                </Button>
            </CalendarNext>
        </CalendarHeader>
        <CalendarGrid v-for="month in grid" :key="month.value.toString()" class="w-full border-collapse">
            <CalendarGridHead>
                <CalendarGridRow>
                    <CalendarHeadCell
                        v-for="day in weekDays"
                        :key="day"
                        class="h-8 text-xs font-normal text-muted-foreground"
                    >
                        {{ day }}
                    </CalendarHeadCell>
                </CalendarGridRow>
            </CalendarGridHead>
            <CalendarGridBody>
                <CalendarGridRow v-for="(week, index) in month.rows" :key="index">
                    <CalendarCell
                        v-for="day in week"
                        :key="day.toString()"
                        class="p-0 text-center"
                        :date="day"
                    >
                        <CalendarCellTrigger
                            class="relative flex h-9 w-full items-center justify-center rounded-md text-sm font-normal outline-none hover:bg-accent hover:text-accent-foreground focus-visible:z-10 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-popover data-[disabled]:pointer-events-none data-[disabled]:opacity-50 data-[outside-view]:text-muted-foreground data-[selected]:bg-primary data-[selected]:text-primary-foreground data-[selected]:hover:bg-primary data-[selected]:hover:text-primary-foreground data-[today]:ring-1 data-[today]:ring-inset data-[today]:ring-border data-[unavailable]:text-destructive data-[unavailable]:line-through"
                            as="button"
                            type="button"
                            :day="day"
                            :month="month.value"
                        />
                    </CalendarCell>
                </CalendarGridRow>
            </CalendarGridBody>
        </CalendarGrid>
    </CalendarRoot>
</template>

<script setup lang="ts">
import type { CalendarRootEmits, CalendarRootProps } from 'reka-ui'
import type { HTMLAttributes } from 'vue'

import { reactiveOmit } from '@vueuse/core'

import { ChevronLeft, ChevronRight } from '@lucide/vue'
import {
    CalendarCell,
    CalendarCellTrigger,
    CalendarGrid,
    CalendarGridBody,
    CalendarGridHead,
    CalendarGridRow,
    CalendarHeadCell,
    CalendarHeader,
    CalendarHeading,
    CalendarNext,
    CalendarPrev,
    CalendarRoot,
} from 'reka-ui'
import { Button } from '@/components/ui/button'

import { useForwardPropsEmits } from 'reka-ui'

import { cn } from '@/lib/utils'

const props = withDefaults(defineProps<Omit<CalendarRootProps, 'multiple'> & {
    class?: HTMLAttributes['class']
    previousLabel?: string
    nextLabel?: string
}>(), { previousLabel: 'Previous month', nextLabel: 'Next month', weekdayFormat: 'short' })
const emits = defineEmits<CalendarRootEmits>()
const forwarded = useForwardPropsEmits(reactiveOmit(props, 'class', 'previousLabel', 'nextLabel'), emits)
</script>
