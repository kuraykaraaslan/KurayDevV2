# KurayDev V2 — Development Plan & Role Map

> Date: March 2026  
> Stack: **Next.js 16 · React 19 · TypeScript 5.9 (strict) · Zod · Zustand · PostgreSQL · Prisma · Redis · BullMQ**

---

## 1. Project Scope

| # | Feature Area | Description |
|---|-------------|-------------|
| 1 | **Blog** | Multi-language posts (26 locales), categories, series, comments, likes, scheduled publishing |
| 2 | **Projects Portfolio** | Project showcase with multi-language support, platform & technology tags |
| 3 | **Authentication** | JWT sessions, 11 SSO providers, MFA (Email/SMS/TOTP/Push OTP), password reset |
| 4 | **Admin Panel** | Full CRUD for all content; analytics dashboard; user, media, campaign management |
| 5 | **Appointments** | Slot-based scheduling, slot templates, booking/cancel flow, meeting link support |
| 6 | **Newsletter** | Subscription management, email campaigns (Draft → Sending → Sent) |
| 7 | **Short Links** | URL shortener with per-click analytics (GEO, browser, OS, device, referrer) |
| 8 | **AI Integration** | Multi-provider text/image generation (OpenAI, Anthropic, Gemini, xAI, DeepSeek) |
| 9 | **Media Library** | S3/R2/MinIO-backed file management with metadata, alt text, folder organization |
| 10 | **GEO Analytics** | Country/city-level visit aggregation with world map visualization |
| 11 | **Push Notifications** | Web Push subscriptions + SSE real-time stream for in-app notifications |
| 12 | **Knowledge Graph** | Local WASM embeddings (@xenova/transformers) for semantic post relationships |
| 13 | **i18n** | 26-locale dictionary system + DB-level content translations + AI-assisted auto-fill |
| 14 | **Sitemap & SEO** | Dynamic sitemap generation, RSS feed, hreflang helper, OpenGraph metadata |

---

## 2. Layer Architecture

```
┌──────────────────────────────────────────────────────────────────────┐
│                         NEXT.JS EDGE MIDDLEWARE                       │
│                                                                        │
│  corsMiddleware → csrfMiddleware → rateLimitMiddleware (Redis)         │
│  → addSecurityHeaders                                                  │
└───────────────────────────────────┬──────────────────────────────────┘
                                    │
┌───────────────────────────────────▼──────────────────────────────────┐
│                        NEXT.JS APP ROUTER                             │
│                                                                        │
│  (frontend)/[lang]/...   ← Server Components (RSC) — public pages    │
│  (api)/api/...           ← Route Handlers — REST API                  │
│  (auth)/auth/...         ← Auth pages (login, register, SSO)         │
│  (admin)/admin/...       ← Protected admin dashboard                  │
│  (my-links)/my-links     ← Short link management                     │
│  (short)/s/[code]        ← Short link redirect                       │
└───────────────────────────────────┬──────────────────────────────────┘
                                    │ imports services
┌───────────────────────────────────▼──────────────────────────────────┐
│                          SERVICE LAYER (services/)                    │
│                                                                        │
│  AuthService · PostService · UserService · CampaignService            │
│  NotificationService · StorageService · AIServices · CronService      │
│  AppointmentService · GeoAnalyticsService · KnowledgeGraphService     │
│  ShortLinkService · SubscriptionService · SitemapService              │
│  SettingService · IntegrationService (GitHub/GitLab) · PushService    │
└──────┬────────────────────────┬──────────────────────────────────────┘
       │                        │
┌──────▼──────┐    ┌────────────▼──────────────────────────────────────┐
│  PostgreSQL  │    │  Redis (ioredis)                                   │
│  (Prisma v7) │    │  ├── Rate limiting (INCR + EXPIRE per IP/route)   │
│              │    │  ├── Session cache                                 │
│              │    │  ├── BullMQ queues (email, AI, publishing, clicks) │
│              │    │  └── Short-link click buffer                       │
└─────────────┘    └────────────────────────────────────────────────────┘
                              │
               ┌──────────────▼───────────────┐
               │  Object Storage               │
               │  AWS S3 / Cloudflare R2 / MinIO │
               └──────────────────────────────┘
```

