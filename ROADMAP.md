# KurayDevSite — Product Roadmap

> This document reflects the completed development history of KurayDevSite.
> The project is now feature-complete. No new phases are planned.
> This repository is in **maintenance mode** — receiving only bug fixes, dependency updates, and security patches.

**Project start:** October 2024
**Final version:** v2.8 (March 2026)
**Status:** 🔒 Maintenance mode — feature development complete
**Status legend:** ✅ Completed

---

## Phase 1 — Foundation & Bootstrapping `v0.1 – v0.3` ✅
> *Target: Oct – Dec 2024*

**Goal:** Establish a production-ready project skeleton with correct conventions locked in from day one.

- ✅ Bootstrap Next.js 14 App Router project with TypeScript strict mode
- ✅ Define folder architecture: `(frontend)`, `(api)`, `(auth)`, `(admin)`, `(short)`, `(my-links)`
- ✅ Configure Tailwind CSS, DaisyUI, and PostCSS pipeline
- ✅ Define base Prisma schema: `User`, `Post`, `Category`, `Project`, `Session`
- ✅ Implement CORS, CSRF, rate-limit, and security-header middleware stack
- ✅ Scaffold i18n dictionary infrastructure; seed initial locale files
- ✅ Build initial public page layouts and reusable UI component library
- ✅ Resolve initial build errors and stabilise CI pipeline

---

## Phase 2 — Content & SEO Core `v0.4 – v0.6` ✅
> *Target: Dec 2024 – Feb 2025*

**Goal:** Ship the public-facing blog, project showcase, and system administration with strong SEO.

- ✅ Blog feed with paginated post list and category filtering
- ✅ Dynamic project pages with full CRUD and session-based auth guard
- ✅ Hero image / video component for landing page
- ✅ System settings admin panel (site-wide configuration keys) and SEO settings
- ✅ Auto-generated Open Graph images for posts and pages
- ✅ Google Tag Manager integration
- ✅ New timeline section on portfolio landing page
- ✅ Fix OG image upload: restrict to PNG/JPG only
- ✅ Secure `/api/users` endpoint against unauthenticated access
- ✅ Transparent navbar and hero background effects

---

## Phase 3 — Security Hardening `v0.7 – v0.9` ✅
> *Target: Mar – May 2025*

**Goal:** Harden the infrastructure against abuse and complete the core auth flows.

- ✅ Denial-of-service protection middleware (body size limits, connection throttling)
- ✅ Rate-limiting middleware backed by Redis (`INCR` + `EXPIRE` per IP/route)
- ✅ Upgrade to **Next.js 15**
- ✅ i18n string cleaning pass and admin UI layout adjustments
- ✅ Terminal easter egg in developer tools
- ✅ Password reset flow (forgot password → email OTP → reset)
- ✅ Post admin view with rich editor, preview, and publish controls
- ✅ JWT refresh and `UserSessionService` abstraction
- ✅ Skills / toolbox showcase section on portfolio page
- ✅ Date-appended post slugs for uniqueness
- ✅ Move all static assets to `public/` per Next.js convention
- ✅ Resolve security vulnerabilities in session handling

---

## Phase 4 — Appointment & Calendar Platform `v1.0 – v1.2` ✅
> *Target: Jun – Sep 2025*

**Goal:** Ship the slot-based appointment booking system as a first-class feature.

- ✅ `CalendarService` with full booking logic (slot selection, confirm, cancel)
- ✅ Redis-backed counters and state management for appointments
- ✅ Zod DTOs for all calendar/appointment API inputs/outputs
- ✅ Calendar redirect and deep-linking flow
- ✅ Form validation across all user-facing forms
- ✅ Post like API, `PostLike` schema, and like button in post header
- ✅ Slack and WeChat SSO providers (total: 11 SSO providers)
- ✅ `AWSService` replaced with pluggable `StorageService` (AWS S3 / R2 / MinIO)
- ✅ SSO services centralised and cleaned up
- ✅ Initial sitemap generation
- ✅ Font updated to Bookerly

---

## Phase 5 — Knowledge Graph & Advanced Analytics `v1.3 – v1.5` ✅
> *Target: Oct – Nov 2025*

**Goal:** Introduce AI-powered content discovery and production-grade geo analytics.

- ✅ Knowledge Graph with local WASM embeddings (`@xenova/transformers`) and 3D visualisation
- ✅ Redis-backed Knowledge Graph caching
- ✅ GeoHeatmap UI component (initial pass)
- ✅ Reading progress bar for blog posts
- ✅ System status indicator component
- ✅ Lazy-loading for heavy GeoMap and Three.js components
- ✅ Global TypeScript types module (`types/`)
- ✅ MIME type validation for all file uploads
- ✅ ESLint cleanup and `console.log` removal pass
- ✅ Initial Jest test suite scaffolded
- ✅ Auth flow stability fixes (multiple iterations)
- ✅ Full-text search for posts using PostgreSQL `tsvector`
- ✅ New language added; `robots.txt` and `llm.txt` published for search crawlers

