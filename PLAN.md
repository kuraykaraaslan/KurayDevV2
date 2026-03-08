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

### Phase 7b — CMS / Blog Sprint (Sıradaki)
- [ ] **Şifre Korumalı Post** — `Post.accessPassword` hash alanı; okuyucu şifre formu → `PostAccessService.verify()` → Redis cookie ile erişim; `PostAccessDTO`
- [ ] **Yorum Zinciri (Threaded Comments)** — `Comment.parentId` alanı; 2 seviye iç içe yanıt; `CommentService.getThreaded(postId)` hiyerarşik çıktı; daha derin cevaplar flatten
- [ ] **Okuma Geçmişi (Reading History)** — `localStorage` tabanlı son okunanlar listesi; scroll ile okuma yüzdesi takibi; profil/sidebar'da "Son okunanlar" bileşeni; sunucu değişikliği gerektirmez
- [ ] **Sosyal Paylaşım Sayacı** — Twitter/X, LinkedIn, WhatsApp paylaşım butonları; `/api/posts/[id]/share` POST endpoint; `Post.shareCount` Redis buffer → Prisma flush
- [ ] **Tam Metin Arama + Facet Filtresi** — `/search` endpoint'ine kategori, yazar, tarih aralığı, dil facet filtresi; PostgreSQL `tsvector` veya embedding skoru ile sıralama; `/[lang]/search` sayfası
- [ ] **Editoryal Skor (Content Score)** — SEO skoru (başlık uzunluğu, meta, alt text, iç link), okunabilirlik ve AI kalite puanı; `ContentScoreService`; admin listesinde skor bazlı filtreleme
- [ ] **Özel Yönlendirme Yöneticisi (Custom Redirects)** — `Redirect` tablosu; admin'den 301/302 kural tanımlama; middleware'de DB lookup; `RedirectService`; `next.config.mjs` statik redirect bağımlılığını ortadan kaldırır

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

### Phase 13 — Chatbot Enhancements
- [x] **Conversation summary / context compression** — `ChatbotRAGService.compressHistory()`: son N mesaj kalır, öncekiler AI ile özetlenir; özet `StoredChatSession.summary` alanında saklanır ve sonraki isteklerde geçmiş yerine kullanılır; uzun sohbetlerdeki token maliyetini düşürür
- [x] **Typing indicator** — `ChatbotWSHandler`'a `handleTyping()` eklendi; admin yazdığında `{ ns: 'chatbot', type: 'typing', role: 'admin' }` eventi yayınlanır; AI akışı başladığında `{ type: 'typing', role: 'assistant' }` gönderilir; `ChatbotWSServerEvent` tipine `typing` olayı eklendi; client bileşenine animasyonlu gösterge eklendi
- [x] **Proactive message (contextual trigger)** — blog post veya proje sayfasında 30+ saniye geçiren kullanıcıya chatbot otomatik açılır; `page_context?: string` alanı `ChatbotWSClientEvent`'e eklendi; RAG sorgusu bu sayfa başlığıyla başlar; `useChatbotStore.openChatbot()` + `IntersectionObserver` / `setTimeout` kombinasyonu ile tetiklenir; `useChatbotProactiveTrigger` hook oluşturuldu
- [x] **Chat session export (admin only)** — `/api/chatbot/admin/[sessionId]/export` GET endpoint'i; `format=json|csv|txt` query param; `ChatSessionService.getMessages()` verisini `Content-Disposition: attachment` header'ıyla döndürür; admin paneli oturum detay sayfasına indirme butonu eklendi
- [x] **Offline message queue** — WS bağlantısı kesildiğinde yazılan mesaj `localStorage`'a `chatbot_pending_msg` olarak kaydedilir; `useChatbotWebSocket`'in `connected` olayında bekleyen mesaj otomatik gönderilir; backend değişikliği gerektirmez

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

### Phase 14 — Roadmap Backlog (Önerilen Özellikler)

> Durum: `[x]` yapıldı · `[ ]` yapılacak · `[~]` sistemde mevcut · `—` henüz karar verilmedi

| # | Özellik | Durum |
|---|---------|-------|
| 1 | **Tag (Etiket) Sistemi** — Post ve projelerde kesişen etiketler; `TagService`, `PostTag`/`ProjectTag` ilişkileri; `/[lang]/tags/[slug]` SEO sayfaları | `[ ]` |
| 2 | **İçerik A/B Testi** — Post başlığı/CTA varyant deneyleri; Redis tabanlı kullanıcı-varyant tayini; `ABTestService` + `ExperimentDTO` | `—` |
| 3 | **İçerik Tazeleme & Audit** — 6+ ay güncellenmemiş post tespiti; `CronService` daily job; `NotificationService` ile yazar bildirimi | `—` |
| 4 | **Kod Snippet Galerisi** — Sözdizimi vurgulu snippet paylaşımı; dil/etiket/kopya sayısı takibi; post'a embed; `SnippetService` | `—` |
| 5 | **Changelog / Release Notes** — Sürüm bazlı değişiklik günlüğü; MAJOR/MINOR/PATCH; RSC zaman çizelgesi sayfası; ayrı RSS feed | `[x]` |
| 6 | **Public API / Geliştirici Portalı** — `ApiKeyDTO` üzerine key bazlı rate limit; kullanım istatistikleri dashboard'u; `/api/docs` OpenAPI sayfası | `[ ]` |
| 7 | **Webhook Sistemi** — Dışa gönderilen event hook'ları (post yayın, randevu, yorum); BullMQ retry/dead-letter; `WebhookService` + `WebhookDTO` | `[ ]` |
| 8 | **Dosya Paylaşım Linkleri** — Süreli presigned URL üretimi; indirme sayacı; `Media` modeline `shareExpiry`; `FileShareService` | `—` |
| 9 | **Event / Webinar Sistemi** — `AppointmentService` üzerine çok katılımcılı etkinlik takvimi; kapasite limiti; BullMQ hatırlatma e-postası/push | `[ ]` |
| 10 | **Takvim Senkronizasyonu** — Google Calendar / Outlook çift yönlü sync; OAuth token `SocialAccountService` şablonuyla; BullMQ sync job | `[ ]` |
| 11 | **İçerik Değerlendirme & NPS Widget** — Post/proje başına 1–5 yıldız + kısa metin; `RatingService`; admin kalite dashboard'u | `—` |
| 12 | **Taslak Onay Süreci (Editorial Workflow)** — `DRAFT → REVIEW → APPROVED → PUBLISHED`; `PostStatus` enum genişletme; SSE bildirim | `[ ]` |
| 13 | **Bekleme Listesi (Waitlist)** — E-posta toplama sayfası; onay maili; toplu duyuru BullMQ; `WaitlistService` | `—` |
| 14 | **Haber Akışı (Activity Feed)** — Kullanıcı bazlı aktivite akışı; `NotificationService` üzerine; SSE stream mevcut altyapısıyla | `—` |
| 15 | **AI ile Yorum Moderasyonu** — Kayıt anında spam/toxicity skoru; eşiğe göre otomatik `PENDING/REJECTED`; `CommentService` hook | `[x]` |
| 16 | **AI ile Çok Dilli E-posta Şablonları** — 26-locale şablon üretimi; `CampaignService`'e AI auto-translate; `MailTemplateDTO` | `—` |
| 17 | **Podcast / Ses İçeriği** — Post'a ses dosyası; `StorageService` yükleme; audio player komponenti; Whisper ile transkript + timestamp | `[ ]` |
| 18 | **Çok Kanallı Bildirim Entegrasyonları** — Slack/Discord/Telegram webhook; admin olayları anlık iletimi; `IntegrationService` pattern | `—` |
| 19 | **Portföy Case Study** — `ProjectService`'e bağlı vaka analizi modülü; sorun→çözüm→sonuç; metrikler; `CaseStudyDTO` + SEO sayfası | `—` |
| 20 | **Public Yol Haritası (Roadmap)** — Oylanabilir özellik roadmap; `PLANNED/IN_PROGRESS/DONE`; `RoadmapService` + `VoteService` | `[~]` |

---

### Phase 15 — CMS & Blog Özellikleri (Önerilen)

