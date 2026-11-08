# notFive frontend

Vue-приложение на основе `Study/knigor`: публичный дайджест и интерфейс администратора.

## Запуск

Нужны Bun и Node.js 24, как в CI исходного проекта.

```bash
bun install --frozen-lockfile
cp .env.dist .env
bun run dev
```

`dev` сначала генерирует GraphQL-типы в `src/gql/` из локальной `schema.graphql`
и операций `src/**/*.graphql`, затем запускает Vite. Эта папка не хранится в Git.
Чтобы подготовить типы для IDE без запуска сервера, выполни `bun run codegen`.

## API

В `.env` задаётся базовый адрес backend:

```dotenv
VITE_URL_BACKEND=http://api.galaxiit.ru/
```

Общая точка входа — экземпляр `api` класса `ApiClient` в `src/api/index.ts`:

```ts
import { api } from '@/api'

const result = await api.ping()
```

Клиент добавляет к базовому адресу путь `api/graphql`. `ping` — техническая
проверка соединения. Методы операций находятся рядом с `.graphql`-документами;
отправка запросов и обработка ошибок — в `src/lib/graphqlClient.ts`.
После изменения `.env` перезапусти Vite. Переменные `VITE_*` попадают в frontend;
секреты в них хранить нельзя.

Запросы идут напрямую на backend, которому нужно разрешить origin frontend
через CORS. Для frontend на HTTPS (включая GitHub Pages) нужен HTTPS-адрес API:
HTTP-запросы блокируются браузером как mixed content.

## Интерфейс администратора

- `/login` — вход по логину и паролю администратора.
- `/admin/settings` — выбор или перетаскивание `news.json`, проверка формата и просмотр метаданных набора.
- `/admin/sources` — мультивыбор сайтов из приложения 1 с поиском и контрольное время по Москве.

Маршруты указаны относительно базового пути Vite. Вход в раздел также доступен
по ссылке «Для администратора» внизу публичного дайджеста.

`api.login` получает JWT и срок действия от backend. Сессия хранится в
`sessionStorage` текущей вкладки и удаляется при выходе, истечении срока или
ответе 401/403. Пароль не сохраняется. После открытия настроек защищённый
запрос `api.availableSiteSources` проверяет доступ и загружает каталог.

`api.startRun` отправляет исходный `news.json` через GraphQL multipart upload.
Контрольное время берётся из файла. Для сайтов используется каталог backend:
можно выбрать до пяти источников, поиск работает по названию и домену.
По умолчанию выбраны SecurityLab, Хакер, Хабр, Positive Technologies и
«Лаборатория Касперского», если они присутствуют в каталоге и не отключены.
Источники `candidate` доступны для подготовки выбора, но запуск требует
статуса `ready` у всех выбранных сайтов. Источники `disabled` выбрать нельзя.
Состояние каталога можно обновить после подключения источников на backend.
Сервер получает их `sourceIds` и `controlTime` в ISO 8601 с `+03:00`.
Произвольные сайты не принимаются; сбор выполняется по домену, а не по пути
раздела из задания. Дата и время выбираются через shadcn-vue Calendar/Popover.

Результат показывает номер запуска и счётчики. `dispatchStatus: completed`
означает завершённый сбор и передачу материалов, а не готовый опубликованный
дайджест. Повторная отправка создаёт новый запуск; автоматических повторов нет.
Для прямых запросов backend должен разрешать origin frontend и заголовок
`Authorization` через CORS. Для GitHub Pages нужен HTTPS API.

## Команды

```bash
bun run codegen
bun run lint
bun run typecheck
bun run build
bun run preview
bun run test
bun run test:watch
bun run test:coverage
```

`build` включает проверку типов и создаёт production-сборку в `dist/`.
Проверки формата входных данных и переходов в административный раздел:
`bun run test src/lib/__tests__/adminInputs.test.ts src/router/__tests__/adminAuth.test.ts`.
Использовать `bun run test`, а не `bun test`.

## Структура

- `src/main.ts` — создание приложения, подключение роутера и i18n.
- `src/App.vue` — корневой компонент с `RouterView`.
- `src/pages/HomeView.vue` — публичный дайджест на маршруте `/`.
- `src/pages/AdminLoginView.vue` — форма входа администратора.
- `src/pages/AdminSettingsView.vue` — загрузка набора и ввод ссылок.
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
старых сборок не переносились.
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
Сборка копирует `index.html` в `404.html`, чтобы прямые переходы на вложенные
маршруты открывали Vue-приложение в GitHub Pages. При таком переходе Pages
отдаёт HTTP-статус 404, после чего Vue Router отображает нужную страницу.

Бэкенд размещается отдельно на VPS. Для release-сборки задай repository variable
`URL_BACKEND`: workflow передаёт её в `VITE_URL_BACKEND` во время сборки.
`bun run dev` и `bun run preview` предназначены для локальной проверки.

## Кейс и исследование

Продукт: [дайджест по кибербезопасности](docs/case/CONTEXT.md). [Исследование моделей и архитектуры](docs/case/RESEARCH.md), [предлагаемый контракт с backend](docs/case/FRONTEND_CONTRACT.md), [исходное задание](docs/case/brief.pdf). Функционал и API из этих документов пока не реализованы.
