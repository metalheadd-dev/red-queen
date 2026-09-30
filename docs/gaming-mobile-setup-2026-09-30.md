# Налаштування Steam / Gaming Queen / Android

Інструкція для поточного коду RED QUEEN, 30 вересня 2026.

## 1. Підключення саме до RED QUEEN

Використовуйте чинний Supabase-проєкт RED QUEEN з його наявними користувачами та історією. Не створюйте іншу базу замість нього і не підключайте чужий проєкт.

Цей код читає такі змінні:

| Змінна | Для чого |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Адреса чинного проєкту |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Публічний ключ для входу користувачів |
| `SUPABASE_SERVICE_ROLE_KEY` | Серверний ключ для приватного збереження та Steam-прив'язки |
| `OPENAI_API_KEY` | Відповіді й модерація Queen |
| `WALLET_SALT` | Стабільне хешування ідентифікаторів та обмеження гостьових запитів |
| `ADMIN_EMAILS` | Email адміністраторів через кому; потрібен для `/admin/feedback` |
| `ADMIN_WALLETS` | Альтернативний список дозволених адмін-гаманців |
| `OPENAI_AGENT_MODEL` | Необов'язкова модель; поточний default — `gpt-4o-mini` |

Назви Supabase-змінних відповідають поточному коду з історичними назвами ключів. Збережіть робочі значення існуючого проєкту; перехід на нові назви/систему ключів потребує окремої перевірки всіх інтеграцій.

**Не генеруйте новий `WALLET_SALT` для існуючої бази.** Зміна солі змінить ключі пошуку профілів, історії й Steam-прив'язок. Якщо змінна раніше не була задана, треба врахувати чинний fallback у `lib/crypto.ts` і спланувати перенесення ідентифікаторів перед зміною.

Локально значення додаються у вже наявний `.env.local` без заміни решти налаштувань. На Vercel — у налаштування змінних потрібного середовища. `SUPABASE_SERVICE_ROLE_KEY`, `OPENAI_API_KEY` і `WALLET_SALT` залишаються серверними; не додавайте їм `NEXT_PUBLIC_` і не комітьте значення. Зміни Vercel env застосовуються до нового deployment: [документація](https://vercel.com/docs/environment-variables). Ролі й типи ключів описані у [Supabase](https://supabase.com/docs/guides/getting-started/api-keys).

## 2. Додаткові таблиці

Перед змінами зробіть доступну резервну копію чинної бази. У перевіреному RED QUEEN-проєкті застосуйте по черзі тільки ці міграції:

1. `supabase/migrations/20260929120000_create_gaming_steam_links.sql`
2. `supabase/migrations/20260930120000_create_gaming_queen_generations.sql`

Вони додають приватні таблиці `gaming_steam_links`, `gaming_queen_generations` та `agent_content_reports`, індекси, RLS і доступ серверній ролі. Вони не видаляють і не замінюють попередню історію. Прямий клієнтський доступ до цих таблиць закритий. Базові таблиці чинного RQ, зокрема користувачі та гостьові квоти, мають уже існувати.

Цей апдейт не застосовував міграції до живої бази. Якщо перша Steam-міграція вже була застосована до включення явного `GRANT`, окремо застосуйте її рядок `grant select, insert, delete on public.gaming_steam_links to service_role;` у тому самому проєкті.

## 3. Вхід та Steam

У Supabase Auth перевірте Email sign-in і реальну доставку листів підтвердження. В URL Configuration встановіть Site URL `https://redqueen.space`; дозволяйте тільки потрібні redirect URL для production і локальної перевірки. [Налаштування redirect URL](https://supabase.com/docs/guides/auth/redirect-urls).

Steam тут працює через власний OpenID-процес:

1. Користувач входить у RED QUEEN через `/login`.
2. У `/profile` або `/gaming/profile` натискає Connect with Steam.
3. Входить на офіційному сайті Steam.
4. Повертається через `https://redqueen.space/api/gaming/steam/callback`; сервер перевіряє Steam і зберігає прив'язку до того самого RQ-акаунта.

Callback автоматично використовує origin, на якому користувач почав процес. Продовжуйте процес на одному домені; production має використовувати HTTPS. У Supabase не потрібно додавати Steam OAuth provider. Для цієї прив'язки Steam Web API key не використовується. Це не самостійне створення RQ-акаунта через Steam і не імпорт бібліотеки, покупок чи achievements. [Офіційна документація Steam OpenID](https://partner.steamgames.com/doc/features/auth#website).

## 4. Розгортання та жива перевірка

Після налаштування бази і змінних розгорніть закомічений код у відповідному Vercel-проєкті. Локальний Git-коміт сам по собі не оновлює сайт; потрібен push у підключену гілку або окреме розгортання.

Перевірте на тестовому RQ-акаунті:

- Steam підключається і зберігається після перезавантаження; від'єднання працює.
- Queen відповідає у `/gaming/queen`; після повторного входу з того самого акаунта доступна його історія.
- Send Report підтверджує збереження; уповноважений адмін бачить запис у `/admin/feedback`.
- Відмова або скасування Steam-входу не створює прив'язку.
- На телефоні працюють вкладки, поле вводу з клавіатурою та повернення зі Steam.

Попередні перевірки: production web build, 19 тестів Steam/Gaming і перевірка мобільних екранів пройшли. Живі Steam, модель, база й черга модерації залишаються неперевіреними, поки RED QUEEN backend не підключено.

## 5. Android

Android-джерела зберігаються в `redqueen-mobile`; мобільний UI — у спільному веб-коді. Поточний Android-пакет залишається TWA.

На машині для збірки потрібні JDK 17, Android SDK 36 і Build Tools 35.0.0. З кореня `red-queen-work`, у звичайному зовнішньому PowerShell:

```powershell
.\redqueen-mobile\build-android.ps1 -CheckOnly
.\redqueen-mobile\build-android.ps1
```

Для підписаного AAB додайте до середовища збірки `RQ_ANDROID_KEYSTORE`, `RQ_ANDROID_KEY_ALIAS`, `RQ_ANDROID_STORE_PASSWORD`, `RQ_ANDROID_KEY_PASSWORD` із **наявного** ключа, потім виконайте `build-android.ps1 -Signed`. Не створюйте заміну ключа й не додавайте ключ або паролі в Git. `RQ_ANDROID_VERSION_CODE` має бути більшим за останній завантажений у Play Console.

Новий AAB поки не підтверджений: Gradle у Codex зупинявся на Java loopback connection ще до компіляції. Деталі, шлях результату, Digital Asset Links, Play App Signing та окремі перевірки перед Google Play — у [Android build preparation](android-play-preparation-2026-09-30.md).

## Комерційна частина

Прив'язка Steam не потребує домовленостей із розробниками ігор. Продаж ключів, криптооплата та субсидовані знижки в цьому апдейті не увімкнені. Для них потрібні узгоджена схема з Valve і договори з правовласниками/авторизованими постачальниками. Чернетка запиту збережена у `steam-support-inquiry-2026-09-30.md`; її не надсилали.
