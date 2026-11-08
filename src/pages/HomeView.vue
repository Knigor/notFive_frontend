<template>
    <div id="top" class="mx-auto max-w-360 px-4 pb-6 font-serif md:px-8 xl:px-16">
        <button
            class="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-50 focus:bg-background focus:p-4 focus:text-foreground focus:outline-2 focus:outline-ring"
            type="button"
            @click="focusNews"
        >
            Перейти к новостям
        </button>
        <header class="grid h-16 grid-cols-[1fr_auto_1fr] items-center border-b border-border">
            <RouterLink
                class="col-start-2 inline-flex min-h-11 items-center text-[28px] leading-11 text-primary sm:text-4xl"
                :to="{ name: 'home' }"
            >
                <BrandLogo :show-text="false" />
            </RouterLink>
            <div class="-mr-2 flex justify-self-end">
                <DropdownMenu>
                    <DropdownMenuTrigger as-child>
                        <Button
                            class="size-11"
                            variant="ghost"
                            size="icon"
                            aria-label="Выбрать выпуск"
                        >
                            <CalendarDays class="size-5" aria-hidden="true" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent class="w-64 font-sans" align="end">
                        <div class="p-1">
                            <DropdownMenuLabel class="px-2 py-1 text-sm font-medium">
                                Доступные выпуски
                            </DropdownMenuLabel>
                            <div class="max-h-72 overflow-y-auto">
                                <DropdownMenuItem
                                    v-for="date in dates"
                                    :key="date"
                                    class="min-h-11 justify-between"
                                    @select="selectDate(date)"
                                >
                                    {{ formatIssueDate(date) }}
                                    <Check v-if="selectedDate === date" class="size-4" aria-hidden="true" />
                                </DropdownMenuItem>
                            </div>
                            <p v-if="!dates.length" class="px-2 py-2 text-sm leading-5 text-muted-foreground">
                                {{ pending ? 'Загружаем выпуски…' : error ? 'Список выпусков недоступен.' : 'Опубликованных выпусков пока нет.' }}
                            </p>
                        </div>
                    </DropdownMenuContent>
                </DropdownMenu>
                <ThemeSwitcher />
            </div>
        </header>
        <p class="flex min-h-16 flex-wrap items-center justify-center gap-x-2 border-b border-border py-3 text-center font-sans text-xs leading-5 text-muted-foreground xl:min-h-12 xl:gap-x-4 xl:font-serif xl:text-base xl:leading-6">
            <span>Кибербезопасность</span>
            <span aria-hidden="true">·</span>
            <span>Ежедневный дайджест</span>
            <span v-if="selectedDate" class="hidden xl:inline" aria-hidden="true">·</span>
            <time v-if="selectedDate" class="basis-full xl:basis-auto" :datetime="selectedDate">{{ formatIssueDate(selectedDate) }}</time>
        </p>
        <main
            id="news"
            ref="news"
            class="scroll-mt-6"
            tabindex="-1"
            :aria-busy="pending"
        >
            <div class="pt-6 pb-8 text-center">
                <h1 class="text-[42px] leading-11 font-normal text-primary md:text-[64px] md:leading-[72px] xl:text-[84px] xl:leading-[92px]">
                    <span class="block md:inline">Актуальные</span>{{ ' ' }}<span>Новости</span>
                </h1>
                <template v-if="digest">
                    <p class="mt-1 font-sans text-xs leading-5 text-muted-foreground xl:font-serif xl:text-[17px] xl:leading-6">
                        {{ period }}
                    </p>
                    <p class="mt-2 font-sans text-xs leading-5 text-muted-foreground">
                        {{ articles.length }} событий из {{ digest.totalMaterials }} материалов · Контрольное время {{ controlTime }} МСК
                    </p>
                </template>
                <div class="mt-5 flex justify-center">
                    <EmailSubscriptionDialog />
                </div>
            </div>
            <p v-if="pending" class="py-12 text-center font-sans text-muted-foreground" role="status">
                Загружаем выпуск…
            </p>
            <div v-else-if="error" class="space-y-4 py-12 text-center font-sans">
                <p class="text-destructive" role="alert">
                    {{ error }}
                </p>
                <Button type="button" variant="outline" @click="refresh">
                    Попробовать ещё раз
                </Button>
            </div>
            <ol v-else-if="articles.length" class="digest-grid grid list-none gap-8 p-0 md:grid-cols-2 xl:gap-6">
                <li
                    v-for="article in articles"
                    :key="article.id"
                    class="min-w-0"
                    :class="`digest-grid__item--${article.rank}`"
                >
                    <DigestCard :article="article" :total-events="articles.length" />
                </li>
            </ol>
            <p v-else class="py-12 text-center font-sans text-muted-foreground" role="status">
                {{ digest ? 'В этом выпуске нет отобранных событий.' : selectedDate ? 'За выбранную дату опубликованного выпуска нет.' : 'Опубликованных выпусков пока нет.' }}
            </p>
        </main>
        <footer id="about" class="mt-6 scroll-mt-6 border-t border-border pt-5 xl:mt-10">
            <div class="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between xl:gap-6">
                <BrandLogo class="text-3xl leading-9" :show-text="false" />
                <RouterLink
                    class="inline-flex min-h-11 items-center rounded-sm font-sans text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring"
                    :to="{ name: 'admin-settings' }"
                >
                    @ notFive
                </RouterLink>
            </div>
        </footer>
    </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'

