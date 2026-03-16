# Test Progress

## Faz 1 — Kimlik Doğrulama & Güvenlik (P0)

| # | Dosya | Durum |
|---|-------|-------|
| 1.1 | `tests/services/AuthService/TokenService.test.ts` | ✅ 24 test geçti |
| 1.2 | `tests/services/AuthService/PasswordService.test.ts` | ✅ 24 test geçti |
| 1.3 | `tests/services/AuthService/OTPService.test.ts` | ✅ 17 test geçti |
| 1.4 | `tests/services/AuthService/TOTPService.test.ts` | ✅ 16 test geçti |
| 1.5 | `tests/services/AuthService/UserSessionService.test.ts` | ✅ 27 test geçti |
| 1.6 | `tests/services/AuthService/UserSessionOTPService.test.ts` | ✅ 16 test geçti |
| 1.7 | `tests/services/AuthService/DeviceFingerprintService.test.ts` | ✅ 13 test geçti |
| 1.8 | `tests/services/AuthService/SecurityService.test.ts` | ✅ 6 test geçti |
| 1.9 | `tests/services/AuthService/SocialAccountService.test.ts` | ✅ 10 test geçti |
| 1.10 | `tests/services/AuthService/SSOService/GoogleService.test.ts` | ✅ 8 test geçti |
| 1.11 | `tests/services/AuthService/SSOService/GithubService.test.ts` | ✅ 8 test geçti |
| 1.12 | `tests/services/AuthService/SSOService/index.test.ts` | ✅ 14 test geçti |

## Faz 2 — Çekirdek İçerik Servisleri (P1)

| # | Dosya | Durum |
|---|-------|-------|
| 2.1 | `tests/services/PostService/LikeService.test.ts` | ✅ 9 test geçti |
| 2.2 | `tests/services/PostService/SeriesService.test.ts` | ✅ 10 test geçti |
| 2.3 | `tests/services/CategoryService.test.ts` | ✅ 10 test geçti |
| 2.4 | `tests/services/ProjectService.test.ts` | ✅ 8 test geçti |
| 2.5 | `tests/services/CommentService.test.ts` | ✅ 13 test geçti |
| 2.6 | `tests/services/UserService/index.test.ts` | ✅ 9 test geçti |
| 2.7 | `tests/services/PostService/index.test.ts` | ✅ 17 test geçti |
| 2.8 | `tests/services/TestimonialService.test.ts` | ✅ 14 test geçti |

## Faz 3 — Bildirim & Kampanya (P1)

| # | Dosya | Durum |
|---|-------|-------|
| 3.1 | `tests/services/NotificationService/MailService.test.ts` | ✅ 12 test geçti |
| 3.2 | `tests/services/NotificationService/SMSService/TwilloService.test.ts` | ✅ 4 test geçti |
| 3.3 | `tests/services/NotificationService/SMSService/NexmoService.test.ts` | ✅ 4 test geçti |
| 3.4 | `tests/services/NotificationService/SMSService/ClickatellService.test.ts` | ✅ 4 test geçti |
| 3.5 | `tests/services/NotificationService/SMSService/NetGSMService.test.ts` | ✅ 4 test geçti |
| 3.6 | `tests/services/NotificationService/SMSService/index.test.ts` | ✅ 14 test geçti |
| 3.7 | `tests/services/SubscriptionService.test.ts` | ✅ 12 test geçti |
| 3.8 | `tests/services/CampaignService.test.ts` | ✅ 14 test geçti |
| 3.9 | `tests/services/ContactFormService.test.ts` | ✅ 11 test geçti |

## Faz 4 — Randevu & Analitik & Kısa Link (P2)

| # | Dosya | Durum |
|---|-------|-------|
| 4.1 | `tests/services/AppointmentService/SlotService.test.ts` | ✅ 12 test geçti |
| 4.2 | `tests/services/AppointmentService/SlotTemplateService.test.ts` | ✅ 7 test geçti |
| 4.3 | `tests/services/ShortLinkService.test.ts` | ✅ 14 test geçti |
| 4.4 | `tests/services/StatService.test.ts` | ✅ 5 test geçti |

## Faz 5 — Depolama, Entegrasyon & AI (P2)

| # | Dosya | Durum |
|---|-------|-------|
| 5.1 | `tests/services/StorageService/AWSService.test.ts` | ✅ 5 test geçti |
| 5.2 | `tests/services/IntegrationService/GithubService.test.ts` | ✅ 3 test geçti |
| 5.3 | `tests/services/IntegrationService/GitlabService.test.ts` | ✅ 3 test geçti |
| 5.4 | `tests/services/SocialMediaService/DiscordService.test.ts` | ✅ 2 test geçti |

## Faz 6 — Yardımcı Servisler (P3)

| # | Dosya | Durum |
|---|-------|-------|
| 6.1 | `tests/services/UserAgentService.test.ts` | ✅ 25 test geçti |
| 6.2 | `tests/services/SettingService.test.ts` | ✅ 8 test geçti |

