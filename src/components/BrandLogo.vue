<template>
    <span class="inline-flex items-center gap-2 text-primary">
        <span class="brand-mark h-8 w-6 shrink-0 bg-current sm:h-10 sm:w-7" aria-hidden="true" />
        <span :class="{ 'sr-only': !props.showText }">notFive</span>
    </span>
</template>

<script setup lang="ts">
const props = withDefaults(defineProps<{ showText?: boolean }>(), { showText: true })
</script>

<style scoped>
.brand-mark {
    -webkit-mask: url('@/assets/logo.svg') center / contain no-repeat;
    mask: url('@/assets/logo.svg') center / contain no-repeat;
}
</style>
