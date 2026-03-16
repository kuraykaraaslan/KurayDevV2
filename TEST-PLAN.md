# KurayDevSite — Risk-Based Test Plan

> **Hedef:** Service katmanında %100 risk-based coverage.
> **Kapsam:** `services/**/*.ts` + `helpers/**/*.ts`
> **Araç:** Jest + ts-jest (mock-only, gerçek ağ/DB çağrısı yok)
> **Öncelik kriteri:** Güvenlik etkisi → Veri bütünlüğü → İş riski → Karmaşıklık

---

## Genel Kurallar

- **Prisma** → `jest.mock('@/libs/prisma', ...)` ile tamamen mock'lanır.
- **Redis** → `jest.setup.ts`'de global mock zaten var; gerekirse test içinde override edilir.
- **Dış servisler** (Mail, SMS, Storage, AI, HTTP) → `jest.mock()` ile izole edilir.
- **Zod şemaları test edilmez** — Zod'un kendisi zaten test edilmiştir; DTO doğruluğu type-check aşamasında garanti altındadır.
- **Prisma model tipleri test edilmez** — Generated tipler Prisma'nın garantisidir.
- Her `describe` bloğu tek bir `public static` metodu kapsar.
- Her test: **Arrange → Act → Assert** yapısını takip eder.
- `beforeEach` içinde `jest.clearAllMocks()` zorunludur.

---

## Faz 1 — Kimlik Doğrulama & Güvenlik (Kritik / P0)

> **Risk:** Güvenlik açığı, oturum ele geçirme, yetki atlama.

### 1.1 `AuthService/TokenService`
**Dosya:** `tests/services/AuthService/TokenService.test.ts`

| Test Senaryosu | Risk |
|----------------|------|
| `generateAccessToken` → geçerli JWT üretir, payload doğru | Yetki atlama |
| `generateRefreshToken` → geçerli JWT üretir, payload doğru | Oturum ele geçirme |
| `verifyAccessToken` → geçerli token doğrulanır | — |
| `verifyAccessToken` → süresi dolmuş token → hata fırlatır | Oturum uzatma |
| `verifyAccessToken` → imza geçersiz → hata fırlatır | Token sahteciliği |
| `verifyAccessToken` → deviceFingerprint eşleşmez → hata fırlatır | Cihaz bağlama bypass |
| `verifyRefreshToken` → geçerli token doğrulanır | — |
| `verifyRefreshToken` → süresi dolmuş → hata fırlatır | — |
| `hashToken` → aynı input → deterministik output | Token saklama güvenliği |
| `hashToken` → farklı inputlar → farklı hash | Çakışma |

### 1.2 `AuthService/PasswordService`
**Dosya:** `tests/services/AuthService/PasswordService.test.ts`

| Test Senaryosu | Risk |
|----------------|------|
| `generateResetToken` → uzunluk doğru, sadece rakam | Tahmin edilebilirlik |
| `hashToken` → SHA-256, deterministik | Token karşılaştırma |
| `forgotPassword` → kullanıcı bulunamazsa → hata | — |
| `forgotPassword` → rate limit aşılmışsa → hata | Brute-force |
| `forgotPassword` → ilk istek → redis set + mail gönderilir | — |
| `forgotPassword` → tekrar istek, limit altında → sayaç artar | — |
| `resetPassword` → kullanıcı bulunamazsa → hata | — |
| `resetPassword` → redis'te token yoksa → hata | Süresi dolmuş token |
| `resetPassword` → token eşleşmiyorsa → hata | Token manipülasyonu |
| `resetPassword` → başarılı → parola güncellenir, redis temizlenir, mail gönderilir | — |
| `resetPassword` → kullanıcının telefonu varsa → SMS de gönderilir | — |
| `resetPassword` → one-time: ikinci kullanımda redis key yok → hata | Token tekrar kullanımı |

### 1.3 `AuthService/OTPService`
**Dosya:** `tests/services/AuthService/OTPService.test.ts`

