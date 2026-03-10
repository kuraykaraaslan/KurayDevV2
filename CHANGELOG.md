# Changelog

All notable changes to **KurayDev Portfolio** are documented in this file.

Versions are distributed chronologically across the full commit history.
The project started as `v0.1` in October 2024 and is currently at `v2.7` (March 2026).

Format loosely follows [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).

---

## [2.7] — 2026-03-08 / 2026-03-09

### Added
- WebAuthn / Passkey authentication (`@simplewebauthn/browser`, `@simplewebauthn/server`) with Conditional UI (browser autofill)
- `PasskeyLoginButton` and `PasskeyManager` components wired into auth UI; `passkeyEnabled` field added to `UserSecurity` type
- `OTPTab` redesigned with skeleton loading, active badge, method-aware modals, and OTP method switching in the login flow
- `otp_resend` and `totp_hint` i18n keys added to all 26 locales
- Newsletter topic preferences (`blogDigest`, `announcements`, `events`) toggles in `NotificationsTab`
- `SubscriptionTopic` model added to Prisma schema; campaign recipient filtering by topic
- Daily / monthly quota enforcement for API keys via Redis counters (429 response on limit breach)
- `ExportButton` (CSV / XLSX / PDF) added to `DynamicTable` toolbar using `jspdf`, `jspdf-autotable`, `xlsx`; enabled on all admin list pages
- `ContentScoreBar` component for real-time SEO / content scoring; integrated into post, category, and project editors
- POST `/api/posts/[postId]/share` endpoint for per-post short-link generation; `ShareButtons` auto-fetch short link on mount with loading spinner
- Sortable columns with URL persistence in all admin tables; sort logic implemented across all API endpoints and services
- Map insert button (OSM / Google Maps embed) in the TinyMCE rich-text editor
- Multi-type file preview with kind icons in the admin media page
- Storage layer: expanded allowed file types (video, audio, documents, archives); EXIF metadata stripping on upload
- reCAPTCHA v2 support: server-side verification for contact form and registration; `NEXT_PUBLIC_RECAPTCHA_CLIENT_KEY` env variable
- Trusted device fingerprint cookie written on login; suspicious-login email suppressed for already-known devices
- i18n: `export`, `api_key_quota`, `newsletter_topic`, `subscription`, `captcha`, `remember_device`, `appointments`, common UI, and admin navigation keys added to all locales
- `DynamicTable` action labels now support i18n translations
- SSO invalid-request handling and corresponding i18n label

### Changed
- Admin pages migrated to a shared common i18n key set; category-posts pages redirect to the filterable posts page
- TinyMCE setup refactored: media upload buttons added, dark-mode skin applied via theme-aware config
- Media library dialog redesigned with card hover overlay and CSS utility classes

### Refactored
- `ContentScoreBar` scoring rules extracted to `rules.ts`; post editor page cleaned up
- Admin sortable columns migrated from legacy `sortable` to `disableSort` pattern
- DTOs: shared enums extracted; `MediaDTO` and `PushNotificationDTO` added
- Zod DTO `safeParse` adopted across all API route handlers (replaced manual validation)
- `WebAuthnService` reformatted with consistent indentation

### Fixed
- WebAuthn: `localhost` RP ID and `http` origin used correctly in development mode
- OTP flow: method switching, error message key, and unsafe `any` cast resolved
- Chatbot: message roles normalised to UPPERCASE enum values; SSE typing corrected
- Appointment update and comment typing edge cases resolved
- `aria-label` attributes replaced with i18n translations (WCAG a11y)
- Admin dashboard and editor TypeScript warnings resolved
- User profile page marked as a client component; unused icon imports removed
- i18n tooling clean-up and build hook fix

### Security
- `crypto.randomInt` used for OTP generation (replaces `Math.random`)
- OTP step skipped for verified trusted devices (reduces friction without sacrificing security)
- reCAPTCHA server-side verification enforced on contact and registration endpoints

---