| # | Özellik | Durum |
|---|---------|-------|
| 41 | **Taslak Otomatik Kayıt (Auto-save)** — TinyMCE değişikliğinde 30 sn debounce ile Redis'e yaz (`draft:post:{userId}:{postId}`); editörde "Son kayıt: X dakika önce" göstergesi; `PostService.autosave()` + `AutosaveDTO` | `[ ]` |
| 42 | **İçerik Şablonları (Post Templates)** — Admin'de yeniden kullanılabilir yazı şablonları; `PostTemplate` tablosu; yeni post oluştururken şablon seçimi; `PostTemplateService` + TinyMCE entegrasyonu | `[ ]` |
| 43 | **Post Klonlama (Duplicate Post)** — Tek tıkla mevcut bir postu `DRAFT` olarak kopyalama; başlığa "Kopya —" prefix; çeviriler dahil klonlama; `PostService.duplicate()` | `[ ]` |
| 44 | **İçerik Sona Erme Tarihi (Content Expiry)** — Post/projeye `expiresAt` alanı; `CronService` daily job ile `PUBLISHED → ARCHIVED` geçişi; admin'de yaklaşan sona erme listesi | `[ ]` |
| 45 | **Öne Çıkan / Sabitlenmiş Post (Pinned Posts)** — Kategori ve anasayfa listelerinde `isPinned: true` postları en üstte göster; admin'de pin toggle; `PostService.pin()` ile maksimum 3 pin limiti | `[ ]` |
| 46 | **Şifre Korumalı Post (Password Protected)** — Post başına `accessPassword` hash alanı; okuyucu şifre formu gönderir → `PostAccessService.verify()` → Redis'te session cookie ile erişim izni; `PostAccessDTO` | `[ ]` |
| 47 | **İçerik Takvimi (Content Calendar)** — Admin'de aylık/haftalık görünümde `SCHEDULED`, `PUBLISHED`, `DRAFT` postların takvim görünümü; `@dnd-kit` ile sürükle-bırak tarih değiştirme; `CronService` ile senkron | `[ ]` |
| 48 | **Yorum Zinciri (Nested / Threaded Comments)** — `Comment` modeline `parentId` alanı; iç içe 2 seviye yanıt desteği (daha derin flatten edilir); `CommentService.getThreaded(postId)` ile hiyerarşik çıktı | `[ ]` |
| 49 | **Okuma Geçmişi (Reading History)** — Oturumlular hangi postları okuduğunu `ReadingHistory` tablosunda tut; profil sayfasında "Son okunanlar" + devam oku yüzdesi; Redis scroll-depth event buffer | `[ ]` |
| 50 | **Tam Metin Arama + Facet Filtresi (Advanced Search)** — `search` endpoint'ine kategori, yazar, tarih aralığı, dil facet filtresi; PostgreSQL `tsvector` veya mevcut embedding ile sıralama; `/[lang]/search` sayfası | `[ ]` |
| 51 | **Bölüm / Paralel İçerik Blokları (Content Blocks)** — Post içinde metin dışı bloklar: callout, info box, code, quiz sorusu; `PostBlock` tablosu; TinyMCE özel plugin olarak; `BlockRendererService` | `[ ]` |
| 52 | **Misafir Yazar Başvurusu (Guest Author Submission)** — Kayıtsız kullanıcı makalesi gönderme formu; `SUBMITTED` status; admin onay akışı (Phase 12 editorial workflow ile uyumlu); `GuestSubmissionService` | `[ ]` |
| 53 | **Bülten Otomatik Özeti (Newsletter Digest Auto-compose)** — `CampaignService`'e haftalık en çok okunan postları otomatik derleyen AI destekli bülten taslağı oluşturma; `CronService` weekly job; admin önizleme + gönder | `[ ]` |
| 54 | **Post Okuma Süresi (Read Time Estimate)** — İçerik kaydedilirken `helpers/` içinde `calculateReadTime(content)` pure fn ile kelime sayısı bazlı süre hesaplama; `Post.readTimeMinutes` alanı; post kartlarında gösterim | `[ ]` |
| 55 | **Sosyal Paylaşım Sayacı (Share Counter)** — Post sayfasında Twitter/X, LinkedIn, WhatsApp paylaşım butonları; `/api/posts/[id]/share` POST endpoint ile `Post.shareCount` artırma; Redis buffer → Prisma flush | `[ ]` |
| 56 | **Post Yazdır / PDF İndir (Print / PDF Export)** — Okuyucu için `/[lang]/blog/[...]/print` route'u; CSS print stylesheet; veya BullMQ ile arka planda PDF üret → S3'e yükle → indirme linki ver; `PostExportService` | `[ ]` |
| 57 | **Özel Yönlendirme Yöneticisi (Custom Redirects)** — Admin'den URL rename/taşıma sonrası 301/302 redirect kuralları; `Redirect` tablosu; `next.config.mjs` dynamic redirects yerine middleware'de DB lookup; `RedirectService` | `[ ]` |
| 58 | **İçerik Puanlama (Editorial Score)** — Her post için SEO skoru (başlık uzunluğu, meta description, alt text, iç link sayısı), okunabilirlik skoru ve AI içerik kalite puanı. Admin listesinde filtreleme. `ContentScoreService` | `[ ]` |
| 59 | **Embed & Widget API (Post Embed)** — `/api/widget/posts` mevcut; buna JS snippet oluşturucu ekleme; üçüncü taraf sitelerde `<iframe>` veya `<script>` ile post kartı gösterebilme; CORS control admin'den | `[ ]` |
| 60 | **Çoklu Yazar Profil Sayfası (Author Hub)** — `/[lang]/authors/[username]` sayfası: biyografi, istatistikler (toplam post, toplam görüntülenme, en popüler post), sosyal linkler, abone ol butonu. `UserProfileService` genişletmesi | `[ ]` |

---

### Phase 16 — Editor & CMS Derinlik (Önerilen)