---

## 3. Role Map

### 3.1 Primary Roles

| Role | Owner Layer | File / Module |
|------|------------|---------------|
| **Auth & Sessions** | Service | `services/AuthService/` |
| **Content Management** | Service | `services/PostService/`, `services/CategoryService/` |
| **AI Generation** | Service | `services/AIServices/` |
| **File Storage** | Service | `services/StorageService/` |
| **Email Delivery** | Service | `services/NotificationService/MailService.ts` |
| **SMS Delivery** | Service | `services/NotificationService/SMSService/` |
| **Background Jobs** | Service | `services/CronService/` + BullMQ |
| **GEO Analytics** | Service | `services/GeoAnalyticsService.ts` |
| **Semantic Search** | Service | `services/PostService/LocalEmbedService.ts` |
| **Appointment Booking** | Service | `services/AppointmentService/` |
| **Short Links** | Service | `services/ShortLinkService.ts` |
| **Settings** | Service | `services/SettingService.ts` |
| **Client State** | Renderer | `libs/zustand/index.ts` |
| **i18n** | Shared | `libs/i18n/`, `libs/localize/`, `dictionaries/` |
| **Infrastructure** | Libs | `libs/prisma/`, `libs/redis/`, `libs/s3/`, `libs/logger/` |

### 3.2 Service Role Details

```
AuthService/
├── index.ts                 → Auth orchestrator (login, register, logout)
├── UserSessionService.ts    → JWT access/refresh token lifecycle
├── PasswordService.ts       → bcrypt hash/verify (only password-touching module)
├── OTPService.ts            → OTP code generation + validation
├── UserSessionOTPService.ts → Per-session OTP state management
├── TOTPService.ts           → otplib TOTP (Authenticator apps)
├── SocialAccountService.ts  → SSO account linking
└── SSOService/
    ├── GoogleService.ts
    ├── GithubService.ts
    ├── LinkedInService.ts
    ├── AppleService.ts
    ├── MicrosoftService.ts
    ├── FacebookService.ts
    ├── TwitterService.ts
    ├── TiktokService.ts
    ├── WeChatService.ts
    ├── SlackService.ts
    └── AutodeskService.ts

AIServices/
├── AIBaseProvider.ts        → Abstract provider interface
├── OpenAIProvider.ts        → GPT-4o, DALL-E
├── AnthropicProvider.ts     → Claude family
├── GeminiProvider.ts        → Gemini family
├── XAIProvider.ts           → Grok family
├── DeepSeekProvider.ts      → DeepSeek family
└── index.ts                 → Provider router (resolves by AIMProviderType)

StorageService/
├── BaseStorageProvider.ts   → Abstract file operations
├── AWSService.ts            → AWS S3
├── CloudflareR2Service.ts   → Cloudflare R2 (S3-compatible)
├── MinioService.ts          → Self-hosted MinIO
└── index.ts                 → Provider router

CronService/
├── index.ts                 → Job registrar
└── jobs/
    ├── fiveMin.ts           → flushClickBuffer (ShortLink batch DB write)
    ├── hourly.ts
    ├── daily.ts             → cleanup, analytics aggregation
    ├── weekly.ts
    ├── monthly.ts
    ├── yearly.ts
    └── publishScheduledPosts.ts → promote SCHEDULED → PUBLISHED
```

---

## 4. TypeScript Type Map

All types live in `types/` (domain shapes) and `dtos/` (Zod schemas + inferred types).
The co-location rule: every DTO file exports **both** the Zod schema and the inferred type.

### 4.1 User Domain (`types/user/`)

