# KurayDev V2 — Architecture Reference

> This document is the single source of truth for architectural decisions.
> All technical choices must remain consistent with this document.

---

## 1. Technology Stack

| Layer | Technology | Version |
|-------|-----------|---------|
| Framework | Next.js (App Router) | ^16.x |
| UI Library | React | 19.x |
| Language | TypeScript (strict) | 5.9.x |
| Package Manager | npm | — |
| Client State | Zustand | 5.x |
| Styling | Tailwind CSS | v4 |
| UI Components | DaisyUI | v5 |
| Icons | FontAwesome | 6.x |
| Rich Text Editor | TinyMCE | 8.x |
| Runtime Validation | Zod | ^3.x |
| ORM | Prisma | v7 |
| Database | PostgreSQL | — |
| Cache / Queue Broker | Redis (ioredis) | 5.x |
| Job Queue | BullMQ | 5.x |
| Storage | AWS S3 / Cloudflare R2 / MinIO | pluggable |
| AI Providers | OpenAI, Anthropic, Gemini, xAI, DeepSeek | multi-provider |
| Email | Nodemailer | ^7 |
| SMS | Twilio / Nexmo / Clickatell / NetGSM | multi-provider |
| Web Push | web-push | ^3 |
| 2FA / OTP | otplib (TOTP) + email/SMS/push OTP | — |
| Logging | Winston | 3.x |
| Testing | Jest + ts-jest | ^29 |
| i18n | i18next + react-i18next | 25.x / 16.x |
| HTTP Client | Axios | ^1 |
| Embedding (local) | @xenova/transformers (WASM) | ^2 |
| Date Utilities | date-fns + date-fns-tz | ^4 |
| Drag & Drop | @dnd-kit | ^6 |
| CSRF Protection | crypto-js + custom token | — |
| CI/CD | Vercel (vercel-build script) | — |

---

## 2. Request Lifecycle

```
Client (Browser)
  │ HTTPS request
  ▼
Next.js Middleware (middlewares/)
  ├── corsMiddleware        → CORS origin validation, preflight
  ├── csrfMiddleware        → CSRF token check (POST/PUT/PATCH/DELETE)
  ├── rateLimitMiddleware   → Redis-backed rate limiting per IP
  └── addSecurityHeaders    → X-Frame-Options, CSP, HSTS, etc.
  │
  ▼
Next.js App Router
  ├── (frontend)/[lang]/...  → Server Components (RSC) + Client Components
  ├── (api)/api/...          → Route Handlers (API Layer)
  ├── (auth)/auth/...        → Auth pages (login, register, etc.)
  ├── (admin)/admin/...      → Admin dashboard pages
  ├── (my-links)/my-links    → Short link management
  └── (short)/s/[code]       → Short link redirect handler
  │
  ▼
Service Layer (services/)
  │ Business logic, no HTTP context
  ▼
Prisma ORM → PostgreSQL
Redis (ioredis) → Cache + BullMQ queues
StorageService → S3 / R2 / MinIO
```

---

## 3. Folder Structure