| # | Özellik | Durum |
|---|---------|-------|
| 61 | **Otomatik İçindekiler (Auto TOC)** — Post kaydedilirken `h2/h3` başlıklardan `tocUtils.ts` (mevcut) ile TOC JSON üretimi; `Post.toc` alanı; okuyucu sayfasında sticky sidebar TOC bileşeni; aktif başlık scroll takibi | `[ ]` |
| 62 | **Taslak Paylaşım Linki (Draft Preview Link)** — Yayınlanmamış post için `/preview/[token]` route; `PostPreviewToken` tablosu; Redis'te TTL 48h; editörden "Önizleme Linkini paylaş" butonu; giriş gerektirmez | `[ ]` |
| 63 | **Eş Zamanlı Düzenleme Kilidi (Edit Lock / Mutex)** — Post açıldığında Redis'te `lock:post:{postId}` SETEX 60 sn; başka bir admin aynı postu açarsa "X kişisi düzenliyor" uyarısı; heartbeat ile kilit uzatma | `[ ]` |
| 64 | **Dipnot & Alıntı Sistemi (Footnotes / Citations)** — TinyMCE'ye `[^1]` footnote eklentisi; `PostFootnote` tablosu; sayfa altında otomatik numaralı dipnot listesi; akademik/hukuki içerik için Chicago/APA format desteği | `[ ]` |
| 65 | **Bağlantı Kontrolü (Broken Link Checker)** — `CronService` weekly job ile yayındaki postlardaki tüm dış linkleri `fetch(HEAD)` ile kontrol; kırık link `PostLinkIssue` tablosuna yaz; admin'de uyarı paneli. `LinkCheckerService` | `[ ]` |
| 66 | **Kanonik URL Yönetimi (Canonical Manager)** — Her post'a özel `canonicalUrl` alanı (sendikasyon için); `MetadataHelper.generate()` bu alanı önceliker; admin'de "canonical farklı kaynak" uyarısı | `[ ]` |
| 67 | **İçerik İçe Aktarma (Import from WordPress / RSS)** — Admin'den WordPress XML export veya RSS URL ile toplu post içe aktarma; başlık/içerik/tarih/kategori eşlemesi; `DRAFT` olarak oluştur; `ContentImportService` | `[ ]` |
| 68 | **Seri Okuma İlerleme Takibi (Series Progress Bar)** — Bir serinin kaçıncı yazısında olunduğuna dair `localStorage` tabanlı ilerleme çubuğu; "X/N tamamlandı" göstergesi; seri sayfasında checkout listesi; `SeriesService` değişiklik gerektirmez | `[ ]` |
| 69 | **Görsel Odak Noktası Seçici (Image Focal Point)** — `Media` modeline `focalX / focalY` float alanı; medya editöründe tıkla-seç UI; `next/image` `object-position` değerine bağlanır; kırpma sırasında önemli alan korunur | `[ ]` |
| 70 | **AI Akıllı İç Linkleme Önerisi (Smart Internal Linking)** — Post taslağı kaydedilirken `LocalEmbedService` ile içerik embedding'i alınır; en yüksek cosine benzerliğe sahip 5 yayındaki post önerilir; editörde "İç link önerileri" yan panel | `[ ]` |
| 71 | **İçerik Heatmap (Scroll & Click Analytics)** — Okuyucu sayfasına anonim scroll-depth + tıklama olayı gönderen küçük `<script>`; `/api/analytics/heatmap` endpoint; `PostHeatmap` tablosu; admin'de görsel ısı haritası | `[ ]` |
| 72 | **Çok Adımlı Anket / Quiz Bloğu (Post Quiz)** — Post içinde gömülü çok şıklı quiz; `PostQuiz` ve `QuizAttempt` tabloları; doğru cevap açıklaması; tamamlama yüzdesi istatistiği; `QuizService` | `[ ]` |
| 73 | **İçerik Kopyalama Tespiti (Plagiarism Check)** — Post taslağı AI'ya gönderilir; benzer web içeriğiyle karşılaştırma sorgusu döndürür; admin'de "Orijinallik raporu" paneli; `AIServices` extension + `ContentCheckDTO` | `[ ]` |
| 74 | **Sponsorlu / Bağlı İçerik Etiketi (Content Disclosure)** — Post başına `isSponsored`, `affiliateDisclosure` alanları; frontend'de otomatik yasal uyarı banner; admin düzenleme formuna toggle. GDPR/FTC uyumu | `[ ]` |
| 75 | **Gelişmiş Arama Önbelleği (Search Cache Layer)** — Arama sorgularını `search:{hash}` anahtarıyla Redis'te 10 dk cache; önbellek ısınma: en popüler 50 sorgu `CronService` hourly job ile yeniler; `SearchCacheService` | `[ ]` |
| 76 | **Post Sürüm Karşılaştırma (Revision Diff)** — `PostRevision` tablosu (önerilen #21) üzerine; admin'de iki sürüm arasında satır bazlı diff görünümü; `diffChars` (pure JS, bağımlılıksız) ile renk kodlu değişiklik listesi | `[ ]` |
| 77 | **TinyMCE Kelime Hedefi (Writing Goals)** — Editörde hedef kelime sayısı ayarlanabilir progress bar; hedef dolduğunda kutlama bildirimi; değer `localStorage`'da tutulur; `wordcount` plugin mevcut, üzerine UI katmanı | `[ ]` |
| 78 | **Metin Okuma (TTS / Read Aloud)** — Post sayfasında "Sesli Oku" butonu; tarayıcı `SpeechSynthesis API` + AI TTS fallback (OpenAI TTS); okuma dili post locale'inden alınır; `TtsService` | `[ ]` |
| 79 | **RSS Aboneliği Yöneticisi (RSS Subscription Tracker)** — `/feed.xml` çağrılarında `User-Agent` ve IP'ye göre abone tahmini; `RssSubscriber` tablosu; admin'de benzersiz RSS okuyucu sayısı istatistiği | `[ ]` |
| 80 | **Etiket Bulutu & Taksonomi Yöneticisi (Tag Cloud)** — Etiket sistemi (#41) üzerine; frontend'de etiket kullanım frekansına göre font boyutu değişen tag cloud bileşeni; admin'de birleştir/yeniden adlandır/sil toplu etiket yönetimi | `[ ]` |

---

### Phase 17 — Gelişmiş CMS & İçerik Büyümesi (Önerilen)

| # | Özellik | Durum |
|---|---------|-------|
| 81 | **Bülten Tercih Merkezi (Newsletter Preference Center)** — Abone çıkma yerine konu bazlı tercih seçimi (blog özeti, duyurular, etkinlikler); `SubscriptionPreference` tablosu; her kampanyaya konu etiketi; `SubscriptionService` genişletmesi | `[ ]` |
| 82 | **İçerik Takvimi E-posta Özeti (Weekly Digest to Admin)** — `CronService` weekly job ile o haftanın en çok okunan/yorum alan/paylaşılan postlarını admin'e özet e-posta; `MailService` üzerinden; template `MailTemplateDTO` | `[ ]` |
| 83 | **Çok Dilli Slug Yönetimi (Localized Slugs)** — Her `PostTranslation` kaydına dil bazlı benzersiz slug; `/[lang]/blog/[categorySlug]/[localizedPostSlug]` route desteği; mevcut `PostTranslationSchema`'ya `slug` alanı eklenmesi | `[ ]` |
| 84 | **Mobil Uygulama Push İçerik Bildirimi (App-style Post Push)** — Yeni post yayınlandığında mevcut web-push altyapısıyla title + cover image + kısa açıklama içeren zengin push; `PushNotificationService.sendToAll()` + `PushService` extension | `[ ]` |
| 85 | **Sosyal Medya Otomatik Paylaşım (Auto Social Publish)** — Post `PUBLISHED` geçişinde BullMQ job ile Twitter/X, LinkedIn API'a özetle paylaşım; `SocialPublishService`; admin'den hangi ağlara paylaşılacağı toggle; `IntegrationService` pattern | `[ ]` |
| 86 | **Okuyucu Anket Bloğu (Inline Poll)** — Post içine gömülü tek soruluk anket bloğu; `Poll` ve `PollVote` tabloları; oy verince sonuç grafiği gösterilir; IP/session başına tek oy limiti (Redis); `PollService` | `[ ]` |
| 87 | **Kişiselleştirilmiş İçerik Önerileri (Personalized Feed)** — Oturumumdaki kullanıcının okuma geçmişi (#49) + beğenileri baz alınarak `LocalEmbedService` cosine ile kişisel "Senin için öneriler" listesi; `/api/posts/recommended` endpoint | `[ ]` |
| 88 | **Kategori Hiyerarşisi (Nested Categories)** — `Category` modeline `parentId` alanı; admin'de ağaç görünümü; `@dnd-kit` ile sürükle-bırak sıralama; breadcrumb zinciri RSC'de otomatik üretim; `CategoryService.getTree()` | `[ ]` |
| 89 | **Yorum E-posta Aboneliği (Comment Watch)** — Yorum bırakan kullanıcıya "Bu yazıya yeni yorum gelince bildir" opt-in; `CommentWatch` tablosu; BullMQ `emails` kuyruğu üzerinden bildirim; çıkış linki her mailde | `[ ]` |
| 90 | **İçerik Lisans Etiketi (Creative Commons / License Badge)** — Post başına CC BY / CC BY-SA / All Rights Reserved seçimi; frontend'de otomatik lisans rozeti ve hukuki özet; `MetadataHelper`'a structured data (schema.org `license` field) eklenmesi | `[ ]` |
| 91 | **Özel 404 Sayfası Yöneticisi (404 Manager)** — Admin'den özel 404 içeriği (başlık, açıklama, CTA linki) düzenleme; `Settings` tablosu üzerinden; `not-found.tsx` bu ayarı RSC ile okur; sıfır yeni tablo | `[ ]` |
| 92 | **Pano Kısayolları & Widget'lar (Dashboard Widgets)** — Admin dashboard'una sürükle-bırak `@dnd-kit` widget düzenleyici; kullanıcı başına hangi widget'ların gösterileceğini `UserPreferences` JSON alanında sakla; mevcut dashboard bileşenleri modüler hale getirilir | `[ ]` |
| 93 | **API Kullanım Kotası (API Usage Quota per Key)** — `ApiKey` modeline `dailyLimit` ve `monthlyLimit` alanları; Redis `INCR api:usage:{keyId}:{date}` ile istek sayımı; limit aşımında 429 ve admin bildirimi; `ApiKeyService` genişletmesi | `[ ]` |
| 94 | **İçerik Güncelleme Geçmişi Bildirimi (Update Notification)** — "Bu yazı güncellendi" post başı banner; `Post.lastSignificantUpdateAt` alanı; admin "önemli güncelleme" işareti; zaten okumuş okuyuculara push bildirimi | `[ ]` |
| 95 | **Görsel Karşılaştırma Kaydırıcısı (Before/After Slider)** — TinyMCE'ye iki görsel yüklenince özel `<before-after>` custom element; CSS scroll snap ile %100 tarayıcı uyumu; case study ve portfolyo için; `BlockRendererService` extension | `[ ]` |
| 96 | **Zamanlayıcılı İçerik Gösterimi (Countdown Reveal)** — Post veya bölüm bloğuna `revealAt` tarihi; bu tarihten önce gizli/blur placeholder, sonra otomatik göster; Redis TTL + RSC revalidation ile sunucu tarafı kontrol | `[ ]` |
| 97 | **Chatbot Bilgi Tabanı Sync (Knowledge Base → Chatbot)** — Yeni post yayınlandığında BullMQ job ile `LocalEmbedService` embedding hesaplanır, `KnowledgeGraph` vektör tablosuna eklenir; chatbot RAG sorguları her zaman güncel içeriği görür | `[ ]` |
| 98 | **Okuma Hedefleri (Reading Goals / Streak)** — Günlük/haftalık post okuma hedefi; `localStorage` tabanlı seri (streak) sayacı; 7 günlük seri dolduğunda konfeti animasyonu + rozetler (#26 ile uyumlu); sıfır backend değişikliği | `[ ]` |
| 99 | **İçerik Gömme Koruması (Embed Rate Limit)** — `/api/widget/posts` endpoint'ine kaynak domain bazlı rate limit; izin verilen domain whitelist `Settings` tablosunda; ihlalde 403 + admin bildirimi; `middlewares/rateLimit.ts` genişletmesi | `[ ]` |
| 100 | **Çoklu Tema Desteği (Per-Post Theme Override)** — Post başına özel renk paleti veya hero gradient; `Post.themeOverride` JSON alanı; RSC'de `<style>` tag inject; admin renk seçici; anasayfa grid'de post kartına yansır | `[ ]` |

---

### Phase 18 — Yaratıcı & Deneysel Özellikler (Önerilen)

| # | Özellik | Durum |
|---|---------|-------|
| 101 | **Canlı Blog (Live Blog)** — Konferans, yayın, etkinlik için gerçek zamanlı güncellenen post formatı; `LiveBlogEntry` tablosu; `POST /api/posts/[id]/live` endpoint; SSE kanalı `ns:'liveblog'` ile okuyucuya anlık entry push; "CANLI" rozeti | `[ ]` |
| 102 | **Distraction-Free Okuma Modu** — Okuyucu sayfasında tek tıkla tüm nav/sidebar gizlenir; font büyür, arka plan kararır; üstte scroll-based ilerleme çubuğu; `localStorage`'da tercih saklanır; sıfır backend değişikliği | `[ ]` |
| 103 | **Geçici / Ephemeral Post (Story Formatı)** — `Post.ephemeralExpiresAt` alanı; 12-72 saat sonra `CronService` cleanup; post sayfasında geri sayım banner; bir kez okunabilir mod seçeneği (Redis `view:once:{postId}:{ip}`) | `[ ]` |
| 104 | **Dinamik Kişiselleştirilmiş İçerik** — Post gövdesinde `{{username}}`, `{{city}}`, `{{locale}}` placeholder'ları; RSC render anında session + GEO IP verisiyle sunucu tarafı doldurma; `ContentPersonalizationService`; client-side JS gerektirmez | `[ ]` |
| 105 | **oEmbed Provider** — Sitenin oEmbed sağlayıcısı olması; `/api/oembed?url=...` endpoint; standart JSON/XML response (title, thumbnail, html embed kodu); Discord, Slack, Notion'da URL yapıştırınca önizleme açılır; `OEmbedService` | `[ ]` |
| 106 | **Yazar İletişim Kutusu (Letter to Author)** — Post sayfasında "Yazara Özel Mesaj" formu; `AuthorMessage` tablosu; admin'de özel mesaj kutusu + yanıt; public değil; yazara SSE bildirimi; spam koruması `SpamProtection` mevcut | `[ ]` |
| 107 | **İnteraktif Kod Oyun Alanı (Code Playground)** — Post içinde çalıştırılabilir kod bloğu; `<iframe>` sandbox veya StackBlitz `sdk.embedProject()` ile sıfır build maliyeti; TinyMCE'ye `codesample` üzerine "Run" butonu eklenir; `CodePlaygroundBlock` | `[ ]` |
| 108 | **Yapay Zeka Destekli Alt Text Zorunluluğu (AI Alt Enforcer)** — Media library'ye yüklenen görselde `alt` boş ise OpenAI Vision ile otomatik alt text üretimi; `ContentScoreService`'e puan katkısı; admin'de "alt text eksik" uyarı listesi; `MediaService` hook | `[ ]` |
| 109 | **Yorum Emoji Tepkileri (Comment Reactions)** — Yorum başına 👍 ❤️ 🔥 🤔 😂 tepkisi; `CommentReaction` tablosu; Redis buffer → batch flush (`LikeService` pattern); animasyonlu tepki picker; okuyucu başına bir tepki limiti | `[ ]` |
| 110 | **Yazma Maratonu / Pomodoro Modu (Writing Sprint)** — Editörde 25 dk geri sayımlı yazma oturumu; süre dolunca otomatik kayıt + "bugün X kelime yazdın" tebrik bildirimi; `WritingSprint` tablosunda session istatistikleri; `wordcount` plugin ile entegre | `[ ]` |
| 111 | **Görsel Kahve / Bağış Butonu (Tip Jar)** — Post sayfasında "Bu içeriği destekle" butonu; Ko-fi / Buy Me a Coffee veya Stripe Payment Link; `Post.tipUrl` alanı; admin'den per-post toggle; ödeme dışarıda işlenir, entegrasyon sıfır | `[ ]` |
| 112 | **Topluluk Yorum Öne Çıkarma (Community Spotlight)** — Admin beğendiği okuyucu yorumunu "öne çıkar"; post sayfasında büyük pull-quote bloğu olarak gösterilir; `Comment.isSpotlight` boolean; `CommentService.spotlight()` | `[ ]` |
| 113 | **İçerik Kopyalama Kalkanı (Anti-Copy Shield)** — `Post.copyProtected` boolean; admin toggle; aktifse `user-select:none` + `contextmenu` + `copy` event engeli; SSR'de `<meta name="robots" content="noarchive">`; TinyMCE'nin editor içini etkilemez | `[ ]` |
| 114 | **Yazar Portfolyo PDF (CV Export)** — Kullanıcının tüm postları, projeleri, istatistikleri ve biyografisiyle hazırlanan PDF özgeçmiş; BullMQ job + `@react-pdf/renderer`; hazır olunca maile gönderilir + S3'ten 24h indirme linki | `[ ]` |
| 115 | **Satır İçi Zaman Çizelgesi Bloğu (Timeline Block)** — Post içine yatay/dikey zaman çizelgesi ekleme; adım başına tarih + başlık + kısa açıklama; TinyMCE custom block; `BlockRendererService`'e yeni tür; vaka analizleri ve tarihsel içerikler için | `[ ]` |
| 116 | **Şiir / Dize Formatı (Verse Mode Block)** — TinyMCE'ye `verse` blok tipi; `white-space:pre-wrap` ile tam satır koruması; şiir başlığı + yazar + yayın tarihi metadata; schema.org `CreativeWork` structured data; seçim engeli opsiyonel | `[ ]` |
| 117 | **Canlı Ziyaretçi Haritası (Live Visitor Map)** — Admin dashboard'unda şu an sitede olan ziyaretçilerin GEO konumlarını gösteren canlı nokta haritası; Redis `SETEX visitor:{session}` 30 sn TTL; SSE `/api/analytics/visitors/live`; `GeoAnalyticsService` extension | `[ ]` |
| 118 | **EPUB / Zip Arşiv İndirimi (Content Archive Download)** — Kullanıcı okuma listesindeki postları veya tüm içerikleri EPUB ya da ZIP olarak indirebilir; BullMQ ile paket hazırlama; S3'e geçici 1 saatlik presigned URL; `ArchiveExportService` | `[ ]` |
| 119 | **FAQ Otomatik Üretici (AI FAQ Generator)** — Post kaydedilirken AI ile "Bu yazıdan çıkabilecek 5 soru-cevap" üretimi; `PostFAQ` tablosu; post sayfasında accordion; `MetadataHelper`'a FAQPage JSON-LD eklenmesi; SEO rich snippet | `[ ]` |
| 120 | **İçerik Satışı / Pay-per-Article** — Abonelik gerektirmeden tek seferlik makale erişimi; Stripe Checkout veya Payment Link; `ArticleAccess` tablosu; Redis'te `access:{userId}:{postId}` TTL; `Post.isPaid + priceUsd` alanları; `PaywallService` | `[ ]` |

---

### Phase 19 — Platform Olgunluğu & Ağ Etkileri (Önerilen)

| # | Özellik | Durum |
|---|---------|-------|
| 121 | **İşbirlikli Post Düzenleme (Co-Editing)** — `libs/websocket/` üzerine; aynı postu açan iki admin birbirinin cursor pozisyonunu görür; karakter bazlı operational transform (lite CRDT); `CoEditSession` Redis hash; kilitleme (#63) ile birlikte çalışır | `[ ]` |
| 122 | **Topluluk Çeviri Katkısı (Community Translations)** — Okuyucular eksik dil çevirisi gönderebilir; `CommunityTranslation` tablosu `status: PENDING/ACCEPTED/REJECTED`; admin onay sonrası `PostTranslation`'a merge; katkı sahibine rozet (#26) | `[ ]` |
| 123 | **Terim Sözlüğü & Hover Tooltip (Glossary)** — Site geneli teknik terim sözlüğü; `GlossaryTerm` tablosu; post renderında eşleşen terimler otomatik underline + hover tooltip; `/[lang]/glossary` liste sayfası; `GlossaryService` | `[ ]` |
| 124 | **İçerik Yaşlanma Banner (Freshness Warning)** — Yayın tarihi 18+ ay geçmişse post başına otomatik sarı uyarı banner; `Post.lastVerifiedAt` alanı; admin "Doğruladım" butonu bannerı kapatır; RSC'de hesaplama, client değişikliği yok | `[ ]` |
| 125 | **Kategori E-posta Aboneliği (Category Follow)** — Okuyucu belirli kategoriyi takip eder; yeni post yayınlandığında BullMQ `emails` kuyruğu; `CategorySubscription` tablosu; "Takipten çık" linki her mailde; `SubscriptionService` genişletmesi | `[ ]` |
| 126 | **Sesli Arama (Voice Search)** — Tarayıcı `SpeechRecognition API`; mikrofon ikonuna basılınca sessiz dinleme; metin mevcut arama kutusuna inject edilir; `useVoiceSearch` hook; sıfır backend değişikliği | `[ ]` |
| 127 | **Komut Paleti (Command Palette)** — `Cmd+K` / `Ctrl+K` ile spotlight benzeri modal; post arama, admin sayfalarına hızlı navigasyon, tema değiştir, kısayol rehberi; Zustand + `KeyboardEvent`; `useCommandPalette` hook | `[ ]` |
| 128 | **Okunabilirlik Skoru (Flesch-Kincaid)** — Post kaydedilirken `helpers/calculateReadability(html)` pure fn; 0–100 arası Flesch skoru; `Post.readabilityScore` alanı; editörde canlı renk kodlu gösterge (yeşil/sarı/kırmızı); `ContentScoreService` entegrasyonu | `[ ]` |
| 129 | **Coğrafi Kısıtlı İçerik (Geo-gated Posts)** — `Post.allowedCountries` JSON dizi; middleware'de `GeoAnalyticsService` IP→ülke çözümlemesiyle kontrol; engellenen ülkede özel 403; admin harita seçici UI; mevcut GEO altyapısını sıfır maliyetle kullanır | `[ ]` |
| 130 | **İçerik Koleksiyonu / Derleme Sayfası (Curated Collection)** — Admin seçilen postlardan tematik koleksiyon oluşturur; `Collection` + `CollectionPost` tabloları; `/[lang]/collections/[slug]` bağımsız SEO sayfası; post kartlarında "koleksiyon" rozeti | `[ ]` |
| 131 | **Bülten Herkese Açık Arşiv (Newsletter Archive)** — Gönderilen kampanyaların public `/[lang]/newsletter/archive` sayfası; `Campaign.isPublicArchive` boolean; HTML içerik S3/R2'de; `CampaignService`'e minimal ek; abone olmayanlara keşif kanalı | `[ ]` |
| 132 | **İç Link Hover Önizleme (Hovercard)** — Post içindeki dahili linklerin üzerine gelince küçük floating kart (başlık, açıklama, cover); `GET /api/posts/preview?slug=` endpoint; debounced fetch; `isomorphic-dompurify` ile XSS güvenli | `[ ]` |
| 133 | **Erişilebilirlik Denetçisi (A11y Checker)** — Post kaydedilirken görselsiz `alt` boşluğu, başlık hiyerarşisi kırığı, link metni "buraya tıkla" gibi WCAG AA ihlalleri tespiti; `A11yCheckerService`; editörde ihlal listesi panel; ContentScore (+puan) | `[ ]` |
| 134 | **Anonim Soru Kutusu (Anonymous Q&A)** — Post sayfasında isim/üyelik gerektirmez soru formu; `AnonQuestion` tablosu; admin panelde cevapla; cevaplananlar post altında herkese açık accordion; spam koruması `SpamProtection.check()` mevcut | `[ ]` |
| 135 | **Yorum Konusu AI Özeti (Comment Thread Summary)** — Bir post 10+ yoruma ulaşınca `AIServices` ile yorum temalarını özetleme; "Okuyucular şunları tartışıyor: …" kutusu; `CommentService.summarize(postId)`; BullMQ tetiklemesi; `CronService` hourly | `[ ]` |
| 136 | **E-posta Doğrulama Kapısı (Email Gate)** — Premium içerik veya downloadable asset'e ulaşmadan önce e-posta doğrulama (üyelik şart değil); `GateToken` tablosu; Redis TTL 7 gün; doğrulama linki `MailService`; GDPR opt-in checkbox | `[ ]` |
| 137 | **Editoryal Görsel Notu (Asset Editorial Note)** — `Media` modeline `editorialNote` (bağlam, kaynak, lisans) alanı; editörde görseli seçince caption alanı otomatik doldurulur; medya kütüphanesinde notlu görseller filtrelenebilir | `[ ]` |
| 138 | **Mevsimsel Site Teması (Seasonal Skin)** — `Settings`'te tarih aralıklı dekorasyon CSS class tanımı (Noel, Yılbaşı, Ramazan, vb.); `CronService` daily job ile otomatik aktivasyon/deaktivasyon; admin manuel override toggle | `[ ]` |
| 139 | **Okuyucu Profil Rozetleri Showcase** — Kullanıcının kazandığı rozetlerin (#26) halka açık profil sayfasında kategori bazlı vitrin; rozet başına tooltip açıklama; `/[lang]/users/[username]` sayfasına ek bölüm; backend değişikliği minimal | `[ ]` |
| 140 | **Akıllı Görsel Placeholder (Blurhash on Upload)** — Media yüklenirken `blurhash` algoritmasıyla `Media.blurHash` alanı üretilir; `next/image` `placeholder="blur"` ile anlık yükleme; `StorageService` upload pipeline hook; Lighthouse CLS puanını iyileştirir | `[ ]` |

---

### Phase 20 — Derinlik, Otomasyon & Bağlantısallık (Önerilen)

| # | Özellik | Durum |
|---|---------|-------|
| 141 | **Kayıp Trafik Kurtarma (Exit-Intent Banner)** — Kullanıcı sekmeyi kapatmaya yaklaştığında (mouse viewport dışı) bülten aboneliği veya ilgili post öneren hafif overlay; `IntersectionObserver` + `mouseleave` kombinasyonu; `localStorage` ile kapatma hatırlanır; sıfır backend | `[ ]` |
| 142 | **İçerik Özeti Widget (TL;DR Block)** — Post başına AI ile otomatik üretilen veya admin tarafından yazılan 3 maddelik özet kutusu; `Post.tldr` JSON array alanı; editörde "AI ile oluştur" butonu; okuma süresinden önce gösterilir | `[ ]` |
| 143 | **Yazar Yayın Akışı (Author RSS per User)** — Her yazar için `/[lang]/authors/[username]/feed.xml` özel RSS akışı; mevcut `SitemapService` / RSS altyapısı üzerine; `UserProfileService`'e `generateFeed()` metodu | `[ ]` |
| 144 | **Gelişmiş Medya Metaveri Editörü (EXIF Strip / Embed)** — Yüklenen fotoğraflarda EXIF (GPS, cihaz adı) otomatik temizleme (gizlilik); sanatsal içeriklerde isteğe bağlı sakla; `StorageService` upload hook; `Media.exifStripped` boolean | `[ ]` |
| 145 | **Video Altyazı Yöneticisi (Subtitle Manager)** — `Media` modeline `.vtt` / `.srt` altyazı dosyası alanı; medya kütüphanesinde altyazı yükleme; post içi `<video>` tag'ine `<track>` otomatik eklenmesi; çok dil altyazı desteği | `[ ]` |
| 146 | **Log Canlı Akışı (Admin Log Stream)** — Winston log dosyasını Redis PubSub üzerinden `/api/admin/logs/stream` SSE endpoint'ine köprüleme; admin panelde gerçek zamanlı log tail; log seviye filtresi (info/warn/error); `LogStreamService` | `[ ]` |
| 147 | **Ödül Kampanyası (Referral Program)** — Davet linki (`/invite/[code]`); kayıt olan kişi + davet eden kullanıcıya rozet/puan; `Referral` tablosu; `CronService` ile aylık top referrer istatistikleri; `ReferralService` | `[ ]` |
| 148 | **Fiyatlandırma Sayfası Yöneticisi (Pricing Page Builder)** — Admin'den plan adı, fiyat, özellik listesi, vurgu rengi olan fiyat kartı yönetimi; `PricingPlan` tablosu; `/[lang]/pricing` RSC sayfası; Stripe entegrasyonuyla bağlanabilir | `[ ]` |
| 149 | **Yayın Öncesi Kontrol Listesi (Pre-publish Checklist)** — Post DRAFT → PUBLISHED geçişini bloke eden modal; "SEO açıklaması dolu mu?", "cover img var mı?", "okunabilirlik 60+?" gibi kontroller; her kural `ContentScoreService`'ten beslenir; tümü geçerse yayınla | `[ ]` |
| 150 | **Tarayıcı Sekmesi Canlı Sayaç (Tab Activity Pulse)** — Sayfa arka plana alındığında sekme başlığı `(3) Blog — kuray.dev` formatında okunmamış yorum/bildirim sayısı gösterir; Zustand notification store'a subscriber; `document.title` manipülasyonu; sıfır backend | `[ ]` |
| 151 | **İçerik Erişim Günlüğü (Post Access Log)** — Admin ve author rolünün hangi postu ne zaman görüntülediği / düzenlediği `ContentAccessLog` tablosuna yazılır; GDPR silme akışında cascade temizlenir; admin'de "Kim baktı?" panel | `[ ]` |
| 152 | **Çoklu Medya Format Dönüştürücü (Transcoder Queue)** — Yüklenen görsel için BullMQ ile AVIF + WebP versiyonları üretimi; `Media.avifUrl / webpUrl` alanları; `next/image` `srcSet` kaynağı olarak kullanılır; `StorageService` extension | `[ ]` |
| 153 | **Şablon Pazar Yeri (Template Marketplace)** — Post şablonlarının (#42) import/export JSON formatı; admin'den `template.json` dışa aktar / içe aktar; uzun vadede topluluk şablonları; `PostTemplateService.exportJson()` / `importJson()` | `[ ]` |
| 154 | **Hedef Kitle Segmenti (Audience Segment)** — `UserSegment` tablosu (yeni kayıt, aktif okuyucu, yüksek etkileşim vb.); kampanya gönderiminde segment filtresi; `CampaignService.sendToSegment(segmentId)`; mevcut `SubscriptionService` üzerine | `[ ]` |
| 155 | **İçerik Dondurma (Content Freeze)** — `Post.isFrozen` boolean; dondurulmuş postlar güncelleme / silme işlemlerine kilitlenir; yalnızca `ADMIN` unlock edebilir; yasal veya arşiv amaçlı; `PostService.update()` başında guard kontrolü | `[ ]` |
| 156 | **Otomatik Sosyal Görsel Üretici (OG Image Generator)** — `POST /api/og` route; post başlığı + yazar adı + kategori rengiyle dinamik `ImageResponse` (Next.js `@vercel/og`); `MetadataHelper`'da `openGraph.images` kaynağına bağlanır; Cloudinary gerekmez | `[ ]` |
| 157 | **Randevu Hatırlatma SMS / Email Zinciri** — Randevu saatinden 24 saat ve 1 saat önce BullMQ `emails` + `sms` kuyruğuna hatırlatma job eklenir; `AppointmentService.scheduleReminders()` booking sırasında tetiklenir; mevcut `NotificationService` altyapısı | `[ ]` |
| 158 | **İçerik Başvuru Önizlemesi (Cited-By Backlink)** — Başka postlar birbirini `[[postSlug]]` söz dizimiyle referans gösterir; `PostReference` tablosu; her post sayfasında "Bu yazıyı referans alan yazılar" bölümü; `ReferenceService.resolve()` | `[ ]` |
| 159 | **Çoklu Dil Anlık Önizleme (Locale Switcher Preview)** — Admin editöründe dil seçilince sağ panelde o dilin çevirisini gerçek zamanlı önizleme; `PostTranslationService.getForLocale()` AJAX; kaydetmeden görüntüleme; TinyMCE readonly panel | `[ ]` |
| 160 | **Ziyaretçi Hedefleme Mesajı (Smart CTA)** — Ziyaretçi ilk kez mi, dönen mi, kayıtlı mı; `localStorage` + session varlığına göre post sayfasında farklı CTA gösterilir ("Üye ol", "Hoş geldin back!", "Premium'a geç"); `SmartCtaService`; tamamen istemci taraflı karar | `[ ]` |

---

### Phase 21 — Ekosistem, Güven & Mikro-Deneyimler (Önerilen)

| # | Özellik | Durum |
|---|---------|-------|
| 161 | **Dijital İmza & Blokzincir Zaman Damgası (Content Notarization)** — Post yayınında SHA-256 hash'i hesaplanır, `Post.contentHash` alanına yazılır; Ethereum / OpenTimestamps API ile isteğe bağlı zincir kaydı; içerik değiştirilse hash uyuşmaz; `NotarizationService` | `[ ]` |
| 162 | **Okuyucu Davranış Funnel Görselleştirici (Behavior Sankey)** — Anasayfa → kategori → post → yorum veya çıkış yollarının Sankey diyagramıyla gösterimi; mevcut GEO analytics event'leri üzerine sayfa bazlı geçiş kaydı; admin'de interaktif SVG diyagram | `[ ]` |
| 163 | **Aktif Geri Sayım Sayacı (Live Countdown Widget)** — Post veya sayfaya `<countdown>` bloğu eklenebilir; etkinlik, yayın tarihi, indirim bitimine geri sayım; `CountdownBlock`; saat dilimi `UserPreferences.timezone`'dan okunur; SSR ile başlangıç değeri hesaplanır | `[ ]` |
| 164 | **Makale Alıntı Üretici (Citation Export)** — Post sayfasında "Bu yazıyı alıntıla" butonu; APA, MLA, BibTeX formatlarında metin üretimi; tarayıcı panoya kopyalama; `helpers/generateCitation(post)` pure fn; yazar biyografi + yayın tarihi + URL | `[ ]` |
| 165 | **İçerik Doğrulama Rozeti (Fact-checked Badge)** — Admin "Doğrulandı" veya "Editörce İncelendi" işareti; `Post.factCheckStatus` enum; öne çıkan rozetle post başlığı yanında görünür; schema.org `ClaimReview` structured data; güven sinyali | `[ ]` |
| 166 | **Yorum Moderasyon Kuyruğu (Moderation Queue)** — `CommentStatus.PENDING` yorumlar için admin'de dedicated moderasyon sayfası; onay/red/spam toplu işlem; klavye kısayolları `j/k/a/r/s`; karar anında SSE yayını; `CommentService.bulkModerate()` | `[ ]` |
| 167 | **Arama Otomatik Tamamlama (Search Autocomplete)** — Arama kutusuna yazılırken `GET /api/search/suggest?q=` endpoint; Redis'te son 100 popüler sorgu önbelleği; başlık + kategori + etiket önerileri; debounce 200ms; `SearchSuggestService` | `[ ]` |
| 168 | **Kullanıcı İstatistik Özeti (User Stats Card)** — Profil sayfasında toplam okuma süresi, okunan post, verilen yorum, kazanılan rozet sayıları animasyonlu sayaç ile; `UserStatsService.aggregate(userId)`; Redis 1h cache; `/[lang]/users/[username]` genişletmesi | `[ ]` |
| 169 | **Bildirim Snoooze (Notification Snooze)** — Kullanıcı bildirimi şimdi değil 1/4/24 saat sonra hatırlat diyebilir; `Notification.snoozeUntil` alanı; BullMQ'da snooze job; SSE'de `snoozeUntil` geçmişse tekrar göster; Zustand store filter | `[ ]` |
| 170 | **Post Beğeni Animasyonu (Reaction Burst)** — Beğeni butonuna tıklandığında SVG konfeti / kalp patlama animasyonu; tamamen CSS `@keyframes`; mevcut `LikeService` API yanıtına bağlı; Framer Motion gerekmez; `useLikeAnimation` hook | `[ ]` |
| 171 | **Arşiv Makinesi Entegrasyonu (Wayback Machine Link)** — Post sayfasında "Arşivlenmiş sürümleri gör" linki; `https://web.archive.org/web/*/` + canonical URL; yeni sekme; sıfır backend; dış bağımlılık yalnızca dış URL | `[ ]` |
| 172 | **Dinamik Robots.txt Yöneticisi** — Admin'den `robots.txt` içeriğini form üzerinden düzenleme; `Settings` tablosunda `robots_txt` key; `GET /robots.txt` route handler DB'den okur; `UserAgent` bazlı farklı kural setleri destekler | `[ ]` |
| 173 | **Akıllı Yeniden Yayın (Smart Republish)** — Düşük trafikli eski postu AI ile yeniden özetleyip "Güncellendi" başlığıyla yeniden öne çıkar; `Post.republishedAt` alanı; orijinal yayın tarihi korunur; `CronService` monthly job öneri listesi; admin onayı | `[ ]` |
| 174 | **İçerik Katkı Panosu (Leaderboard)** — En çok post yazan, en çok yorum alan, en çok oy toplayan yazarların skor tablosu; Redis `ZADD leaderboard:{month}` sorted set; `/[lang]/leaderboard` sayfası; aylık sıfırlama `CronService` | `[ ]` |
| 175 | **Taslak Gönder (Submit for Review) Butonu** — `AUTHOR` rolü "İncelemeye Gönder" butonuna basar → `PostStatus.REVIEW`; admin'e SSE bildirimi; editörde durum rozeti değişir; mevcut editorial workflow (#12) için frontend katmanı | `[ ]` |
| 176 | **Çoklu Kampanya Zamanlayıcısı (Campaign Scheduler)** — `Campaign.scheduledAt` alanı; `CronService` hourly job belirlenen saatte BullMQ `emails` kuyruğuna alır; admin takvimde kampanya tarihlerini görür; `CampaignService.scheduleDispatch()` | `[ ]` |
| 177 | **Gömülü Harita Bloğu (Map Embed Block)** — TinyMCE'ye adres veya koordinat girilen özel blok; Leaflet.js (açık kaynak, Mapbox gerektirmez) ile SSR-safe embed; `MapBlock`; `BlockRendererService` extension; etkinlik ve mekan içerikleri için | `[ ]` |
| 178 | **Webhook Test Konsolu** — Admin'de webhook endpoint'lerine test event gönderme; örnek payload seçimi; HTTP yanıtı + latency + header görüntüleme; geliştirme kolaylığı; `WebhookService.test(webhookId, eventType)` extension (#7 ile uyumlu) | `[ ]` |
| 179 | **Kısmen Gizli İçerik (Blur Spoiler Block)** — Post içine blur'lanmış spoiler bloğu; okuyucu "Görmek istiyorum" butonuna basarsa blur kalkar; `localStorage`'da karar saklanır; tamamen client CSS; tiyatro/film/kitap inceleme yazıları için | `[ ]` |
| 180 | **Admin Koyu/Açık Tema Zamanlayıcısı (Scheduled Theme Switch)** — `UserPreferences.theme` `SYSTEM` dışında ise belirli saatlerde otomatik tema geçişi; örn. 21:00–07:00 arası `DARK`; `CronService` değil, client taraflı `setTimeout` ile `localStorage` yazma; Zustand theme store bağlantısı | `[ ]` |

---

### Phase 22 — Derinlemesine Medya, Erişilebilirlik & Otomasyon (Önerilen)

| # | Özellik | Durum |
|---|---------|-------|
| 181 | **Medya Klasör Hiyerarşisi (Folder Tree)** — `MediaFolder` tablosu; `parentId` ile iç içe klasör yapısı; `@dnd-kit` sürükle-bırak dosya taşıma; medya yükleme formunda klasör seçici; `MediaService.getFolderTree()` recursive sorgu; breadcrumb navigasyon | `[ ]` |
| 182 | **Otomatik Webp Dönüşümü (On-the-fly Format Serving)** — `Accept: image/webp` header'ı varsa `StorageService` presigned URL yerine `/api/media/[id]/serve` isteğe bağlı sharp dönüşümü; `Media.webpKey` S3'e cache; tarayıcı desteği olmayanda orijinal format | `[ ]` |
| 183 | **Yazar Çoklu Biyografi Blokları (Bio Builder)** — Kullanıcı profil sayfasına drag-drop biyografi bölümleri: metin, stat, sertifika, zaman çizelgesi; `UserBioBlock` tablosu; `@dnd-kit` sıralama; JSON render; `UserProfileService` genişletmesi | `[ ]` |
| 184 | **İçerik Abonelik Hatırlatıcısı (Re-engagement Drip)** — 30 gün hiç ziyaret etmeyen aboneye "Seni özledik" BullMQ `emails` drip mail; `SubscriptionService`'e `lastSeenAt` alanı; `CronService` daily job kontrol; opt-out linki her mailde | `[ ]` |
| 185 | **Pano Klavye Tamamen Navigasyonu (Full Keyboard Nav)** — Admin tablolarında `Tab`, `Enter`, `Esc`, `Ctrl+S` kısayolları; satır odağı, satır açma, modal kapatma, form kaydetme; `useAdminKeyboardNav` hook; `aria-` etiketleriyle WCAG 2.1 AA uyumlu | `[ ]` |
| 186 | **Çok Adımlı Kayıt Sihirbazı (Onboarding Wizard)** — Yeni kullanıcı ilk girişte: dil seçimi → avatar yükleme → bülten tercihleri → bildirim izni; adım ilerlemesi `UserOnboarding` tablosu; tamamlanınca hoşgeldin maili; `OnboardingService` | `[ ]` |
| 187 | **Canlı İçerik Istatistik Overlay (Live Stats HUD)** — Admin post listesinde satır üzerine gelince tooltip: anlık görüntülenme, son 7 gün trend, paylaşım, yorum; Redis'ten canlı okuma; `PostStatsService.getLive(postId)` SSR + client hydration | `[ ]` |
| 188 | **Mobil QR Kod Paylaşımı (Post QR)** — Post sayfasında "QR Kod Oluştur" butonu; `qrcode` paketi ile SVG client taraflı üretim; indir veya paylaş (`Web Share API`); sıfır backend; etkinlik sunumları için | `[ ]` |
| 189 | **Çoklu Admin Bildirimleri Kanalı (Notification Routing)** — Admin, hangi olay tipinin hangi kanala (e-posta, Discord, Telegram, tarayıcı push) gönderileceğini tablolayan `AdminNotificationRoute` ayarı; `NotificationService.route(event)` kanala göre dispatch | `[ ]` |
| 190 | **Ortam Değişkeni Sağlık Kontrolü (Env Validator on Boot)** — Uygulama başlarken `Zod` ile tüm zorunlu `env` değişkenlerini doğrulayan `libs/env.ts` modülü; eksik/geçersiz değişken varsa boot sırasında `process.exit(1)` ile açıklayıcı hata; prod sürprizleri önler | `[ ]` |
| 191 | **Post İçi Anket Sonuç Paylaşımı (Poll Share Card)** — Anket (#86) tamamlanınca "Bu sonuçları paylaş" butonu; `@vercel/og` ile dinamik sonuç görseli üretimi; Twitter/X için `card=summary_large_image`; `OGImageService` extension | `[ ]` |
| 192 | **Admin Toplu Etiket Yöneticisi (Tag Bulk Editor)** — Tablo satırında `checkbox`; seçili postlara toplu etiket ekle/kaldır; `PostTagService.bulkAssign(postIds, tagIds)`; mevcut bulk action pattern'ine (Phase 7) uygun | `[ ]` |
| 193 | **Renk Körlüğü Simülatörü (Accessibility Preview)** — Admin görsel önizlemesinde deuteranopia/protanopia/tritanopia filtresi; `filter: url(#colorblind-svg)` ile CSS SVG filtre; üretim kodunu etkilemez; erişilebilirlik farkındalık aracı | `[ ]` |
| 194 | **Yakındaki Etkinlikler Widget (Proximity Events)** — Tarayıcı Geolocation API ile yakından işaret edilen slot/etkinlik tarihlerini gösteren "yakındaki etkinlikler" bileşeni; `AppointmentService.getUpcoming()` + `navigator.geolocation`; izin yoksa şehir bazlı fallback | `[ ]` |
| 195 | **Test Modu / Kum Havuzu (Sandbox Environment)** — `Settings`'te `sandboxMode: true`; aktifken randevu bildirimleri, kampanya gönderim ve webhook'lar gerçek yerine log'a yazılır; üretim verisini bozmadan uçtan uca test; `NotificationService` sandbox guard | `[ ]` |
| 196 | **İçerik İzleme Pikseli (Content Tracking Pixel)** — `GET /api/track/open?pid=[postId]&uid=[token]` 1×1 şeffaf GIF; e-posta bülteni içinde görüntülenme takibi; `CampaignOpen` tablosu; piksel URL'si kampanya gönderisine otomatik inject; `CampaignService` extension | `[ ]` |
| 197 | **Etiket Bazlı İçerik Akışı API (Tag Feed API)** — `GET /api/feed/tag/[slug]` JSON endpoint; son N yayını döndürür; `If-None-Match` ETag desteği; harici araçların (n8n, Zapier, Make) kancalanması için; `TagService` + Redis ETag cache | `[ ]` |
| 198 | **Çevrimdışı Admin Notları (Offline Draft Notes)** — Admin'de bağlantı kesilince kaydetmeye çalışılan form içeriği `IndexedDB`'ye yazılır; bağlantı geri gelince "Kaydedilmemiş değişiklik var" banner'ı; `useOfflineDraftSync` hook; çevrimiçi olunca server'a POST | `[ ]` |
| 199 | **Admin Oturum Sona Erme Sayacı (Session Expiry Countdown)** — JWT `exp` üzerinden kalan süre Zustand store'da hesaplanır; 2 dakika kala modal: "Oturumunuz dolmak üzere — Uzat"; otomatik token yenileme veya çıkış; `UserSessionService` refresh endpoint mevcut | `[ ]` |
| 200 | **İçerik Güven Skoru Rozeti (Trust Score Badge)** — Her post için Fact-check (#165) + A11y (#133) + ContentScore (#58) + Okunabilirlik (#128) + Kanonik (#66) puanlarının bileşik skoru; 0–100 arası `Post.trustScore`; frontend'de kalkan ikonu + renk; otomatik hesaplama `CronService` daily | `[ ]` |

---

### Phase 23 — Verimlilik, Entegrasyon & Gelecek Teknolojiler (Önerilen)

| # | Özellik | Durum |
|---|---------|-------|
| 201 | **Görsel OCR ile Metin Çıkarma (Image to Text)** — Admin medya kütüphanesinde seçili görsele "Metni Çıkar" aksiyonu; OpenAI Vision API ile OCR; sonuç editöre veya `Media.extractedText` alanına yazılır; taranmış belge ve ekran görüntüsü içerikleri için | `[ ]` |
| 202 | **Çok Kiracılı Site (Multi-tenant Subdomain)** — `Tenant` tablosu; `{tenant}.kuray.dev` subdomain yönlendirmesi; her kiracının kendi post/kullanıcı/ayar havuzu; middleware'de `Host` header'ından kiracı çözümlemesi; mevcut Prisma şemasına `tenantId` filter extension | `[ ]` |
| 203 | **Kayan Okuma Çubuğu (Reading Progress Bar)** — Post sayfası üst kenarında scroll derinliğine bağlı ince ilerleme çubuğu; renk `primary` token; `useScrollProgress` hook + `requestAnimationFrame`; sıfır backend; mobilde de çalışır | `[ ]` |
| 204 | **Akıllı İçerik Önerisi Sidebar (Related Posts Widget)** — Post sayfasında sağ ya da alt sticky sidebar; `KnowledgeGraphService` cosine skorlarını RSC'de hesaplar; `"use client"` gerekmiyor; ilk 3 öneri cover + başlık; mevcut `LocalEmbedService` altyapısı | `[ ]` |
| 205 | **Admin İçindekiler Atlama (Quick-Jump TOC)** — Admin'deki uzun sayfalar (ayarlar, kullanıcı listesi) için sayfanın sağ kenarında bölümlere anchor atlamalı mini TOC; `IntersectionObserver` ile aktif bölüm vurgusu; `useAdminTOC` hook | `[ ]` |
| 206 | **Şifreli Not Defteri (Encrypted Personal Notes)** — Her `ADMIN/AUTHOR` kullanıcısına özel, tarayıcı tarafında AES-GCM ile şifrelenmiş kişisel not alanı; `EncryptedNote` tablosunda yalnızca cipher text saklanır; sunucu düz metni asla görmez; `useEncryptedNotes` hook | `[ ]` |
| 207 | **RSS → İçerik Beslemesi Import (RSS Aggregator)** — Admin'de güvenilir dış RSS kaynaklarını tanımla; `CronService` hourly job ile yeni öğeleri çek; `DRAFT` post olarak aç; ayarlanabilir filtre (anahtar kelime, kategori eşleme); `RssAggregatorService` | `[ ]` |
| 208 | **Canlı Yazım Göstergesi (Live Autosave Indicator)** — Editörde değişiklik olduğunda "Kaydedilmemiş…" → spinnerli "Kaydediyor…" → "⓪ Son kayıt 10 sn önce" geçişi; `useAutosaveStatus` hook; `#41 autosave` üzerine sadece UI katmanı | `[ ]` |
| 209 | **Coğrafi İçerik Tavsiyesi (GEO Smart Suggest)** — Ziyaretçi ülkesine göre o dildeki çevirileri öncelikle sun; Türkiye'den gelene Türkçe, Almanya'dan gelene Almanca yönlendirme banner'ı; mevcut GEO IP + `AppLanguageEnum` birleştirmesi; `LanguageSuggestService` | `[ ]` |
| 210 | **Admin Renk Etiketi (Color Label on Rows)** — Post, proje, yorum tablolarında satıra admin özel renk etiketi (kırmızı=acil, sarı=bekliyor, yeşil=onaylı); `AdminLabel` tablosu `{entityType, entityId, color}`; filtresi uygulanabilir; tamamen internal tool | `[ ]` |
| 211 | **Yavaş Sorgu Uyarısı (Slow Query Monitor)** — Prisma `$use` middleware ile her sorgunun süresini ölç; 500ms'yi aşan sorguları Winston `warn` seviyesinde logla + Redis `LPUSH slowqueries` kuyruğuna at; admin panelde son 20 yavaş sorgu listesi | `[ ]` |
| 212 | **Post Kariyer Haritası (Competency Map)** — Kullanıcı okuduğu postların etiket/kategorilerine göre "bilgi haritası" oluşturur; `ReadingHistory` + tag verileri üzerinden kümeleme; `/[lang]/users/[username]/map` sayfasında SVG skill web görünümü | `[ ]` |
| 213 | **Akıllı Görsel Kırpma (Smart Crop for Thumbnails)** — Cover image yüklenince OpenAI Vision API ile ana nesne bölgesi tespit edilir; `Media.smartCropBounds` JSON; thumbnail render'da bu koordinata odaklanır; `focalX/focalY` (#169) ile tümleşik | `[ ]` |
| 214 | **Ekip İçi Yorum / Mention (Internal Thread)** — Admin/editörler arası post veya medya kaydına `@username` etiketli iç yorum; `InternalComment` tablosu; etiketlenen kişiye SSE bildirimi; halka kapatık; `InternalDiscussionService` | `[ ]` |
| 215 | **WebAuthn / Passkey Desteği** — Şifresiz giriş; `navigator.credentials.create/get` tarayıcı API; `WebAuthnCredential` tablosu; `AuthService` OTP akışına paralel branch olarak eklenir; `passkey` `SSOService` kalıbına uyumlu | `[ ]` |
| 216 | **Süreli Erişim Kuponu (Access Coupon)** — Pay-per-article (#120) veya premium içerik için indirim/ücretsiz erişim kodu; `AccessCoupon` tablosu (`code`, `maxUses`, `expiresAt`); admin'den kod üret; `PaywallService.applyCoupon()` | `[ ]` |
| 217 | **İçerik Katkı Görselleştirici (GitHub-style Heatmap)** — Admin profil sayfasında yayınlanan post günlerini GitHub katkı heatmap tarzında 52 haftalık ızgara gösterimi; `PostService.getPublishingCalendar(userId)`; tamamen SVG/HTML, bağımlılıksız | `[ ]` |
| 218 | **Toplu Çeviri Kuyruğu (Bulk Translation Queue)** — Seçilen postları BullMQ `ai-generation` kuyruğuna al; sırayla AI çevirisi yap (throttle: 5/dk); tamamlanınca admin'e SSE bildirimi; mevcut `AIServices` + `PostTranslationService` zinciri | `[ ]` |
| 219 | **Dinamik Paylaşım Bağlamı (Share Context Card)** — Kullanıcı bir metni seçince post sayfasında "Bu bölümü paylaş" balonu belirir; seçili metin + post URL'si Twitter/LinkedIn payload'ına eklenir; `selection` event; `useTextSharePopover` hook; sıfır backend | `[ ]` |
| 220 | **AI Başlık Testi (Headline Analyzer)** — Admin post başlığına yazarken gerçek zamanlı analiz: uzunluk, güç kelimesi sayısı, duygu tonu (pozitif/negatif/tarafsız), tıklama potansiyeli skoru; `AIServices` veya kural tabanlı pure fn; editör panelinde canlı renk göstergesi | `[ ]` |

---

*Reports source: `/reports/` · Last updated: March 2026*

---

## 11. Kişisel / Profesyonel CMS Kapsamı Dışında Kalan Özellikler

> Bu liste, plan içinde tanımlı ancak kişisel bir site / profesyonel portfolyo CMS'sinde (WordPress türevi) **olmaması gereken** özellikleri derler.
> Kişisel CMS'nin çekirdeği şunlardır: blog, portfolyo, medya, yorumlar, temel SEO, iletişim formu, basit bülten, tek yönetici.
> Aşağıdaki her madde ya ayrı bir ürüne (SaaS, platform, araç) ya da kurumsal düzey altyapıya aittir.

---

### 11.1 Kimlik Doğrulama Karmaşıklığı

| Özellik | Neden Fazla |
|---------|-------------|
| **11 SSO sağlayıcısı** (TikTok, WeChat, Slack, Autodesk, vb.) | Kişisel site için Google + GitHub yeterli; niche sağlayıcılar kişisel kitleye hitap etmez |
| **4 farklı MFA yöntemi** (Email OTP + SMS OTP + TOTP + Push OTP) | TOTP tek başına yeterli; 4 paralel yöntem kimlik doğrulama SaaS karmaşıklığıdır |
| **SMS çok-sağlayıcı soyutlaması** (Twilio / Nexmo / Clickatell / NetGSM) | Kişisel CMS'de SMS OTP gerekmez, olsa bile tek sağlayıcı yeter |
| **Cihaz parmak izi + UserSession tablosu** | Oturum iptali için yeterli; parmak izi kurumsal güvenlik ihtiyacıdır |
| **WebAuthn / Passkey desteği** (Phase 23 #215) | İyi bir özellik fakat kişisel CMS'nin auth karmaşıklığını katlamayan düzeyde |
| **Şüpheli giriş tespiti + tüm cihazlardan çıkış UI** | Kurumsal kimlik platformu özelliği |

---

### 11.2 Bağımsız Ürün / SaaS Özellikleri

| Özellik | Ait Olduğu Ürün |
|---------|----------------|
| **Randevu & Slot Yönetimi** (`AppointmentService`, `SlotService`, `SlotTemplateService`) | Booking SaaS (Calendly türevi) |
| **URL Kısaltıcı + GEO tıklama analitiği** (`ShortLinkService`, Redis tıklama buffer) | URL shortener SaaS (Bitly türevi) |
| **Kamya A/B konu satırı testi** | E-posta pazarlama SaaS (Mailchimp türevi) |
| **Bekleme Listesi (Waitlist)** (Phase 14 #13) | Ayrı ürün geliştirme / lansman aracı |
| **Pay-per-Article / Paywall** (Phase 18 #120) | İçerik monetizasyon SaaS |
| **İndirim Kuponu (Access Coupon)** (Phase 23 #216) | E-ticaret / monetizasyon katmanı |
| **Yönlendirme Programı (Referral Program)** (Phase 20 #147) | Büyüme / platform özelliği |
| **Fiyatlandırma Sayfası Yöneticisi** (Phase 20 #148) | SaaS ürün sitesi altyapısı |
| **Çok Kiracılı Subdomain (Multi-tenant)** (Phase 23 #202) | SaaS platform — CMS değil |
| **Hedef Kitle Segmenti (Audience Segment)** (Phase 20 #154) | Kurumsal e-posta pazarlama |
| **Genel API / Geliştirici Portalı** (Phase 14 #6) | Platform ürünü; kişisel CMS API'si kamuya açılmaz |
| **Webhook Sistemi** (Phase 14 #7) | iPaaS / otomasyon entegrasyon platformu (Zapier türevi) |
| **Etkinlik / Webinar Sistemi** (Phase 14 #9) | Etkinlik yönetim platformu (Eventbrite türevi) |
| **Google Calendar / Outlook Takvim Senkronizasyonu** (Phase 14 #10) | Kurumsal takvim entegrasyonu |

---

### 11.3 Yapay Zeka Aşırı Mühendisliği

| Özellik | Neden Fazla |
|---------|-------------|
| **5 paralel AI sağlayıcı soyutlaması** (OpenAI + Anthropic + Gemini + xAI + DeepSeek) | Kişisel CMS'de tek sağlayıcı yeterli; multi-provider abstraction B2B SaaS için gereklidir |
| **Yerel WASM Embedding + Knowledge Graph** (`@xenova/transformers`, cosine similarity) | Araştırma / kurumsal düzey; kişisel blog'da yazılar arası ilişki basit tag/kategori ile çözülür |
| **AI Chatbot (RAG + WebSocket + konuşma özeti + proaktif tetikleyici)** | Başlı başına bir ürün; kişisel CMS'nin kapsamı dışında |
| **AI ile İçerik Kopyalama Tespiti (Plagiarism Check)** (Phase 16 #73) | Özel editoryal araç; bağımsız servis olarak tüketilmeli |
| **AI ile Akıllı İç Linkleme Önerisi** (Phase 16 #70) | Kurumsal SEO araç özelliği |
| **AI ile Görsel OCR** (Phase 23 #201) | Bağımsız medya işleme aracı |
| **AI ile Akıllı Kırpma (Smart Crop via Vision API)** (Phase 23 #213) | Medya pipeline SaaS |
| **AI ile Toplu Çeviri Kuyruğu** (Phase 23 #218) | İçerik operasyonu otomasyon platformu |
| **AI FAQ Üretici** (Phase 18 #119) | İçerik optimizasyon araç ekosistemi |
| **AI ile Alt Text Zorunluluğu (Enforcer)** (Phase 18 #108) | DAM (Digital Asset Management) ürün özelliği |
| **AI ile Başlık Testi (Headline Analyzer)** (Phase 23 #220) | İçerik pazarlama platformu özelliği (BuzzSumo türevi) |

---

### 11.4 Kurumsal Analytics & İzleme

| Özellik | Neden Fazla |
|---------|-------------|
| **GEO Analitiği + dünya haritası görselleştirmesi** | Kurumsal analytics platformu; kişisel için Google Analytics / Plausible yeterli |
| **İçerik Isı Haritası (Heatmap)** (Phase 16 #71) | Ayrı analytics SaaS (Hotjar türevi) |
| **RSS Abone Takipçisi** (Phase 16 #79) | Ayrı yayın analitiği aracı |
| **Canlı Ziyaretçi Haritası** (Phase 18 #117) | Kurumsal gerçek zamanlı analytics |
| **Davranış Funnel (Sankey Diagramı)** (Phase 21 #162) | Ürün analitiği platformu (Mixpanel türevi) |
| **İçerik İzleme Pikseli (Tracking Pixel)** (Phase 22 #196) | E-posta pazarlama analitiği |
| **Yavaş Sorgu İzleyici (Slow Query Monitor)** (Phase 23 #211) | DevOps / APM aracı (Datadog türevi), CMS özelliği değil |
| **Log Canlı Akışı (Admin Log Stream)** (Phase 20 #146) | DevOps / platform operasyon aracı |

---

### 11.5 Kurumsal Altyapı

| Özellik | Neden Fazla |
|---------|-------------|
| **BullMQ + Redis kuyruk sistemi** | Kişisel ölçekte `setImmediate` veya basit cron yeterli; BullMQ kurumsal iş yükü içindir |
| **3 paralel Object Storage soyutlaması** (S3 + R2 + MinIO) | Kişisel CMS tek bir depolama hizmeti kullanır |
| **Redis tıklama buffer + 5 dakikalık batch flush** | Kısa link ürünü altyapısı; kişisel CMS'de bu trafik hacmi gerçekçi değil |
| **Eş Zamanlı Düzenleme (Co-editing, CRDT)** (Phase 19 #121) | Google Docs düzeyinde karmaşıklık; tek yazar CMS'de birden fazla editör yoktur |
| **Düzenleme Kilidi / Mutex (Edit Lock)** (Phase 16 #63) | Çok editörlü kurumsal CMS özelliği |

---

### 11.6 Platform / Topluluk Özellikleri

| Özellik | Neden Fazla |
|---------|-------------|
| **Topluluk Çeviri Katkısı** (Phase 19 #122) | Kalabalık yazar topluluğu olan platformlar içindir (Wikipedia, Crowdin modeli) |
| **Coğrafi Kısıtlı İçerik (Geo-gated Posts)** (Phase 19 #129) | Medya şirketi / yayın lisanslama ihtiyacı |
| **Canlı Blog (Live Blog)** (Phase 18 #101) | Haber medyası özelliği |
| **oEmbed Sağlayıcısı** (Phase 18 #105) | Kendisi gömülebilen içerik platformu; kişisel blog gömülen değil, gömen taraf olur |
| **Geçici / Ephemeral Post (Story Formatı)** (Phase 18 #103) | Sosyal medya özelliği (Instagram Stories türevi) |
| **İnteraktif Kod Oyun Alanı (Code Playground)** (Phase 18 #107) | Geliştirici araçları platformu (CodeSandbox türevi ek özellik) |
| **Dijital İmza / Blokzincir Zaman Damgası** (Phase 21 #161) | Hukuki / kurumsal içerik doğrulama; kişisel blogda pratik kullanım yok |
| **Şablon Pazaryeri** (Phase 20 #153) | Ekosistem platformu; tek kişilik CMS'de pazar yeri işlevselliği anlamsız |
| **Ekip İçi Mention / Internal Thread** (Phase 23 #214) | Çok kişili editör ekibi olan kurumsal CMS |
| **Liderlik Tablosu (Leaderboard)** (Phase 21 #174) | Yazar topluluğu platformu |

---

### 11.7 Fazla Mühendislik / Gereksiz Karmaşıklık (Kişisel Blog Ölçeğinde)

| Özellik | Neden Fazla |
|---------|-------------|
| **İçerik A/B Testi** (Phase 14 #2) | Kişisel blogda istatistiksel anlamlılık için trafik yok |
| **Okuma Hedefleri / Streak Sistemi** (Phase 17 #98) | Okuma uygulaması özelliği (Kindle, Goodreads türevi) |
| **Okuyucu Rozet / Başarım Sistemi** (Phase 14 #26 referansı) | Oyunlaştırma katmanı; platform ürünü |
| **Mevsimsel Site Teması (CronService ile otomatik)** (Phase 19 #138) | Dekorasyon; CronService ile CSS class değiştirmek aşırı mühendislik |
| **Tarayıcı Sekmesi Canlı Sayaç (Tab Title Pulse)** (Phase 20 #150) | Mikro-deneyim; kişisel içerik sitesinde gereksiz |
| **İçerik Dondurma (Content Freeze)** (Phase 20 #155) | Yalnızca yasal zorunluluklu büyük editoryal organizasyonlarda gerekli |
| **Kariyer / Yetenek Haritası (Competency Map)** (Phase 23 #212) | Öğrenme yönetim sistemi (LMS) özelliği |
| **Okuyucu Davranış Funnel Görselleştirici** (Phase 21 #162) | Bkz. §11.4 |
| **Çok Dilli Otomatik Sosyal Görsel Üretici (OG Image)** (Phase 20 #156) | Kısmen geçerli, ancak Vercel OG + basit şablon yeterli; tam servis overkill |
| **RSS Aggregator (Dış kaynaklardan otomatik içerik çekme)** (Phase 23 #207) | İçerik küratörlüğü platformu; kişisel blog orijinal içerik üretir |
