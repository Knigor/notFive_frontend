<template>
    <article
        class="digest-card flex h-full min-w-0 flex-col"
        lang="ru"
        :class="{ 'digest-card--lead': article.rank === 1, 'digest-card--featured': featured }"
        :aria-labelledby="`article-${article.id}`"
    >
        <img
            class="digest-card__image block w-full object-cover"
            decoding="async"
            :src="article.image"
            :alt="article.imageAlt"
            :width="article.rank === 1 ? 560 : 336"
            :height="article.rank === 1 ? 344 : 176"
            :loading="article.rank === 1 ? 'eager' : 'lazy'"
            :fetchpriority="article.rank === 1 ? 'high' : 'auto'"
        >
        <div class="mt-3 flex flex-col items-start">
            <span
                class="inline-flex min-h-5 items-center rounded-full border border-current px-2 font-sans text-[11px] leading-4"
                :lang="locale"
            >
                {{ article.category }}
            </span>
            <h2
                :id="`article-${article.id}`"
                class="digest-card__title mt-2 font-serif font-normal"
            >
                {{ article.title }}
            </h2>
            <span
                v-if="article.caveat"
                class="mt-3 bg-warning px-2 py-1 font-sans text-xs leading-4 text-warning-foreground"
                :lang="locale"
            >
                {{ article.caveat }}
            </span>
            <p class="digest-card__summary mt-3 font-serif">
                {{ article.summary }}
            </p>
            <details class="digest-card__details group mt-3 w-full">
                <summary
                    class="flex min-h-11 cursor-pointer list-none items-center gap-2 rounded-sm text-sm underline underline-offset-4 hover:opacity-75 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-current [&::-webkit-details-marker]:hidden"
                    :lang="locale"
                >
                    <span class="group-open:hidden">{{ labels.details }}</span>
                    <span class="hidden group-open:inline">{{ labels.collapse }}</span>
                    <ChevronDown class="size-4 shrink-0 group-open:rotate-180" aria-hidden="true" />
                </summary>
                <dl class="space-y-4 pt-2 pb-4 text-base leading-6">
                    <div>
                        <dt class="font-sans text-xs font-semibold" :lang="locale">
                            {{ labels.essence }}
                        </dt>
                        <dd class="mt-1">
                            {{ article.essence }}
                        </dd>
                    </div>
                    <div>
                        <dt class="font-sans text-xs font-semibold" :lang="locale">
                            {{ labels.consequences }}
                        </dt>
                        <dd class="mt-1">
                            {{ article.consequences }}
                        </dd>
                    </div>
                    <div>
                        <dt class="font-sans text-xs font-semibold" :lang="locale">
                            {{ labels.rationale }}
                        </dt>
                        <dd class="mt-1">
                            {{ article.rationale }}
                        </dd>
                    </div>
                </dl>
            </details>
        </div>
        <footer class="mt-auto flex items-center justify-between gap-2 pt-4" :lang="locale">
            <span class="font-sans text-xs" :class="featured ? 'text-editorial-foreground' : 'text-muted-foreground'">
                {{ labels.rank }} {{ article.rank }} / 5
            </span>
            <DropdownMenu>
                <DropdownMenuTrigger as-child>
                    <Button
                        class="h-11 gap-1 rounded-none px-0 font-serif text-sm font-normal underline underline-offset-4 hover:opacity-75"
                        variant="link"
                        :class="featured ? 'text-editorial-foreground' : 'text-primary'"
                    >
                        {{ labels.sources }} · {{ article.sources.length }}
                        <ArrowUpRight class="size-3" aria-hidden="true" />
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent class="w-80 max-w-[calc(100vw-2rem)] font-sans" align="end">
                    <div class="p-1">
                        <DropdownMenuLabel class="px-2 py-1 text-sm font-medium">
                            {{ labels.sources }}
                        </DropdownMenuLabel>
                        <DropdownMenuItem
                            v-for="source in article.sources"
                            :key="source.id"
                            class="min-h-11 items-start px-2 py-2"
                            as-child
                        >
                            <a
                                target="_blank"
                                rel="noopener noreferrer"
                                lang="ru"
                                :href="source.url"
                            >
                                <span class="min-w-0 flex-1">
                                    <span class="block whitespace-normal wrap-anywhere">{{ source.name }}</span>
                                    <span class="mt-1 block text-xs text-muted-foreground">
                                        <time :datetime="source.publishedAt">{{ formatDate(source.publishedAt) }}</time> · {{ source.id }}
                                    </span>
                                </span>
                                <ArrowUpRight class="mt-1 size-4 shrink-0" aria-hidden="true" />
                            </a>
                        </DropdownMenuItem>
                    </div>
                </DropdownMenuContent>
            </DropdownMenu>
        </footer>
    </article>
</template>

<script setup lang="ts">
import type { DigestEvent } from '@/pages/digestExample'

import { computed } from 'vue'

import { ArrowUpRight, ChevronDown } from '@lucide/vue'
import { Button } from '@/components/ui/button'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

interface Article extends DigestEvent {
    category: string
    image: string
    imageAlt: string
    caveat?: string
}

const props = defineProps<{
    article: Article
    locale: string
    labels: {
        sources: string
        details: string
        collapse: string
        essence: string
        consequences: string
        rationale: string
        rank: string
    }
}>()

const featured = computed(() => props.article.rank === 2 || props.article.rank === 5)
const formatDate = (date: string) => date.split('-').reverse().join('.')
</script>

<style scoped>
.digest-card {
    border-bottom: 1px solid var(--border);
    padding-bottom: 8px;
}

.digest-card--featured {
    position: relative;
    border: 0;
    background: var(--editorial);
    color: var(--editorial-foreground);
    padding: 16px;
    mask-image:
        radial-gradient(circle 16px at 0 0, transparent 99%, oklch(0 0 0) 100%),
        radial-gradient(circle 16px at 100% 0, transparent 99%, oklch(0 0 0) 100%),
        radial-gradient(circle 16px at 0 100%, transparent 99%, oklch(0 0 0) 100%),
        radial-gradient(circle 16px at 100% 100%, transparent 99%, oklch(0 0 0) 100%);
    mask-composite: intersect;
}

.digest-card__image {
    height: 176px;
}

.digest-card--lead .digest-card__image {
    height: 224px;
}

.digest-card__title {
    font-size: 28px;
    line-height: 30px;
    overflow-wrap: anywhere;
}

.digest-card--lead .digest-card__title {
    font-size: 32px;
    line-height: 36px;
}

.digest-card__summary {
    font-size: 16px;
    line-height: 24px;
}

@media (min-width: 48rem) and (max-width: 79.999rem) {
    .digest-card--lead .digest-card__image {
        height: 344px;
    }
}

@media (min-width: 80rem) {
    .digest-card__image {
        height: 112px;
    }

    .digest-card--lead .digest-card__image {
        height: 344px;
    }

    .digest-card__title {
        font-size: 26px;
        line-height: 28px;
    }

    .digest-card--lead .digest-card__title {
        font-size: 40px;
        line-height: 42px;
    }

    .digest-card__summary {
        font-size: 14px;
        line-height: 18px;
    }

    .digest-card--lead .digest-card__summary {
        font-size: 18px;
        line-height: 24px;
    }

}
</style>