```typescript
// types/user/UserTypes.ts

export const UserRoleEnum    = z.enum(['ADMIN', 'AUTHOR', 'USER'])
export const UserStatusEnum  = z.enum(['ACTIVE', 'INACTIVE', 'BANNED'])
export const ThemeEnum       = z.enum(['LIGHT', 'DARK', 'SYSTEM'])

export const UserPreferencesSchema = z.object({
  theme:               ThemeEnum.default('SYSTEM'),
  language:            AppLanguageEnum.default('en'),
  emailNotifications:  z.boolean().default(true),
  smsNotifications:    z.boolean().default(false),
  pushNotifications:   z.boolean().default(true),
  newsletter:          z.boolean().default(true),
  timezone:            z.string().default('UTC'),
  dateFormat:          z.enum(['DD/MM/YYYY', 'MM/DD/YYYY']).default('DD/MM/YYYY'),
  timeFormat:          z.enum(['24H', '12H']).default('24H'),
  firstDayOfWeek:      z.enum(['MON', 'SUN']).default('MON'),
})
export type UserPreferences = z.infer<typeof UserPreferencesSchema>

export const UserSchema = z.object({
  userId:          z.string().cuid(),
  email:           z.string().email(),
  phone:           z.string().optional(),
  userRole:        UserRoleEnum.default('USER'),
  userStatus:      UserStatusEnum.default('ACTIVE'),
  userPreferences: UserPreferencesSchema.optional(),
  userProfile:     UserProfileSchema.optional(),
  userSecurity:    UserSecuritySchema.optional(),
  createdAt:       z.date().optional(),
  updatedAt:       z.date().optional(),
  deletedAt:       z.date().optional(),
})
export type User    = z.infer<typeof UserSchema>
export type SafeUser = Omit<User, 'password'>
```

### 4.2 Content Domain (`types/content/`)

```typescript
// types/content/BlogTypes.ts

export const PostStatusEnum = z.enum(['PUBLISHED', 'DRAFT', 'ARCHIVED', 'SCHEDULED'])
export type  PostStatus     = z.infer<typeof PostStatusEnum>

export const CommentStatusEnum = z.enum(['NOT_PUBLISHED', 'PUBLISHED', 'SPAM'])
export type  CommentStatus     = z.infer<typeof CommentStatusEnum>

export const PostSchema = z.object({
  postId:      z.string().cuid(),
  title:       z.string(),
  content:     z.string(),
  description: z.string().optional(),
  slug:        z.string(),
  keywords:    z.array(z.string()),
  status:      PostStatusEnum.default('PUBLISHED'),
  views:       z.number().int().nonnegative(),
  image:       z.string().url().optional(),
  publishedAt: z.date().optional(),
  createdAt:   z.date(),
  // Relations
  author:      SafeUserSchema,
  category:    CategorySchema,
  translations: z.array(PostTranslationSchema),
  seriesEntry:  PostSeriesRefSchema.optional(),
})
export type Post = z.infer<typeof PostSchema>

export const PostTranslationSchema = z.object({
  id:          z.string().cuid(),
  postId:      z.string().cuid(),
  lang:        AppLanguageEnum,
  title:       z.string(),
  content:     z.string(),
  description: z.string().optional(),
  slug:        z.string(),
})
export type PostTranslation = z.infer<typeof PostTranslationSchema>
```

### 4.3 AI Domain (`types/features/AITypes.ts`)

```typescript
export const AIMProvider = z.enum([
  'OPENAI', 'AZURE_OPENAI', 'GOOGLE_GENAI',
  'ANTHROPIC', 'DEEPSEEK', 'XAI', 'CUSTOM'
])
export type AIMProviderType = z.infer<typeof AIMProvider>

export const AIMmodelOption = z.object({
  id:        z.string().optional(),      // "{provider}:{modelName}" serialized
  provider:  AIMProvider,
  modelName: z.string(),
  label:     z.string().optional(),
})
export type AIMmodelOption = z.infer<typeof AIMmodelOption>

// Serialization helpers
export const serializeAIModel   = (p: AIMProviderType, m: string): string => `${p}:${m}`
export const deserializeAIModel = (id: string): AIMmodelOption | null => { /* … */ }
```

### 4.4 Notification Domain (`types/common/NotificationTypes.ts`)

```typescript
export const NotificationSchema = z.object({
  notificationId: z.string(),
  title:          z.string(),
  message:        z.string(),
  isRead:         z.boolean(),
  createdAt:      z.string(),
  path:           z.string().optional(),
})
export type Notification = z.infer<typeof NotificationSchema>

export const NotificationsResponseSchema = z.object({
  notifications: z.array(NotificationSchema),
  unreadCount:   z.number().int().nonnegative(),
})
```