## [2.6] — 2026-03-07

### Added
- Redesigned auth layout with a two-panel branding design (`AuthGridBackground`, left panel with features list)
- Auth branding i18n keys distributed across all 26 locales (`headline_line1/2`, `tagline`, `feature_*`)
- `forgot_password_link` and `welcome_back` i18n keys added to all dictionaries
- Cookie consent banner (`CookieConsentBanner`) with Zustand store
- Chatbot SSE (Server-Sent Events) transport support as a WebSocket fallback
- Session export and proactive message trigger for chatbot

### Changed
- Chatbot architecture refactored: RAG pipeline consolidated, admin service separation improved
- Auth API session creation converted to a dynamic `apiSessionCreate` method (removed static `API_SESSION` constant)
- RULES.md updated to reflect latest conventions
- PLAN.md updated with chatbot and cookie consent phases

### Fixed
- API key authentication now correctly returns a valid session object instead of `null`
- Chatbot `page_context` parameter added; Prisma type mismatches corrected
- Replaced icon-only link with a text link for "Forgot password" on the login page

### Refactored
- `SecurityService` extracted from `AuthService` and security constants centralized to `constants.ts`
- `AuthMiddleware` unified across all route handlers (replaced `UserSessionService.authenticateUserByRequest`)
- `TokenService` and `DeviceFingerprintService` extracted from `UserSessionService`

---

## [2.5] — 2026-03-05 / 2026-03-06

### Added
- AI Chatbot with RAG (Retrieval-Augmented Generation), full admin panel, and frontend integration
- WebSocket infrastructure: generic `WSManager`, `useWebSocket` hook, `ws` dependency
- Chatbot migrated to WebSocket with streaming responses and persistent session support
- Chatbot admin: stats widget, user ban/unban system with session close detection
- `ChatSession` and `ChatMessage` models added to Prisma schema
- GET endpoint to fetch full chat session history
- Live viewer count feature using Redis sorted-set heartbeat
- Smart recommendations component: similar posts API, knowledge-graph-based matching
- Search autocomplete with keyboard navigation, text highlight, and ARIA accessibility attributes
- GEO analytics: `countryCode` field in `GeoAnalytics` schema, Redis caching, `ip-api.com` fallback
- GeoHeatmap stats panel added to footer/status button
- API Key management: create, list, revoke, and authenticate via personal API keys
- `ApiKeysTab` added to user settings page
- `ApiKey` model added to Prisma schema
- Post series feature (`post_series` i18n key, series data model and UI)
- Zustand global store: `migrate` and `onRehydrateStorage` lifecycle handlers

### Changed
- `ChatbotService` split into sub-services: `session`, `admin`, `moderation`, `RAG`
- Chatbot UI split into hooks and partial components; `FlowingAIWhatsAppButton` rename
- `ChatInput` and `ChatMessageList` extracted as reusable components
- Short-link redirect prefix corrected to `/s/` in middleware config matcher
- `TableToolbar` refactored to accept a `buttons` array for multiple action buttons

### Removed
- Redundant chatbot button removed from `Navbar` (`ScrollToTop` simplified)

---

## [2.4] — 2026-03-02 / 2026-03-05

### Added
- `ARCHITECTURE.md`, `PLAN.md`, and `RULES.md` documentation files
- Scheduled post publishing (draft → scheduled → published pipeline)
- Short link management page (`(my-links)/my-links`)
- Session management UI for users (view and revoke active sessions)
- `back_to_site`, `sessions`, and `post_series` i18n keys; Spanish translation fixes

### Changed
- Short links implementation consolidated (duplicate commits resolved)
- `build: next env` configuration tuned for production deployment

---

## [2.3] — 2026-02-26 / 2026-03-01

### Added
- RTL (right-to-left) layout support
- New locale additions and language reordering in the supported-locales config
- Country-level geo-restrictions for certain locales
- Post sharing functionality
- Email campaign feature (draft → sending → sent pipeline)
- Missing i18n key checker script (`check-missing-key`)
- New i18n structure with centralised dictionary validation tooling

