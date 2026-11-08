import { readonly, ref } from 'vue'

interface AdminSession {
    token: string
    expiresAt: number
}

const storageKey = 'notfive.admin.session'

const readSession = (): AdminSession | null => {
    try {
        const stored = sessionStorage.getItem(storageKey)
        if (!stored) return null
        const value: unknown = JSON.parse(stored)
        if (
            typeof value === 'object' && value !== null
            && 'token' in value && typeof value.token === 'string' && value.token.length > 0
            && 'expiresAt' in value && typeof value.expiresAt === 'number'
            && Number.isFinite(value.expiresAt) && value.expiresAt > Date.now()
        ) return { token: value.token, expiresAt: value.expiresAt }
        sessionStorage.removeItem(storageKey)
    } catch {
        return null
    }
    return null
}

const session = ref<AdminSession | null>(readSession())

const clearSession = () => {
    session.value = null
    try {
        sessionStorage.removeItem(storageKey)
    } catch {
        return
    }
}

const setSession = (token: string, expiresIn: number) => {
    if (!token || !Number.isFinite(expiresIn) || expiresIn <= 0) {
        clearSession()
        throw new Error('INVALID_SESSION')
    }
    session.value = { token, expiresAt: Date.now() + expiresIn * 1000 }
    try {
        sessionStorage.setItem(storageKey, JSON.stringify(session.value))
    } catch {
        return
    }
}

const getToken = (): string | null => {
    if (session.value && session.value.expiresAt > Date.now()) return session.value.token
    clearSession()
    return null
}

export const useAdminAuth = () => ({
    session: readonly(session),
    setSession,
    clearSession,
    getToken,
})