### 4.5 i18n Domain (`types/common/I18nTypes.ts`)

```typescript
export const AppLanguageEnum = z.enum([
  'en', 'tr', 'ar', 'az', 'de', 'el', 'es', 'et', 'fi', 'fr',
  'he', 'it', 'ja', 'kk', 'ky', 'kz', 'mt', 'nl', 'ru', 'th',
  'tk', 'tt', 'tw', 'uk', 'uz', 'zh'
])
export type AppLanguage = z.infer<typeof AppLanguageEnum>
```

### 4.6 Stats Domain (`types/common/StatTypes.ts`)

```typescript
export interface SiteStats {
  readonly totalPosts:      number
  readonly totalProjects:   number
  readonly totalUsers:      number
  readonly totalComments:   number
  readonly totalViews:      number
  readonly totalLikes:      number
  readonly totalShortLinks: number
  readonly totalClicks:     number
}
```

---

## 5. Data Flow

### 5.1 Content Read Flow (Public Blog)

```
Browser
  │ GET /en/blog/category/post-slug
  ▼
Next.js RSC (Server Component)
  │ getDictionary('en')           → i18n strings
  │ PostService.getBySlug(slug)   → DB query (Prisma, select only needed fields)
  ▼
Page component renders HTML
  │ <PostContent /> — TinyMCE HTML sanitized with DOMPurify
  │ <CommentSection /> — "use client", Zustand + fetch
  └─ SEO: MetadataHelper.generate() → OpenGraph, hreflang, canonical
```

### 5.2 Auth Flow (Email + OTP)

```
POST /api/auth/login
  │ csrfMiddleware.check()
  │ rateLimitMiddleware (5 req/min)
  │ z.safeParse(loginSchema)
  ▼
AuthService.login(email, password)
  ├── PasswordService.verify(plain, hash)  → bcrypt.compare
  ├── UserSessionService.create(userId, ua) → INSERT UserSession
  │     ├── accessToken  = jwt.sign({ userId, role }, secret, { expiresIn: '15m' })
  │     └── refreshToken = jwt.sign({ sessionId },    secret, { expiresIn: '30d' })
  │
  └── if otpEnabled:
        OTPService.send(method, contact)  → MailService | SMSService | PushService
        → session.otpVerifyNeeded = true
        → POST /api/auth/otp/verify required before access
```

### 5.3 AI Content Generation Flow

```
POST /api/ai/generate
  │ auth check (ADMIN | AUTHOR role)
  │ rateLimitMiddleware (10 req/min)
  │ z.safeParse(generateSchema)
  ▼
AIServices.getProvider(model)           → resolves AIMProviderType
  ├── OpenAIProvider.generate(prompt)
  ├── AnthropicProvider.generate(prompt)
  ├── GeminiProvider.generate(prompt)
  ├── DeepSeekProvider.generate(prompt)
  └── XAIProvider.generate(prompt)
  ▼
Response streamed or returned as JSON
```

### 5.4 Short Link Click Flow

```
GET /s/[code]
  ▼
ShortLinkService.resolve(code)   → Prisma: SELECT ShortLink WHERE code = ?
  │
  ├── Redis LPUSH clicks:{code} {clickEvent JSON}   ← buffered, not written to DB immediately
  │
  └── redirect(originalUrl)

CronService (every 5 min) → flushClickBuffer
  ├── Redis LRANGE + DEL clicks:{code}
  └── Prisma: createMany(ShortLinkClick[])          ← batch DB insert
```

### 5.5 Real-Time Notification Flow

```
Server-side event (new comment, new contact, system alert)
  │
  └── NotificationService.create(userId, { title, message, path })
        │ INSERT Notification row
        │
        └── SSE broadcast → GET /api/notifications/stream
              │ EventSource in client "use client" component
              ▼
           Zustand notification store update
              │
              └── UI badge count + toast
```

---

## 6. Background Job Architecture (BullMQ)