### Changed
- i18n dictionary restructured for maintainability
- AI and storage service internal structures fixed
- Modal pages compressed for code size reduction
- General code cleanup pass

### Fixed
- Proxy configuration corrected
- Language codes normalised across the config

---

## [2.2] — 2026-02-24 / 2026-02-25

### Added
- PWA (`manifest.webmanifest`, service worker `sw.js`) support
- Testimonials section and service
- Canonical URL tags for all public pages
- Notification bell in the frontend UI
- User settings page (preferences, profile editing)
- Multilingual routing: locale-prefixed paths implemented across all public pages
- Multilingual Blog, Projects, Categories, and link components
- WCAG AA 3.2 accessibility compliance: navbar, sidebar, and footer elements (focus order, focus visibility — criteria 2.4.3)

### Fixed
- Language codes normalised
- Sidebar rendering issues resolved
- Multilingual variable interpolation fixed

---

## [2.1] — 2026-02-20 / 2026-02-23

### Added
- New admin dashboard pages
- Admin table grid view
- New analytics page
- Appointments table page
- Media manager (file browser, upload, metadata editing)
- Draft manager
- New admin navbar

### Added (User Features)
- User profile pages (`/users/[username]`)

### Fixed
- i18n key lookups in admin and user pages
- Import path errors resolved
- Formatter passes: console.log cleanup, import ordering, bulk comment cleanup

---

## [2.0] — 2026-01-29 / 2026-02-12

### Added
- Project detail page with breadcrumb navigation
- Projects SEO (JSON-LD, Open Graph)
- Blog SEO pass (canonical, OG metadata for posts)
- Table of contents (ToC) generator for long-form posts
- `articleBody` JSON-LD schema for blog posts
- `WebSite` + `SearchAction` JSON-LD schema
- Preconnect hints for external resources

### Changed
- Font updated (new typeface and wallpaper)
- UI style passes (spacing, colour tweaks)
- SSR pre-rendering layout adjustments

### Fixed
- SEO metadata inconsistencies across pages
- User profile page rendering errors
- User security validation edge cases
- Category page routing and rendering
- Build errors resolved; `post.updatedAt` removed from public schema

---

## [1.9] — 2025-12-22 / 2026-01-08

### Added
- Comprehensive i18n pass: all admin, auth, common, and frontend components fully translated
- `AppointmentCalendar` and `AppointmentModal` translation support
- `OTPTab` 2FA settings translation support
- Knowledge Graph 3D viewer translations
- New DTO layer: Zod schemas + inferred types for all API inputs/outputs (`dtos/`)
- `messages/` folder introduced: per-domain error/success string maps (no inline strings in services)
- New global TypeScript types in `types/`
- New i18n dictionary keys for appointments, blog feed, article dates, comments

### Changed
- Folder structure reorganised to match architecture conventions (`services/`, `libs/`, `dtos/`, `messages/`)
- All remaining `console.log` statements cleaned

---

## [1.8] — 2025-12-16 / 2025-12-22

### Added
- TOTP (Time-based OTP) 2FA setup and verification flow
- Full email OTP support (6-digit codes, expiry, retry)
- OTP change and management pages
- Security settings tab in user settings
- Preferences page and corresponding API endpoint
- Extended user schema: 2FA fields, preferences, security metadata
- `sec: vibe coding fix` — sanitisation and validation hardening pass

### Changed
- Login authentication refactored to support multi-factor flows
- User settings pages restructured into tabs (profile, security, preferences)

---

## [1.7] — 2025-12-08 / 2025-12-16

### Added
- Admin reports dashboard with smart stats widgets
- Cron job scheduler (`CronService`) for background maintenance tasks
- Appointment email templates (booking confirmation, cancellation, reminder)
- Nodemailer-based mail templating system
- Auto comment approval policy configurable per post

