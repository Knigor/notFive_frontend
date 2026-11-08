<template>
    <div class="mx-auto flex min-h-svh max-w-360 flex-col px-4 font-sans md:px-8 xl:px-16">
        <header class="flex min-h-20 items-center justify-between gap-4 border-b border-border">
            <RouterLink class="inline-flex min-h-11 items-center font-serif text-3xl" :to="{ name: 'home' }">
                <BrandLogo />
            </RouterLink>
            <ThemeSwitcher />
        </header>
        <main class="flex flex-1 items-center justify-center py-12 md:py-16">
            <section class="w-full max-w-md" aria-labelledby="login-title">
                <p class="mb-3 text-xs font-medium tracking-widest text-muted-foreground uppercase">
                    Панель управления
                </p>
                <h1 id="login-title" class="font-serif text-4xl leading-tight text-primary sm:text-5xl">
                    Вход администратора
                </h1>
                <p class="mt-4 text-sm leading-6 text-muted-foreground">
                    Загрузка материалов и настройка источников для следующего выпуска дайджеста.
                </p>
                <div class="mt-8 rounded-xl border border-border bg-card p-4 sm:p-8">
                    <form class="space-y-5" :aria-busy="isSubmitting" @submit.prevent="signIn">
                        <div class="space-y-2">
                            <label class="block text-sm font-medium" for="admin-username">Логин</label>
                            <Input
                                id="admin-username"
                                v-model="username"
                                name="username"
                                type="text"
                                autocomplete="username"
                                autocapitalize="none"
                                spellcheck="false"
                                required
                                :disabled="isSubmitting"
                            />
                        </div>
                        <div class="space-y-2">
                            <label class="block text-sm font-medium" for="admin-password">Пароль</label>
                            <div class="relative">
                                <Input
                                    id="admin-password"
                                    v-model="password"
                                    class="pr-12"
                                    name="password"
                                    autocomplete="current-password"
                                    required
                                    :type="showPassword ? 'text' : 'password'"
                                    :disabled="isSubmitting"
                                />
                                <Button
                                    class="absolute top-0 right-0 size-11"
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    :aria-label="showPassword ? 'Скрыть пароль' : 'Показать пароль'"
                                    :aria-pressed="showPassword"
                                    @click="showPassword = !showPassword"
                                >
                                    <EyeOff v-if="showPassword" class="size-4" aria-hidden="true" />
                                    <Eye v-else class="size-4" aria-hidden="true" />
                                </Button>
                            </div>
                        </div>
                        <Button
                            class="h-11 w-full"
                            type="submit"
                            :disabled="isSubmitting || !username.trim() || !password"
                        >
                            <LoaderCircle v-if="isSubmitting" class="size-4 animate-spin motion-reduce:animate-none" aria-hidden="true" />
                            <LockKeyhole v-else class="size-4" aria-hidden="true" />
                            {{ isSubmitting ? 'Входим…' : 'Войти' }}
                        </Button>
                        <p v-if="error" class="text-sm leading-6 text-destructive" role="alert">
                            {{ error }}
                        </p>
                    </form>
                </div>
                <RouterLink
                    class="mt-6 inline-flex min-h-11 items-center gap-2 rounded-sm text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring"
                    :to="{ name: 'home' }"
                >
                    <ArrowLeft class="size-4" aria-hidden="true" />
                    Вернуться к дайджесту
                </RouterLink>
            </section>
        </main>
    </div>
</template>

<script setup lang="ts">
import { onBeforeUnmount, ref } from 'vue'

import { ArrowLeft, Eye, EyeOff, LoaderCircle, LockKeyhole } from '@lucide/vue'
import { RouterLink } from 'vue-router'
import BrandLogo from '@/components/BrandLogo.vue'
import ThemeSwitcher from '@/components/ThemeSwitcher.vue'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

import { useRoute, useRouter } from 'vue-router'
import { useAdminAuth } from '@/composables/useAdminAuth'

import { api } from '@/api'
import { ApiError } from '@/lib/graphqlClient'

const route = useRoute()
const router = useRouter()
const { setSession, clearSession } = useAdminAuth()
const username = ref('')
const password = ref('')
const showPassword = ref(false)
const isSubmitting = ref(false)
const error = ref('')
let request: AbortController | null = null

const signIn = async () => {
    if (isSubmitting.value || !username.value.trim() || !password.value) return
    isSubmitting.value = true
    error.value = ''
    request = new AbortController()
    try {
        const result = await api.login({ username: username.value.trim(), password: password.value }, request.signal)
        setSession(result.token, result.expiresIn)
        password.value = ''
        await router.replace({ name: route.query.next === 'sources' ? 'admin-sources' : 'admin-settings' })
    } catch (cause) {
        if (request.signal.aborted) return
        clearSession()
        error.value = cause instanceof ApiError && cause.kind === 'graphql'
            ? cause.message
            : cause instanceof ApiError && cause.status && cause.status >= 500
                ? 'Сервер авторизации временно недоступен. Повторите попытку позже.'
                : 'Не удалось выполнить вход. Проверьте соединение и повторите попытку.'
    } finally {
        isSubmitting.value = false
    }
}

onBeforeUnmount(() => request?.abort())
</script>