```
Redis Broker
    │
    ├── Queue: "emails"
    │     Workers: MailService.send()
    │     Jobs: newsletter campaign send, OTP email, welcome email
    │
    ├── Queue: "publishing"
    │     Workers: PostService.publish()
    │     Jobs: publishScheduledPosts (cron daily)
    │
    ├── Queue: "ai-generation"
    │     Workers: AIServices.generate()
    │     Jobs: post cover generation, bulk translation
    │
    └── Queue: "analytics"
          Workers: ShortLinkService.flushClicks()
          Jobs: flushClickBuffer (cron 5min)

All workers:
  - handle 'failed' event → Winston logger.error('[Queue] job failed', { jobId, queue, error })
  - retry: 3 attempts, exponential backoff
```

---

## 7. Development Phases

### Phase 1 — Foundation (Done)
- [x] Next.js App Router scaffold with TypeScript strict mode
- [x] Prisma schema: User, Post, Category, Project, Comment, Testimonial, Setting
- [x] AuthService: JWT sessions, PasswordService, UserSessionService
- [x] SSO: Google, GitHub, LinkedIn, Apple, Microsoft
- [x] Middleware stack: CORS, CSRF, rate limiting, security headers
- [x] Blog: posts, categories, comments, likes
- [x] i18n: 26-locale dictionary + URL routing
- [x] Admin panel: basic CRUD for posts, categories, projects, comments
- [x] Media library: S3/R2/MinIO upload, metadata
- [x] Zustand global store: user, theme
- [x] Winston logger, Redis singleton, Prisma singleton

### Phase 2 — Content & Engagement (Done)
- [x] Post series (ordered multi-part posts)
- [x] Post translations (26 locales, DB-level)
- [x] Category translations
- [x] Project portfolio + project translations
- [x] Testimonials management
- [x] Newsletter: subscriptions + email campaigns
- [x] Contact form + contact info management
- [x] GEO analytics with world map visualization
- [x] Short links + per-click analytics

### Phase 3 — Auth Maturity (Done)
- [x] Additional SSO providers: Facebook, Twitter, TikTok, WeChat, Slack, Autodesk
- [x] MFA: Email OTP, SMS OTP, TOTP (Authenticator), Push OTP
- [x] OTP per-session state tracking
- [x] TOTPService (otplib)
- [x] Device fingerprinting in UserSession
- [x] Password reset flow with VerificationToken

### Phase 4 — AI & Intelligence (Done)
- [x] Multi-provider AI: OpenAI, Anthropic, Gemini, xAI, DeepSeek
- [x] AI text generation endpoint
- [x] AI image generation (DALL-E)
- [x] AI-assisted translation script (translate-and-add-missing-keys)
- [x] Local WASM embeddings: @xenova/transformers → LocalEmbedService
- [x] KnowledgeGraphService (cosine similarity, related posts)
- [x] AI post cover image generation (PostCoverService)
- [x] helpers/Cosine.ts for vector math

### Phase 5 — Scheduling & Notifications (Done)
- [x] Appointment scheduling: Slot, SlotTemplate, Appointment models
- [x] SlotService, SlotTemplateService, AppointmentService
- [x] Slot template apply to date range
- [x] Web Push subscriptions + PushNotificationService
- [x] SSE notification stream (/api/notifications/stream)
- [x] BullMQ job queues wired to CronService
- [x] Scheduled post publishing (SCHEDULED status)

### Phase 6 — Integrations & SEO (Done)
- [x] GitHub integration (section data: repos, activity)
- [x] GitLab integration
- [x] SitemapService + dynamic sitemap.xml per locale
- [x] RSS feed (feed.xml)
- [x] MetadataHelper: OpenGraph, Twitter Card, hreflang
- [x] HreflangHelper: alternate URLs for all 26 locales
- [x] SpamProtection helper (contact form)
- [x] UserAgentService (OS, browser, device fingerprint parsing)
- [x] Discord webhook integration (SocialMediaService)