---

## Phase 6 — Platform Restructure & Newsletter `v1.6` ✅
> *Target: Dec 2025*

**Goal:** Upgrade the runtime, restructure the App Router, and ship newsletter management.

- ✅ Upgrade to **Next.js 16** and **Prisma 7**
- ✅ App Router full restructure (route groups, `(short)`, `(my-links)`)
- ✅ Global Visitors Heatmap service with world-map visualisation
- ✅ System status page with full i18n support
- ✅ GEO analytics service: IP-to-location pipeline
- ✅ Newsletter subscription management
- ✅ RSS feed endpoint (`/[lang]/feed.xml`)
- ✅ Sitemap service with dynamic, per-locale generation
- ✅ Draft memory / auto-save for post editing
- ✅ Remove `multisite` feature (deferred; blocked pending redesign)

---

## Phase 7 — 2FA & Mail Infrastructure `v1.7 – v1.8` ✅
> *Target: Dec 2025*

**Goal:** Ship full multi-factor authentication and a transactional mail templating system.

- ✅ TOTP (Time-based OTP) 2FA setup and verification flow
- ✅ Email OTP support (6-digit codes, expiry, retry logic)
- ✅ OTP change and management pages in user settings
- ✅ Security settings tab (profile · security · preferences)
- ✅ Extended User schema: 2FA fields, preferences, security metadata
- ✅ Sanitisation and validation hardening pass across all inputs
- ✅ Admin reports dashboard with smart stats widgets
- ✅ Cron job scheduler (`CronService`) for background maintenance tasks
- ✅ Appointment email templates (booking confirmation, cancellation, reminder)
- ✅ Nodemailer-based mail templating system
- ✅ Auto comment approval policy configurable per post
- ✅ CORS configuration tightened; mobile layout rendering fixed

---

## Phase 8 — Architecture Refactor & DTO Layer `v1.9` ✅
> *Target: Dec 2025 – Jan 2026*

**Goal:** Formalise the service/DTO/messages architecture so the codebase scales.

- ✅ Comprehensive i18n pass: all admin, auth, common, and frontend components fully translated
- ✅ New DTO layer: Zod schemas + inferred types for all API inputs/outputs (`dtos/`)
- ✅ `messages/` folder: per-domain error/success string maps (no inline strings in services)
- ✅ Folder structure reorganised to match ARCHITECTURE.md conventions
- ✅ `AppointmentCalendar`, `OTPTab`, and Knowledge Graph 3D viewer translation support
- ✅ New global TypeScript type declarations (`types/`)
- ✅ All remaining `console.log` statements cleaned

---

## Phase 9 — SEO Polish & Multilingual Routing `v2.0 – v2.1` ✅
> *Target: Jan – Feb 2026*

**Goal:** Deliver perfect Lighthouse SEO scores and a rich admin dashboard.

- ✅ Project detail page with breadcrumb navigation
- ✅ Projects and Blog SEO: JSON-LD, Open Graph, canonical tags
- ✅ Table of Contents generator for long-form posts
- ✅ `articleBody`, `WebSite`, and `SearchAction` JSON-LD schemas
- ✅ Preconnect hints for external resources
- ✅ New admin dashboard pages, table grid view, and analytics page
- ✅ Appointments table page in admin
- ✅ Media manager: file browser, upload, and metadata editing
- ✅ Draft manager
- ✅ New admin navbar
- ✅ User profile pages (`/users/[username]`)
- ✅ Font and UI style passes (spacing, colour, SSR pre-rendering)

---

## Phase 10 — PWA, Accessibility & Multilingual URLs `v2.2 – v2.3` ✅
> *Target: Feb 2026*

**Goal:** Make the platform truly multilingual, accessible, and installable as a PWA.

- ✅ PWA: `manifest.webmanifest` and service worker (`sw.js`)
- ✅ Testimonials section and service
- ✅ Canonical URL tags for all public pages
- ✅ Notification bell in the frontend UI
- ✅ User settings page (profile, preferences)
- ✅ Locale-prefixed multilingual routing across all public pages (`/[lang]/...`)
- ✅ Multilingual Blog, Projects, Categories, and Link components
- ✅ WCAG AA 3.2 accessibility compliance: navbar, sidebar, footer (focus order, criteria 2.4.3)
- ✅ RTL (right-to-left) layout support across all components
- ✅ New locale additions and systematic language reordering
- ✅ Country-level geo-restrictions for sensitive locales
- ✅ i18n dictionary restructured for long-term maintainability
- ✅ Post sharing functionality

