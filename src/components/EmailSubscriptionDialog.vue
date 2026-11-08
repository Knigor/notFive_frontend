<template>
    <DialogRoot :open="open" @update:open="setOpen">
        <DialogTrigger as-child>
            <Button class="min-h-11 gap-2 px-5 font-sans" type="button">
                <Mail class="size-4" aria-hidden="true" />
                Подписаться
            </Button>
        </DialogTrigger>
        <DialogPortal>
            <DialogOverlay class="fixed inset-0 z-50 bg-foreground/40 backdrop-blur-sm dark:bg-background/80" />
            <DialogContent
                class="fixed top-1/2 left-1/2 z-50 max-h-[calc(100dvh-2rem)] w-[calc(100%-2rem)] max-w-md -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-xl border border-border bg-background p-6 font-sans text-foreground shadow-xl sm:p-8"
                aria-modal="true"
            >
                <div class="mb-5 flex size-12 items-center justify-center rounded-full bg-secondary text-primary">
                    <MailCheck v-if="submitted" class="size-6" aria-hidden="true" />
                    <Mail v-else class="size-6" aria-hidden="true" />
                </div>
                <DialogTitle as-child>
                    <h2 ref="title" class="pr-8 font-serif text-3xl leading-tight text-primary outline-none" tabindex="-1">
                        {{ submitted ? 'Проверьте почту' : 'Новости на почту' }}
                    </h2>
                </DialogTitle>
                <DialogDescription class="mt-3 text-sm leading-6 text-muted-foreground">
                    {{ submitted ? 'Чтобы получать дайджест, подтвердите подписку по ссылке в письме.' : 'Получайте новые выпуски дайджеста по кибербезопасности прямо на вашу почту.' }}
                </DialogDescription>
                <div v-if="submitted" class="mt-6 space-y-5">
                    <p class="rounded-lg border border-border bg-secondary p-4 text-sm leading-6 wrap-anywhere" role="status">
                        Проверьте почту {{ submittedEmail }}, включая папку «Спам». Если письма нет, попробуйте подписаться позже. Если адрес уже подтверждён, повторное подтверждение не требуется.
                    </p>
                    <DialogClose as-child>
                        <Button class="min-h-11 w-full" type="button">
                            Понятно
                        </Button>
                    </DialogClose>
                </div>
                <form
                    v-else
                    ref="form"
                    class="mt-6 space-y-5"
                    novalidate
                    :aria-busy="pending"
                    @submit.prevent="submit"
                >
                    <div class="space-y-2">
                        <label class="block text-sm font-medium" :for="emailId">Электронная почта</label>
                        <Input
                            :id="emailId"
                            v-model="email"
                            name="email"
                            type="email"
                            autocomplete="email"
                            autocapitalize="none"
                            spellcheck="false"
                            inputmode="email"
                            maxlength="254"
                            required
                            :disabled="pending"
                            :aria-invalid="invalidEmail"
                            :aria-describedby="invalidEmail ? `${emailId}-error` : undefined"
                            @input="clearErrors"
                        />
                        <p
                            v-if="invalidEmail"
                            :id="`${emailId}-error`"
                            class="text-sm leading-5 text-destructive"
                            role="alert"
                        >
                            Введите корректный адрес электронной почты.
                        </p>
                    </div>
                    <p v-if="requestError" class="text-sm leading-6 text-destructive" role="alert">
                        {{ requestError }}
                    </p>
                    <Button class="min-h-11 w-full" type="submit" :disabled="pending">
                        <LoaderCircle v-if="pending" class="size-4 animate-spin motion-reduce:animate-none" aria-hidden="true" />
                        {{ pending ? 'Отправляем…' : 'Подписаться' }}
                    </Button>
                    <p class="text-xs leading-5 text-muted-foreground">
                        Отписаться можно в любой момент по ссылке в рассылке.
                    </p>
                </form>
                <DialogClose as-child>
                    <Button
                        class="absolute top-3 right-3 size-11"
                        type="button"
                        variant="ghost"
                        size="icon"
                        aria-label="Закрыть"
                    >
                        <X class="size-5" aria-hidden="true" />
                    </Button>
                </DialogClose>
            </DialogContent>
        </DialogPortal>
    </DialogRoot>
</template>

<script setup lang="ts">
import { nextTick, onBeforeUnmount, ref } from 'vue'

import { LoaderCircle, Mail, MailCheck, X } from '@lucide/vue'
import { DialogClose, DialogContent, DialogDescription, DialogOverlay, DialogPortal, DialogRoot, DialogTitle, DialogTrigger } from 'reka-ui'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

import { useId } from 'vue'

import { api } from '@/api'
import { ApiError } from '@/lib/graphqlClient'

const emailId = useId()
const open = ref(false)
const email = ref('')
const pending = ref(false)
const submitted = ref(false)
const submittedEmail = ref('')
const invalidEmail = ref(false)
const requestError = ref('')
const form = ref<HTMLFormElement | null>(null)
const title = ref<HTMLElement | null>(null)
let activeRequest: AbortController | null = null

const clearErrors = () => {
    invalidEmail.value = false
    requestError.value = ''
}

const setOpen = (value: boolean) => {
    activeRequest?.abort()
    activeRequest = null
    open.value = value
    pending.value = false
    submitted.value = false
    submittedEmail.value = ''
    email.value = ''
    clearErrors()
}

const submit = async () => {
    if (pending.value || submitted.value) return
    clearErrors()
    if (!form.value?.checkValidity()) {
        invalidEmail.value = true
        const input = form.value?.elements.namedItem('email')
        if (input instanceof HTMLInputElement) input.focus()
        return
    }

    const address = email.value.trim()
    const request = new AbortController()
    activeRequest = request
    pending.value = true

    try {
        const result = await api.subscribeEmail(address, {
            signal: request.signal,
        })
        if (activeRequest !== request || !open.value) return
        if (result.status !== 'accepted') throw new Error('Unexpected subscription status')
        submittedEmail.value = address
        submitted.value = true
        await nextTick()
        if (activeRequest === request && open.value) title.value?.focus()
    } catch (error) {
        if (activeRequest !== request || request.signal.aborted) return
        requestError.value = error instanceof ApiError && error.kind === 'network'
            ? 'Не удалось связаться с сервером. Проверьте соединение и попробуйте ещё раз.'
            : 'Не удалось отправить запрос. Попробуйте ещё раз чуть позже.'
    } finally {
        if (activeRequest === request) {
            activeRequest = null
            pending.value = false
        }
    }
}

onBeforeUnmount(() => activeRequest?.abort())
</script>
