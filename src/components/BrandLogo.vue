<template>
    <span class="inline-flex items-center gap-2 text-primary">
        <span class="brand-mark h-8 w-6 shrink-0 bg-current sm:h-10 sm:w-7" aria-hidden="true" />
        <span>notFive</span>
    </span>
</template>

<style scoped>
.brand-mark {
    -webkit-mask: url('@/assets/logo.svg') center / contain no-repeat;
    mask: url('@/assets/logo.svg') center / contain no-repeat;
}
</style>