| Test Senaryosu | Risk |
|----------------|------|
| OTP kodu üretimi → uzunluk, only digits | Tahmin |
| OTP saklama → redis key doğru, TTL ayarlı | — |
| OTP doğrulama → doğru kod → başarılı | — |
| OTP doğrulama → yanlış kod → hata | Brute-force |
| OTP doğrulama → süresi dolmuş (redis'te yok) → hata | Replay |
| OTP doğrulama → tek kullanım: başarı sonrası key silinir | Replay saldırısı |
| OTP gönderimi (EMAIL) → MailService çağrısı | — |
| OTP gönderimi (SMS) → SMSService çağrısı | — |

### 1.4 `AuthService/TOTPService`
**Dosya:** `tests/services/AuthService/TOTPService.test.ts`

| Test Senaryosu | Risk |
|----------------|------|
| `generateSecret` → base32 string üretir | — |
| `verifyToken` → geçerli TOTP kodu → true | — |
| `verifyToken` → geçersiz kod → false | Bypass |
| `generateQRCodeUrl` → doğru otpauth URL formatı | — |

### 1.5 `AuthService/UserSessionService`
**Dosya:** `tests/services/AuthService/UserSessionService.test.ts`

| Test Senaryosu | Risk |
|----------------|------|
| `createSession` → otpMethods varsa otpVerifyNeeded=true | MFA bypass |
| `createSession` → otpIgnore=true → otpVerifyNeeded=false | — |
| `createSession` → token hash'lenerek DB'ye yazılır (raw token saklanmaz) | Token sızıntısı |
| `getSessionDangerously` → redis cache hit → prisma çağrılmaz | — |
| `getSessionDangerously` → cache miss → DB sorgulanır, cache'e yazılır | — |
| `getSessionDangerously` → token doğrulanamaz → hata | — |
| `getSessionDangerously` → session süresi dolmuş → hata | — |
| `getSessionDangerously` → otpVerifyNeeded + bypass=false → hata | MFA bypass |
| `getSessionDangerously` → deviceFingerprint eşleşmez → hata | Cihaz bağlama |
| `rotateTokens` → geçerli refresh token → yeni token çifti | — |
| `rotateTokens` → session bulunamazsa → hata | — |
| `rotateTokens` → token reuse detection → tüm session'lar silinir | Token çalınması |
| `rotateTokens` → otpVerifyNeeded → hata | MFA bypass |
| `destroyAllSessions` → DB + redis cache temizlenir | — |
| `destroyOtherSessions` → mevcut session korunur | — |
| `deleteSession` → DB + ilgili cache silinir | — |
| `omitSensitiveFields` → accessToken/refreshToken döndürülmez | Veri sızıntısı |

### 1.6 `AuthService/UserSessionOTPService`
**Dosya:** `tests/services/AuthService/UserSessionOTPService.test.ts`

| Test Senaryosu | Risk |
|----------------|------|
| OTP gönderimi → session güncellenir | — |
| OTP doğrulama → başarılı → `otpVerifiedAt` güncellenir | — |
| OTP doğrulama → yanlış → hata, session değişmez | — |

### 1.7 `AuthService/SSOService` (Google, GitHub, LinkedIn, Microsoft, Facebook, Twitter, TikTok, WeChat, Slack, Autodesk, Apple)
**Dosya:** `tests/services/AuthService/SSOService/[Provider].test.ts`

Her provider için ortak senaryolar:

| Test Senaryosu | Risk |
|----------------|------|
| `getAuthUrl` → scope ve redirect_uri doğru | CSRF / redirect |
| `handleCallback` → provider'dan token alınamaz → hata | — |
| `handleCallback` → kullanıcı bilgisi alınamaz → hata | — |
| `handleCallback` → yeni kullanıcı → oluşturulur | — |
| `handleCallback` → mevcut kullanıcı → güncellenir | — |

### 1.8 `AuthService/SocialAccountService`
**Dosya:** `tests/services/AuthService/SocialAccountService.test.ts`

| Test Senaryosu | Risk |
|----------------|------|
| `upsert` → yeni provider → kayıt oluşturulur | — |
| `upsert` → mevcut provider → güncellenir | — |
| `getByProvider` → bulunamazsa null döner | — |
| `unlink` → kullanıcıya bağlı son hesap ise → hata (şifresi yoksa kilitleme riski) | Hesap kilidi |

### 1.9 `AuthService/DeviceFingerprintService`
**Dosya:** `tests/services/AuthService/DeviceFingerprintService.test.ts`

| Test Senaryosu | Risk |
|----------------|------|
| Aynı request headers → aynı fingerprint (deterministik) | Bypass |
| Farklı IP → farklı fingerprint | Cihaz bağlama |
| Eksik header'lar → hata fırlatmaz, graceful fallback | — |

### 1.10 `AuthService/SecurityService`
**Dosya:** `tests/services/AuthService/SecurityService.test.ts`

| Test Senaryosu | Risk |
|----------------|------|
| Şüpheli giriş tespiti → IP değişikliği → uyarı | Hesap ele geçirme |
| Başarısız giriş sayacı artar → rate limit tetiklenir | Brute-force |
| Hesap kilitleme → kilitleme sonrası giriş → hata | — |

---

## Faz 2 — Çekirdek İçerik Servisleri (Yüksek / P1)

> **Risk:** Veri bütünlüğü, yetkisiz içerik yayınlama, durum geçiş hataları.

### 2.1 `PostService/index`
**Dosya:** `tests/services/PostService/index.test.ts`

| Test Senaryosu | Risk |
|----------------|------|
| `getAll` → sadece `deletedAt: null` kayıtlar | Soft delete bypass |
| `getAll` → pagination parametreleri prisma'ya iletilir | Unbounded query |
| `getById` → bulunamazsa null/hata | — |
| `getBySlug` → `deletedAt: null` filtresi | — |
| `create` → geçerli veri → oluşturulur | — |
| `update` → başka kullanıcının postu → hata | Yetki ihlali |
| `delete` → soft delete: `deletedAt` set edilir, fiziksel silme yok | Veri kaybı |
| `publish` → DRAFT → PUBLISHED, `publishedAt` set | — |
| `publish` → zaten PUBLISHED → idempotent | — |
| `getPublished` → yalnızca PUBLISHED + `deletedAt: null` | Taslak sızıntısı |
| `incrementViews` → redis buffer'a yazılır | — |
| `sitemap cache` → redis cache hit/miss | — |

### 2.2 `PostService/LikeService`
**Dosya:** `tests/services/PostService/LikeService.test.ts`

| Test Senaryosu | Risk |
|----------------|------|
| `like` → kullanıcı daha önce beğenmemişse → kayıt oluşturulur | — |
| `like` → zaten beğenmişse → idempotent (hata fırlatmaz) | Duplicate |
| `unlike` → kayıt silinir | — |
| `unlike` → beğeni yoksa → hata fırlatmaz | — |
| `getCount` → doğru sayı döner | — |
| Anonymous like → IP + fingerprint ile kayıt | — |

### 2.3 `PostService/SeriesService`
**Dosya:** `tests/services/PostService/SeriesService.test.ts`

| Test Senaryosu | Risk |
|----------------|------|
| `create` → yeni seri oluşturulur | — |
| `addEntry` → post ve seri mevcut → entry eklenir, order doğru | — |
| `addEntry` → post zaten serideyse → hata | Duplicate |
| `removeEntry` → entry silinir | — |
| `getWithEntries` → sıralı döner | — |

### 2.4 `CategoryService`
**Dosya:** `tests/services/CategoryService.test.ts`

| Test Senaryosu | Risk |
|----------------|------|
| `getAll` → tüm kategoriler döner | — |
| `getById` → bulunamazsa hata | — |
| `create` → geçerli → oluşturulur | — |
| `update` → slug çakışması → hata | SEO bozulması |
| `delete` → içinde post varsa → hata | Yetim post |

### 2.5 `ProjectService`
**Dosya:** `tests/services/ProjectService.test.ts`

| Test Senaryosu | Risk |
|----------------|------|
| `getAll` → `deletedAt: null` | — |
| `create` → oluşturulur | — |
| `update` → sahiplik kontrolü | — |
| `delete` → soft delete | — |

### 2.6 `CommentService`
**Dosya:** `tests/services/CommentService.test.ts`

| Test Senaryosu | Risk |
|----------------|------|
| `create` → NOT_PUBLISHED statüsüyle oluşturulur (moderasyon bekler) | Spam |
| `create` → spam içerik tespiti → status=SPAM | — |
| `approve` → NOT_PUBLISHED → PUBLISHED | — |
| `approve` → zaten PUBLISHED → idempotent | — |
| `markAsSpam` → SPAM statüsü | — |
| `delete` → silinir | — |
| `getByPost` → yalnızca PUBLISHED döner (public API) | Moderasyon bypass |

### 2.7 `UserService/index`
**Dosya:** `tests/services/UserService/index.test.ts`

| Test Senaryosu | Risk |
|----------------|------|
| `getByEmail` → kullanıcı bulunur | — |
| `getByEmail` → bulunamazsa null | — |
| `getById` → bulunamazsa hata | — |
| `create` → şifre hash'lenerek saklanır (plain text yok) | Şifre sızıntısı |
| `update` → userId başkasıyla değiştirilemez | Privilege escalation |
| `updateRole` → ADMIN rolü atama → başarılı | — |
| `ban` → status BANNED olur, tüm sessionlar silinir | — |
| `delete` → soft delete | — |
| `getByEmail` → BANNED kullanıcı döner ama caller ban kontrolü yapar | — |

### 2.8 `UserProfileService`
**Dosya:** `tests/services/UserService/UserProfileService.test.ts`

| Test Senaryosu | Risk |
|----------------|------|
| `update` → geçerli → güncellenir | — |
| `update` → username çakışması → hata | — |

### 2.9 `TestimonialService`
**Dosya:** `tests/services/TestimonialService.test.ts`

| Test Senaryosu | Risk |
|----------------|------|
| `create` → oluşturulur | — |
| `approve` / `reject` → durum güncellenir | — |
| `getApproved` → yalnızca onaylı | — |

---

## Faz 3 — Bildirim & Kampanya (Yüksek / P1)

> **Risk:** Yanlış/toplu e-posta gönderimi, abonelik yönetim hataları.

### 3.1 `NotificationService/MailService`
**Dosya:** `tests/services/NotificationService/MailService.test.ts`

| Test Senaryosu | Risk |
|----------------|------|
| `sendForgotPasswordEmail` → BullMQ kuyruğuna eklenir | — |
| `sendPasswordResetSuccessEmail` → kuyruğa eklenir | — |
| `sendCampaignEmail` → kuyruğa eklenir, unsubscribe linki var | GDPR |
| Geçersiz e-posta adresi → hata fırlatmaz, kuyruk reddeder | — |
| Nodemailer mock'u → gerçek SMTP çağrısı yapılmaz | — |

### 3.2 `NotificationService/SMSService` (Twilio, Nexmo, Clickatell, NetGSM)
**Dosya:** `tests/services/NotificationService/SMSService/[Provider].test.ts`

| Test Senaryosu | Risk |
|----------------|------|
| `sendShortMessage` → HTTP çağrısı doğru endpoint'e yapılır | — |
| Provider hata döndürürse → hata fırlatılır | — |
| `index.ts` provider routing → env değişkenine göre doğru provider seçilir | — |

### 3.3 `SubscriptionService`
**Dosya:** `tests/services/SubscriptionService.test.ts`

| Test Senaryosu | Risk |
|----------------|------|
| `subscribe` → yeni kayıt oluşturulur, unsubscribeToken atanır | GDPR |
| `subscribe` → zaten aboneyse → idempotent | Duplicate |
| `unsubscribe` → token eşleşir → kayıt silinir | — |
| `unsubscribe` → geçersiz token → hata | Başkası adına abonelik iptali |
| `getAll` → pagination çalışır | — |

### 3.4 `CampaignService`
**Dosya:** `tests/services/CampaignService.test.ts`

| Test Senaryosu | Risk |
|----------------|------|
| `create` → DRAFT statüsüyle oluşturulur | — |
| `update` → SENT kampanya düzenlenemez | Veri tutarsızlığı |
| `send` → DRAFT → SENDING statüsüne geçer | — |
| `send` → zaten SENDING/SENT → hata | Çift gönderim |
| `send` → tüm aktif abonelere mail kuyruğa eklenir | Toplu hata |
| `send` → abonelik yoksa → başarıyla biter (0 gönderim) | — |
| `send` → tamamlanınca SENT statüsüne geçer | — |
| `delete` → yalnızca DRAFT silinebilir | — |

### 3.5 `ContactFormService`
**Dosya:** `tests/services/ContactFormService.test.ts`

| Test Senaryosu | Risk |
|----------------|------|
| `create` → kayıt oluşturulur, admin mail gönderilir | — |
| Spam koruması → rate limit aşılmışsa → hata | Spam |
| `getAll` → pagination | — |

---

## Faz 4 — Randevu & Analitik & Kısa Link (Orta / P2)

> **Risk:** Çifte rezervasyon, analitik bozulması, URL enjeksiyonu.

### 4.1 `AppointmentService/SlotService`
**Dosya:** `tests/services/AppointmentService/SlotService.test.ts`

| Test Senaryosu | Risk |
|----------------|------|
| `getAvailableSlots` → geçmiş tarih → hata | — |
| `getAvailableSlots` → BOOKED slotlar filtrelenir | Çifte rezervasyon |
| `book` → PENDING slot → BOOKED | — |
| `book` → zaten BOOKED → hata | Çifte rezervasyon |
| `book` → CANCELLED slot → hata | — |
| `cancel` → BOOKED → CANCELLED | — |
| `cancel` → başkasının randevusu → hata | Yetki ihlali |
| `cancel` → geçmiş randevu → hata | — |

### 4.2 `AppointmentService/SlotTemplateService`
**Dosya:** `tests/services/AppointmentService/SlotTemplateService.test.ts`

| Test Senaryosu | Risk |
|----------------|------|
| `getByDay` → haftanın günü doğru | — |
| `upsert` → yeni → oluşturulur | — |
| `upsert` → mevcut → güncellenir | — |
| `applyToDateRange` → date range slot'ları oluşturulur | — |
| `applyToDateRange` → mevcut slotlar üzerine yazılmaz (idempotent) | Veri kaybı |

### 4.3 `ShortLinkService`
**Dosya:** `tests/services/ShortLinkService.test.ts`

| Test Senaryosu | Risk |
|----------------|------|
| `create` → benzersiz kod üretilir | — |
| `create` → kod çakışması → yeniden denenir | — |
| `resolve` → kod bulunur → originalUrl döner | — |
| `resolve` → bulunamazsa → hata | — |
| `resolve` → originalUrl geçerli URL değil → hata | Open redirect |
| `bufferClick` → redis'e yazılır | — |
| `flushClickBuffer` → redis'ten okunur, DB'ye yazılır, key temizlenir | — |
| `delete` → link + click verileri silinir | — |
| `getAnalytics` → click istatistikleri döner | — |

### 4.4 `GeoAnalyticsService`
**Dosya:** `tests/services/GeoAnalyticsService.test.ts`

| Test Senaryosu | Risk |
|----------------|------|
| `recordVisit` → ülke/şehir normalize edilir | — |
| `recordVisit` → aynı ülke/şehir → `visitCount` artar | — |
| `getTopCountries` → sıralı döner | — |
| IP anonimleştirme → raw IP saklanmaz | GDPR |

### 4.5 `StatService`
**Dosya:** `tests/services/StatService.test.ts`

| Test Senaryosu | Risk |
|----------------|------|
| `getStats` → tüm model sayıları döner | — |
| Prisma count hata fırlatırsa → hata iletilir | — |

---

## Faz 5 — Depolama, Entegrasyon & AI (Orta / P2)

> **Risk:** Dosya kaybı, kimlik bilgisi sızıntısı, provider bağımlılığı.

### 5.1 `StorageService/AWSService`
**Dosya:** `tests/services/StorageService/AWSService.test.ts`

| Test Senaryosu | Risk |
|----------------|------|
| `upload` → S3 PutObject çağrılır, Media DB'ye kaydedilir | Senkronizasyon kaybı |
| `delete` → S3 DeleteObject + DB kaydı silinir | — |
| `getSignedUrl` → geçerli URL döner | — |
| S3 hata → hata iletilir, DB'ye yazılmaz | Tutarsız durum |

### 5.2 `StorageService/index` (provider routing)
**Dosya:** `tests/services/StorageService/index.test.ts`

| Test Senaryosu | Risk |
|----------------|------|
| `STORAGE_PROVIDER=aws` → AWSService döner | Yanlış provider |
| `STORAGE_PROVIDER=r2` → CloudflareR2Service döner | — |
| `STORAGE_PROVIDER=minio` → MinioService döner | — |
| Tanımsız provider → hata fırlatır | Silent fallback |

### 5.3 `IntegrationService/GithubService`
**Dosya:** `tests/services/IntegrationService/GithubService.test.ts`

| Test Senaryosu | Risk |
|----------------|------|
| `getActivity` → GitHub API yanıtı parse edilir | — |
| `getActivity` → API hata → fallback/hata | — |
| Rate limit → 403/429 → hata iletilir | — |
| Cache hit → API çağrısı yapılmaz | — |

### 5.4 `IntegrationService/GitlabService`
**Dosya:** `tests/services/IntegrationService/GitlabService.test.ts`

| Test Senaryosu | Risk |
|----------------|------|
| `getActivity` → GitLab API yanıtı parse edilir | — |
| `getActivity` → API hata → hata iletilir | — |

### 5.5 `SocialMediaService/DiscordService`
**Dosya:** `tests/services/SocialMediaService/DiscordService.test.ts`

| Test Senaryosu | Risk |
|----------------|------|
| `sendWebhook` → doğru payload ile POST yapılır | — |
| `sendWebhook` → webhook URL yoksa → hata fırlatmaz | Sessiz başarısızlık |

### 5.6 `AIServices/index` (provider routing)
**Dosya:** `tests/services/AIServices/index.test.ts`

| Test Senaryosu | Risk |
|----------------|------|
| Model prefix → doğru provider seçilir (`gpt-*` → OpenAI, `claude-*` → Anthropic) | Yanlış ücretlendirme |
| Tanımsız model prefix → hata fırlatır | — |

---

## Faz 6 — Yardımcı Servisler & Helpers (Düşük / P3)

> **Risk:** Düşük; ancak yanlış çalışan yardımcılar çok sayıda servisi etkiler.

### 6.1 `UserAgentService`
**Dosya:** `tests/services/UserAgentService.test.ts`

| Test Senaryosu | Risk |
|----------------|------|
| Chrome User-Agent → browser, os, device doğru parse | Yanlış analitik |
| Mobile User-Agent → device=mobile | — |
| Bot User-Agent → bot olarak etiketlenir | Analitik kirliliği |
| Boş User-Agent → hata fırlatmaz, varsayılan döner | — |

### 6.2 `SettingService`
**Dosya:** `tests/services/SettingService.test.ts`

| Test Senaryosu | Risk |
|----------------|------|
| `get` → key bulunur → değer döner | — |
| `get` → bulunamazsa → null/default | — |
| `set` → mevcut key → güncellenir | — |
| `set` → yeni key → oluşturulur | — |

### 6.3 `InAppNotificationService`
**Dosya:** `tests/services/InAppNotificationService.test.ts`

| Test Senaryosu | Risk |
|----------------|------|
| `create` → bildirim oluşturulur | — |
| `markAsRead` → isRead=true | — |
| `getUnread` → yalnızca okunmamış | — |

### 6.4 `PushNotificationService`
**Dosya:** `tests/services/PushNotificationService.test.ts`

| Test Senaryosu | Risk |
|----------------|------|
| `subscribe` → PushSubscription kaydedilir | — |
| `send` → web-push kütüphanesi çağrılır | — |
| `send` → geçersiz endpoint → subscription silinir | — |

### 6.5 `ActivityPubService`
**Dosya:** `tests/services/ActivityPubService/index.test.ts`

| Test Senaryosu | Risk |
|----------------|------|
| `handleFollow` → remote actor fetch → DB'ye kaydedilir, Accept gönderilir | — |
| `handleUndo` → follower silinir | — |
| `broadcastToFollowers` → tüm followerlara deliver | — |
| `HttpSignatureService` → imza üretimi ve doğrulaması | Fediverse güvenliği |

### 6.6 `KnowledgeGraphService`
**Dosya:** `tests/services/KnowledgeGraphService.test.ts`

| Test Senaryosu | Risk |
|----------------|------|
| `build` → post vektörleri hesaplanır, graph oluşturulur | — |
| `getSimilar` → cosine similarity eşiğin üstündekiler döner | — |

### 6.7 `SitemapService`
**Dosya:** `tests/services/SitemapService.test.ts`

| Test Senaryosu | Risk |
|----------------|------|
| `generate` → geçerli sitemap XML üretilir | SEO |
| Redis cache kullanılır | — |

### 6.8 `ViewerService`
**Dosya:** `tests/services/ViewerService.test.ts`

| Test Senaryosu | Risk |
|----------------|------|
| `recordView` → redis click buffer'a yazılır | — |
| `flushBuffer` → DB'ye toplu yazar | — |

### 6.9 `ChatbotService`
**Dosya:** `tests/services/ChatbotService/index.test.ts`

| Test Senaryosu | Risk |
|----------------|------|
| `processMessage` → AI provider çağrılır | — |
| `processMessage` → rate limit aşılmışsa → hata | Maliyet |
| Moderasyon → zararlı içerik → reddedilir | Güvenlik |
| Session yönetimi → yeni/devam eden session | — |

### 6.10 `CronService/jobs`
**Dosya:** `tests/services/CronService/jobs.test.ts`

| Test Senaryosu | Risk |
|----------------|------|
| `publishScheduledPosts` → `publishedAt <= now` AND `status=DRAFT` → PUBLISHED | — |
| `publishScheduledPosts` → ActivityPub notify çağrılır | — |
| `flushClickBuffer` → redis buffer okunur, DB'ye yazılır, key silinir | Analitik kaybı |

---

## Faz 7 — Helpers (Düşük / P3)

### 7.1 `helpers/Cosine`
**Dosya:** `tests/helpers/Cosine.test.ts`

| Test Senaryosu | Risk |
|----------------|------|
| Aynı vektör → similarity = 1.0 | — |
| Dik vektörler → similarity = 0.0 | — |
| Sıfır vektör → NaN/hata yok | — |

### 7.2 `helpers/TimeHelper`
**Dosya:** `tests/helpers/TimeHelper.test.ts`

| Test Senaryosu | Risk |
|----------------|------|
| Timezone dönüşümleri doğru | — |
| Geçersiz tarih → hata fırlatmaz | — |

### 7.3 `helpers/SpamProtection`
**Dosya:** `tests/helpers/SpamProtection.test.ts`

| Test Senaryosu | Risk |
|----------------|------|
| Spam keyword tespiti → true | — |
| Temiz içerik → false | — |
| Edge case: boş string | — |

### 7.4 `helpers/tocUtils`
**Dosya:** `tests/helpers/tocUtils.test.ts`

| Test Senaryosu | Risk |
|----------------|------|
| HTML içerikten doğru TOC üretilir | — |
| Heading yoksa boş array döner | — |

---

## Mart 2026 — Mevcut Fazlara Eklenmesi Gereken Kapsam (Faz 1–7)

> **Not:** Aşağıdaki maddeler mevcut faz kapsamına ek backlog olarak planlanır. Mevcut test dosyaları korunur; yeni test blokları ilgili dosyalara artımlı olarak eklenir.

### Faz 1 — Kimlik Doğrulama & Güvenlik (Ek Kapsam)

- **Authorization matrix testleri**
  - owner erişir
  - non-owner erişemez
  - admin override varsa erişir
- **Boundary testleri**
  - token expiry tam sınır anında
  - OTP/TOTP tam süre sınırında
  - rate limit tam eşik değerde
- **Clock skew testleri**
  - JWT/TOTP için küçük zaman kaymalarında davranış
- **Partial failure senaryoları**
  - session create başarılı ama cache write fail
  - password reset DB update başarılı ama mail/SMS fail
- **Session consistency**
  - aynı refresh token ile arka arkaya rotate denemesi
  - parallel rotate denemesinde reuse detection
- **Revocation / invalidation**
  - logout sonrası eski access/refresh token kullanımı
  - all sessions destroy sonrası cache ve DB uyumu
- **Sensitive data leakage**
  - hata objelerinde raw token/hash/email reset code sızmaması
- **SSO için ek güvenlik**
  - state/nonce doğrulama
  - eksik code parametresi
  - redirect URI mismatch
  - provider’dan eksik email/profile dönmesi
  - aynı email ile farklı provider bağlama çakışmaları

### Faz 2 — Çekirdek İçerik Servisleri (Ek Kapsam)

- **Authorization matrix**
  - post/project/category/comment işlemlerinde owner vs non-owner vs admin
- **Immutable field koruması**
  - `authorId`, `userId`, `createdAt`, `publishedAt` update ile değiştirilemez
- **Boundary & validation davranışı**
  - `page=0`, negative page, `limit=0`, aşırı yüksek limit
  - boş slug, duplicate slug, slug normalize davranışı
- **State transition testleri**
  - DRAFT → PUBLISHED
  - PUBLISHED → tekrar publish idempotent
  - silinmiş içerik publish edilemez
- **Cache consistency**
  - sitemap / published list / slug cache invalidation
- **Soft delete derinliği**
  - silinen içerik public listelerde görünmez
  - admin/internal fetch davranışı net
- **Concurrency-lite**
  - like iki kez üst üste
  - incrementViews duplicate çağrılar
  - seri entry ekleme yarış durumu
- **Moderation edge-case**
  - comment approve edilmiş içeriği tekrar approve
  - spam → published geçiş kuralları

### Faz 3 — Bildirim & Kampanya (Ek Kapsam)

- **Recipient filtering**
  - unsubscribed kullanıcılar atlanır
  - banned/inactive kullanıcılar atlanır
  - duplicate email tek gönderim alır
- **Campaign reentrancy**
  - aynı kampanya `send` iki kez çağrılırsa ikinci deneme reddedilir
- **Partial queue failure**
  - bazı abonelerde kuyruk ekleme başarısızsa davranış (tüm işlem fail mi, kısmi başarı mı)
- **Template integrity**
  - unsubscribe link zorunlu
  - subject/body boşsa davranış
- **Rate limit / abuse**
  - contact form peş peşe gönderim
  - mail bombardımanı koruması
- **Auditability**
  - campaign status geçişleri doğru
  - `sentAt` / `sendingAt` alanları düzgün set edilir
- **SMS provider fallback**
  - provider hata verdiğinde hata mapping’i doğru
  - timeout ve invalid credential ayrımı

### Faz 4 — Randevu & Analitik & Kısa Link (Ek Kapsam)

- **Concurrency testleri**
  - aynı slot için iki booking denemesi
  - cancel ile eşzamanlı rebook senaryosu
- **Boundary testleri**
  - geçmiş/şimdi/gelecek slot sınırı
  - `publishedAt === now` benzeri slot zaman eşikleri
- **Timezone testleri**
  - `Europe/Istanbul` timezone etkileri
  - gün değişim sınırları
- **Ownership / authorization**
  - başkasının appointment cancel etmesi
  - shortlink delete/update sahiplik kontrolü
- **ShortLink güvenlik**
  - `javascript:` / `data:` / invalid URL reddi
  - protocol allowlist
- **Analytics idempotency**
  - aynı buffer iki kez flush edilirse duplicate yazım olur mu
- **Template application safety**
  - SlotTemplate apply sırasında mevcut slot overwrite olmaması
  - range overlap edge-case’leri

### Faz 5 — Depolama, Entegrasyon & AI (Ek Kapsam)

- **Env/config guard testleri**
  - eksik env’de açık hata
  - yanlış provider config’inde silent fallback olmaması
- **Partial failure**
  - S3 upload başarılı ama DB save fail
  - DB delete başarılı ama storage delete fail
- **Retry policy**
  - hangi provider retry edilir, hangisi edilmez
- **Timeout/error mapping**
  - 401, 403, 404, 429, 500 ayrımı
- **Cache tests**
  - GitHub/GitLab cache hit/miss/stale cache
- **AI maliyet koruması**
  - rate limit
  - token/usage üst sınırı
  - provider response parse hatası
- **Moderation / safety**
  - chatbot/AI serviste zararlı içerik reddi
  - prompt injection benzeri inputlarda fallback davranışı
- **Provider routing**
  - case sensitivity
  - unsupported model/provider hata mesajı

### Faz 6 — Yardımcı Servisler (Ek Kapsam)

- **Fallback davranışları**
  - parse edilemeyen inputlarda graceful handling
- **Boundary testleri**
  - boş string, nullish input, çok uzun input
- **Determinism**
  - aynı input aynı output
- **Cache / buffering**
  - ViewerService ve benzerlerinde duplicate flush koruması
- **Security**
  - ActivityPub / HttpSignature tarafında bozuk imza, eksik header, replay

### Faz 7 — Helpers (Ek Kapsam)

- **Property-based benzeri mini varyasyon testleri**
  - cosine, time helper, spam helper için farklı input kümeleri
- **Boundary ve degenerate case**
  - empty array, zero vector, malformed HTML
- **Determinism**
  - helper aynı inputta hep aynı output verir
- **No-throw garantileri**
  - helper’lar servisleri patlatmayacak şekilde güvenli davranır

---

## Faz 8 — Yetkilendirme & Policy Enforcement (Yeni / P0)

> **Amaç:** Sistem genelinde yatay authorization boşluklarını kapatmak.

**Test konuları:**

- role-based access control
- resource ownership
- admin override kuralları
- banned/suspended kullanıcı davranışı
- public/private resource erişim ayrımı
- internal-only method çağrılarında guard testleri

**Odak servisler:**

- `PostService`
- `ProjectService`
- `UserService`
- `AppointmentService`
- `CampaignService`
- `ShortLinkService`

---

## Faz 9 — Cache, Idempotency & Consistency (Yeni / P1)

> **Amaç:** Redis kullanan tüm servislerde veri tutarlılığını garanti altına almak.

**Test konuları:**

- cache hit / miss / stale
- write sonrası invalidation
- delete sonrası invalidation
- aynı command’in iki kez çağrılmasında idempotency
- buffered write sonrası duplicate flush
- eventual consistency beklentileri

**Özellikle:**

- `UserSessionService`
- `PostService`
- `SitemapService`
- `ViewerService`
- `ShortLinkService`
- `SlotService`

---

## Faz 10 — Hata Yönetimi & Fallback Politikaları (Yeni / P1)

> **Amaç:** Servislerin başarısızlık anında tahmin edilebilir davranması.

**Test konuları:**

- third-party timeout
- DB hata yayılımı
- Redis unavailable senaryosu
- partial success kuralları
- retryable vs non-retryable hata ayrımı
- user-facing safe error mesajları
- internal log / public exception ayrımı

---

## Faz 11 — Boundary, Input Extremes & Pagination (Yeni / P2)

> **Amaç:** Küçük ama sık görülen edge-case bug’larını kapatmak.

**Test konuları:**

- minimum/maksimum length
- empty input
- huge page size
- negative/zero values
- tam eşik değerleri
- unicode / locale / case-folding edge-case’leri
- slug/title normalization sınırları

---

## Faz 12 — Durum Geçişleri & Lifecycle Integrity (Yeni / P1)

> **Amaç:** State-machine benzeri akışlarda illegal transition’ları engellemek.

**Test konuları:**

- DRAFT → PUBLISHED
- PUBLISHED → REPUBLISH
- BOOKED → CANCELLED
- SENT kampanya update/delete blokları
- OTP/session verification akış sırası
- soft-deleted entity’lerde yasak işlemler

**Öncelikli servisler:**

- `Post`
- `Comment`
- `Campaign`
- `Appointment`
- `Session`

---

## Faz 13 — Gizli Veri & Güvenli Çıktı Kontrolleri (Yeni / P0)

> **Amaç:** Response, error, log ve serialization katmanlarında veri sızıntısını önlemek.

**Test konuları:**

- raw token dönmemesi
- password hash dönmemesi
- reset token / otp / secret leak olmaması
- provider credential’ların hata objesine düşmemesi
- sanitized response helpers
- `omitSensitiveFields` benzeri metodların tüm varyasyonları

---

## Faz 14 — Cron, Jobs & Reentrancy (Yeni / P1)

> **Amaç:** Job’ların birden fazla kez çalışması veya yarım kalması durumunda tutarlılığı korumak.

**Test konuları:**

- aynı cron iki kez tetiklenirse
- job yarıda kesilirse
- flush işlemi iki kez çalışırsa
- `publishScheduledPosts` idempotency
- queue job duplicate prevention
- job retry sonrası duplicate side effect oluşmaması

---

## Faz 15 — Observability-Aware Testler (Yeni / P2)

> **Amaç:** Hata ve kritik akışlarda sistemin gözlemlenebilir olmasını sağlamak.

**Test konuları:**

- kritik hatalarda logger çağrılıyor mu
- security event audit ediliyor mu
- brute-force / suspicious login event kaydı
- campaign send summary log’ları
- slot booking conflict telemetry

---

## Özet Tablo

| Faz | Kapsam | Öncelik | Test Dosyası Sayısı |
|-----|--------|---------|---------------------|
| 1 | Auth & Güvenlik | P0 — Kritik | ~11 |
| 2 | Çekirdek İçerik | P1 — Yüksek | ~9 |
| 3 | Bildirim & Kampanya | P1 — Yüksek | ~5 |
| 4 | Randevu & Analitik & Link | P2 — Orta | ~5 |
| 5 | Depolama, Entegrasyon & AI | P2 — Orta | ~6 |
| 6 | Yardımcı Servisler | P3 — Düşük | ~9 |
| 7 | Helpers | P3 — Düşük | ~4 |
| 8 | Yetkilendirme & Policy Enforcement | P0 — Kritik | T.B.D. (cross-cutting) |
| 9 | Cache, Idempotency & Consistency | P1 — Yüksek | T.B.D. (cross-cutting) |
| 10 | Hata Yönetimi & Fallback | P1 — Yüksek | T.B.D. (cross-cutting) |
| 11 | Boundary & Input Extremes | P2 — Orta | T.B.D. (cross-cutting) |
| 12 | Durum Geçişleri & Lifecycle | P1 — Yüksek | T.B.D. (cross-cutting) |
| 13 | Gizli Veri & Güvenli Çıktı | P0 — Kritik | T.B.D. (cross-cutting) |
| 14 | Cron, Jobs & Reentrancy | P1 — Yüksek | T.B.D. (cross-cutting) |
| 15 | Observability-Aware Testler | P2 — Orta | T.B.D. (cross-cutting) |
| **Toplam** | | | **~49 + T.B.D. (ek backlog)** |

---

## Mock Şablon Referansı

```typescript
// Prisma mock — her test dosyasında
jest.mock('@/libs/prisma', () => ({
  prisma: {
    user: { findUnique: jest.fn(), create: jest.fn(), update: jest.fn(), delete: jest.fn() },
    userSession: { create: jest.fn(), findFirst: jest.fn(), update: jest.fn(), deleteMany: jest.fn() },
    // sadece ihtiyaç duyulan modeller
  },
}))

// Redis — jest.setup.ts'de global; override için:
import redis from '@/libs/redis'
const redisMock = redis as jest.Mocked<typeof redis>

// Dış HTTP (axios) mock:
jest.mock('axios')
import axios from 'axios'
const axiosMock = axios as jest.Mocked<typeof axios>
```

---

*Son güncelleme: Mart 2026 (ek kapsam revizyonu)*
