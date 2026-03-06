# KurayDev V2 — Development Rules

> This file is the single source of truth for all development conventions.
> These rules are followed **strictly**. There are no exceptions.

---

## 1. Runtime & Environment

| Setting | Value |
|---------|-------|
| Node.js | `>= 20` |
| npm | `>= 10` |
| Next.js | `^16.x` (App Router) |
| React | `19.x` |
| TypeScript | `5.9.x strict` |

---

## 2. TypeScript Rules

Active compiler flags (`tsconfig.json`):

```json
{
  "strict": true,
  "noImplicitAny": true,
  "noUnusedLocals": true,
  "noUnusedParameters": true,
  "isolatedModules": true,
  "noEmit": true
}
```

- `any` is **forbidden**. Unknown types are declared as `unknown` and narrowed.
- `as` (type assertion) is only permitted after a Zod `parse` call or when unavoidable for third-party library compatibility.
- optionals are represented with `undefined`. Zod schemas use `z.optional()`
- Enums are not used; prefer `as const` objects or union string literal types.
- Every exported type or interface must have a corresponding Zod schema in the same file or in the `dtos/` folder.
- `TypeScript ignoreBuildErrors` is permanently `false`. Build must never fail silently.

---

## 3. Project Structure Rules

- **`app/(api)/api/`** — Route Handlers only. No business logic. Delegates immediately to the service layer.
- **`services/`** — All business logic. No HTTP context (`Request`, `Response`, headers) inside services.
- **`libs/`** — Singleton clients and infrastructure wrappers (`prisma`, `redis`, `s3`, `logger`, `openai`, `csrf`, `rateLimit`, `zustand`, `i18n`, `localize`, `axios`).
- **`dtos/`** — Zod schemas + inferred TypeScript types for all API inputs/outputs.
- **`types/`** — Shared domain TypeScript types not coupled to any single service.
- **`helpers/`** — Pure, stateless utility functions. No side effects, no service imports.
- **`messages/`** — Error and success message string maps per domain. No string literals inside services.
- **`middlewares/`** — Next.js middleware logic (CORS, CSRF, rate-limit, security headers). No business logic.
- **`components/`** — React components only. No direct Prisma/Redis imports.
- **`scripts/`** — CLI scripts run with `tsx`. Not imported by application code.

Crossing these boundaries is a rule violation.

---

## 4. File & Folder Naming

| Item | Convention | Example |
|------|-----------|---------|
| Service class | `PascalCase.ts` | `MailService.ts` |
| Service folder | `PascalCase/` | `AuthService/` |
| React component | `PascalCase.tsx` | `PostCard.tsx` |
| Zustand store | `useNounStore.ts` | `useGlobalStore.ts` |
| API Route Handler | `route.ts` inside App Router folder | `app/(api)/api/posts/route.ts` |
| DTO / Zod schema | `NounDTO.ts` | `PostDTO.ts` |
| Helper function file | `camelCase.ts` | `tocUtils.ts` |
| Test file | `*.test.ts` or `*.test.tsx` | `PostService.test.ts` |
| i18n dictionary | `{lang}.json` (ISO 639-1) | `tr.json` |

Folder names under `services/`, `libs/`, `components/` use `PascalCase` when they represent a named module, and `camelCase` for infrastructure sub-folders.

---

## 5. API Route Handler Rules

- Every Route Handler file exports only HTTP verb functions: `GET`, `POST`, `PUT`, `PATCH`, `DELETE`.
- The handler must:
  1. Validate the incoming request body / query params using the corresponding DTO schema (`z.safeParse`).
  2. Call the relevant service method.
  3. Return a typed `NextResponse.json(...)` with an explicit HTTP status code.
- Error handling inside route handlers uses a centralized `handleApiError(error)` pattern — no raw `try/catch` blocks with inline messages.
- No Prisma queries or Redis calls directly inside route handlers.
- Auth checks (session validation) happen at the top of the handler before any other logic.

