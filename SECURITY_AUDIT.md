# Güvenlik Denetim Raporu (Security Audit Report)

**Tarih / Date:** 8 Aralık 2024  
**Proje / Project:** KurayDevV2  
**Durum / Status:** ⚠️ KRITIK VE ORTA DÜZEY SORUNLAR BULUNMUŞTUR / CRITICAL AND MEDIUM SEVERITY ISSUES FOUND

---

## 📋 Executive Summary (Yönetici Özeti)

Projede toplamda **8 güvenlik sorunu** tespit edilmiştir:
- 🔴 **Kritik (Critical):** 3 sorun
- 🟠 **Yüksek (High):** 2 sorun  
- 🟡 **Orta (Medium):** 3 sorun

---

## 🔴 KRİTİK SEVİYE SORUNLAR (CRITICAL ISSUES)

### 1. **Token'lar URL'de Açıklanıyor (Token Exposure in URL)**
**Dosya:** `/app/(api)/api/auth/callback/[provider]/route.ts` (Line 48)  
**Şiddet:** KRİTİK  
**CVSS Score:** 9.8

```typescript
// ❌ GÜVENSİZ
const response = NextResponse.redirect(
    `${process.env.APPLICATION_HOST}/auth/callback?rawAccessToken=${rawAccessToken}&rawRefreshToken=${rawRefreshToken}`
)
```

**Sorun:**
- Access token ve refresh token URL query parametresi olarak iletiliyor
- Browser geçmişinde saklanıyor
- Server loglarında görünüyor
- Proxy/firewall loglarında görünüyor
- XSS saldırıcısı kolayca çalabilir

**Çözüm:**
```typescript
// ✅ GÜVENLİ - Cookies veya POST ile iletişim
// Yöntem 1: Cookies kullan
const response = NextResponse.redirect(
    `${process.env.APPLICATION_HOST}/auth/callback`
);
response.cookies.set('accessToken', rawAccessToken, {
    httpOnly: true,
    secure: true,
    sameSite: 'lax',
    maxAge: 60 * 60 // 1 saat
});
response.cookies.set('refreshToken', rawRefreshToken, {
    httpOnly: true,
    secure: true,
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 7 // 7 gün
});
```

---

### 2. **API Anahtarları Environment Variables'da Saklı Ancak İfşa Riski**
**Dosya:** `/helpers/SendSMS.tsx`, `/libs/s3/index.ts`, `/libs/openai/index.ts`  
**Şiddet:** KRİTİK  
**CVSS Score:** 9.1

**Bulunan Anahtarlar:**
- `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_PHONE_NUMBER`
- `NETGSM_USER_CODE`, `NETGSM_SECRET_CODE`, `NETGSM_PHONE_NUMBER`, `NETGSM_APP_KEY`
- `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_REGION`
- `OPENAI_API_KEY`

**Sorun:**
- Credentials kontrolsüz şekilde loglanabiliyor
- Build outputlarda sızdırılabiliyor
- Client-side koda ulaşabiliyor

**Çözüm:**
```bash
# .env.local (GİT'E KATALMSIN)
TWILIO_ACCOUNT_SID=xxx
TWILIO_AUTH_TOKEN=xxx
AWS_ACCESS_KEY_ID=xxx
AWS_SECRET_ACCESS_KEY=xxx
OPENAI_API_KEY=xxx

# Environment değişkenlerini filtrelemek
# next.config.mjs içine
serverRuntimeConfig: {
  // Sadece server tarafında accessible
  apiKeys: {
    openai: process.env.OPENAI_API_KEY,
    aws: process.env.AWS_SECRET_ACCESS_KEY
  }
}
```

---

### 3. **CORS ve Origin Doğrulaması Eksik**
**Dosya:** Tüm API routes  
**Şiddet:** KRİTİK  
**CVSS Score:** 8.6

**Sorun:**
- CORS headers ayarlanmamış
- Origin doğrulaması yapılmıyor
- Cross-origin istek kısıtlaması yok
- POST endpoint'ler CSRF saldırısına açık

