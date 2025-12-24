# Logging ve Hata İzleme Analizi

> **Analiz Tarihi:** 2025  
> **Proje:** KurayDevV2 - Next.js Portfolio & Blog Platform  
> **Analiz Kapsamı:** console.log kullanımı, structured logging, error context, production debugging imkanları

---

## 📋 Executive Summary

| Kriter | Değerlendirme | Skor |
|--------|---------------|------|
| **Winston Logger** | ✅ Mevcut | 6/10 |
| **console.log Kullanımı** | ⚠️ Yaygın (50+) | 3/10 |
| **Structured Logging** | ⚠️ Kısmi | 4/10 |
| **Error Context** | ❌ Yetersiz | 2/10 |
| **Production Debugging** | ❌ Zayıf | 2/10 |
| **APM/Monitoring** | ❌ Yok | 0/10 |
| **Request Tracing** | ❌ Yok | 0/10 |

**Genel Değerlendirme:** Proje temel bir Winston logger altyapısına sahip ancak tutarsız kullanım, eksik error context ve production monitoring araçlarının yokluğu ciddi sorunlar oluşturuyor.

---

## 🔍 Mevcut Logger Altyapısı

### Winston Logger Yapılandırması

```typescript
// libs/logger/index.ts
import winston from 'winston';

const { combine, timestamp, json, printf } = winston.format;
const timestampFormat = 'MMM-DD-YYYY HH:mm:ss';
const NODE_ENV = process.env.NODE_ENV || 'development';

export default class Logger {
  private static infoLogger = winston.createLogger({
    level: 'info',
    format: combine(
      timestamp({ format: timestampFormat }),
      json(),
      printf(({ level, message, timestamp }) => {
        return `[${timestamp}] [${level}]: ${message}`;
      })
    ),
    transports: (NODE_ENV === 'vercel' || NODE_ENV === 'development') ? [
      new winston.transports.Console(),
    ] : [
      new winston.transports.File({
        filename: 'logs/' + new Date().toISOString().split('T')[0] + '.log',
        level: 'info',
      }),
    ],
  });

  // errorLogger ve warnLogger benzer yapıda...

  static info(message: string) {
    Logger.infoLogger.info(message);
  }

  static error(message: string) {
    Logger.errorLogger.error(message);
  }

  static warn(message: string) {
    Logger.warnLogger.warn(message);
  }
}
```

### Logger Analizi

**Güçlü Yönler:**
- ✅ Winston kullanımı (production-ready library)
- ✅ Timestamp formatı mevcut
- ✅ Environment-based transport seçimi
- ✅ File logging desteği (production dışı)

**Zayıf Yönler:**
- ❌ Sadece string message kabul ediyor, metadata desteği yok
- ❌ Log rotation yok
- ❌ Log level filtreleme dinamik değil
- ❌ Vercel'de sadece console, file logging yok
- ❌ Ayrı logger instance'ları gereksiz (tek logger yeterli)
- ❌ JSON format var ama printf ile override ediliyor

---

## 📊 console.log Kullanım Analizi

### Kullanım İstatistikleri

| Lokasyon | Toplam | console.log | console.error | console.warn |
|----------|--------|-------------|---------------|--------------|
| API Routes | 20+ | 8 | 10 | 2 |
| Components | 25+ | 6 | 18 | 1 |
| Services | 5+ | 1 | 3 | 1 |
| Helpers | 8+ | 0 | 8 | 0 |

### Sorunlu Pattern'ler

#### 1. Debug Log'ların Production'da Kalması

```typescript
// app/(api)/api/auth/login/route.ts
console.log('[LOGIN] Setting cookies - isSecure:', isSecure, 'protocol:', protocol, 'origin:', origin);
console.log('[LOGIN] Request headers:', {
    host: request.headers.get('host'),
    origin: request.headers.get('origin'),
    'x-forwarded-host': request.headers.get('x-forwarded-host'),
    'x-forwarded-proto': request.headers.get('x-forwarded-proto'),
});
console.log('[LOGIN] Cookies set successfully with options:', cookieOptions);
```

**Sorun:** Hassas bilgiler (headers, cookies) production log'larına yazılıyor.

#### 2. Tutarsız Error Logging

```typescript
// app/(api)/api/posts/route.ts - console.error kullanımı
catch (error: any) {
    console.error(error.message);  // ❌ Sadece message, stack yok
    return NextResponse.json(
        { message: error.message },
        { status: 500 }
    );
}

// app/(api)/api/booking/route.ts - Logger kullanımı
catch (err: any) {
    Logger.error('API/booking POST: ' + err.message)  // ✅ Logger kullanılmış
    return NextResponse.json(
        { message: 'Internal server error' },
        { status: 500 }
    )
}
```

