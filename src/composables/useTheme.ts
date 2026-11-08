import { useColorMode } from '@vueuse/core'

export const useTheme = () => {
    const preference = useColorMode({
        initialValue: 'dark',
        emitAuto: true,
        disableTransition: false,
        onChanged: (theme, applyTheme) => {
            applyTheme(theme)
            document.documentElement.style.colorScheme = theme
        }
    })

    if (!['light', 'dark', 'auto'].includes(preference.value)) {
        preference.value = 'dark'
    }

    const setTheme = (value: unknown) => {
        if (value === 'light' || value === 'dark' || value === 'auto') {
            preference.value = value
        }
    }

    return {
        preference,
        resolvedTheme: preference.state,
        setTheme
    }
}
