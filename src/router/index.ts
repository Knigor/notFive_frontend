import type { RouterHistory } from 'vue-router'

import { createRouter, createWebHistory } from 'vue-router'

import { useAdminAuth } from '@/composables/useAdminAuth'

export const createAppRouter = (history: RouterHistory = createWebHistory(import.meta.env.BASE_URL)) => {
    const router = createRouter({
        history,
        routes: [
            {
                path: '/',
                name: 'home',
                component: () => import('@/pages/HomeView.vue'),
            },
            {
                path: '/login',
                name: 'admin-login',
                component: () => import('@/pages/AdminLoginView.vue'),
            },
            {
                path: '/admin',
                redirect: { name: 'admin-settings' },
            },
            {
                path: '/admin/settings',
                name: 'admin-settings',
                component: () => import('@/pages/AdminSettingsView.vue'),
            },
            {
                path: '/admin/sources',
                name: 'admin-sources',
                component: () => import('@/pages/AdminSettingsView.vue'),
            },
        ],
        scrollBehavior: (to, _from, savedPosition) => {
            if (savedPosition) return savedPosition
            if (to.hash) return { el: to.hash, top: 24 }
            return { top: 0 }
        },
    })

    router.beforeEach(to => {
        const { getToken } = useAdminAuth()
        const isAdminRoute = to.name === 'admin-settings' || to.name === 'admin-sources'

        if (isAdminRoute && !getToken()) {
            return {
                name: 'admin-login',
                query: { next: to.name === 'admin-sources' ? 'sources' : 'settings' },
            }
        }
    })

    return router
}

export default createAppRouter()
