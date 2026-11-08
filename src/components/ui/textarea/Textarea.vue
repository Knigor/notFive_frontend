<template>
    <textarea
        v-model="model"
        data-slot="textarea"
        :class="cn('flex min-h-32 w-full min-w-0 resize-y rounded-md border border-input bg-transparent px-3 py-3 text-base leading-6 text-foreground shadow-xs outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm', props.class)"
    />
</template>

<script setup lang="ts">
import type { HTMLAttributes } from 'vue'

import { cn } from '@/lib/utils'

const props = defineProps<{ class?: HTMLAttributes['class'] }>()
const model = defineModel<string>({ default: '' })
</script>