### Phase 7 — Advanced Admin (In Progress)
- [ ] Admin analytics dashboard: traffic trends, top posts, GEO map
- [ ] Post bulk operations (bulk publish, bulk delete, bulk translate)
- [ ] Media library UX: drag-and-drop reorder, bulk delete, folder management
- [ ] Advanced comment moderation: spam filter integration, bulk action
- [ ] Appointment calendar view (week/month) in admin
- [ ] Campaign preview + A/B subject line test
- [ ] Short link bulk import/export (CSV)
- [ ] Settings UI: all Setting table keys exposed as typed form fields
- [ ] Audit log: record admin actions to a log table

### Phase 8 — Performance & Observability
- [ ] Next.js `use cache` / `unstable_cache` adoption for expensive RSC data
- [ ] Prisma query profiling: identify N+1 queries, add missing indexes
- [ ] Redis response caching for heavy public endpoints (homepage, top posts)
- [ ] Bundle audit: `ANALYZE=true npm run build` — eliminate unnecessary client-side dependencies
- [ ] Winston structured logging: request ID tracing across services
- [ ] Health dashboard: `/api/status` extended with DB ping, Redis ping, storage ping
- [ ] Web Vitals tracking (web-vitals package → analytics endpoint)
- [ ] Lighthouse CI integration in GitHub Actions

### Phase 9 — Mobile & PWA
- [ ] Service worker enhancement (sw.js): offline post reading, background sync
- [ ] Web App Manifest improvements: shortcuts, screenshots
- [ ] Push notification rich payloads: action buttons, image
- [ ] Responsive audit: all admin pages on tablet viewport
- [ ] `react-calendar` appointment picker: mobile-optimized touch targets
- [ ] Adaptive image loading: AVIF/WebP with `next/image` priority hints

### Phase 10 — Security Hardening
- [ ] Rate limit per-user in addition to per-IP (authenticated endpoints)
- [ ] Suspicious login detection: new device → notify user via email
- [ ] Session revocation UI: "log out all devices" per user in settings
- [ ] CAPTCHA integration (Google reCAPTCHA v3) on contact form + registration
- [ ] Password strength policy enforced at registration + change
- [ ] Content Security Policy (CSP) nonce-based for inline scripts
- [ ] Dependency audit script: `npm audit` in CI, fail on high severity

### Phase 11 — Internationalization Completeness
- [ ] Check missing dictionary keys script in CI (block PR if keys missing in any locale)
- [ ] Admin interface translations (admin panel currently English-only)
- [ ] Locale-aware date/time formatting across all UI components
- [ ] RTL layout support for Arabic (`ar`) and Hebrew (`he`) locales
- [ ] Locale-specific number formatting (currency, percentages)
- [ ] Translate existing DB content (post descriptions, project descriptions) for all locales

### Phase 12 — Developer Experience & Testing
- [ ] Increase Jest coverage to > 80% lines for all services
- [ ] Add integration tests for critical auth flows (login, OTP, SSO callback)
- [ ] Storybook setup for UI components (atoms, molecules)
- [ ] E2E tests with Playwright: blog read, contact form, appointment booking, login
- [ ] Pre-commit hooks: `lint-staged` + `tsc --noEmit`
- [ ] GitHub Actions CI: lint → typecheck → test → build on every PR
- [ ] Vercel Preview deployments with seeded test data
- [ ] OpenAPI spec generation from Zod DTO schemas

---

## 8. Technical Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Rendering strategy | RSC-first, `"use client"` only when needed | Minimizes JS bundle sent to browser |
| State management | Zustand | Lightweight; no boilerplate; persistent middleware built-in |
| ORM | Prisma v7 | Type-safe queries, migration history, accelerate adapter |
| Background jobs | BullMQ | Redis-native, reliable queue patterns, retry/backoff built-in |
| AI provider strategy | Multi-provider abstraction | Avoid vendor lock-in; model switching per feature |
| Embeddings | @xenova/transformers WASM | Runs server-side in Node.js; no external API cost; privacy |
| Storage abstraction | BaseStorageProvider | S3 / R2 / MinIO switchable via config without code changes |
| SMS abstraction | BaseProvider | Multi-provider (Twilio/Nexmo/Clickatell/NetGSM) via config |
| Short-link clicks | Redis buffer + cron flush | Avoids per-click DB write under traffic; batched insert |
| i18n content (DB) | `*Translation` model per entity | Avoids JSON blob anti-pattern; queryable, indexable |
| Session storage | DB (`UserSession` table) | Full revocability; device tracking; OTP state per session |
| CSRF | Double-submit cookie | Stateless; compatible with RSC and API routes |
| Rate limiting | Redis INCR + EXPIRE | Distributed-safe across Vercel serverless instances |