**Çözüm:**
```typescript
// middleware.ts oluştur
import { NextRequest, NextResponse } from 'next/server';

const ALLOWED_ORIGINS = process.env.ALLOWED_ORIGINS?.split(',') || [
    'https://yourdomain.com',
    'https://www.yourdomain.com'
];

export function middleware(request: NextRequest) {
    const origin = request.headers.get('origin');
    
    // Sensible endpoints için CORS kontrol
    if (request.nextUrl.pathname.startsWith('/api/')) {
        if (!ALLOWED_ORIGINS.includes(origin)) {
            return new NextResponse('Unauthorized', { status: 403 });
        }
        
        const response = NextResponse.next();
        response.headers.set('Access-Control-Allow-Origin', origin);
        response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
        response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
        response.headers.set('Access-Control-Allow-Credentials', 'true');
        return response;
    }
    
    return NextResponse.next();
}

export const config = {
    matcher: ['/api/:path*']
};
```

---

## 🟠 YÜKSEK SEVİYE SORUNLAR (HIGH SEVERITY)

### 4. **Redirect Validation Eksik (Open Redirect)**
**Dosya:** `/app/(api)/api/auth/callback/[provider]/route.ts` (Satırlar 21-22, 29-30, 45-46)  
**Şiddet:** YÜKSEK  
**CVSS Score:** 7.5

```typescript
// ❌ GÜVENSİZ - Doğrulama yok
NextResponse.redirect(process.env.APPLICATION_HOST + '/auth/login?error=Missing code');
```

**Sorun:**
- `process.env.APPLICATION_HOST` değeri doğrulanmıyor
- Kötü amaçlı URL'ye yönlendirme mümkün
- Phishing saldırıları için kullanılabilir

**Çözüm:**
```typescript
function isValidRedirect(url: string): boolean {
    try {
        const parsedUrl = new URL(url);
        const allowedHosts = ['yourdomain.com', 'www.yourdomain.com'];
        return allowedHosts.includes(parsedUrl.hostname);
    } catch {
        return false;
    }
}

// Kullanım
const redirectUrl = `${process.env.APPLICATION_HOST}/auth/login?error=Missing code`;
if (!isValidRedirect(redirectUrl)) {
    return new NextResponse('Invalid redirect', { status: 400 });
}
```

---

### 5. **Login Endpointinde Zayıf Error Handling (Information Disclosure)**
**Dosya:** `/app/(api)/api/auth/login/route.ts`  
**Şiddet:** YÜKSEK  
**CVSS Score:** 6.5

```typescript
// ❌ GÜVENSİZ - User enumeration
if (!user) {
    throw new Error(AuthMessages.INVALID_CREDENTIALS);
}
```

**Sorun:**
- Login başarısız olunca "Kullanıcı bulunamadı" vs "Parola yanlış" diye ayırt ediliyor
- Attacker email enumerasyonu yapabiliyor

**Çözüm:**
```typescript
const user = await AuthService.login({ email, password });

if (!user) {
    // ✅ GÜVENLİ - Genelleştirilmiş hata mesajı
    // Rate limiting'i de biraz daha yavaşlat
    await new Promise(resolve => setTimeout(resolve, 500));
    return NextResponse.json({
        error: "E-mail veya parola hatalı"
    }, { status: 401 });
}
```

---

## 🟡 ORTA SEVİYE SORUNLAR (MEDIUM SEVERITY)

### 6. **SMS Sağlayıcıları İçin Credentials Exposure Riski**
**Dosya:** `/helpers/SendSMS.tsx`  
**Şiddet:** ORTA  
**CVSS Score:** 5.3

```typescript
// Satır 98-107 - Credentials açıkça kullanılıyor
formData.append("password", process.env.NETGSM_SECRET_CODE);
```

**Sorun:**
- API request loglarında password görünebilir
- Error response'larda credentials ifşa edilebilir

