<template>
    <DropdownMenu>
        <DropdownMenuTrigger as-child>
            <Button
                type="button"
                variant="ghost"
                size="icon"
                class="size-11 rounded-none text-foreground"
                :aria-label="t('theme')"
                :title="t('theme')"
            >
                <Sun v-if="resolvedTheme === 'light'" class="size-5" aria-hidden="true" />
                <Moon v-else class="size-5" aria-hidden="true" />
            </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent class="min-w-48 font-sans" align="end">
            <DropdownMenuRadioGroup :model-value="preference" @update:model-value="setTheme">
                <DropdownMenuRadioItem
                    v-for="theme in themes"
                    :key="theme.value"
                    class="flex min-h-11 cursor-pointer items-center gap-3 rounded-sm px-3 py-2 text-sm outline-none data-[highlighted]:bg-accent data-[highlighted]:text-accent-foreground"
                    :value="theme.value"
                >
                    <component :is="theme.icon" class="size-5" aria-hidden="true" />
                    <span class="flex-1">{{ t(theme.label) }}</span>
                    <Check v-if="preference === theme.value" class="size-4" aria-hidden="true" />
                </DropdownMenuRadioItem>
            </DropdownMenuRadioGroup>
        </DropdownMenuContent>
    </DropdownMenu>
</template>

<script setup lang="ts">
import { Check, Monitor, Moon, Sun } from '@lucide/vue'
import { Button } from '@/components/ui/button'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuRadioGroup,
    DropdownMenuRadioItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

import { useI18n } from 'vue-i18n'
import { useTheme } from '@/composables/useTheme'

const { t } = useI18n()
const { preference, resolvedTheme, setTheme } = useTheme()

const themes = [
    { value: 'light', label: 'light', icon: Sun },
    { value: 'dark', label: 'dark', icon: Moon },
    { value: 'auto', label: 'system', icon: Monitor },
] as const
</script>

<i18n lang="json">
{
    "ru-RU": {
        "theme": "Тема оформления",
        "light": "Светлая",
        "dark": "Тёмная",
        "system": "Системная"
    },
    "en-GB": {
        "theme": "Colour theme",
        "light": "Light",
        "dark": "Dark",
        "system": "System"
    }
}
</i18n>