#### 3. Component'lerde API Error Logging

```typescript
// components/frontend/Features/Blog/Feed/index.tsx
useEffect(() => {
    axiosInstance.get("/api/posts")
        .then(response => {
            console.log("Fetched posts:", response);  // ❌ Debug log
        })
        .catch(error => {
            console.error("Error fetching posts:", error);  // ❌ Client-side console
        });
}, [page]);
```

**Sorun:** Client-side error'lar izlenemiyor, kullanıcının browser'ında kalıyor.

---

## 🏷️ Logger Kullanım Haritası

### Logger Import Eden Dosyalar

```
✅ Logger Kullanan Dosyalar:
├── services/AppointmentService/index.ts
├── services/KnowledgeGraphService.ts
├── services/CronService/index.ts
├── services/NotificationService/SMSService/TwilloService.ts
├── services/NotificationService/SMSService/NexmoService.ts
├── services/PostService/LocalEmbedService.ts
├── app/(api)/api/booking/route.ts
├── app/(api)/api/appointments/[appointmentId]/book/route.ts
├── app/(api)/api/appointments/[appointmentId]/cancel/route.ts
├── app/(api)/api/knowledge-graph/route.ts
├── app/(api)/api/cron/[frequency]/route.ts
└── helpers/TimeHelper.ts
```

### Logger Kullanmayan Kritik Dosyalar

```
❌ console.error Kullanan API Routes:
├── app/(api)/api/posts/route.ts
├── app/(api)/api/projects/route.ts
├── app/(api)/api/slot-templates/[day]/route.ts
├── app/(api)/api/appointments/route.ts
├── app/(api)/api/auth/login/route.ts
├── app/(api)/api/auth/logout/route.ts
├── app/(api)/api/auth/otp/verify/route.ts
└── ... (ve diğerleri)
```

---

## 🚨 Error Handling Analizi

### Mevcut Error Pattern'leri

#### Pattern 1: Generic Error Messages

```typescript
// services/UserService/index.ts
static INVALID_EMAIL = "INVALID_EMAIL";
static INVALID_PASSWORD_FORMAT = "INVALID_PASSWORD_FORMAT";
static USER_NOT_FOUND = "USER_NOT_FOUND";
static EMAIL_ALREADY_EXISTS = "EMAIL_ALREADY_EXISTS";

static async create({ email, password, name, phone, userRole }) {
    if (!email || !FieldValidater.isEmail(email)) {
        throw new Error(this.INVALID_EMAIL);  // ❌ Context yok
    }
}
```

**Eksiklik:** Error'da context bilgisi yok. Hangi email geçersiz? Log'dan anlaşılmıyor.

#### Pattern 2: Message-Only Error Logging

```typescript
// Yaygın pattern
catch (error: any) {
    console.error(error.message);  // ❌ Stack trace kayboluyor
}
```

#### Pattern 3: Error Stack Kullanımı (Nadir)

```typescript
// services/AuthService/UserSessionService.ts (tek örnek)
catch (error: any) {
    console.error('[AUTH] Authentication error:', error.message, error.stack);
}
```

### Message Enum'ları

Proje merkezi error message enum'ları kullanıyor:

```
messages/
├── AIMessages.ts
├── AppointmentMessages.ts
├── AuthMessages.ts           ✅ 50+ mesaj tanımlı
├── CategoryMessages.ts
├── CommentMessages.ts
├── ContactMessages.ts
├── GEOAnalyticsMessages.ts
├── PostMessages.ts
├── ProjectMessages.ts
├── SlotMessages.ts
├── SSOMessages.ts
├── SubscriptionMessages.ts
├── UserMessages.ts
└── ValidationMessages.ts
```

**Örnek - AuthMessages.ts:**

```typescript
export enum AuthMessages {
    INVALID_CREDENTIALS = "INVALID_CREDENTIALS",
    INVALID_EMAIL_OR_PASSWORD = "INVALID_EMAIL_OR_PASSWORD",
    SESSION_NOT_FOUND = "SESSION_NOT_FOUND",
    USER_NOT_FOUND = "USER_NOT_FOUND",
    TOKEN_EXPIRED = "TOKEN_EXPIRED",
    REFRESH_TOKEN_REUSED = "REFRESH_TOKEN_REUSED",
    // ... 50+ mesaj
}
```