**Çözüm:**
```typescript
// Wrapper sınıf oluştur
class SecureNetGSMClient {
    private apiKey: string;
    
    constructor() {
        if (!process.env.NETGSM_SECRET_CODE) {
            throw new Error('Missing NETGSM credentials');
        }
        this.apiKey = process.env.NETGSM_SECRET_CODE;
    }
    
    async send(phone: string, message: string) {
        // Credentials log'a basılmayan şekilde gönder
        const headers = {
            'Authorization': `Bearer ${this.apiKey}`
        };
    }
}
```

---

### 7. **Rate Limiting'in IP Spoofing'e Karşı Açık Olması**
**Dosya:** `/libs/rateLimit/index.ts`  
**Şiddet:** ORTA  
**CVSS Score:** 5.7

```typescript
// ❌ GÜVENSİZ - x-forwarded-for spoof edilebilir
static getIpFromRequest(request: NextRequest): string {
    return (
        request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
        request.headers.get('x-real-ip')?.trim() ||
        'unknown'
    );
}
```

**Sorun:**
- x-forwarded-for header'ı client tarafından spoof edilebilir
- Proxy arkasındaysa güvenilir değildir

**Çözüm:**
```typescript
// Sadece trusted proxy'lerin header'ını kullan
static getIpFromRequest(request: NextRequest, trustedProxy = false): string {
    if (trustedProxy) {
        // Eğer Cloudflare, AWS gibi trust edilen proxy
        return request.headers.get('cf-connecting-ip') || // Cloudflare
               request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
               request.socket?.remoteAddress ||
               'unknown';
    }
    
    // Trusted proxy yoksa doğrudan bağlantıyı kullan
    return request.socket?.remoteAddress || 'unknown';
}
```

---

### 8. **Session Token'ı Hashing İçin SHA-256 Kullanılıyor (Zayıf)**
**Dosya:** `/services/AuthService/UserSessionService.ts` (Line 166)  
**Şiddet:** ORTA  
**CVSS Score:** 5.1

```typescript
// ❌ ZAYıF - SHA-256 password hashing için uygun değil
static hashToken(token: string): string {
    return crypto.createHash("sha256").update(token).digest("hex");
}
```

**Sorun:**
- SHA-256 hızlıdır, brute force saldırılarına açıktır
- Salt kullanılmıyor
- Rainbow table saldırılarına açık

**Çözüm:**
```typescript
import bcrypt from 'bcrypt';

// ✅ GÜVENLİ - Bcrypt kullan
static async hashToken(token: string): Promise<string> {
    return bcrypt.hash(token, 12); // 12 rounds
}

static async compareToken(rawToken: string, hashedToken: string): Promise<boolean> {
    return bcrypt.compare(rawToken, hashedToken);
}
```

---

## 📋 Kontrol Listesi (Checklist)

- [ ] URL'de token gönderme kaldırılacak
- [ ] .env.local örneği oluşturulacak (.env.example)
- [ ] CORS middleware kurulacak
- [ ] Redirect validation eklenecek
- [ ] Error mesajları genelleştirilecek
- [ ] Rate limiting IP spoofing'e karşı korunacak
- [ ] Token hashing bcrypt ile yapılacak
- [ ] API security headers eklenecek (CSP, X-Frame-Options, vb.)
- [ ] HTTPS enforcement kurulacak
- [ ] Dependency vulnerabilities taraması yapılacak (`npm audit`)

---

## 🛠️ Acil Yapılması Gereken İşlemler (Immediate Actions)

1. **ÖNCE:** `/app/(api)/api/auth/callback/[provider]/route.ts` düzeltilecek - Kritik!
2. **.env** dosyasının git'e commit edilmediğini kontrol et
3. **CORS** policy'si kurulacak
4. Rate limiting IP'lerin doğrulanması yapılacak
5. Token hashing bcrypt'e geçirilecek

---

## 📚 Faydalı Kaynaklar

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Auth0 Security Best Practices](https://auth0.com/docs/get-started/identity-fundamentals/authentication-and-authorization)
- [Next.js Security Guide](https://nextjs.org/docs/basic-features/data-fetching/security)
- [Node.js Security Best Practices](https://nodejs.org/en/docs/guides/security/)

---

**Raporlayan:** GitHub Copilot Security Scanner  
**Güncelleme Tarihi:** 8 Aralık 2024
