<template>
    <PopoverPortal>
        <PopoverContent
            v-bind="{ ...$attrs, ...forwarded }"
            data-slot="popover-content"
            :class="cn('z-50 max-h-(--reka-popover-content-available-height) w-72 max-w-[calc(100vw-2rem)] overflow-y-auto rounded-md border bg-popover p-4 text-popover-foreground shadow-md outline-none', props.class)"
        >
            <slot />
        </PopoverContent>
    </PopoverPortal>
</template>

<script setup lang="ts">
import type { PopoverContentEmits, PopoverContentProps } from 'reka-ui'
import type { HTMLAttributes } from 'vue'

import { reactiveOmit } from '@vueuse/core'

import { PopoverContent, PopoverPortal } from 'reka-ui'

import { useForwardPropsEmits } from 'reka-ui'

import { cn } from '@/lib/utils'

defineOptions({ inheritAttrs: false })

const props = withDefaults(defineProps<PopoverContentProps & {
    class?: HTMLAttributes['class']
}>(), { sideOffset: 8, align: 'start', collisionPadding: 16 })
const emits = defineEmits<PopoverContentEmits>()
const forwarded = useForwardPropsEmits(reactiveOmit(props, 'class'), emits)
</script>