```typescript
// Correct pattern
export async function POST(req: Request) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const parsed = createPostSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })

  const result = await PostService.create(parsed.data, session.userId)
  return NextResponse.json(result, { status: 201 })
}
```

---

## 6. Service Layer Rules

- Services are plain TypeScript classes or modules — no decorators, no DI framework.
- Services receive all dependencies via function parameters or constructor injection — no module-level singletons inside service files (use `libs/` for that).
- Every public service method must have a TSDoc block: `/** ... */`.
- Service methods throw typed errors from `messages/` maps — never raw `new Error('some string')`.
- Services never import from `app/`, `components/`, or `middlewares/`.
- Async methods always return `Promise<T>`. Never fire-and-forget without explicit intent.

---

## 7. Zod & Runtime Validation

- Every external input — API request bodies, query parameters, environment variables, external API responses — is validated with Zod before use.
- `z.safeParse()` is used in route handlers and middleware (application continues on failure with an error response).
- `z.parse()` is used in service layer internals where a validation failure is a programming error.
- Schemas and their inferred types are co-located in `dtos/`:

```typescript
// dtos/PostDTO.ts
export const createPostSchema = z.object({
  title: z.string().min(1).max(200),
  content: z.string().min(1),
  categoryId: z.string().cuid(),
})
export type CreatePostInput = z.infer<typeof createPostSchema>
```

---

## 8. Database Rules (Prisma + PostgreSQL)

- All database access goes through the Prisma client singleton in `libs/prisma/`.
- Raw SQL queries (`$queryRaw`, `$executeRaw`) are only used when Prisma's query API cannot express the operation, and must be documented with a comment explaining why.
- Prisma queries inside services always use `select` to fetch only the fields required — never fetch entire models unnecessarily.
- Soft deletes: models with `deletedAt` must filter by `deletedAt: null` in all standard queries. A helper wrapper or Prisma extension should enforce this.
- Schema changes require:
  1. Update `prisma/schema.prisma`
  2. Run `npx prisma migrate dev -n "<descriptive-name>"`
  3. Update `ARCHITECTURE.md` data models section if the model is new or significantly changed.
- `prisma/seed.js` is the only place for seed data. Never seed from application code paths.

---

## 9. Authentication & Session Rules

- Session validation is performed by `AuthService/UserSessionService.ts` — no JWT decoding outside this module.
- Access tokens are short-lived JWTs. Refresh tokens are long-lived and stored in the `UserSession` table.
- OTP verification state is tracked per session (`otpVerifyNeeded`, `otpVerifiedAt`) — never per request or in client state.
- SSO callbacks always go through `AuthService/SSOService/` — provider logic is never inline in route handlers.
- Passwords are hashed exclusively in `AuthService/PasswordService.ts` using bcrypt. No other module handles raw passwords.
- The `ADMIN` role guard is applied at the route level before reaching service code.

---

## 10. State Management Rules (Zustand)

- Zustand is the only client-side state manager. React Context is not used for application state.
- Each store is defined in `libs/zustand/` and exported as a named hook (`useGlobalStore`, etc.).
- Stores that need persistence use `zustand/middleware` → `persist` with `createJSONStorage(() => localStorage)` and an explicit `version` number.
- Stores hold only **validated domain types** — never raw API response shapes.
- Server-fetched data is not stored in Zustand; it lives in React component state or in `fetch` cache (Next.js RSC / `use cache`).
- Zustand setters are named `setNoun` / `clearNoun`. No mutation methods with ambiguous names.

---

## 11. Redis & BullMQ Rules

- The Redis client singleton lives in `libs/redis/`. Never instantiate `ioredis` directly elsewhere.
- Redis key naming format: `{namespace}:{identifier}` (e.g., `ratelimit:127.0.0.1:/api/auth/login`, `session:abc123`).
- BullMQ queues are used for all heavy background operations (email sending, scheduled post publishing, AI generation offload, click buffer flush).
- Queue names are defined as constants — no inline string queue names scattered across the codebase.
- Workers always handle `failed` events and log to Winston.
- TTL is explicitly set on every Redis key that should expire. Keys without TTL require a comment explaining why.