```
KurayDevV2/
├── app/
│   ├── globals.css
│   ├── layout.tsx                    # Root layout
│   ├── not-found.tsx
│   │
│   ├── (frontend)/
│   │   └── [lang]/                   # Locale-prefixed public pages
│   │       ├── blog/
│   │       │   ├── [categorySlug]/
│   │       │   │   └── [postSlug]/   # Blog post detail
│   │       │   └── sitemap.xml
│   │       ├── projects/
│   │       │   └── [projectSlug]/
│   │       ├── users/
│   │       │   └── [username]/
│   │       ├── settings/
│   │       ├── now/
│   │       ├── privacy-policy/
│   │       ├── terms-of-use/
│   │       ├── feed.xml              # RSS feed
│   │       ├── sitemap.xml
│   │       └── sitemap-static.xml
│   │
│   ├── (api)/
│   │   └── api/
│   │       ├── auth/                 # login, register, refresh, OTP, reset-password, CSRF, SSO callback
│   │       ├── posts/[postId]/       # CRUD + translations + cover + likes
│   │       ├── categories/           # Blog categories CRUD + translations
│   │       ├── comments/             # Comment moderation
│   │       ├── projects/[projectId]/ # CRUD + translations
│   │       ├── media/                # Upload, sync, from-url
│   │       ├── analytics/            # GEO analytics + geo endpoint
│   │       ├── contact/              # form submissions, info, subscriptions
│   │       ├── newsletter/
│   │       │   └── campaigns/        # Email campaign CRUD + send
│   │       ├── testimonials/         # Testimonial management
│   │       ├── users/[userId]/       # User management
│   │       ├── slots/                # Appointment time slots
│   │       ├── slot-templates/       # Slot template management
│   │       ├── appointments/         # Booking + cancel
│   │       ├── links/[id]/           # Short link CRUD + analytics
│   │       ├── post-series/          # Series + entries management
│   │       ├── notifications/        # List + stream (SSE)
│   │       ├── push/                 # subscribe / send
│   │       ├── ai/                   # generate text, generate image, list models
│   │       ├── search/               # Full-text search
│   │       ├── sections/             # GitHub / GitLab activity sections
│   │       ├── stats/                # Site-wide statistics
│   │       ├── status/               # Health check
│   │       ├── widget/posts          # Embeddable posts widget
│   │       ├── cron/[frequency]      # Cron job trigger (5min/hourly/daily/…)
│   │       └── settings/             # App settings CRUD
│   │
│   ├── (auth)/
│   │   └── auth/
│   │       ├── login/
│   │       ├── register/
│   │       ├── forgot-password/
│   │       ├── callback/             # SSO callback page
│   │       └── logout/
│   │
│   ├── (admin)/
│   │   └── admin/
│   │       ├── posts/[postId]/
│   │       ├── categories/[categoryId]/
│   │       ├── projects/[projectId]/
│   │       ├── comments/
│   │       ├── contacts/
│   │       ├── media/
│   │       ├── testimonials/
│   │       ├── analytics/
│   │       ├── users/[userId]/
│   │       ├── slots/
│   │       ├── appointments/
│   │       ├── subscriptions/
│   │       ├── campaigns/[campaignId]/
│   │       ├── short-links/[id]/
│   │       ├── post-series/[seriesId]/
│   │       └── settings/
│   │
│   ├── (my-links)/
│   │   └── my-links/
│   │
│   └── (short)/
│       └── s/[code]/                 # Short link redirect
│
├── components/
│   ├── admin/                        # Admin UI components
│   ├── auth/                         # Login, register, OTP forms
│   ├── common/                       # Shared/generic components
│   └── frontend/                     # Public-facing components
│
├── services/
│   ├── AuthService/
│   │   ├── index.ts                  # Auth orchestrator
│   │   ├── UserSessionService.ts
│   │   ├── PasswordService.ts
│   │   ├── OTPService.ts
│   │   ├── UserSessionOTPService.ts
│   │   ├── TOTPService.ts
│   │   ├── SocialAccountService.ts
│   │   └── SSOService/               # Google, GitHub, LinkedIn, Apple,
│   │       ├── GoogleService.ts      # Microsoft, Facebook, Twitter,
│   │       ├── GithubService.ts      # LinkedIn, TikTok, WeChat,
│   │       ├── LinkedInService.ts    # Slack, Autodesk
│   │       └── index.ts
│   │
│   ├── PostService/
│   │   ├── index.ts
│   │   ├── SeriesService.ts
│   │   ├── LikeService.ts
│   │   ├── LocalEmbedService.ts      # @xenova/transformers WASM embeddings
│   │   └── PostCoverService.tsx      # AI cover image generation
│   │
│   ├── AIServices/
│   │   ├── AIBaseProvider.ts         # Abstract base
│   │   ├── OpenAIProvider.ts
│   │   ├── AnthropicProvider.ts
│   │   ├── GeminiProvider.ts
│   │   ├── XAIProvider.ts
│   │   ├── DeepSeekProvider.ts
│   │   └── index.ts                  # Provider router
│   │
│   ├── NotificationService/
│   │   ├── MailService.ts            # Nodemailer
│   │   └── SMSService/
│   │       ├── BaseProvider.ts
│   │       ├── TwilloService.ts
│   │       ├── NexmoService.ts
│   │       ├── ClickatellService.ts
│   │       ├── NetGSMService.ts
│   │       └── index.ts              # SMS provider router
│   │
│   ├── StorageService/
│   │   ├── BaseStorageProvider.ts
│   │   ├── AWSService.ts
│   │   ├── CloudflareR2Service.ts
│   │   ├── MinioService.ts
│   │   └── index.ts                  # Storage provider router
│   │
│   ├── CronService/
│   │   ├── index.ts
│   │   └── jobs/
│   │       ├── fiveMin.ts
│   │       ├── hourly.ts
│   │       ├── daily.ts
│   │       ├── weekly.ts
│   │       ├── monthly.ts
│   │       ├── yearly.ts
│   │       ├── publishScheduledPosts.ts
│   │       └── flushClickBuffer.ts
│   │
│   ├── AppointmentService/
│   │   ├── SlotService.ts
│   │   └── SlotTemplateService.ts
│   │
│   ├── UserService/
│   │   ├── index.ts
│   │   └── UserProfileService.ts
│   │
│   ├── IntegrationService/
│   │   ├── GithubService.ts
│   │   └── GitlabService.ts
│   │
│   ├── SocialMediaService/
│   │   └── DiscordService.ts
│   │
│   ├── PushNotificationService/index.ts
│   ├── SubscriptionService.ts
│   ├── GeoAnalyticsService.ts
│   ├── DBGeoService.ts
│   ├── KnowledgeGraphService.ts
│   ├── SitemapService.ts
│   ├── ShortLinkService.ts
│   ├── SettingService.ts
│   ├── OpenAIService.ts
│   ├── UserAgentService.ts
│   ├── CampaignService.ts
│   └── CategoryService.ts
│
├── middlewares/
│   ├── index.ts                      # Centralized exports
│   ├── cors.ts
│   ├── csrf.ts
│   ├── rateLimit.ts
│   ├── security.ts
│   └── types.ts
│
├── libs/
│   ├── axios/                        # Axios instance + interceptors
│   ├── csrf/                         # CSRF token generation
│   ├── i18n/                         # i18next server-side config
│   ├── localize/                     # Locale helpers
│   ├── logger/                       # Winston logger instance
│   ├── openai/                       # OpenAI client singleton
│   ├── prisma/                       # Prisma client singleton
│   ├── rateLimit/                    # Rate limit helpers
│   ├── redis/                        # ioredis singleton
│   ├── s3/                           # S3 client singleton
│   └── zustand/                      # Zustand store definitions
│
├── dtos/                             # Data Transfer Object definitions (Zod)
├── types/                            # Shared TypeScript types
├── helpers/                          # Pure utility functions
├── messages/                         # Service-level error/success message maps
├── dictionaries/                     # i18n JSON files (26 locales)
├── config/
│   └── settings.json
├── prisma/
│   ├── schema.prisma
│   ├── seed.js
│   └── migrations/
├── generated/
│   └── prisma/                       # Generated Prisma Client output
├── scripts/                          # CLI scripts (user create, translations, etc.)
├── tests/                            # Jest test files
├── views/                            # Server-rendered view helpers
├── public/
│   ├── robots.txt
│   ├── manifest.webmanifest
│   ├── llm.txt
│   ├── sw.js
│   └── assets/
├── logs/
├── ARCHITECTURE.md                   # ← This file
├── next.config.mjs
├── tailwind.config.ts
├── tsconfig.json
├── jest.config.ts
├── jest.setup.ts
├── prisma.config.ts
├── global.d.ts
└── package.json
```