---

## Phase 11 — Campaign Engine & Short Links `v2.4` ✅
> *Target: Mar 2026*

**Goal:** Add email campaign management, short-link infrastructure, and session control.

- ✅ Email campaign pipeline: draft → sending → sent
- ✅ Short-link management page (`(my-links)/my-links`)
- ✅ Short-link redirect handler (`/s/[code]`) with click analytics
- ✅ Session management UI: view and revoke active sessions per device
- ✅ Scheduled post publishing: draft → scheduled → published pipeline
- ✅ Post series feature with UI and data model
- ✅ `ARCHITECTURE.md`, `PLAN.md`, and `RULES.md` documentation published
- ✅ Missing i18n key checker script (`npm run check-missing-key`)

---

## Phase 12 — Real-Time, AI Chatbot & Live Analytics `v2.5` ✅
> *Target: Mar 2026*

**Goal:** Introduce real-time infrastructure, an AI-powered chatbot with RAG, and live engagement features.

- ✅ WebSocket infrastructure: generic `WSManager`, `useWebSocket` hook, `ws` package
- ✅ AI Chatbot with RAG (Retrieval-Augmented Generation): embeddings, vector similarity, context injection
- ✅ Full chatbot admin panel: stats widget, user ban/unban, session management
- ✅ `ChatSession` and `ChatMessage` models added to Prisma schema
- ✅ GET endpoint for full chat session history
- ✅ Live viewer count via Redis sorted-set heartbeat
- ✅ Smart post recommendations: similar posts API + knowledge-graph-based matching component
- ✅ Search autocomplete with keyboard navigation, highlight, and ARIA attributes
- ✅ GEO analytics: `countryCode` field, Redis caching, `ip-api.com` fallback
- ✅ GeoHeatmap stats panel in footer / status button
- ✅ API Key management: create, list, revoke, authenticate via personal API keys
- ✅ `ApiKey` model added to Prisma schema; `ApiKeysTab` in user settings
- ✅ `TableToolbar` refactored to support a `buttons` array for multiple actions
- ✅ Zustand store `migrate` and `onRehydrateStorage` lifecycle handlers

---

## Phase 13 — Auth Hardening, Cookie Consent & SSE Fallback `v2.6` ✅
> *Target: Mar 2026*

**Goal:** Lock down authentication architecture and improve chatbot resilience.

- ✅ Redesigned auth layout with two-panel branding design (`AuthGridBackground`, features list)
- ✅ Auth branding i18n keys distributed across all 26 locales
- ✅ Cookie consent banner (`CookieConsentBanner`) with Zustand store
- ✅ Chatbot SSE (Server-Sent Events) transport as WebSocket fallback
- ✅ Session export and proactive message trigger for chatbot
- ✅ `SecurityService` extracted from `AuthService`; security constants centralised
- ✅ `AuthMiddleware` unified across all route handlers
- ✅ `TokenService` and `DeviceFingerprintService` extracted from `UserSessionService`
- ✅ Auth API session creation converted to dynamic `apiSessionCreate` method
- ✅ API key authentication correctly returns a valid session object
- ✅ Chatbot `page_context` parameter; Prisma type mismatches corrected

---

## Phase 14 — Security Deep-Dive, Export & Passkeys `v2.7` ✅
> *Target: Mar 2026*

**Goal:** Deliver passwordless login, reCAPTCHA, trusted device management, content scoring, and data export.

- ✅ WebAuthn / Passkey authentication (`@simplewebauthn`) with Conditional UI (browser autofill)
- ✅ `PasskeyLoginButton` and `PasskeyManager` in auth UI
- ✅ Trusted device fingerprint cookie on login; skip suspicious-login email for known devices
- ✅ OTP generation hardened with `crypto.randomInt`; OTP step skipped for trusted devices
- ✅ `OTPTab` redesigned: skeleton loading, active badge, method-aware modals, method switching
- ✅ reCAPTCHA v2 enforced on contact form and registration (server-side verification)
- ✅ Daily / monthly API key quota enforcement via Redis counters (429 on breach)
- ✅ Newsletter topic preferences (`blogDigest`, `announcements`, `events`); campaign recipient filtering by topic
- ✅ `ExportButton` (CSV / XLSX / PDF) on all admin list pages
- ✅ `ContentScoreBar` for real-time SEO / content quality scoring in post, category, and project editors
- ✅ Per-post short-link generation endpoint; `ShareButtons` auto-fetch on mount
- ✅ Sortable columns with URL persistence across all admin tables
- ✅ Map embed button (OSM / Google Maps) in TinyMCE editor
- ✅ Expanded storage types: video, audio, documents, archives + EXIF stripping
- ✅ Admin media page: multi-type file preview with kind icons
- ✅ All admin pages migrated to shared i18n key set
- ✅ `aria-label` tags replaced with i18n translations site-wide
- ✅ Zod DTO `safeParse` adopted uniformly across all API route handlers

