import { createI18n } from 'vue-i18n'

import en from './en-GB.json'
import ru from './ru-RU.json'

const i18n = createI18n({
    locale: 'ru-RU',
    messages: {
        'en-GB': en,
        'ru-RU': ru,
    }
})

export default i18n