---

## 4. Data Models

All models are defined in [prisma/schema.prisma](prisma/schema.prisma) and use PostgreSQL.

| Model | Description |
|-------|-------------|
| `User` | Core user entity. Roles: `USER`, `AUTHOR`, `ADMIN`. Statuses: `ACTIVE`, `INACTIVE`, `BANNED`. Stores profile, preferences, security config as JSON. |
| `UserSession` | JWT access/refresh token pair. Tracks IP, OS, browser, device, city, country. OTP verification state included. |
| `UserSocialAccount` | SSO provider account linked to a User. Stores provider, providerId, tokens, scopes. |
| `VerificationToken` | Generic token for email/phone verification flows. |
| `Post` | Blog posts. Status: `PUBLISHED` / `DRAFT`. Supports multilingual translations, series membership, likes, comments. |
| `PostTranslation` | i18n content for a Post (title, content, description, slug per lang). |
| `PostSeries` | Ordered collection of related posts. |
| `PostSeriesEntry` | M2M join between a Post and a PostSeries with an order field. |
| `Category` | Blog category with multilingual translations. |
| `CategoryTranslation` | i18n fields for a Category. |
| `Comment` | Threaded blog comments. Statuses: `NOT_PUBLISHED`, `PUBLISHED`, `SPAM`. Supports anonymous (name + email). |
| `Like` | Post likes by registered users or anonymous (IP + device fingerprint). |
| `Project` | Portfolio projects with multilingual translations, platform/technology tags. |
| `ProjectTranslation` | i18n fields for a Project. |
| `Appointment` | Scheduled meeting. Statuses: `PENDING`, `BOOKED`, `CANCELLED`, `COMPLETED`. |
| `Setting` | Key-value application settings with group and type metadata. |
| `Campaign` | Newsletter email campaign. Statuses: `DRAFT`, `SENDING`, `SENT`. |
| `Subscription` | Email subscription list with unsubscribe token. |
| `ContactForm` | Contact form submissions (name, email, phone, message). |
| `Testimonial` | User testimonials / reviews. |
| `Media` | File metadata — S3 key, public URL, folder, mimeType, size, altText. |
| `PushSubscription` | Web Push subscription endpoint + keys per user. |
| `GeoAnalytics` | Aggregated visit counts by country + city. |
| `ShortLink` | URL shortener code → original URL mapping with click counter. |
| `ShortLinkClick` | Per-click analytics: referrer, IP, country, city, OS, browser, device. |

