# KurayDevSite — Personal Website & Full Digital Presence Platform

Welcome to the source code of **Kuray Karaaslan's** full-stack personal platform. This project is far more than a simple portfolio — it is a complete, production-grade system featuring a blog engine, AI-powered chatbot with RAG, appointment scheduling, WebAuthn/Passkey authentication, email campaigns, real-time analytics, knowledge graph visualization, and a comprehensive admin dashboard.

This repository powers **kuray.dev**, the central hub for my projects, content, services, and experiments.

**Project start:** October 2024  
**Current version:** v2.7 (March 2026)  
**Total commits:** 460+

---

## 🚀 Overview

KurayDevSite is built on **Next.js 16**, **React 19**, **Prisma 7**, and a fully modular service architecture. It integrates complex backend systems such as:

- Prisma ORM (PostgreSQL) with full-text search (`tsvector`)
- Redis caching, rate limiting, and real-time counters
- BullMQ workers for background tasks
- WebSocket + SSE real-time infrastructure
- AI Chatbot with RAG (Retrieval-Augmented Generation)
- Multi-provider SSO authentication (11 providers)
- WebAuthn / Passkey passwordless login
- TOTP & Email OTP two-factor authentication
- Email campaigns with topic-based targeting
- Appointment & booking system with Redis slot management
- Knowledge Graph with WASM embeddings and 3D visualization
- Full admin dashboard with CRUD operations and data export
- Internationalization (26 languages with RTL support)
- SEO-optimized dynamic sitemaps & RSS feeds
- Advanced GEO analytics with live viewer tracking

The project is designed to be **high-performance**, **secure**, and **scalable**, suitable for future SaaS extensions.

---

## 📸 Screenshot

![kuray.dev](/public/kuraydev.gif)

*(GIF captured previously — the live platform evolves continuously.)*

---

## 🌐 Live Demo