---

## 9. Environment Variables Reference

| Variable | Required | Used By |
|----------|----------|---------|
| `DATABASE_URL` | ✅ | Prisma |
| `REDIS_URL` | ✅ | ioredis, BullMQ, rate limiting |
| `JWT_ACCESS_SECRET` | ✅ | AuthService |
| `JWT_REFRESH_SECRET` | ✅ | AuthService |
| `OPENAI_API_KEY` | ✅ | OpenAIProvider, DALL-E |
| `ANTHROPIC_API_KEY` | optional | AnthropicProvider |
| `GEMINI_API_KEY` | optional | GeminiProvider |
| `XAI_API_KEY` | optional | XAIProvider |
| `DEEPSEEK_API_KEY` | optional | DeepSeekProvider |
| `AWS_ACCESS_KEY_ID` | optional | AWSService |
| `AWS_SECRET_ACCESS_KEY` | optional | AWSService |
| `AWS_REGION` | optional | AWSService |
| `AWS_BUCKET_NAME` | optional | AWSService |
| `R2_ACCOUNT_ID` | optional | CloudflareR2Service |
| `SMTP_HOST` | ✅ | MailService |
| `SMTP_USER` | ✅ | MailService |
| `SMTP_PASS` | ✅ | MailService |
| `TWILIO_ACCOUNT_SID` | optional | TwilloService |
| `TWILIO_AUTH_TOKEN` | optional | TwilloService |
| `GOOGLE_CLIENT_ID` | optional | GoogleService (SSO) |
| `GOOGLE_CLIENT_SECRET` | optional | GoogleService (SSO) |
| `GITHUB_CLIENT_ID` | optional | GithubService (SSO) |
| `GITHUB_CLIENT_SECRET` | optional | GithubService (SSO) |
| `VAPID_PUBLIC_KEY` | ✅ | web-push |
| `VAPID_PRIVATE_KEY` | ✅ | web-push |
| `APPLICATION_HOST` | ✅ | next.config.mjs, metadata |
| `SSO_ALLOWED_PROVIDERS` | optional | SSO route guard |
| `RECAPTCHA_SECRET_KEY` | optional | SpamProtection |

---

## 10. Dependency Rationale

| Package | Why this one |
|---------|-------------|
| `next` | App Router RSC, built-in image optimization, streaming, Turbopack |
| `prisma` | Type-safe ORM with migration history; accelerate adapter for edge |
| `ioredis` | Full-featured Redis client; BullMQ peer dependency |
| `bullmq` | Reliable job queues backed by Redis Streams; retries, priorities |
| `zod` | Schema-first type generation; runtime validation at API boundaries |
| `zustand` | Minimal client state; no boilerplate; persist middleware |
| `@xenova/transformers` | Browser/Node WASM ML inference; no external API for embeddings |
| `bcrypt` | Industry-standard password hashing; constant-time comparison |
| `jsonwebtoken` | JWT sign/verify; battle-tested |
| `nodemailer` | SMTP email; provider-agnostic |
| `web-push` | Web Push Notifications; VAPID support |
| `otplib` | TOTP/HOTP spec-compliant; Authenticator app compatible |
| `tinymce` | Rich text editor; React integration; content sanitization-friendly |
| `isomorphic-dompurify` | XSS sanitization that runs both server-side and client-side |
| `date-fns` + `date-fns-tz` | Immutable date utils; timezone-aware operations |
| `@dnd-kit/core` | Accessible drag-and-drop for media reorder, slot templates |
| `winston` | Structured logging with multiple transports; log level control |
| `@aws-sdk/client-s3` | Official AWS SDK v3; tree-shakeable; S3/R2/MinIO compatible |

---

*Reports source: `/reports/` · Last updated: March 2026*
