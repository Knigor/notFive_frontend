# notFive frontend

Стартовое Vue-приложение на основе `Study/knigor`: приветственная страница без вёрстки портфолио.

## Запуск

Нужны Bun и Node.js 24, как в CI исходного проекта.

```bash
bun install --frozen-lockfile
bun run dev
```

## Команды

```bash
bun run lint
bun run typecheck
bun run build
bun run preview
bun run test
bun run test:watch
bun run test:coverage
```

`build` включает проверку типов и создаёт production-сборку в `dist/`.
Тестовый стек настроен, собственных тестов пока нет. Для проверки раннера
без тестовых файлов: `bun run test --passWithNoTests`. Этот же флаг используется
в CI при запуске покрытия. Использовать `bun run test`, а не `bun test`.

## Структура

- `src/main.ts` — создание приложения, подключение роутера и i18n.
- `src/App.vue` — корневой компонент с `RouterView`.
- `src/pages/HomeView.vue` — приветствие на маршруте `/`.
- `src/router/index.ts` — маршруты с HTML5 history.
- `src/i18n` — локали `ru-RU` и `en-GB`, по умолчанию русский язык.
- `src/components/ui` — компоненты shadcn-vue: button, select, dropdown-menu, navigation-menu.
- `src/assets/style.css` — Tailwind CSS 4, анимации и токены светлой/тёмной темы.
- `src/lib/utils.ts` — функция `cn` для объединения классов.
- `eslint/rules/import-groups.js` — локальное правило группировки импортов.

## Что перенесено

Все зависимости и их зафиксированные версии из `bun.lock`, команды Bun,
`AGENTS.md`, конфигурации ESLint, TypeScript, Vite, Vitest и shadcn-vue,
алиасы `@` / `@lib`, UI-компоненты, утилиты и настройка локализации.
`AGENTS.md` сохранён без изменений из исходного проекта.

CI проверяет линтер, сборку и тесты; запускается для pull request,
push в `main` / `master` и вручную. Из него удалена переменная API галереи.

Имя пакета заменено на `notfive-frontend`, базовый путь Vite — `/notFive`.
Из глобальных стилей убраны оформление портфолио и внешние шрифты;
семантические токены shadcn и стили ARIA-состояний сохранены.

Страницы портфолио, API галереи, связанные composables, типы и тесты,
личные изображения, `.env.local`, настройки IDE, Git-история и результаты
старых сборок не переносились. Переменные окружения для приветствия не нужны.
Workflow публикации в GitHub Pages перенесён из `Study/knigor`.
Удалена переменная API галереи, для тестового раннера добавлен
`--passWithNoTests`, как в CI, пока собственных тестов нет.

## Размещение

Фронтенд размещается в GitHub Pages. В настройках репозитория
`Settings → Pages → Build and deployment → Source` нужно выбрать `GitHub Actions`.

Публикация GitHub Release запускает `.github/workflows/deploy.yml`:
установка зависимостей → линтер → проверка типов и сборка → тесты →
настройка Pages → загрузка `dist/` → деплой в окружение `github-pages`.

Для репозитория `notFive` адрес сайта будет `https://<username>.github.io/notFive/`.
Vue Router использует базовый путь Vite через `import.meta.env.BASE_URL`.
Пока есть только корневой маршрут. При добавлении вложенных маршрутов
нужно отдельно решить обработку прямых переходов: GitHub Pages
не предоставляет серверный fallback для HTML5 history.

Бэкенд размещается отдельно на VPS; его адрес будет настраиваться
при подключении API.
`bun run dev` и `bun run preview` предназначены для локальной проверки.

## Кейс и исследование

Продукт: [дайджест по кибербезопасности](docs/case/CONTEXT.md). [Исследование моделей и архитектуры](docs/case/RESEARCH.md), [предлагаемый контракт с backend](docs/case/FRONTEND_CONTRACT.md), [исходное задание](docs/case/brief.pdf). Функционал и API из этих документов пока не реализованы.