Visit the live site: **[https://kuray.dev](https://kuray.dev)**

---

## ✨ Key Features

### 🖥️ Frontend

- Fully responsive UI built with **Tailwind CSS** + **DaisyUI**
- **Dark/Light mode** with theme persistence
- **26 language support** (EN, TR, DE, NL, AR, HE, JA, ZH, and more)
- **RTL (right-to-left) layout support** for Arabic, Hebrew, etc.
- **PWA support** (`manifest.webmanifest`, service worker)
- **Hero sections**, services, testimonials, toolbox, timeline, and dynamic project showcases
- **3D & 2D Knowledge Graph** visualizations with Three.js
- **Reading progress bar**, share buttons, table of contents
- **Search autocomplete** with keyboard navigation and ARIA accessibility
- **Notification bell** and cookie consent banner
- **GeoHeatmap** with live visitor visualization

### 🧭 Blog System

- Rich WYSIWYG editing (TinyMCE) with map embed support
- **Full-text search** using PostgreSQL `tsvector`
- Categories, related articles, AI-powered smart recommendations
- Comments with auto-moderation policy
- **Post series** feature for multi-part content
- **Scheduled publishing** (draft → scheduled → published)
- Per-post stats, likes, sharing with auto-generated short links
- **ContentScoreBar** for real-time SEO / content quality scoring
- **Draft auto-save** functionality
- Fully cached sitemap + RSS feed generation

### 🤖 AI Chatbot

- **RAG (Retrieval-Augmented Generation)** with embeddings and vector similarity
- WebSocket transport with **SSE fallback**
- Persistent chat sessions with full history
- Admin panel: stats widget, user ban/unban, session management
- Page context awareness for relevant responses

### 📅 Appointment & Booking System

- Redis-powered time slot generation & storage
- Templates for recurring weekly schedules
- Atomic booking with Prisma transactions
- Email confirmations, cancellation, and reminders
- Admin calendar management tools

### 🔐 Authentication & Security

- Email/password login
- **WebAuthn / Passkey** passwordless authentication with Conditional UI
- **TOTP (Time-based OTP)** and **Email OTP** two-factor authentication
- **Trusted device fingerprinting** — skip OTP for known devices
- **11 SSO providers**: Google, GitHub, Microsoft, LinkedIn, Apple, Slack, TikTok, Twitter, Autodesk, WeChat, and more
- **reCAPTCHA v2** server-side verification
- Geo-based suspicious activity alerts
- Rate limiting backed by Redis
- CSRF, security headers, MIME validation
- **`crypto.randomInt`** for secure OTP generation

### 📧 Email Campaigns & Newsletter

- Campaign pipeline: draft → sending → sent
- **Topic preferences** (blogDigest, announcements, events)
- Recipient filtering by subscription topic
- Transactional email templates (Nodemailer + EJS)

### 🔗 Short Links

- Short-link management page (`/my-links`)
- Per-post short-link generation
- Click analytics and tracking
- Redirect handler (`/s/[code]`)

### 🔑 API Key Management

- Personal API keys: create, list, revoke
- **Daily / monthly quota enforcement** via Redis counters
- API key authentication for external integrations

### 📦 Integrations

- Pluggable storage: **AWS S3 / Cloudflare R2 / MinIO**
- Expanded file types: video, audio, documents, archives
- **EXIF metadata stripping** on upload
- Twilio, NetGSM, Nexmo, Clickatell SMS providers
- OpenAI GPT-4o & DALL-E endpoints

### 📊 Analytics

- **Live viewer count** via Redis sorted-set heartbeat
- GEO analytics: IP-to-location pipeline with Redis caching
- `countryCode` tracking with `ip-api.com` fallback
- User-agent parsing (browser, OS, device groups)
- Admin dashboard with smart stats widgets
- GeoHeatmap with world-map visualization

### 🛠️ Admin Panel

Comprehensive CRUD modules with:

- **Sortable columns** with URL persistence
- **Data export** (CSV / XLSX / PDF) on all list pages
- **Multi-type file preview** with kind icons
- Projects, Posts, Categories, Users, Comments
- Media manager with file browser and metadata editing
- Appointments table and calendar management
- Settings, Slots & slot templates
- Reports dashboard with analytics
- Draft manager
- API keys management

---

## 🧱 Technologies

### Frontend

- **Next.js 16** (App Router)
- **React 19**
- **Tailwind CSS + DaisyUI**
- **Three.js** for 3D visualizations
- **Zustand** (global store with migration support)
- **@xenova/transformers** (WASM embeddings)
- **@simplewebauthn** (Passkey support)

### Backend

- **Prisma 7** (PostgreSQL 16)
- **Redis (ioredis)** for caching, rate limiting & real-time
- **BullMQ** for async workers
- **ws** for WebSocket infrastructure
- **Nodemailer + EJS** templates
- **Zod** DTOs with `safeParse` validation
- Multi-provider OAuth

### DevOps & Tooling

- Jest test suite
- ESLint + TypeScript strict mode
- i18n key checker script (`npm run check-missing-key`)
- Winston logging

---

## 📦 Project Structure

A deeply modular, service-oriented architecture:

```
app/           → Frontend pages + API routes (Route Groups)
services/      → All backend logic (Auth, Chatbot, Post, Campaign, GEO, Storage…)
components/    → Reusable UI & admin components
dtos/          → Zod schemas + inferred types for all API inputs/outputs
messages/      → Per-domain error/success string maps
views/email/   → EJS email templates
prisma/        → DB schema + migrations
libs/          → Shared utilities (Redis, WebSocket, i18n, axios…)
dictionaries/  → 26 language files
types/         → Global TypeScript type declarations
tests/         → Test coverage for services
```

---

## 🛣️ Roadmap

### ✅ Completed Phases (v0.1 – v2.7)

| Phase | Version | Highlights |
|-------|---------|------------|
| Foundation | v0.1-v0.3 | Next.js 14, TypeScript strict, Prisma, middleware stack, i18n infrastructure |
| Content & SEO | v0.4-v0.6 | Blog, projects, OG images, GTM, admin panel |
| Security Hardening | v0.7-v0.9 | Rate limiting, Next.js 15, password reset, JWT refresh |
| Appointment Platform | v1.0-v1.2 | Slot booking, Redis state, 11 SSO providers, pluggable storage |
| Knowledge Graph | v1.3-v1.5 | WASM embeddings, 3D visualization, GeoHeatmap, full-text search |
| Platform Restructure | v1.6 | Next.js 16, Prisma 7, RSS feed, sitemap service, newsletter |
| 2FA & Mail | v1.7-v1.8 | TOTP, Email OTP, cron scheduler, email templates |
| Architecture Refactor | v1.9 | DTO layer, messages folder, comprehensive i18n pass |
| SEO Polish | v2.0-v2.1 | JSON-LD schemas, ToC generator, admin dashboard redesign |
| PWA & Accessibility | v2.2-v2.3 | PWA support, WCAG AA compliance, RTL support, 26 locales |
| Campaign & Short Links | v2.4 | Email campaigns, short-link system, session management |
| AI Chatbot & Real-Time | v2.5 | RAG chatbot, WebSocket, live viewer count, API keys |
| Auth Hardening | v2.6 | Auth redesign, cookie consent, SSE fallback, service extraction |
| Passkeys & Export | v2.7 | WebAuthn, reCAPTCHA, trusted devices, data export, content scoring |

### 🔜 Upcoming Phases

| Phase | Target | Goals |
|-------|--------|-------|
| Test Coverage | Q2 2026 | >80% unit test coverage, CI test gating |
| Performance | Q2 2026 | Sub-2s LCP, bundle optimization, RSC conversion |
| Mobile & Push | Q3 2026 | Web Push notifications, offline support, React Native exploration |
| Developer Showcase | Q3 2026 | GitHub widgets, tech-stack charts, case study pages |
| AI Content | Q3 2026 | AI writing assistant, auto-tagging, personalized feed |
| Personal Branding | Q4 2026 | Dynamic CV generator, certifications gallery, social cross-posting |
| Freelancer Services | Q4 2026 | Service packages, lead capture, availability indicator |
| Client Portal | Q1 2027 | Proposal builder, client onboarding, milestone tracking |
| Billing & Retainers | Q1 2027 | Invoice generation, Stripe integration, capacity planning |
| Reputation & Referrals | Q2 2027 | Case studies, testimonial collection, referral system |

---

## 🏗️ Architecture Principles

| Principle | Implementation |
|-----------|---------------|
| **Type safety** | TypeScript strict, Zod on every boundary, zero `any` |
| **Layered architecture** | Route handlers → Services → Prisma / Redis |
| **Security by default** | CSRF, rate limiting, security headers, bcrypt, `crypto.randomInt`, MIME checks |
| **i18n-first** | All UI strings in dictionary files; 26 locales kept in sync |
| **Pluggable providers** | Storage, AI, SMS, and email providers are swappable |
| **Observability** | Winston logs every service error; Redis + BullMQ surface queue health |
| **Privacy by design** | First-party analytics, opt-in tracking, GDPR-compliant cookie consent |
| **Portfolio-grade quality** | Target ≥95 Lighthouse score on all metrics |

---

## 🔧 Installation

```bash
git clone https://github.com/kuraykaraaslan/KurayDevV2.git
cd KurayDevV2
npm install
npm run dev
```

### Requirements

- Node.js 20+
- PostgreSQL 16
- Redis 7+
- Environment variables (see `.env.example`)

### Key Scripts

```bash
npm run dev              # Start development server
npm run build            # Production build
npm run start            # Start production server
npm run test             # Run Jest tests
npm run check-missing-key # Check for missing i18n keys
```

---

## 📜 License

This project is shared **for educational and inspirational purposes only**.

You may study the structure, ideas, and architecture — but you **cannot copy, reuse, or redistribute** any part of the codebase or designs.

A friendly developer-to-developer request:
Please respect the effort behind this platform.

---

If you'd like help building a similar system or want to collaborate, feel free to reach out via **kuray.dev/contact**.

---

*Last updated: 2026-03-09 · v2.7*
