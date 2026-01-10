# KurayDevV2 — Personal Website & Full Digital Presence Platform

Welcome to the source code of **Kuray Karaaslan’s** full-stack personal platform. This project is far more than a simple portfolio — it is a complete, production‑grade system featuring a blog engine, appointment scheduling, email/SMS notification pipelines, analytics, multi-language support, knowledge graph, AI assistants, 3D/2D visualization, and a modular admin dashboard.

This repository powers **kuray.dev**, the central hub for my projects, content, services, and experiments.

---

## 🚀 Overview

KurayDevV2 is built on **Next.js 16**, **React 19**, and a fully modular service architecture. It integrates complex backend systems such as:

* Prisma ORM (PostgreSQL)
* Redis caching
* BullMQ workers
* Multi-provider SSO authentication
* Email & SMS pipelines (Nodemailer + providers)
* AI endpoints (OpenAI GPT‑4o, DALL‑E)
* Appointment & booking system with Redis slot management
* Knowledge Graph (2D & 3D)
* Full admin dashboard with CRUD operations
* Internationalization (10+ languages)
* SEO‑optimized dynamic sitemaps & RSS
* Advanced analytics (GeoIP + UA parsing)

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

* Fully responsive UI built with **Tailwind CSS** + **DaisyUI**
* **Dark/Light mode** with theme persistence
* **Multi-language support** (EN, TR, DE, NL, GR, MT, TH, ET, UK)
* **Hero sections**, services, testimonials, toolbox, timeline, and dynamic project showcases
* **3D & 2D Knowledge Graph** visualizations
* **3JS / Three.js scenes** used in multiple components
* **Confetti animations**, offline indicators, Geo heatmap overlays
* **TTS-ready article structure**, share buttons, reading progress

### 🧭 Blog System

* Rich WYSIWYG editing (TinyMCE)
* Categories, related articles, comments (with auto-moderation)
* AI-assisted writing tools in the admin panel
* Per-post stats, likes, user profiles
* Fully cached sitemap + RSS feed generation

### 📅 Appointment & Booking System

* Redis-powered time slot generation & storage
* Templates for recurring weekly schedules
* Atomic booking with Prisma transactions
* Email confirmations & update pipelines
* Admin calendar management tools

### 🔐 Authentication & Security

* Email/password login
* **SSO providers**: Google, GitHub, Microsoft, LinkedIn, Apple, Slack, TikTok, Twitter, Autodesk, WeChat
* OTP (2FA) support
* Geo-based suspicious activity alerts
* SQL injection prevention layer
* Global rate limiter

### 📦 Integrations

* AWS S3 file uploads
* GitHub & GitLab widget integrations
* Twilio, NetGSM, Nexmo, Clickatell SMS providers
* OpenAI GPT‑4o & DALL‑E endpoints

### 📊 Analytics

* GeoIP resolution (MaxMind)
* User‑agent parsing (browser, OS, device groups)
* Admin dashboard with weekly digests
* Live system health/status widgets

### 🛠️ Admin Panel

Comprehensive CRUD modules:

* Projects
* Posts
* Categories
* Users
* Comments
* Settings
* Slots & slot templates
* Integrations
* Statistics overview

---

## 🧱 Technologies

### Frontend

* **Next.js 16**
* **React 19**
* **Tailwind CSS + DaisyUI**
* Three.js
* Zustand (global store)

### Backend

* **Prisma ORM** (PostgreSQL 16)
* **Redis (ioredis)** for caching & queueing
* **BullMQ** for async workers
* Nodemailer + EJS templates
* OpenAI API
* Multi-provider OAuth

### DevOps & Tooling

* Jest test suite
* ESLint + TypeScript
* GitHub integrations

---

## 📦 Project Structure

A deeply modular, service-oriented architecture organized under:

* `app/` — Frontend + API routes
* `services/` — All backend logic (Auth, Appointment, Posts, Notification, AI, Integrations…)
* `components/` — Reusable UI & admin components
* `views/email/` — EJS email templates
* `prisma/` — DB schema + migrations
* `tests/` — Full test coverage for all services

(Full directory tree shown in the prompt.)

---

## 🛣️ Roadmap

To provide a clearer high‑level direction, here are the strategic goals that guide the platform's evolution. The roadmap is organized by category and priority to balance technical excellence with user value.

---

### 🎯 **Content & Community Features**

#### **High Priority**
- [ ] **Newsletter System Enhancement**
  - Segment-based email campaigns (by interest, category, engagement)
  - A/B testing for subject lines
  - Newsletter templates with drag-drop builder
  - Auto-digest personalization per user preferences

