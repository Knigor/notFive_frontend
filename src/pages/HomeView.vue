<template>
    <div id="top" class="mx-auto max-w-360 px-4 pb-6 font-serif md:px-8 xl:px-16">
        <button
            class="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-50 focus:bg-background focus:p-4 focus:text-foreground focus:outline-2 focus:outline-ring"
            type="button"
            @click="focusNews"
        >
            {{ t('skipToNews') }}
        </button>
        <header class="grid h-16 grid-cols-[1fr_auto_1fr] items-center border-b border-border">
            <div class="-ml-2 justify-self-start">
                <DropdownMenu>
                    <DropdownMenuTrigger as-child>
                        <Button
                            class="size-11"
                            variant="ghost"
                            size="icon"
                            :aria-label="t('navigation.language')"
                        >
                            <Menu class="size-5" aria-hidden="true" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent class="w-52 font-sans" align="start">
                        <div class="p-1">
                            <DropdownMenuLabel class="px-2 py-1 text-sm font-medium">
                                {{ t('navigation.language') }}
                            </DropdownMenuLabel>
                            <DropdownMenuRadioGroup :model-value="locale" @update:model-value="setLocale">
                                <DropdownMenuRadioItem
                                    class="flex min-h-11 cursor-pointer items-center justify-between gap-3 rounded-sm px-2 py-2 text-sm outline-none data-[highlighted]:bg-accent data-[highlighted]:text-accent-foreground"
                                    value="ru-RU"
                                >
                                    Русский
                                    <Check v-if="locale === 'ru-RU'" class="size-4" aria-hidden="true" />
                                </DropdownMenuRadioItem>
                                <DropdownMenuRadioItem
                                    class="flex min-h-11 cursor-pointer items-center justify-between gap-3 rounded-sm px-2 py-2 text-sm outline-none data-[highlighted]:bg-accent data-[highlighted]:text-accent-foreground"
                                    value="en-GB"
                                >
                                    English
                                    <Check v-if="locale === 'en-GB'" class="size-4" aria-hidden="true" />
                                </DropdownMenuRadioItem>
                            </DropdownMenuRadioGroup>
                        </div>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
            <RouterLink
                class="inline-flex min-h-11 items-center text-[28px] leading-11 text-primary sm:text-4xl"
                :to="{ name: 'home' }"
            >
                <BrandLogo />
            </RouterLink>
            <div class="-mr-2 flex justify-self-end">
                <DropdownMenu>
                    <DropdownMenuTrigger as-child>
                        <Button
                            class="size-11"
                            variant="ghost"
                            size="icon"
                            :aria-label="t('chooseIssue')"
                        >
                            <CalendarDays class="size-5" aria-hidden="true" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent class="w-64 font-sans" align="end">
                        <div class="p-1">
                            <DropdownMenuLabel class="px-2 py-1 text-sm font-medium">
                                {{ t('availableIssues') }}
                            </DropdownMenuLabel>
                            <DropdownMenuItem class="min-h-11 justify-between">
                                {{ issueDate }}
                                <Check class="size-4" aria-hidden="true" />
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <p class="px-2 py-2 text-sm leading-5 text-muted-foreground">
                                {{ t('issueNotice') }}
                            </p>
                        </div>
                    </DropdownMenuContent>
                </DropdownMenu>
                <ThemeSwitcher />
            </div>
        </header>
        <p class="flex min-h-16 flex-wrap items-center justify-center gap-x-2 border-b border-border py-3 text-center font-sans text-xs leading-5 text-muted-foreground xl:min-h-12 xl:gap-x-4 xl:font-serif xl:text-base xl:leading-6">
            <span>{{ t('topic') }}</span>
            <span aria-hidden="true">·</span>
            <span>{{ t('edition') }}</span>
            <span class="hidden xl:inline" aria-hidden="true">·</span>
            <time class="basis-full xl:basis-auto" :datetime="digestExample.controlTime">{{ issueDate }}</time>
        </p>
        <main
            id="news"
            ref="news"
            class="scroll-mt-6"
            tabindex="-1"
        >
            <div class="pt-6 pb-8 text-center">
                <h1 class="text-[42px] leading-11 font-normal text-primary md:text-[64px] md:leading-[72px] xl:text-[84px] xl:leading-[92px]">
                    <span class="block md:inline">{{ t('titleFirst') }}</span>{{ ' ' }}<span>{{ t('titleSecond') }}</span>
                </h1>
                <p class="mt-1 font-sans text-xs leading-5 text-muted-foreground xl:font-serif xl:text-[17px] xl:leading-6">
                    {{ period }}
                </p>
                <p class="mt-2 font-sans text-xs leading-5 text-muted-foreground">
                    {{ t('issueSummary', { events: articles.length, total: digestExample.totalMaterials, time: controlTime }) }}
                </p>
            </div>
            <ol class="digest-grid grid list-none gap-8 p-0 md:grid-cols-2 xl:gap-6">
                <li
                    v-for="article in articles"
                    :key="article.id"
                    class="min-w-0"
                    :class="`digest-grid__item--${article.rank}`"
                >
                    <DigestCard
                        :article="article"
                        :locale="locale"
                        :labels="articleLabels"
                    />
                </li>
            </ol>
        </main>
        <footer id="about" class="mt-6 scroll-mt-6 border-t border-border pt-5 xl:mt-10">
            <div class="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between xl:gap-6">
                <BrandLogo class="text-3xl leading-9" />
            </div>
        </footer>
    </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'