**Güçlü Yön:** Merkezi, tutarlı error message'lar  
**Zayıf Yön:** i18n desteği yok, sadece İngilizce

---

## 📉 Production Debugging Kapasitesi

### Mevcut Durum

| Özellik | Durum | Etki |
|---------|-------|------|
| APM Tool (Sentry, DataDog) | ❌ Yok | Error tracking yok |
| Request Tracing | ❌ Yok | Request flow izlenemiyor |
| Correlation ID | ❌ Yok | Log'lar ilişkilendirilemiyor |
| Performance Metrics | ❌ Yok | Yavaş endpoint'ler tespit edilemiyor |
| User Context | ❌ Yok | Hangi user etkilendi bilinmiyor |
| Error Grouping | ❌ Yok | Benzer hatalar gruplanmıyor |
| Alerting | ❌ Yok | Kritik hatalardan haberdar olunmuyor |

### Vercel Environment'ında Logging

```typescript
// libs/logger/index.ts
transports: (NODE_ENV === 'vercel' || NODE_ENV === 'development') ? [
    new winston.transports.Console(),
] : [
    new winston.transports.File({ ... }),
],
```

**Sorun:** Vercel'de sadece console transport kullanılıyor. Vercel log'ları:
- Sadece 1 saat retention (Free tier)
- Search/filter kapasitesi sınırlı
- Log volume limiti var
- Structured query yok

---

## 🔬 Kritik Eksiklikler

### 1. Request Context Yok

```typescript
// ❌ Mevcut durum
Logger.error('API/booking POST: ' + err.message)

// ✅ Olması gereken
Logger.error({
    message: 'Booking creation failed',
    error: err.message,
    stack: err.stack,
    requestId: req.headers.get('x-request-id'),
    userId: session?.userId,
    endpoint: '/api/booking',
    method: 'POST',
    body: sanitize(body),
    duration: Date.now() - startTime
})
```

### 2. Correlation ID Eksik

```typescript
// ❌ Log'lar ilişkilendirilemiyor
[Dec-24-2025 10:30:15] [info]: User logged in
[Dec-24-2025 10:30:15] [info]: Session created
[Dec-24-2025 10:30:16] [error]: Failed to send email

// ✅ Olması gereken (aynı request'e ait olduğu belli)
[Dec-24-2025 10:30:15] [info] [req-abc123]: User logged in
[Dec-24-2025 10:30:15] [info] [req-abc123]: Session created
[Dec-24-2025 10:30:16] [error] [req-abc123]: Failed to send email
```

### 3. Structured Metadata Eksik

```typescript
// ❌ Mevcut - String concatenation
Logger.info(`Appointment created for ${date} ${time}`)
Logger.info(`[KG-Worker] Processing job ${job.id}: ${type} ${postId || ''}`)

// ✅ Olması gereken - Structured
Logger.info('Appointment created', { date, time, appointmentId })
Logger.info('KG-Worker processing job', { 
    jobId: job.id, 
    type, 
    postId,
    attempt: job.attemptsMade 
})
```

### 4. Performance Logging Eksik

```typescript
// ❌ Süre bilgisi yok
const result = await PostService.getAllPosts({ ... });
return NextResponse.json({ posts: result.posts });

// ✅ Olması gereken
const startTime = Date.now();
const result = await PostService.getAllPosts({ ... });
Logger.info('Posts fetched', {
    count: result.posts.length,
    total: result.total,
    duration: Date.now() - startTime,
    page,
    pageSize
});
```

---

## 🏗️ Önerilen Mimari

### 1. Enhanced Logger

```typescript
// libs/logger/index.ts (Önerilen)
import pino from 'pino';

interface LogContext {
    requestId?: string;
    userId?: string;
    sessionId?: string;
    endpoint?: string;
    method?: string;
    duration?: number;
    [key: string]: any;
}

const isProduction = process.env.NODE_ENV === 'production';

const logger = pino({
    level: process.env.LOG_LEVEL || 'info',
    formatters: {
        level: (label) => ({ level: label }),
    },
    base: {
        env: process.env.NODE_ENV,
        service: 'kuraydev',
        version: process.env.npm_package_version,
    },
    timestamp: pino.stdTimeFunctions.isoTime,
    ...(isProduction ? {} : {
        transport: {
            target: 'pino-pretty',
            options: { colorize: true }
        }
    })
});

export class Logger {
    private static context: LogContext = {};

    static setContext(ctx: LogContext) {
        this.context = { ...this.context, ...ctx };
    }

    static clearContext() {
        this.context = {};
    }

    static info(message: string, meta?: Record<string, any>) {
        logger.info({ ...this.context, ...meta }, message);
    }

    static warn(message: string, meta?: Record<string, any>) {
        logger.warn({ ...this.context, ...meta }, message);
    }

    static error(message: string, error?: Error, meta?: Record<string, any>) {
        logger.error({
            ...this.context,
            ...meta,
            error: error ? {
                message: error.message,
                name: error.name,
                stack: error.stack,
            } : undefined
        }, message);
    }

    static debug(message: string, meta?: Record<string, any>) {
        logger.debug({ ...this.context, ...meta }, message);
    }

    static child(bindings: Record<string, any>) {
        return logger.child(bindings);
    }
}
```