- [ ] **Comment System v2**
  - Threaded/nested comments
  - Reaction system (helpful, insightful, etc.)
  - Comment voting & sorting (top/controversial/newest)
  - Moderator tools (pin, highlight, mark as answer)

- [ ] **Content Recommendation Engine**
  - ML-based "You might also like" (based on reading history)
  - Trending articles algorithm
  - Personalized homepage feed
  - Cross-category recommendations

#### **Medium Priority**
- [ ] User-Generated Content (guest posts, code sharing)
- [ ] Content Versions & History (revision tracking, diff viewer)
- [ ] Podcast/Video Integration (audio posts, transcript generation)

---

### ⚡ **Performance & Technical Improvements**

#### **High Priority**
- [ ] **Edge Computing Migration**
  - Cloudflare Workers/Vercel Edge Functions for critical paths
  - Geo-distributed read replicas
  - Edge caching strategy for static content

- [ ] **Image Optimization Pipeline**
  - Automatic WebP/AVIF conversion
  - Responsive image generation (srcset)
  - Lazy loading with blur placeholders
  - CDN integration (Cloudinary/Imgix)

- [ ] **Database Optimization**
  - Query performance monitoring
  - Index optimization analysis
  - Read replica setup for analytics
  - Connection pooling enhancements

#### **Medium Priority**
- [ ] Advanced Caching Strategy (multi-tier caching)
- [ ] Bundle Size Optimization (route-based code splitting)
- [ ] Admin RSC Optimization (server-side render isolation)

---

### 💰 **Monetization & SaaS Transformation**

#### **High Priority**
- [ ] **Premium Content System**
  - Paywall for premium articles
  - Membership tiers (free/pro/enterprise)
  - Stripe/Paddle integration
  - Subscription management dashboard

- [ ] **Digital Products Marketplace**
  - E-book/course sales
  - Template/code snippet marketplace
  - Licensing system
  - Download delivery & DRM

#### **Medium Priority**
- [ ] Sponsorship System (sponsored posts, banner ads, affiliate tracking)
- [ ] Multi-Tenant SaaS Mode (white-label, per-tenant customization)

---

### 🤖 **AI & Automation**

#### **High Priority**
- [ ] **AI Content Assistant v2**
  - Auto-tagging & categorization
  - SEO optimization suggestions
  - Readability score & improvements
  - Grammar & style checking
  - Meta description generation

- [ ] **Smart Search with Vector DB**
  - Semantic search using embeddings
  - Hybrid search (keyword + vector)
  - Search autocomplete with AI
  - Natural language queries

- [ ] **Chatbot for Site Navigation**
  - AI assistant for visitors
  - Context-aware responses
  - Integration with Knowledge Graph
  - Multi-language support

#### **Medium Priority**
- [ ] Auto Content Generation (summaries, social posts, alt-text)
- [ ] Intelligent Scheduling (AI-suggested appointment times)
- [ ] Sentiment Analysis (comment sentiment, engagement prediction)

---

### 🛠️ **Developer Experience**

#### **High Priority**
- [ ] **Developer API (Public)**
  - RESTful API v2 with OpenAPI docs
  - GraphQL endpoint option
  - Webhook system for events
  - API playground (Swagger/Redoc)

- [ ] **CLI Tool**
  - Content management from terminal
  - Deployment scripts
  - Database migration helpers
  - Local dev environment setup automation

#### **Medium Priority**
- [ ] Plugin System (custom middleware, hook system, theme marketplace)
- [ ] Enhanced Testing (E2E, visual regression, performance benchmarking)
- [ ] Developer Documentation Site (architecture diagrams, tutorials)

---

### 🎯 **User Experience**

#### **High Priority**
- [ ] **Progressive Web App (PWA)**
  - Offline reading mode
  - Install prompt
  - Background sync
  - Push notifications

- [ ] **Reading Experience Enhancement**
  - Distraction-free reading mode
  - Adjustable font size/family
  - Night mode optimization
  - Reading time estimates
  - Progress saving (resume where you left off)

- [ ] **Personalization Dashboard**
  - User preference center
  - Notification settings granularity
  - Custom homepage layout
  - Reading list/bookmarks

#### **Medium Priority**
- [ ] Gamification (badges, reading streaks, leaderboards)
- [ ] Social Features (follow users, activity feed, mentions)
- [ ] Accessibility (a11y) compliance (WCAG AA)

---

