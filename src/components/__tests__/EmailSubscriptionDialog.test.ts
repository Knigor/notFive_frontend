import type { EmailSubscriptionOptions, EmailSubscriptionResult } from '@/api/subscribeEmail'

import userEvent from '@testing-library/user-event'
import { cleanup, render, screen, waitFor, within } from '@testing-library/vue'
import { afterEach, beforeEach, expect, test, vi } from 'vitest'
import { nextTick } from 'vue'

import EmailSubscriptionDialog from '@/components/EmailSubscriptionDialog.vue'

import { ApiError } from '@/lib/graphqlClient'

const { subscribeEmail } = vi.hoisted(() => ({
    subscribeEmail: vi.fn<(email: string, options?: EmailSubscriptionOptions) => Promise<EmailSubscriptionResult>>(),
}))

vi.mock('@/api', () => ({ api: { subscribeEmail } }))

const accepted = { status: 'accepted', message: 'Запрос принят.' }

const deferredSubscription = () => {
    let resolve: (result: EmailSubscriptionResult) => void = () => {
        throw new Error('The deferred request is not initialized')
    }
    const promise = new Promise<EmailSubscriptionResult>(fulfill => {
        resolve = fulfill
    })
    return { promise, resolve }
}

const openDialog = async () => {
    const user = userEvent.setup()
    render(EmailSubscriptionDialog)
    await user.click(screen.getByRole('button', { name: 'Подписаться' }))
    const dialog = await screen.findByRole('dialog', { name: 'Новости на почту' })
    return { user, dialog: within(dialog) }
}

beforeEach(() => {
    subscribeEmail.mockReset()
})

afterEach(() => {
    cleanup()
})

test('rejects an empty or invalid email without sending a request', async () => {
    const { user, dialog } = await openDialog()
    const submit = dialog.getByRole('button', { name: 'Подписаться' })
    const email = dialog.getByRole<HTMLInputElement>('textbox', { name: 'Электронная почта' })

    await user.click(submit)
    expect(dialog.getByRole('alert').textContent?.trim()).toBe('Введите корректный адрес электронной почты.')
    expect(email.getAttribute('aria-invalid')).toBe('true')

    await user.type(email, 'invalid-address')
    await user.click(submit)
    expect(dialog.getByRole('alert').textContent?.trim()).toBe('Введите корректный адрес электронной почты.')
    expect(subscribeEmail).not.toHaveBeenCalled()
})

test('sends one request while pending and asks the reader to confirm by email', async () => {
    const request = deferredSubscription()
    subscribeEmail.mockReturnValueOnce(request.promise)
    const { user, dialog } = await openDialog()
    const email = dialog.getByRole<HTMLInputElement>('textbox', { name: 'Электронная почта' })

    await user.type(email, 'reader@example.com')
    await user.dblClick(dialog.getByRole('button', { name: 'Подписаться' }))

    expect(subscribeEmail).toHaveBeenCalledTimes(1)
    expect(subscribeEmail).toHaveBeenCalledWith('reader@example.com', {
        signal: expect.any(AbortSignal),
    })
    expect(email.disabled).toBe(true)
    expect(dialog.getByRole<HTMLButtonElement>('button', { name: 'Отправляем…' }).disabled).toBe(true)

    request.resolve(accepted)
    await dialog.findByRole('heading', { name: 'Проверьте почту' })
    expect(dialog.getByText('Чтобы получать дайджест, подтвердите подписку по ссылке в письме.')).toBeTruthy()
    expect(dialog.getByRole('status').textContent).toContain('reader@example.com')
})

test('keeps the email after a network error and allows retrying', async () => {
    subscribeEmail.mockRejectedValueOnce(new ApiError('NETWORK_ERROR', 'network')).mockResolvedValueOnce(accepted)
    const { user, dialog } = await openDialog()
    const email = dialog.getByRole<HTMLInputElement>('textbox', { name: 'Электронная почта' })

    await user.type(email, 'reader@example.com')
    await user.click(dialog.getByRole('button', { name: 'Подписаться' }))

    const error = await dialog.findByRole('alert')
    expect(error.textContent).toBe('Не удалось связаться с сервером. Проверьте соединение и попробуйте ещё раз.')
    expect(email.value).toBe('reader@example.com')
    expect(dialog.getByRole<HTMLButtonElement>('button', { name: 'Подписаться' }).disabled).toBe(false)

    await user.click(dialog.getByRole('button', { name: 'Подписаться' }))
    await dialog.findByRole('heading', { name: 'Проверьте почту' })
    expect(dialog.queryByRole('alert')).toBeNull()
    expect(subscribeEmail).toHaveBeenCalledTimes(2)
})

test('aborts on close and ignores a late response after reopening', async () => {
    const previousRequest = deferredSubscription()
    const currentRequest = deferredSubscription()
    subscribeEmail.mockReturnValueOnce(previousRequest.promise).mockReturnValueOnce(currentRequest.promise)
    const { user, dialog } = await openDialog()

    await user.type(dialog.getByRole('textbox', { name: 'Электронная почта' }), 'previous@example.com')
    await user.click(dialog.getByRole('button', { name: 'Подписаться' }))
    const previousSignal = subscribeEmail.mock.calls[0]?.[1]?.signal
    expect(previousSignal?.aborted).toBe(false)

    await user.click(dialog.getByRole('button', { name: 'Закрыть' }))
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull())
    expect(previousSignal?.aborted).toBe(true)

    await user.click(screen.getByRole('button', { name: 'Подписаться' }))
    const reopened = within(await screen.findByRole('dialog', { name: 'Новости на почту' }))
    const email = reopened.getByRole<HTMLInputElement>('textbox', { name: 'Электронная почта' })
    expect(email.value).toBe('')
    await user.type(email, 'current@example.com')
    await user.click(reopened.getByRole('button', { name: 'Подписаться' }))

    previousRequest.resolve(accepted)
    await previousRequest.promise
    await nextTick()
    expect(reopened.queryByRole('status')).toBeNull()
    expect(reopened.getByRole<HTMLButtonElement>('button', { name: 'Отправляем…' }).disabled).toBe(true)

    currentRequest.resolve(accepted)
    await reopened.findByRole('heading', { name: 'Проверьте почту' })
    expect(reopened.getByRole('status').textContent).toContain('current@example.com')
    expect(reopened.getByRole('status').textContent).not.toContain('previous@example.com')
    expect(subscribeEmail).toHaveBeenCalledTimes(2)
})
