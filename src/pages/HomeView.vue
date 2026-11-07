<template>
    <main class="grid min-h-dvh place-items-center bg-background px-6 py-12 text-foreground">
        <div class="w-full max-w-xl text-center">
            <p class="mb-4 text-sm font-medium text-muted-foreground">
                notFive
            </p>
            <h1 class="text-4xl font-semibold tracking-tight sm:text-5xl">
                {{ t('hello') }}
            </h1>
            <p class="mt-6 text-base leading-7 text-muted-foreground sm:text-lg">
                {{ t('welcome') }}
            </p>
        </div>
    </main>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'

const { t } = useI18n()
</script>