### 2. Request Context Middleware

```typescript
// middleware/logging.ts
import { NextRequest, NextResponse } from 'next/server';
import { Logger } from '@/libs/logger';
import { v4 as uuidv4 } from 'uuid';

export async function withRequestLogging(
    request: NextRequest,
    handler: (req: NextRequest) => Promise<NextResponse>
): Promise<NextResponse> {
    const requestId = request.headers.get('x-request-id') || uuidv4();
    const startTime = Date.now();

    Logger.setContext({
        requestId,
        endpoint: request.nextUrl.pathname,
        method: request.method,
        userAgent: request.headers.get('user-agent'),
        ip: request.headers.get('x-forwarded-for'),
    });

    Logger.info('Request started');

    try {
        const response = await handler(request);
        
        Logger.info('Request completed', {
            status: response.status,
            duration: Date.now() - startTime,
        });

        response.headers.set('x-request-id', requestId);
        return response;

    } catch (error) {
        Logger.error('Request failed', error as Error, {
            duration: Date.now() - startTime,
        });
        throw error;
    } finally {
        Logger.clearContext();
    }
}
```

### 3. Error Boundary with Reporting

```typescript
// libs/errorReporting.ts
interface ErrorReport {
    message: string;
    stack?: string;
    context: {
        requestId?: string;
        userId?: string;
        url?: string;
        userAgent?: string;
        extra?: Record<string, any>;
    };
    severity: 'error' | 'warning' | 'info';
    timestamp: string;
}

export class ErrorReporter {
    static async report(error: Error, context?: Record<string, any>) {
        const report: ErrorReport = {
            message: error.message,
            stack: error.stack,
            context: {
                ...context,
                url: typeof window !== 'undefined' ? window.location.href : undefined,
            },
            severity: 'error',
            timestamp: new Date().toISOString(),
        };

        // Sentry örneği
        // Sentry.captureException(error, { extra: report.context });

        // Veya custom endpoint
        if (process.env.ERROR_REPORTING_ENDPOINT) {
            await fetch(process.env.ERROR_REPORTING_ENDPOINT, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(report),
            }).catch(() => {
                // Silent fail - don't throw from error reporter
            });
        }

        // Always log locally
        Logger.error(error.message, error, context);
    }
}
```

### 4. API Route Error Handler

```typescript
// utils/apiHandler.ts
import { NextRequest, NextResponse } from 'next/server';
import { Logger } from '@/libs/logger';
import { ErrorReporter } from '@/libs/errorReporting';
import { ZodError } from 'zod';

type ApiHandler = (req: NextRequest) => Promise<NextResponse>;

export function withErrorHandling(handler: ApiHandler): ApiHandler {
    return async (request: NextRequest) => {
        const startTime = Date.now();
        
        try {
            return await handler(request);
        } catch (error) {
            const duration = Date.now() - startTime;

            if (error instanceof ZodError) {
                Logger.warn('Validation error', {
                    errors: error.errors,
                    duration,
                });
                return NextResponse.json(
                    { error: 'Validation failed', details: error.errors },
                    { status: 400 }
                );
            }

            if (error instanceof Error) {
                // Known business errors
                if (error.message.startsWith('AUTH_') || 
                    error.message.startsWith('USER_') ||
                    error.message.startsWith('POST_')) {
                    Logger.warn('Business error', { 
                        code: error.message,
                        duration 
                    });
                    return NextResponse.json(
                        { error: error.message },
                        { status: 400 }
                    );
                }

                // Unknown errors - report and hide details
                await ErrorReporter.report(error, {
                    endpoint: request.nextUrl.pathname,
                    method: request.method,
                });

                return NextResponse.json(
                    { 
                        error: 'Internal server error',
                        requestId: request.headers.get('x-request-id'),
                    },
                    { status: 500 }
                );
            }

            // Non-Error throws
            Logger.error('Unknown error type thrown', undefined, { error });
            return NextResponse.json(
                { error: 'Internal server error' },
                { status: 500 }
            );
        }
    };
}
```