---

## 5. Authentication Architecture

```
Login Request
  │
  ├── Email + Password
  │     └── PasswordService.verify() → bcrypt compare
  │
  └── SSO Provider (Google, GitHub, LinkedIn, Apple, Microsoft,
  │                  Facebook, Twitter, TikTok, WeChat, Slack, Autodesk)
  │     └── SSOService.handleCallback() → upsert UserSocialAccount
  │
  ▼
AuthService.createSession()
  ├── accessToken  = JWT (short-lived)
  ├── refreshToken = JWT (long-lived)
  └── stores UserSession in DB (IP, device, OTP state)

  ┌─────────────────────────────────────────────────┐
  │                  MFA / OTP Layer                 │
  │                                                  │
  │  OTPMethod enum:                                 │
  │    EMAIL   → MailService one-time code           │
  │    SMS     → SMSService one-time code            │
  │    TOTP_APP→ otplib TOTP (Authenticator apps)    │
  │    PUSH_APP→ PushNotificationService OTP         │
  │                                                  │
  │  Session.otpVerifyNeeded = true                  │
  │    → POST /api/auth/otp/send                     │
  │    → POST /api/auth/otp/verify                   │
  │    → Session.otpVerifiedAt = now()               │
  └─────────────────────────────────────────────────┘

Token Refresh:
  POST /api/auth/refresh
    → validate refreshToken in DB
    → issue new accessToken + refreshToken pair
    → invalidate old session row

Password Reset:
  POST /api/auth/reset-password
    → VerificationToken lookup → PasswordService.hash() → update User
```

---

## 6. Internationalization (i18n)

```
URL structure: /{lang}/page
  langs: en, tr, ar, az, de, el, es, et, fi, fr, he, it, ja,
         kk, ky, kz, mt, nl, ru, th, tk, tt, tw, uk, uz, zh

dictionaries/{lang}.json         ← static UI strings
  │
  ├── libs/i18n/     ← server-side getDictionary(lang)
  └── libs/localize/ ← locale detection + redirect helper

Content translations (DB):
  PostTranslation        (title, content, description, slug per lang)
  CategoryTranslation    (title, description, slug per lang)
  ProjectTranslation     (title, description, slug, content per lang)

API scripts:
  scripts/translate-and-add-missing-keys.ts  ← AI-powered translation fill
  scripts/check-missing-dictionary-keys.ts   ← diff checker
  scripts/translate-metadata-to-all-langs.ts ← metadata translation
```

---

## 7. Service Layer Patterns

### 7.1 AI Provider

```
AIServices/index.ts  →  getAIProvider(model: string): AIBaseProvider
  │
  ├── OpenAIProvider     (gpt-4o, gpt-4, etc.)
  ├── AnthropicProvider  (claude-*)
  ├── GeminiProvider     (gemini-*)
  ├── XAIProvider        (grok-*)
  └── DeepSeekProvider   (deepseek-*)

API routes:
  POST /api/ai/generate  → text generation
  POST /api/ai/image     → image generation (OpenAI DALL-E)
  GET  /api/ai/models    → list available models
```

### 7.2 Storage Provider

