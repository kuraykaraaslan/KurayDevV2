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

To provide a clearer high‑level direction, here are the **Top 10 Roadmap Goals** that guide the platform’s evolution:

### 🔟 Top 10 Roadmap Goals

1. **Accessibility Overhaul (WCAG AA)** — Full keyboard nav, screen‑reader labels, focus rings, contrast audit.
2. **Public REST API (`/api/v2`)** — Versioned, documented, rate‑limited API for external integrations.
3. **AR & 3D Portfolio Viewer** — Web‑based AR mode + interactive 3D scenes for projects.
4. **IoT Dashboard Integration** — Real‑time device tracking for FastIoT / Roltek SaaS with charts & maps.
5. **Auto‑Translation Pipeline** — Background worker translating all blog posts into supported languages.
6. **Email Deliverability Monitor** — Warm‑up score, bounce analytics, reputation tracker.
7. **Browser & Desktop Notifications** — Push subscription + article update alerts.
8. **Recurring Appointment Scheduling** — Multi‑interval booking, rescheduling UI, conflict detection.
9. **Admin RSC Optimization** — Reduce bundle size, server‑side render isolation, performance gains.
10. **Full Multi‑Tenant SaaS Architecture** — Tenant isolation, region routing, custom domains, billing.

A constantly evolving platform — the roadmap reflects both technical expansion and creative direction.

### 🚧 In Progress

* [x] Multi-language UI (10+ languages)
* [x] Advanced blog engine with AI helpers
* [x] Appointment scheduling system
* [x] Knowledge Graph (2D + 3D visualizations)
* [x] AI integrations (GPT‑4o, DALL‑E)
* [x] Weekly admin analytics & digests
* [x] Full admin dashboard migration

### 🛠️ Near Future

* [ ] Accessibility (a11y) compliance (WCAG AA)
* [ ] Public REST API documentation (`/docs`)
* [ ] Add AR viewer & 3D model portfolio
* [ ] Real IoT dashboard integration (FastIoT / Roltek SaaS compatible)
* [ ] Auto‑translation pipeline for blog posts
* [ ] Add email warm‑up score + deliverability monitor
* [ ] Add browser push notifications
* [ ] Expand appointment module with recurring bookings
* [ ] Admin dashboard performance optimization (React 19 RSC isolation)

### 🌀 Long-term Vision

* [ ] Session replay analytics (privacy‑safe)
* [ ] AI‑powered personalization (smart recommendations)
* [ ] Knowledge Graph → Semantic Search + embeddings
* [ ] Desktop app version with Tauri
* [ ] Open‑source UI component library (KurayUI)

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
