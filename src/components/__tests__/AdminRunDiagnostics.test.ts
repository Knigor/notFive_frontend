import type { RunStatusResult } from '@/api'

import userEvent from '@testing-library/user-event'
import { cleanup, render, screen } from '@testing-library/vue'
import { afterEach, expect, test } from 'vitest'

import AdminRunDiagnostics from '@/components/AdminRunDiagnostics.vue'

const diagnostics: RunStatusResult['diagnostics'] = {
    collectionRunId: 'collection-run',
    digestRunId: 'digest-run',
    counts: { candidates: 2, collected: 1, imported: 1, included: 1, merged: 0, excluded: 1, events: 1 },
    warnings: ['Дата одной публикации не подтверждена.'],
    materials: [
        { id: 'web-accepted', title: 'Исправлена уязвимость', url: 'https://example.org/article', stage: 'analysis', status: 'included', group: 'G1', reason: 'Производитель выпустил исправление.', error: null },
        { id: 'web-rejected', title: 'Архив новостей', url: 'https://example.org/archive', stage: 'collection', status: 'excluded', group: null, reason: 'Страница раздела не является публикацией.', error: 'Дата не подтверждена.' },
    ],
}

afterEach(cleanup)

test('shows collection rejection reasons and warnings after expanding details', async () => {
    const user = userEvent.setup()
    render(AdminRunDiagnostics, { props: { diagnostics } })

    await user.click(screen.getByText('Предупреждения: 1'))
    expect(screen.getByText('Дата одной публикации не подтверждена.')).toBeTruthy()
    await user.click(screen.getByText('Материалы и причины обработки: 2'))
    expect(screen.getByText('Страница раздела не является публикацией.')).toBeTruthy()
    expect(screen.getByText('Дата не подтверждена.')).toBeTruthy()
    expect(screen.getByRole('link', { name: 'Архив новостей' }).getAttribute('href')).toBe('https://example.org/archive')
    expect(screen.getByText('Сбор с сайтов')).toBeTruthy()
})

test('never turns an unsafe source URL or source markup into active content', async () => {
    const user = userEvent.setup()
    render(AdminRunDiagnostics, { props: { diagnostics: {
        ...diagnostics,
        materials: [{ ...diagnostics.materials[0]!, title: '<script>unsafe</script>', url: 'javascript:alert(1)' }],
    } } })

    await user.click(screen.getByText('Материалы и причины обработки: 1'))
    expect(screen.getByText('<script>unsafe</script>')).toBeTruthy()
    expect(screen.queryByRole('link')).toBeNull()
})