## Faz 7 — Helpers (P3)

| # | Dosya | Durum |
|---|-------|-------|
| 7.1 | `tests/helpers/Cosine.test.ts` | ✅ 7 test geçti |
| 7.2 | `tests/helpers/SpamProtection.test.ts` | ✅ 18 test geçti |
| 7.3 | `tests/helpers/TimeHelper.test.ts` | ✅ 11 test geçti |

---

## Mart 2026 — Ek Kapsam Backlog (Kategori Bazlı)

| # | Kapsam | Durum | Not |
|---|--------|-------|-----|
| 1.E1 | Faz 1: Authorization matrix + boundary + clock skew | ✅ | owner/non-owner/admin, token/OTP/TOTP sınırları, JWT/TOTP time skew |
| 1.E2 | Faz 1: Partial failure + session consistency + revocation | ✅ | create/cache fail, rotate race/reuse, logout/destroy sonrası geçersizlik |
| 1.E3 | Faz 1: Sensitive leakage + SSO ek güvenlik | ✅ | raw token/hash/code leak yok, state/nonce, redirect mismatch, profile/email edge-case |
| 2.E1 | Faz 2: Authorization matrix + immutable field guard | ⏳ | owner/non-owner/admin ve `authorId`/`userId`/`createdAt`/`publishedAt` koruması |
| 2.E2 | Faz 2: Boundary/validation + state transitions | ⏳ | pagination limitleri, slug edge-case, publish lifecycle |
| 2.E3 | Faz 2: Cache/soft delete/concurrency/moderation edge | ⏳ | invalidation, public/internal görünürlük, duplicate like/views, approve/spam geçişleri |
| 3.E1 | Faz 3: Recipient filtering + campaign reentrancy | ⏳ | unsubscribed/banned/duplicate email filtresi, ikinci send bloklama |
| 3.E2 | Faz 3: Partial queue failure + template integrity | ⏳ | kısmi başarı politikası, unsubscribe zorunluluğu, subject/body boş davranışı |
| 3.E3 | Faz 3: Abuse guard + auditability + SMS fallback | ⏳ | contact/mail rate limit, status timeline alanları, timeout/credential mapping |
| 4.E1 | Faz 4: Concurrency + boundary + timezone | ⏳ | slot booking race, now sınırları, gün değişimi/timezone etkisi |
| 4.E2 | Faz 4: Ownership + shortlink security | ⏳ | appointment/shortlink yetki kontrolü, protocol allowlist |
| 4.E3 | Faz 4: Analytics idempotency + template safety | ⏳ | duplicate flush koruması, apply overwrite/overlap edge-case |
| 5.E1 | Faz 5: Env/config guard + partial failure | ⏳ | eksik env açık hata, silent fallback yok, storage↔DB kısmi hata senaryoları |
| 5.E2 | Faz 5: Retry + timeout/error mapping + cache | ⏳ | retryable ayrımı, 401/403/404/429/500, GitHub/GitLab stale cache |
| 5.E3 | Faz 5: AI cost/safety + provider routing | ⏳ | usage limit, parse error, moderation/prompt injection fallback, unsupported provider/model |
| 6.E1 | Faz 6: Fallback/boundary/determinism | ⏳ | nullish/uzun input, parse edilemeyen input, aynı input aynı output |
| 6.E2 | Faz 6: Cache-buffering + ActivityPub güvenlik | ⏳ | duplicate flush, bozuk imza/eksik header/replay |
| 7.E1 | Faz 7: Property-like variations + boundary/degenerate | ⏳ | cosine/time/spam helper varyasyonları, empty/zero/malformed durumlar |
| 7.E2 | Faz 7: Determinism + no-throw garantileri | ⏳ | helper güvenli dönüş davranışı |
| 8.1 | Faz 8: Yetkilendirme & Policy Enforcement | ⏳ | RBAC, ownership, admin override, suspended user, internal-only guard |
| 9.1 | Faz 9: Cache, Idempotency & Consistency | ⏳ | cache lifecycle, invalidation, duplicate command, eventual consistency |
| 10.1 | Faz 10: Hata Yönetimi & Fallback Politikaları | ⏳ | timeout, DB/Redis fail, retryable ayrımı, safe public error |
| 11.1 | Faz 11: Boundary, Input Extremes & Pagination | ⏳ | extreme input, unicode/locale, pagination sınırları |
| 12.1 | Faz 12: Durum Geçişleri & Lifecycle Integrity | ⏳ | illegal transition blokları, soft-delete sonrası yasak operasyonlar |
| 13.1 | Faz 13: Gizli Veri & Güvenli Çıktı Kontrolleri | ⏳ | token/hash/secret leak önleme, sanitized response doğrulama |
| 14.1 | Faz 14: Cron, Jobs & Reentrancy | ⏳ | duplicate trigger/retry sonrası side-effect kontrolü |
| 15.1 | Faz 15: Observability-Aware Testler | ⏳ | logger, security audit, campaign summary, booking conflict telemetry |