### Changed
- README updated with setup and deployment instructions
- Auth redirect flow improved post-login

### Fixed
- Mobile layout rendering issues resolved
- CORS configuration tightened

---

## [1.6] — 2025-12-01 / 2025-12-08

### Added
- Upgrade to **Next.js 16** and **Prisma 7**
- Global Visitors Heatmap (`GeoHeatmapService`, world-map visualisation)
- System status page with i18n support
- GEO analytics service with IP-to-location pipeline
- Newsletter subscription management
- RSS feed endpoint (`/[lang]/feed.xml`)
- Sitemap service (`SitemapService`) with dynamic generation
- `robots.txt` and `llm.txt` added to `public/`
- Full-text search for posts (PostgreSQL `tsvector`)
- Draft memory / auto-save for post editing
- `feat: new structure and react2shellfix` — App Router restructure

### Removed
- Multisite feature rolled back (disabled pending redesign)
- Unused GitHub/GitLab integration services removed

---

## [1.5] — 2025-10-28 / 2025-11-30

### Added
- New locale added; `robots.txt` and `llm.txt` updated for search crawlers
- Sitemap fixes (multiple iterations)
- Typing effect animation improvements on the hero section
- Dynamic component loading for heavy 3D widgets

### Fixed
- Auth flow stability issues (multiple attempts; session token handling)
- New cover image upload and rendering
- Multi-bug fixes tracked across October–November

---

## [1.4] — 2025-10-14 / 2025-10-15

### Added
- Knowledge Graph: local WASM embeddings via `@xenova/transformers`, 3D visualisation, Redis caching
- GeoHeatmap UI component (initial pass)
- Reading progress bar for blog posts
- System status indicator component
- Lazy loading for heavy GeoMap and Three.js components
- Global TypeScript types module (`types/`)
- Initial Jest test suite (not final)

### Changed
- ESLint configuration cleaned and errors resolved
- `console.log` statements removed project-wide (QA pass)
- MIME type validation added for file uploads (`sec: MIME check`)
- Prisma client import paths corrected

### Dependencies
- `nodemailer` bumped from `6.9.16` → `7.0.7`
- `axios` bumped from `1.8.4` → `1.12.2`

---

## [1.3] — 2025-10-12 / 2025-10-13

### Added
- Appointment booking system (slot selection, booking, cancellation)
- New public-facing pages
- Font changed to Bookerly

---

## [1.2] — 2025-09-05 / 2025-09-10

### Added
- Sitemap generation (initial implementation)
- New UI features and page components

### Changed
- Font changed to Bookerly for improved readability

---

## [1.1] — 2025-07-03

### Added
- Post like API and service logic
- `PostLike` and related schema migrations
- Slack and WeChat SSO providers (total: 11 SSO providers)
- Post header redesigned with like button and new styling

### Refactored
- SSO services centralised and cleaned up
- `AWSService` removed; storage routes updated to use pluggable `StorageService`
- Integration, social, storage, and user-agent modules reorganised
- Frontend components updated for consistency
- Session services and layout integration adjusted

### Removed
- Unused utility functions and deprecated schema fields cleaned up

---

## [1.0] — 2025-06-07 / 2025-06-26

### Added
- Appointment calendar application (slot-based scheduling UI)
- Calendar redirect flow
- `CalendarService` with full booking logic
- Zod schemas for calendar/appointment DTOs
- Redis-backed counters and state management for appointments
- Form validation across all user-facing forms

---

## [0.9] — 2025-05-06 / 2025-05-23

### Added
- Password reset flow (forgot password → email → reset)
- Post admin view (rich editor, preview, publish controls)
- JWT refresh and new service abstractions (`UserSessionService`)
- Skills/tools showcase section on the personal portfolio page
- Date appended to post slugs for uniqueness
- Skill and toolbox editing in admin

### Fixed
- Static directory removed; assets moved under `public/` (Next.js convention)
- Security vulnerabilities in session handling resolved
- Build errors from prior dependency update resolved