---

## 12. Storage Rules

- All file uploads go through `StorageService/index.ts` — no direct AWS SDK / R2 / MinIO calls in route handlers.
- The active storage provider is resolved from environment configuration inside `StorageService`.
- File keys follow the pattern: `{folder}/{timestamp}-{uuid}.{ext}` (e.g., `posts/1709640000000-clxyz123.jpg`).
- The `Media` model is always updated when a file is uploaded or deleted — S3 and DB must stay in sync.
- Max upload size limits are enforced at the route handler level before calling `StorageService`.

---

## 13. Middleware Rules

- All four middleware modules (`cors`, `csrf`, `rateLimit`, `security`) are composed in `middlewares/index.ts`. They are not applied individually in route handlers.
- Rate limit configurations are centralized in `middlewares/rateLimit.ts` as `RATE_LIMIT_CONFIG`. Per-route limits are not hardcoded inline.
- CSRF-exempt routes and rate-limit-exempt routes are declared in their respective middleware files as named constant arrays.
- In development mode, rate limits operate with a `10x` multiplier (prevents friction during local development while keeping production limits strict).
- Security headers are applied globally in `next.config.mjs` headers block AND in `middlewares/security.ts`. Do not remove either.

---

## 14. React Component Rules

- Functional components only. Class components are forbidden.
- Props interface is declared at the top of the file as `interface Props { ... }`, not inline.
- `"use client"` directive is added only when the component requires browser APIs, event handlers, or Zustand. Server Components are the default.
- `React.memo` is applied to list items that receive frequently-changing props (post cards, comment rows, analytics table rows).
- `useEffect` dependency arrays are never left empty without a comment; if truly mount-only, add `// mount-only: intentional`.
- Tailwind class strings are composed with `cn()` (clsx + tailwind-merge). No template literal concatenation for conditional classes.
- i18n strings are never hardcoded in components — all UI text comes from the dictionary via the `useDictionary` / `getDictionary` pattern.

---

## 15. Internationalization Rules

- All 26 locale dictionary files (`dictionaries/{lang}.json`) must have identical key structures. Missing keys must be added and translated before a PR is merged.
- Run `npm run translate` before building to auto-fill missing translations via AI.
- The language segment in the URL (`/[lang]/`) is always a valid ISO 639-1 code present in the supported locales list.
- Translation keys use dot-nested `camelCase`: `"auth.login.title"`, `"blog.post.readTime"`.
- Database content translations (Post, Category, Project) use the `*Translation` models — never store multi-lang content as JSON blobs.

---

## 16. Error Handling Rules

- Route handlers return typed JSON error objects with explicit HTTP status codes — never `throw` from a route handler into Next.js unhandled territory.
- Service-layer errors use message constants from `messages/` — no inline string error messages.
- All `Promise` rejections without an explicit handler are logged by Winston — unhandled promise rejections are a build bloat and a runtime danger.
- External API calls (SSO providers, AI providers, SMS providers, storage providers) are wrapped in try/catch with retry logic (max 3 attempts, exponential backoff) where appropriate.
- User-visible error messages are displayed via `react-toastify` with a maximum duration of 5 seconds.

```
Server-side errors  → Winston (logger) at appropriate level
Client-side errors  → react-toastify toast + console.error in dev
External API errors → logged with provider name + status code, retried up to 3×
```

---

## 17. Security Rules