```
StorageService/index.ts  →  getStorageProvider(): BaseStorageProvider
  │
  ├── AWSService          (AWS S3)
  ├── CloudflareR2Service (S3-compatible)
  └── MinioService        (self-hosted S3-compatible)

Operations: upload, delete, getSignedUrl, listObjects, syncFromUrl
```

### 7.3 SMS Provider

```
SMSService/index.ts  →  getSMSProvider(): BaseProvider
  │
  ├── TwilloService
  ├── NexmoService
  ├── ClickatellService
  └── NetGSMService
```

### 7.4 Cron Jobs

```
POST /api/cron/[frequency]  ← triggered by external cron scheduler (Vercel Cron)

Frequencies:
  5min   → flushClickBuffer (ShortLink click analytics)
  hourly → hourly.ts
  daily  → daily.ts  + publishScheduledPosts
  weekly → weekly.ts
  monthly→ monthly.ts
  yearly → yearly.ts
```

---

## 8. Middleware Stack

Applied in Next.js middleware ([middlewares/index.ts](middlewares/index.ts)):

| Middleware | Purpose |
|-----------|---------|
| `corsMiddleware` | Origin whitelist, preflight `OPTIONS` response |
| `csrfMiddleware` | Double-submit token pattern; exempt routes configurable |
| `rateLimitMiddleware` | Redis `INCR` + `EXPIRE` per IP; per-route configs |
| `addSecurityHeaders` | `X-Frame-Options`, `X-Content-Type-Options`, `Strict-Transport-Security`, `Content-Security-Policy`, `Referrer-Policy` |

Exempt route lists are maintained in `rateLimit.ts` and `csrf.ts` for public endpoints (SSO callbacks, webhook handlers, etc.).

---

## 9. Redis Usage Patterns

```
Redis singleton: libs/redis/
  ├── Rate limiting:   INCR {ip}:{route}  + EXPIRE
  ├── Session cache:   GET/SET session:{token}
  ├── BullMQ broker:   Queue + Worker for background jobs
  └── Short-link buffer: click event batching before DB flush
```

BullMQ queues (via `bullmq` package):
- Background email delivery
- Scheduled post publishing
- Heavy AI generation tasks offloaded from API response cycle

---

## 10. Real-Time Notifications

```
GET /api/notifications/stream
  └── Server-Sent Events (SSE) endpoint
        │
        └── pushes notification events to connected clients

Client: EventSource('/api/notifications/stream')
  └── updates Zustand notification store in real time
```

---

## 11. Short Link Analytics

```
User visits /s/[code]
  │
  ▼
(short)/s/[code]/page.tsx
  ├── ShortLinkService.resolve(code) → originalUrl
  ├── buffered click event  → Redis queue
  │     └── CronService fiveMin → flushClickBuffer → DB batch insert
  └── redirect(originalUrl)

ShortLinkClick stores:
  clickedAt, referrer, ip, country, city, os, browser, device

Admin view: /admin/short-links/[id]/analytics
API:        GET /api/links/[id]/analytics
```

---

## 12. Local Embedding (Semantic Search)

```
PostService/LocalEmbedService.ts
  └── @xenova/transformers (WASM, runs in Node.js)
        └── generates vector embeddings for posts
              └── used for KnowledgeGraphService + similar-post recommendations

KnowledgeGraphService.ts → builds a graph of related content
helpers/Cosine.ts        → cosine similarity calculation
```

---

## 13. API Route Table

### Auth

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/login` | Email + password login |
| POST | `/api/auth/register` | New user registration |
| POST | `/api/auth/logout` | Session invalidation |
| POST | `/api/auth/refresh` | Token refresh |
| POST | `/api/auth/reset-password` | Password reset via token |
| GET  | `/api/auth/csrf` | CSRF token fetch |
| POST | `/api/auth/otp/send` | Send OTP (email/SMS/push) |
| POST | `/api/auth/otp/verify` | Verify OTP |
| GET  | `/api/auth/callback` | SSO callback handler |

### Content

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET/POST | `/api/posts` | List / create posts |
| GET/PUT/DELETE | `/api/posts/[postId]` | Get / update / delete post |
| PUT | `/api/posts/[postId]/translations/[lang]` | Upsert translation |
| GET | `/api/posts/[postId]/cover.jpeg` | AI-generated cover image |
| POST/DELETE | `/api/posts/[postId]/like` | Like / unlike |
| GET | `/api/posts/[postId]/like/count` | Like count |
| GET/POST | `/api/categories` | List / create categories |
| GET/POST | `/api/projects` | List / create projects |
| GET/POST | `/api/comments` | List / create comments |
| GET/PATCH/DELETE | `/api/comments/[commentId]` | Manage comment |
| GET/POST | `/api/post-series` | Series management |
| POST/DELETE | `/api/post-series/[seriesId]/entries/[postId]` | Add / remove post from series |

### Media & Storage

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET/POST | `/api/media` | List / upload files |
| POST | `/api/media/from-url` | Import media from URL |
| POST | `/api/media/sync` | Sync media metadata |
| GET/DELETE | `/api/media/[mediaId]` | Get / delete file |

### Analytics & GEO

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/analytics` | Record page visit |
| GET | `/api/analytics/geo` | GEO analytics data |
| GET | `/api/stats` | Aggregate site statistics |

