<template>
    <DropdownMenuPortal>
        <DropdownMenuContent
            v-bind="{ ...$attrs, ...forwarded }"
            data-slot="dropdown-menu-content"
            :class="cn('z-50 max-h-(--reka-dropdown-menu-content-available-height) min-w-32 overflow-y-auto rounded-md border bg-popover p-1 text-popover-foreground shadow-lg outline-none', props.class)"
        >
            <slot />
        </DropdownMenuContent>
    </DropdownMenuPortal>
</template>

<script setup lang="ts">
import type { DropdownMenuContentEmits, DropdownMenuContentProps } from 'reka-ui'
import type { HTMLAttributes } from 'vue'

import { reactiveOmit } from '@vueuse/core'

import { DropdownMenuContent, DropdownMenuPortal } from 'reka-ui'

import { useForwardPropsEmits } from 'reka-ui'

import { cn } from '@/lib/utils'

defineOptions({ inheritAttrs: false })

const props = withDefaults(defineProps<DropdownMenuContentProps & {
    class?: HTMLAttributes['class']
}>(), { sideOffset: 8 })
const emits = defineEmits<DropdownMenuContentEmits>()
const forwarded = useForwardPropsEmits(reactiveOmit(props, 'class'), emits)
</script>