import { CalendarDays, Check, Menu } from '@lucide/vue'
import { RouterLink } from 'vue-router'
import BrandLogo from '@/components/BrandLogo.vue'
import DigestCard from '@/components/DigestCard.vue'
import ThemeSwitcher from '@/components/ThemeSwitcher.vue'
import { Button } from '@/components/ui/button'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuRadioGroup,
    DropdownMenuRadioItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

import { useI18n } from 'vue-i18n'

import serverRacks from '@/assets/digest/01-server-racks.jpg'
import laptopOffice from '@/assets/digest/02-laptop-office.jpg'
import codeWorkspace from '@/assets/digest/03-code-workspace.jpg'
import storageDrive from '@/assets/digest/04-storage-drive.jpg'
import emailLaptop from '@/assets/digest/05-email-laptop.jpg'
import { digestExample } from '@/pages/digestExample'

const { t } = useI18n({ useScope: 'local' })
const { locale } = useI18n({ useScope: 'global' })
const news = ref<HTMLElement | null>(null)

const focusNews = () => {
    news.value?.focus({ preventScroll: true })
    news.value?.scrollIntoView({ block: 'start' })
}

const articleImages: Record<string, string> = {
    strazhshlyuz: serverRacks,
    buhlink: codeWorkspace,
    translogistik: laptopOffice,
    romashka: storageDrive,
    kii: emailLaptop,
}

const issueDate = computed(() => new Intl.DateTimeFormat(locale.value, {
    timeZone: 'Europe/Moscow',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
}).format(new Date(digestExample.controlTime)))

const controlTime = computed(() => new Intl.DateTimeFormat(locale.value, {
    timeZone: 'Europe/Moscow',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
}).format(new Date(digestExample.controlTime)))

const period = computed(() => {
    const dateFormat = new Intl.DateTimeFormat(locale.value, {
        timeZone: 'Europe/Moscow',
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
    })

    return t('period', {
        start: dateFormat.format(new Date(digestExample.periodStart)),
        end: dateFormat.format(new Date(digestExample.controlTime)),
    })
})

const articleLabels = computed(() => ({
    sources: t('sources'),
    details: t('details'),
    collapse: t('collapse'),
    essence: t('essence'),
    consequences: t('consequences'),
    rationale: t('rationale'),
    rank: t('rank'),
}))

const articles = computed(() => digestExample.events.map(article => ({
    ...article,
    category: t(`articles.${article.id}.category`),
    image: articleImages[article.id] ?? serverRacks,
    imageAlt: t(`articles.${article.id}.imageAlt`),
    caveat: article.id === 'romashka' ? t('conflictingReports') : undefined,
})))

const setLocale = (value: unknown) => {
    if (value === 'ru-RU' || value === 'en-GB') locale.value = value
}

watch(locale, (value) => {
    document.documentElement.lang = value
}, { immediate: true })
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

<i18n lang="json">
{
    "ru-RU": {
        "skipToNews": "Перейти к новостям",
        "chooseIssue": "Выбрать выпуск",
        "availableIssues": "Доступные выпуски",
        "issueNotice": "Сейчас доступен один выпуск из примера организаторов.",
        "topic": "Кибербезопасность",
        "edition": "Ежедневный дайджест",
        "titleFirst": "Актуальные",
        "titleSecond": "Новости",
        "period": "{start} — {end} МСК",
        "issueSummary": "{events} событий из {total} материалов · Контрольное время {time} МСК",
        "sources": "Источники",
        "details": "Подробнее",
        "collapse": "Свернуть",
        "essence": "Суть",
        "consequences": "Последствия",
        "rationale": "Почему в выпуске",
        "rank": "Событие",
        "conflictingReports": "Оценки расходятся",
        "navigation": {
            "language": "Язык"
        },
        "articles": {
            "strazhshlyuz": {
                "category": "Уязвимость",
                "imageAlt": "Ряды серверных стоек в дата-центре"
            },
            "buhlink": {
                "category": "Цепочка поставок",
                "imageAlt": "Ноутбук с открытым редактором кода"
            },
            "translogistik": {
                "category": "Шифровальщик",
                "imageAlt": "Ноутбуки и мониторы на рабочем столе"
            },
            "romashka": {
                "category": "Утечка данных",
                "imageAlt": "Внутреннее устройство жёсткого диска"
            },
            "kii": {
                "category": "Регулирование",
                "imageAlt": "Почтовое сообщение на экране ноутбука"
            }
        }
    },
    "en-GB": {
        "skipToNews": "Skip to news",
        "chooseIssue": "Choose an issue",
        "availableIssues": "Available issues",
        "issueNotice": "One issue from the organisers’ example is currently available.",
        "topic": "Cybersecurity",
        "edition": "Daily digest",
        "titleFirst": "Latest",
        "titleSecond": "News",
        "period": "{start} — {end} MSK",
        "issueSummary": "{events} events from {total} articles · Cut-off time {time} MSK",
        "sources": "Sources",
        "details": "Read more",
        "collapse": "Collapse",
        "essence": "What happened",
        "consequences": "Impact",
        "rationale": "Why it matters",
        "rank": "Event",
        "conflictingReports": "Conflicting estimates",
        "navigation": {
            "language": "Language"
        },
        "articles": {
            "strazhshlyuz": {
                "category": "Vulnerability",
                "imageAlt": "Rows of server racks in a data centre"
            },
            "buhlink": {
                "category": "Supply chain",
                "imageAlt": "A laptop displaying a code editor"
            },
            "translogistik": {
                "category": "Ransomware",
                "imageAlt": "Laptops and monitors on an office desk"
            },
            "romashka": {
                "category": "Data breach",
                "imageAlt": "The internal mechanism of a hard drive"
            },
            "kii": {
                "category": "Regulation",
                "imageAlt": "An email message on a laptop screen"
            }
        }
    }
}
</i18n>