### Appointments

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/slots/[date]` | Available slots for a date |
| GET/POST | `/api/slot-templates/[day]` | Slot templates per weekday |
| POST | `/api/slot-templates/[day]/apply` | Apply template to date range |
| GET | `/api/appointments` | List appointments |
| POST | `/api/appointments/[appointmentId]/book` | Book appointment |
| POST | `/api/appointments/[appointmentId]/cancel` | Cancel appointment |

### Misc

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET/POST | `/api/links` | Short link CRUD |
| GET | `/api/links/[id]/analytics` | Short link analytics |
| GET/POST | `/api/alerts` (contact) | Contact form |
| GET/POST | `/api/contact/subscription` | Newsletter subscribe |
| POST | `/api/newsletter/campaigns/[id]/send` | Send email campaign |
| POST | `/api/ai/generate` | AI text generation |
| POST | `/api/ai/image` | AI image generation |
| GET | `/api/search` | Full-text search |
| GET | `/api/status` | Health check |
| GET | `/api/widget/posts` | Embeddable posts widget |
| GET | `/api/notifications/stream` | SSE notification stream |
| POST | `/api/push/subscribe` | Web Push subscription |
| POST | `/api/cron/[frequency]` | Cron job endpoint |
| GET/POST | `/api/settings` | Application settings |

---

## 14. Security Layer

### CSRF

Double-submit cookie pattern:
- `GET /api/auth/csrf` → generates token, sets `HttpOnly` cookie
- All state-mutating requests must include `X-CSRF-Token` header
- Safe methods (`GET`, `HEAD`, `OPTIONS`) and configured exempt routes skip validation

### Rate Limiting

- Backed by Redis `INCR` + `EXPIRE`
- Per-route configurations in `middlewares/rateLimit.ts`
- Returns `429 Too Many Requests` with `Retry-After` header support

### Security Headers (all responses)

```
X-Frame-Options: DENY
X-Content-Type-Options: nosniff
Strict-Transport-Security: max-age=31536000; includeSubDomains
Referrer-Policy: strict-origin-when-cross-origin
Content-Security-Policy: (configured per environment)
```

---

## 15. Logging

```
libs/logger/ → Winston instance

Transports:
  Console   → colorized in development
  File      → logs/ directory (production)

Log levels: error > warn > info > http > verbose > debug
  Production default: info
  Development default: debug

Usage pattern: import logger from '@/libs/logger'
  logger.info('[AuthService] Session created', { userId, ip })
  logger.error('[PostService] Failed to publish', { postId, error })
```

---

## 16. Testing

```
Jest + ts-jest  (jest.config.ts)
jest.setup.ts   → global test setup

Test locations: tests/

Patterns:
  - Services tested in isolation with mocked Prisma client
  - API routes tested with mocked service layer
  - Helpers and utility functions covered with unit tests

Run commands:
  npm test              → run all tests
  npm run test:watch    → watch mode
  npm run test:coverage → coverage report
```

---

## 17. Build & Deployment

```
npm run dev    → next dev (development server)
npm run build  → next build (production build)
npm run start  → next start (production server)

npm run vercel-build:
  1. prisma generate
  2. prisma migrate deploy
  3. next build

Pre-build hook (prebuild):
  tsx scripts/translate-and-add-missing-keys.ts all
  → ensures all dictionary keys are translated before build

Bundle analyzer:
  ANALYZE=true npm run build  → @next/bundle-analyzer report
```

*Last updated: March 2026*