---

## Phase 14.1 — Fediverse Integration, UX Refactor & Runtime Hardening `v2.8` ✅
> *Target: Mar 2026*

**Goal:** Federate the platform to the Fediverse while stabilising core UI and runtime behavior after v2.7.

- ✅ ActivityPub endpoints added: Actor, Inbox, Outbox, Followers, Following
- ✅ Discovery endpoints added: `/.well-known/webfinger` and `/.well-known/nodeinfo`
- ✅ `ActivityPubFollower` model added to Prisma schema; client regenerated
- ✅ Signed outbound ActivityPub delivery and inbound HTTP Signature verification
- ✅ Post publish/update/delete now emit Create/Update/Delete federation activities
- ✅ ActivityPub middleware hardening: CSRF exemption and route-level rate-limit tuning
- ✅ Modal system refactored into composable modules with stack/z-index and drag support
- ✅ Reusable form/modal components migrated from admin layer to `components/common/*`
- ✅ Form controls expanded: `DynamicSelect` multiselect + `DynamicNumber` + `DynamicRadio`
- ✅ i18n dictionary loading switched to lazy-loading by language
- ✅ Public user profile and metadata flow rebuilt; server/client boundary cleanup pass
- ✅ Cron schedule definitions reorganised from `jobs/` to `timers/`

---

## Phase 15 — Test Coverage & Quality Gates `v2.8.x` ✅
> *Target: Q2 2026 · Risk-based completion: Mar 2026*

**Goal:** Complete risk-based test hardening for high-impact service paths and enforce practical quality gates.

- ✅ Risk-based unit test expansion completed for critical service areas (`AuthService`, `PostService`, `CampaignService`, `AppointmentService`, `CronService`, `UserService`, …)
- ✅ Critical flow validation completed for login/session lifecycle, scheduled publish, appointment booking/cancel, and campaign send pipelines
- ✅ External dependency mocking standardised across suites (Prisma, Redis, Storage/S3, mail, AI providers)
- ✅ `npm test` baseline enforced as required merge gate
- ✅ Coverage workflow operational (`npm test -- --coverage`); PR-level coverage annotation handled as CI policy refinement

**Final coverage (2026-03-18):**

| Metric | Result |
|--------|--------|
| Test Suites | 111 / 111 passed |
| Tests | 2,075 / 2,075 passed |
| Statements | 96.42% |
| Branches | 85.01% |
| Functions | 94.37% |
| Lines | 97.32% |
| Run time | 2.317 s |

---

## Phase 16 — Performance & Bundle Optimisation 📋
> *Target: Q2 2026*

**Goal:** Achieve sub-2 s LCP on mobile and reduce JS bundle size.

- ✅ Bundle analysis pass (`ANALYZE=true npm run build`) on all major dependency additions
- ✅ Convert remaining Client Components to Server Components where possible
- ✅ Audit and remove unused Tailwind classes (PurgeCSS pass)

---

## Architecture Principles (Non-Negotiable)

These constraints were established at project inception and apply to every phase:

| Principle | Implementation |
|-----------|---------------|
| **Type safety** | TypeScript strict, Zod on every boundary, zero `any` |
| **Layered architecture** | Route handlers → Services → Prisma / Redis. No layer skipping |
| **Security by default** | CSRF, rate limiting, security headers, bcrypt, `crypto.randomInt`, MIME checks |
| **i18n-first** | All UI strings in dictionary files; 26 locales kept in sync |
| **Pluggable providers** | Storage, AI, SMS, and email providers are swappable via `StorageService`, `AIProvider`, `SMSService`, `MailService` |
| **Observability** | Winston logs every service error; Redis + BullMQ surface queue health |
| **Zero build failures** | `typescript.ignoreBuildErrors: false` is permanent |
| **Privacy by design** | First-party analytics, opt-in tracking, GDPR-compliant cookie consent, data minimisation |
| **Portfolio-grade quality** | Every public-facing page must score ≥ 95 on Lighthouse Performance, Accessibility, Best Practices, and SEO |

---

*Last updated: 2026-03-23 · v2.8 · Feature development complete — maintenance mode*