---

## 📋 Migration Planı

### Faz 1: Logger Upgrade (1-2 gün)

1. **Pino veya Winston upgrade**
```bash
npm install pino pino-pretty
# veya mevcut Winston'ı güncelle
```

2. **Structured logging support**
```typescript
// Eski
Logger.info(`User ${userId} logged in`)
// Yeni
Logger.info('User logged in', { userId })
```

3. **Tüm console.log → Logger migration**

### Faz 2: Request Context (2-3 gün)

1. **Correlation ID middleware**
2. **Request/Response logging**
3. **Duration tracking**

### Faz 3: Error Reporting (1 hafta)

1. **Sentry integration**
```bash
npm install @sentry/nextjs
npx @sentry/wizard@latest -i nextjs
```

2. **Error boundary components**
3. **API error handler wrapper**

### Faz 4: Monitoring (1-2 hafta)

1. **Vercel Analytics** (ücretsiz başlangıç)
2. **Custom metrics endpoint**
3. **Health check endpoint**
4. **Alert kuralları**

---

## 🔧 Hızlı Kazanımlar (Quick Wins)

### 1. console.log Temizliği

```typescript
// Tüm debug log'ları kaldır
console.log('[LOGIN] Setting cookies...');  // ❌ Kaldır
console.log("Fetched posts:", response);    // ❌ Kaldır
```

### 2. Error Stack Logging

```typescript
// Mevcut
console.error(error.message);

// İyileştirilmiş
Logger.error('Operation failed', {
    message: error.message,
    stack: error.stack,
    name: error.name
});
```

### 3. Sensitive Data Masking

```typescript
// ❌ Tehlikeli
console.log('Request headers:', request.headers);

// ✅ Güvenli
Logger.debug('Request received', {
    contentType: request.headers.get('content-type'),
    // Diğer hassas header'lar loglanmaz
});
```

---

## 📊 Production Hazırlık Checklist

| Madde | Mevcut | Hedef | Öncelik |
|-------|--------|-------|---------|
| Structured logging | ❌ | ✅ | P0 |
| console.log temizliği | ❌ | ✅ | P0 |
| Request ID tracking | ❌ | ✅ | P1 |
| Error stack logging | ⚠️ | ✅ | P1 |
| Sentry/APM integration | ❌ | ✅ | P1 |
| Performance metrics | ❌ | ✅ | P2 |
| Log retention policy | ❌ | ✅ | P2 |
| Alert rules | ❌ | ✅ | P2 |
| Sensitive data masking | ❌ | ✅ | P0 |
| Health check endpoint | ❌ | ✅ | P2 |

---

## ✅ Sonuç

### Kritik Sorunlar

1. **Tutarsız Logging:** console.log ve Logger karışık kullanılıyor
2. **Context Eksikliği:** Error'ların root cause analizi imkansız
3. **Production Blindness:** APM/monitoring yok, hatalar fark edilmiyor
4. **Sensitive Data Leakage:** Debug log'lar production'da kalıyor
5. **Stack Trace Kaybı:** Error.message ile stack bilgisi kayboluyor

### Önerilen Aksiyon Öncelikleri

1. **Acil (Bu Hafta):**
   - Tüm console.log'ları Logger'a migrate et
   - Debug log'ları production'dan kaldır
   - Error stack logging ekle

2. **Kısa Vadeli (2 Hafta):**
   - Sentry integration
   - Request ID middleware
   - Structured logging format

3. **Orta Vadeli (1 Ay):**
   - Performance metrics
   - Custom dashboards
   - Alert kuralları

### ROI Tahmini

| İyileştirme | Effort | Kazanım |
|-------------|--------|---------|
| Sentry Integration | 4 saat | Production error visibility %100 artış |
| Structured Logging | 8 saat | Debug time %50 azalma |
| Request Tracing | 4 saat | Issue isolation %70 hızlanma |
| console.log cleanup | 2 saat | Security risk %90 azalma |

---

## 📚 Referanslar

- [Pino - Fast Node.js Logger](https://github.com/pinojs/pino)
- [Sentry Next.js SDK](https://docs.sentry.io/platforms/javascript/guides/nextjs/)
- [OpenTelemetry for Node.js](https://opentelemetry.io/docs/instrumentation/js/)
- [12 Factor App - Logs](https://12factor.net/logs)
- [Vercel Log Drains](https://vercel.com/docs/observability/log-drains)