- Environment variables containing secrets (API keys, JWT secrets, SMTP passwords, etc.) are **never** committed. They live in `.env.local` (development) and the deployment platform's secret store (production).
- JWT secrets must be at least 256 bits of entropy.
- Passwords are always hashed with bcrypt before storage — nowhere else in the codebase is a plain-text password written to the database.
- `reactStrictMode: true` is permanent in `next.config.mjs`.
- `typescript.ignoreBuildErrors: false` is permanent in `next.config.mjs`.
- CSRF protection is always active for all state-mutating routes. Exempt routes require an explicit entry in `CSRF_EXEMPT_ROUTES`.
- Input coming from users is sanitized with `isomorphic-dompurify` before being stored or rendered as HTML (TinyMCE rich-text content).
- OTP codes are single-use and expire; reuse attempts are rejected with an audit log entry.
- `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, and `Referrer-Policy` headers are applied globally and must not be removed.

---

## 18. Test Rules

| Test type | Tool | Location | Coverage target |
|-----------|------|----------|----------------|
| Unit | Jest + ts-jest | `tests/**/*.test.ts` | > 80% lines for services/helpers |
| Integration | Jest + ts-jest | `tests/**/*.test.ts` | Key API flows |

- Every service class requires at least one corresponding test file.
- Tests never make real network calls. All external dependencies (Prisma, Redis, ioredis, HTTP providers) are mocked with `jest.mock()`.
- Test coverage is collected from `services/**/*.ts`, `helpers/**/*.ts`, and `utils/**/*.ts` (configured in `jest.config.ts`).
- Test files are co-located under `tests/` using the same directory structure as the source.
- `npm test` must pass with zero failures on every commit.

---

## 19. Performance Rules

- Server Components (RSC) are the default. Client Components (`"use client"`) are used only when necessary.
- Next.js `fetch` caching and `use cache` are used for expensive data fetching (GitHub/GitLab section data, sitemap generation, GEO data).
- Images are always served through `next/image` with explicit `width`, `height`, and `alt` attributes. The `<img>` tag is forbidden in components.
- Bundle analyzer (`ANALYZE=true npm run build`) is run before any pull request that adds a new large dependency.
- `@xenova/transformers` (WASM) is listed under `serverExternalPackages` to prevent it from being bundled into the client bundle.
- Prisma queries in list endpoints always include pagination (`take` + `skip` or cursor-based). Unbounded queries are forbidden.
- Heavy AI generation tasks (post cover image, text generation) are offloaded to BullMQ workers — they never block an API response.

---

## 20. Git & Versioning Rules

| Prefix | Usage |
|--------|-------|
| `feat:` | New feature |
| `fix:` | Bug fix |
| `refactor:` | Code restructuring without behavior change |
| `test:` | Adding or fixing tests |
| `docs:` | Documentation only |
| `chore:` | Build, config, dependency updates |
| `perf:` | Performance improvement |
| `i18n:` | Translation or locale changes |

- Commit message format: `<prefix>(<scope>): <short description>` — max 72 characters.
- Scopes: `auth`, `posts`, `media`, `analytics`, `appointments`, `ai`, `newsletter`, `i18n`, `middleware`, `db`, `storage`, `notifications`, `short-links`, `admin`, `build`.
- Direct pushes to `main` are forbidden. All changes go through a feature branch → Pull Request → squash merge.
- Version tags follow SemVer: `v0.1.0`, `v0.2.0`, ..., `v1.0.0`.
- The `vercel-build` script (`prisma generate && prisma migrate deploy && next build`) must succeed without errors before a release tag is created.

---

## 21. Documentation Rules

- Every public service method must have a TSDoc block (`/** ... */`).
- `ARCHITECTURE.md` is updated whenever a new service, route group, Prisma model, or infrastructure component is added.
- `RULES.md` is updated when a rule is added or changed — include the date of change as a comment at the bottom.
- Comments in code are written in **English**. UI-facing text is in the language of the active dictionary.
- Inline comments explain **why**, not what. Self-documenting code is preferred over explanatory comments.
- No commented-out code blocks in committed files. Use git history instead.

---

*Last updated: March 2026*