---

## [0.8] — 2025-04-16 / 2025-04-28

### Added
- Rate limiting middleware (`rateLimit.ts`) backed by Redis (`INCR` + `EXPIRE` per IP/route)
- i18n refactoring and string cleaning pass
- Adjustments to admin UI layout and settings

### Changed
- Upgraded to **Next.js 15**
- Terminal easter egg added to the developer tools section

### Dependencies
- `axios` bumped from `1.7.9` → `1.8.4`
- `@babel/runtime` bumped from `7.26.0` → `7.27.0`

---

## [0.7] — 2025-03-18 / 2025-03-26

### Added
- Denial-of-service protection middleware (request body size limits, connection throttling)

### Fixed
- Project showcase page rendering errors
- Fatal error on image cover generation resolved (two separate attempts)

### Dependencies
- Dependency security updates via Dependabot

---

## [0.6] — 2025-02-03 / 2025-02-19

### Added
- System settings admin panel (site-wide configuration keys)
- SEO settings in admin
- Auto-generated Open Graph images for posts and pages
- Google Tag Manager integration
- New timeline section on the portfolio landing page
- New public pages

### Fixed
- Only PNG and JPG formats allowed for OG image uploads
- `post.updatedAt` removed from public-facing API responses
- Users admin table display bug corrected
- Post status transition logic corrected
- API `/users` endpoint secured against unauthenticated access
- Prisma migration conflicts resolved

---

## [0.5] — 2025-01-01 / 2025-01-29

### Added
- Projects and comments full implementation
- "My Links" short-link management page (`(my-links)/my-links`)
- Transparent navbar on the landing page hero section
- New welcome background and hero transparency effects
- New UI widgets with configurable colours

### Changed
- Dynamic blog post header replaced with a static layout
- SEO query optimisations (multiple passes)
- Sitemap temporarily disabled while rebuild was in progress

### Fixed
- AWS S3 filename encoding bug
- SEO meta element inconsistencies
- Comment threading and display bugs
- Missing spacing in text rendering

---

## [0.4] — 2024-12-07 / 2024-12-31

### Added
- Blog feed implementation (paginated post list, category filtering)
- Session policy enforcement and newsletter subscription integration
- Hero image / video component for the landing page
- Theme fix: view count display per post
- New page components and layout sections

### Changed
- Multiple iterative "Several Updates" passes: routing, data fetching, layout
- Dynamic project pages operational

---

## [0.3] — 2024-11-21 / 2024-12-07

### Added
- New public pages scaffolded
- New reusable UI components
- Middleware fixed and stabilised (CORS configuration, header validation)
- Dictionary i18n files seeded for multiple locales

### Fixed
- Build errors resolved; project marked "ready to take off"
- Image component server-side rendering issues

---

## [0.2] — 2024-10-31 / 2024-11-20

### Added
- AI service layer scaffolded (`libs/openai/`, multi-provider stubs)
- Authentication foundation: session creation, JWT signing/verification
- Database schema expanded with new models and relationships
- Placeholder `{commit_message}` resolved; first coherent service integrations

### Changed
- Category model schema updated
- Big refactoring pass across auth, admin, and database layers

---

## [0.1] — 2024-10-14

### Added
- **Initial V2 commit**: project bootstrapped with Next.js App Router, TypeScript strict mode, Prisma ORM, and PostgreSQL
- Base Prisma schema with core models (User, Post, Category, Project, Session)
- App Router folder structure: `(frontend)`, `(api)`, `(auth)`, `(admin)`, `(short)`, `(my-links)`
- Root layout, `not-found` page, and `globals.css`
- Tailwind CSS and DaisyUI configured
- `tsconfig.json` with strict TypeScript flags (`noImplicitAny`, `noUnusedLocals`, `isolatedModules`)
- Initial V2 rebase from previous V1 codebase

---

*Generated on 2026-03-09 based on git history (460+ commits, Oct 2024 – Mar 2026).*