### 🔒 **Security & Compliance**

#### **High Priority**
- [ ] **Security Hardening**
  - Content Security Policy (CSP) strict mode
  - CSRF token rotation
  - Rate limiting per endpoint
  - DDoS protection strategy

- [ ] **Privacy Enhancements**
  - Cookie consent management
  - GDPR compliance automation
  - Data export/deletion requests
  - Privacy-first analytics

- [ ] **Audit Logging**
  - Admin action logs
  - Security event tracking
  - Compliance report generation
  - Suspicious activity alerts

#### **Medium Priority**
- [ ] Backup & Disaster Recovery (automated backups, point-in-time recovery)

---

### 📊 **Analytics & Insights**

#### **High Priority**
- [ ] **Advanced Analytics Dashboard**
  - Real-time visitor tracking
  - Conversion funnel analysis
  - Cohort analysis
  - Retention metrics
  - Revenue analytics

- [ ] **Content Performance Insights**
  - Scroll depth tracking
  - Time-on-page heatmaps
  - Click tracking
  - Content decay detection
  - A/B testing framework

- [ ] **SEO Performance Monitor**
  - Google Search Console integration
  - Ranking tracker
  - Backlink monitor
  - Core Web Vitals tracking

#### **Medium Priority**
- [ ] Business Intelligence (custom report builder, data warehouse integration)
- [ ] Email Deliverability Monitor (warm-up score, bounce analytics)

---

### 🌍 **Internationalization**

#### **Medium Priority**
- [ ] **Auto-Translation Enhancement**
  - AI-powered translation with DeepL/GPT
  - Translation quality scoring
  - Multi-language SEO optimization
  - RTL language support (Arabic, Hebrew)

- [ ] **Geo-Specific Content**
  - Location-based content recommendations
  - Currency localization
  - Regional pricing
  - Local event calendars

---

### 🎮 **Experimental & Advanced**

#### **Low Priority (Long-term Vision)**
- [ ] **AR & 3D Portfolio Viewer** — Web-based AR mode + interactive 3D scenes
- [ ] **IoT Dashboard Integration** — Real-time device tracking for FastIoT / Roltek SaaS
- [ ] **Blockchain Integration** — NFT certificates, crypto payments, content provenance
- [ ] **Voice Interface** — Voice search, text-to-speech, voice commands
- [ ] **VR/AR Showcase** — WebXR portfolio viewer, virtual office tours
- [ ] **Collaborative Features** — Real-time co-editing, live streaming, virtual events
- [ ] **Desktop App** — Tauri-based desktop version
- [ ] **Open-source UI Library** — KurayUI component library
- [ ] **Session Replay Analytics** — Privacy-safe user session recording

---

### 📋 **Priority Matrix**

#### **Q1 2026 - Immediate Focus**
1. Newsletter System Enhancement
2. Premium Content System
3. AI Content Assistant v2
4. PWA Implementation
5. Advanced Analytics Dashboard

#### **Q2 2026 - Medium-term**
1. Developer API (Public)
2. Smart Search with Vector DB
3. Comment System v2
4. Image Optimization Pipeline
5. Security Hardening

#### **Q3-Q4 2026 - Long-term**
1. Multi-Tenant SaaS Mode
2. Plugin System
3. Chatbot Integration
4. Advanced Caching Strategy
5. Content Recommendation Engine

---

### 🚧 **Completed Milestones**

* [x] Multi-language UI (10+ languages)
* [x] Advanced blog engine with AI helpers
* [x] Appointment scheduling system
* [x] Knowledge Graph (2D + 3D visualizations)
* [x] AI integrations (GPT-4o, DALL-E)
* [x] Weekly admin analytics & digests
* [x] Full admin dashboard migration
* [x] Redis-powered queue system (BullMQ)
* [x] Multi-provider SSO authentication

---

A constantly evolving platform — the roadmap reflects both technical expansion and creative direction, balancing innovation with practical business value

---

## 🔧 Installation

```bash
git clone https://github.com/kuraykaraaslan/KurayDevV2.git
cd KurayDevV2
npm install
npm run dev
```

Ensure PostgreSQL, Redis, and environment variables are configured.

---

## 📜 License

This project is shared **for educational and inspirational purposes only**.

You may study the structure, ideas, and architecture — but you **cannot copy, reuse, or redistribute** any part of the codebase or designs.

A friendly developer-to-developer request:
Please respect the effort behind this platform.

---

If you'd like help building a similar system or want to collaborate, feel free to reach out via **kuray.dev/contact**.
