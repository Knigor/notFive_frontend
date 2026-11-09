<template>
    <div class="h-64 w-full min-w-0" aria-hidden="true">
        <VChart
            class="h-full w-full"
            autoresize
            :option="option"
            :init-options="chartInit"
        />
    </div>
</template>

<script setup lang="ts">
import type { EChartsOption } from 'echarts'

import { BarChart } from 'echarts/charts'
import { use } from 'echarts/core'
import { SVGRenderer } from 'echarts/renderers'
import { computed, ref, watch } from 'vue'
import VChart from 'vue-echarts'

import { GridComponent, LegendComponent, TooltipComponent } from 'echarts/components'

import { usePreferredReducedMotion } from '@vueuse/core'
import { useTheme } from '@/composables/useTheme'

use([BarChart, GridComponent, LegendComponent, TooltipComponent, SVGRenderer])

const props = defineProps<{
    labels: string[]
    series: { name: string, values: (number | null)[] }[]
    unit?: string
    stacked?: boolean
}>()
const chartInit = { renderer: 'svg' as const }
const { resolvedTheme } = useTheme()
const reducedMotion = usePreferredReducedMotion()
const colors = ref({ text: '', grid: '', series: [] as string[] })

watch(resolvedTheme, () => {
    const style = getComputedStyle(document.documentElement)
    colors.value = {
        text: style.getPropertyValue('--foreground').trim(),
        grid: style.getPropertyValue('--border').trim(),
        series: ['--primary', '--chart-2', '--chart-3', '--chart-4', '--chart-5'].map(token => style.getPropertyValue(token).trim()),
    }
}, { immediate: true, flush: 'post' })

const option = computed<EChartsOption>(() => ({
    animation: reducedMotion.value !== 'reduce',
    color: colors.value.series,
    textStyle: { color: colors.value.text, fontFamily: 'Arial, sans-serif' },
    tooltip: { trigger: 'axis', renderMode: 'richText', confine: true },
    legend: { show: props.series.length > 1, top: 0, textStyle: { color: colors.value.text, fontSize: 12 } },
    grid: { top: props.series.length > 1 ? 56 : 16, bottom: 32, left: 112, right: 40, containLabel: false },
    xAxis: { type: 'value', min: 0, name: props.unit ?? '', nameLocation: 'middle', nameGap: 24, splitLine: { lineStyle: { color: colors.value.grid } } },
    yAxis: {
        type: 'category', inverse: true, data: props.labels,
        axisLine: { show: false }, axisTick: { show: false },
        axisLabel: { color: colors.value.text, fontSize: 12, width: 104, overflow: 'truncate' },
    },
    series: props.series.map(series => ({
        name: series.name, type: 'bar' as const, stack: props.stacked ? 'total' : undefined,
        data: series.values.map(value => value ?? '-'), barMaxWidth: 24,
        label: { show: props.series.length === 1, position: 'right', color: colors.value.text },
    })),
}))
</script>