import { CalendarDays, Check } from '@lucide/vue'
import { RouterLink } from 'vue-router'
import BrandLogo from '@/components/BrandLogo.vue'
import DigestCard from '@/components/DigestCard.vue'
import EmailSubscriptionDialog from '@/components/EmailSubscriptionDialog.vue'
import ThemeSwitcher from '@/components/ThemeSwitcher.vue'
import { Button } from '@/components/ui/button'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

import { usePublishedDigest } from '@/composables/usePublishedDigest'

import serverRacks from '@/assets/digest/01-server-racks.jpg'
import laptopOffice from '@/assets/digest/02-laptop-office.jpg'
import codeWorkspace from '@/assets/digest/03-code-workspace.jpg'
import storageDrive from '@/assets/digest/04-storage-drive.jpg'
import emailLaptop from '@/assets/digest/05-email-laptop.jpg'

const { dates, selectedDate, digest, pending, error, refresh, selectDate } = usePublishedDigest()
const news = ref<HTMLElement | null>(null)

const focusNews = () => {
    news.value?.focus({ preventScroll: true })
    news.value?.scrollIntoView({ block: 'start' })
}

const illustrations = [
    { image: serverRacks, imageAlt: 'Иллюстрация: серверные стойки в дата-центре' },
    { image: codeWorkspace, imageAlt: 'Иллюстрация: ноутбук с редактором кода' },
    { image: laptopOffice, imageAlt: 'Иллюстрация: компьютеры на рабочем столе' },
    { image: storageDrive, imageAlt: 'Иллюстрация: внутреннее устройство жёсткого диска' },
    { image: emailLaptop, imageAlt: 'Иллюстрация: почтовое сообщение на экране ноутбука' },
]

const formatIssueDate = (date: string) => new Intl.DateTimeFormat('ru-RU', {
    timeZone: 'Europe/Moscow', day: 'numeric', month: 'long', year: 'numeric',
}).format(new Date(`${date}T12:00:00+03:00`))

const controlTime = computed(() => digest.value ? new Intl.DateTimeFormat('ru-RU', {
    timeZone: 'Europe/Moscow', hour: '2-digit', minute: '2-digit', hour12: false,
}).format(new Date(digest.value.controlTime)) : '')

const period = computed(() => {
    if (!digest.value) return ''
    const dateFormat = new Intl.DateTimeFormat('ru-RU', {
        timeZone: 'Europe/Moscow', day: '2-digit', month: '2-digit', year: 'numeric',
        hour: '2-digit', minute: '2-digit', hour12: false,
    })
    return `${dateFormat.format(new Date(digest.value.periodStart))} — ${dateFormat.format(new Date(digest.value.controlTime))} МСК`
})

const articles = computed(() => (digest.value?.events ?? []).map(article => ({
    ...article,
    ...(illustrations[article.rank - 1] ?? { image: serverRacks, imageAlt: 'Иллюстрация: серверные стойки в дата-центре' }),
})))
</script>

<style scoped>
@media (min-width: 48rem) and (max-width: 79.999rem) {
    .digest-grid__item--1 {
        grid-column: 1 / -1;
    }
}

@media (min-width: 80rem) {
    .digest-grid {
        position: relative;
        grid-template-columns: minmax(0, 35fr) minmax(0, 21fr) minmax(0, 23fr);
        grid-template-rows: minmax(284px, auto) minmax(84px, auto) minmax(284px, auto);
    }

    .digest-grid__item--1 {
        grid-column: 1;
        grid-row: 1 / 4;
    }

    .digest-grid__item--2 {
        grid-column: 2;
        grid-row: 1 / 3;
    }

    .digest-grid__item--3 {
        grid-column: 2;
        grid-row: 3;
    }

    .digest-grid__item--4 {
        grid-column: 3;
        grid-row: 1;
    }

    .digest-grid__item--5 {
        grid-column: 3;
        grid-row: 2 / 4;
    }

    .digest-grid__item--1::after,
    .digest-grid__item--2::after {
        position: absolute;
        top: 0;
        bottom: 0;
        width: 1px;
        background: var(--border);
        content: '';
        pointer-events: none;
    }

    .digest-grid__item--1::after {
        left: calc((100% - 48px) * 35 / 79 + 12px);
    }

    .digest-grid__item--2::after {
        left: calc((100% - 48px) * 56 / 79 + 36px);
    }
}
</style>
