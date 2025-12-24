# Domain Modelleme ve Clean Architecture Analizi

> **Analiz Tarihi:** 2025  
> **Proje:** KurayDevV2 - Next.js Portfolio & Blog Platform  
> **Analiz Kapsamı:** İş mantığı (business logic) ile UI mantığı ayrımı, servis katmanları, Clean Architecture prensiplerine yakınlık

---

## 📋 Executive Summary

| Kriter | Değerlendirme | Skor |
|--------|---------------|------|
| **Servis Katmanı** | ✅ Mevcut ve aktif | 8/10 |
| **DTO Katmanı** | ✅ Zod ile güçlü | 8/10 |
| **Domain-UI Ayrımı** | ⚠️ Kısmen ayrık | 5/10 |
| **Repository Pattern** | ❌ Eksik | 2/10 |
| **Use Case Katmanı** | ❌ Yok | 0/10 |
| **Clean Architecture** | ⚠️ Kısmi uyum | 4/10 |

**Genel Değerlendirme:** Proje klasik bir "Layered Architecture" yaklaşımı sergiliyor. Clean Architecture'ın tüm prensiplerine uymasa da, pragmatik bir katmanlama ile iş mantığını UI'dan kısmen ayırmayı başarmış.

---

## 🏛️ Clean Architecture Prensipleri

### Clean Architecture Nedir?

```
┌─────────────────────────────────────────────────────────┐
│                    Frameworks & Drivers                  │
│  ┌───────────────────────────────────────────────────┐  │
│  │                 Interface Adapters                 │  │
│  │  ┌─────────────────────────────────────────────┐  │  │
│  │  │            Application Business             │  │  │
│  │  │  ┌───────────────────────────────────────┐  │  │  │
│  │  │  │          Enterprise Business          │  │  │  │
│  │  │  │            (Entities)                 │  │  │  │
│  │  │  └───────────────────────────────────────┘  │  │  │
│  │  │              (Use Cases)                    │  │  │
│  │  └─────────────────────────────────────────────┘  │  │
│  │          (Controllers, Presenters, Gateways)       │  │
│  └───────────────────────────────────────────────────┘  │
│              (Web, UI, DB, External Services)            │
└─────────────────────────────────────────────────────────┘
```

**Temel Kurallar:**
1. **Dependency Rule:** İç katmanlar dış katmanları bilmemeli
2. **Entities:** Framework-agnostic iş nesneleri
3. **Use Cases:** Uygulama-spesifik iş kuralları
4. **Interface Adapters:** Veri dönüşüm katmanı
5. **Frameworks & Drivers:** En dış katman (DB, Web, UI)

---

## 📂 Mevcut Mimari Yapı

### Katman Haritası

```
KurayDevV2/
├── app/                    # [Framework Layer] Next.js Routes
│   ├── (api)/             # API Routes - Controller benzeri
│   ├── (frontend)/        # UI Pages
│   └── (admin)/           # Admin UI Pages
│
├── components/            # [Framework Layer] React Components
│   ├── frontend/          # Public-facing UI
│   └── admin/             # Admin UI
│
├── services/              # [Application Layer] Business Logic
│   ├── PostService/
│   ├── UserService/
│   ├── AuthService/
│   └── ... (20+ servis)
│
├── dtos/                  # [Interface Adapter] Data Transfer Objects
│   ├── PostDTO.ts
│   ├── UserDTO.ts
│   └── ... (18 DTO dosyası)
│
├── types/                 # [Domain Layer?] Type Definitions
│   ├── user/
│   ├── content/
│   ├── features/
│   └── common/
│
├── libs/                  # [Framework Layer] External Libraries
│   ├── prisma/           # Database Client
│   ├── redis/            # Cache Client
│   └── axios/            # HTTP Client
│
└── generated/prisma/     # [Framework Layer] Generated Types
```

---

## 🔍 Katman Detaylı Analizi

### 1. Servis Katmanı (Services) - ✅ İyi Tasarlanmış

**Konum:** `/services/`

**Bulunan Servisler:**
```
AppointmentService/    CategoryService.ts     CommentService.ts
ContactFormService.ts  CronService/          DBGeoService.ts
GeoAnalyticsService.ts IntegrationService/   KnowledgeGraphService.ts
NotificationService/   OpenAIService.ts      PostService/
ProjectService.ts      SettingService.ts     SitemapService.ts
SocialMediaService/    StatService.ts        StorageService/
SubscriptionService.ts UserAgentService.ts   UserService/
AuthService/
```

**Örnek Servis Yapısı - PostService:**
```typescript
// services/PostService/index.ts
export default class PostService {
    static SQL_INJECTION_REGEX = /[\s\[\]{}()*+?.,\\^$|#]/;
    static CACHE_KEY_ALL_POSTS = 'cache:all:posts';

    static async createPost(data: CreatePostDTO): Promise<Post> {
        // Input validation
        if (this.SQL_INJECTION_REGEX.test(data.title)) {
            throw new Error('Invalid input');
        }
        
        // Business logic
        const slug = this.generateSlug(data.title);
        
        // Database operation via Prisma
        return prisma.post.create({
            data: { ...data, slug }
        });
    }
}
```

**Güçlü Yönler:**
- ✅ Static class pattern ile singleton davranışı
- ✅ İş mantığı merkezi lokasyonda
- ✅ SQL injection koruması her serviste
- ✅ Error message'lar serviste tanımlı
- ✅ Transaction desteği (AppointmentService)

**Zayıf Yönler:**
- ❌ Her serviste tekrarlanan validation kodu
- ❌ Prisma direkt kullanımı (Repository pattern yok)
- ❌ Servisler arası bağımlılık injection yerine static çağrı

---

### 2. DTO Katmanı (Data Transfer Objects) - ✅ Güçlü

**Konum:** `/dtos/`

**Örnek DTO - PostDTO.ts:**
```typescript
// dtos/PostDTO.ts
import { z } from 'zod';

// Request Schemas
export const CreatePostRequestSchema = z.object({
    title: z.string().min(1).max(200),
    content: z.string().min(1),
    categoryId: z.string().cuid(),
    status: z.enum(['DRAFT', 'PUBLISHED', 'ARCHIVED']).default('DRAFT'),
    keywords: z.array(z.string()).optional(),
});

export const UpdatePostRequestSchema = CreatePostRequestSchema.partial();

export const GetPostsRequestSchema = z.object({
    page: z.number().default(0),
    pageSize: z.number().default(10),
    status: z.string().optional(),
    categoryId: z.string().optional(),
});

// Response Schemas
export const PostResponseSchema = z.object({
    postId: z.string(),
    title: z.string(),
    slug: z.string(),
    createdAt: z.date(),
});

// Type Inference
export type CreatePostRequest = z.infer<typeof CreatePostRequestSchema>;
export type PostResponse = z.infer<typeof PostResponseSchema>;
```

**Güçlü Yönler:**
- ✅ Zod ile runtime validation
- ✅ Request/Response ayrımı
- ✅ Type inference ile TypeScript entegrasyonu
- ✅ Default değer desteği
- ✅ 18 domain için DTO tanımları

**Kullanım Örneği - API Route:**
```typescript
// app/(api)/api/posts/route.ts
export async function POST(request: NextRequest) {
    const body = await request.json();
    
    // DTO validation
    const parsedData = CreatePostRequestSchema.safeParse(body);
    
    if (!parsedData.success) {
        return NextResponse.json({
            error: parsedData.error.errors.map(err => err.message).join(", ")
        }, { status: 400 });
    }
    
    // Service call with validated data
    const post = await PostService.createPost(parsedData.data);
    return NextResponse.json({ post });
}
```

---

### 3. Type Sistemi - ⚠️ Hibrit Yaklaşım

**Konum:** `/types/`

**Yapı:**
```
types/
├── index.ts           # Master export
├── user/
│   ├── UserTypes.ts
│   ├── UserProfileTypes.ts
│   └── UserSecurityTypes.ts
├── content/
│   ├── BlogTypes.ts
│   └── ProjectTypes.ts
├── features/
│   ├── CalendarTypes.ts
│   └── ContactTypes.ts
├── ui/
│   └── ComponentTypes.ts
└── common/
    └── CommonTypes.ts
```

**Örnek - UserTypes.ts:**
```typescript
// types/user/UserTypes.ts
import { z } from 'zod';

export const UserSchema = z.object({
    userId: z.string(),
    email: z.string().email(),
    name: z.string().nullable(),
    userRole: z.enum(['USER', 'ADMIN', 'MODERATOR']),
    userStatus: z.enum(['ACTIVE', 'INACTIVE', 'BANNED']),
    userProfile: z.any(),
    userPreferences: z.any(),
});

export const SafeUserSchema = UserSchema.omit({ password: true });

export const UserPreferencesDefault = {
    language: 'en',
    theme: 'dark',
    notifications: true,
};

export type User = z.infer<typeof UserSchema>;
export type SafeUser = z.infer<typeof SafeUserSchema>;
```

**Sorun - Prisma Client Import:**
```typescript
// components/frontend/Features/Blog/Feed/index.tsx
import { Category } from '@prisma/client';  // ⚠️ UI Prisma type kullanıyor

// Daha iyi yaklaşım:
import { Category } from '@/types/content/BlogTypes';
```

**Bulgu:** 12 component dosyası `@prisma/client`'tan type import ediyor. Bu Clean Architecture'ın Dependency Rule'unu ihlal ediyor.

---

### 4. Component Katmanı - ⚠️ Mixed Logic

**Konum:** `/components/`

**Sorunlu Pattern - API Call in Component:**
```typescript
// components/frontend/Features/Blog/Feed/index.tsx
'use client';

export default function Feed(props: FeedProps) {
    const [feeds, setFeeds] = useState<FeedCardProps[]>([]);
    const [page, setPage] = useState(0);
    
    useEffect(() => {
        // ❌ API call directly in component
        axiosInstance.get("/api/posts" + `?page=${page}&pageSize=${pageSize}`)
            .then(response => {
                // ❌ Data transformation in component
                const incomingFeeds = response.data.posts.map((post: any) => ({
                    ...post,
                    createdAt: new Date(post.createdAt),
                    image: post.image || `${HOST}/api/posts/${post.postId}/cover.jpeg`,
                }));
                setFeeds(prev => [...prev, ...incomingFeeds]);
            });
    }, [page]);
    
    return <div>{/* UI rendering */}</div>;
}
```

**Sorunlu Pattern - AppointmentCalendar:**
```typescript
// components/frontend/Features/Appointments/AppointmentCalendar/index.tsx
'use client'

export default function AppointmentCalendar() {
    const [availableSlots, setAvailableSlots] = useState<Slot[]>([]);
    
    // ❌ Business logic in component
    const formatDate = (date: Date) => format(date, 'yyyy-MM-dd');
    
    const getTileClassName = ({ date }: { date: Date }): string => {
        // ❌ Complex business logic
        const hasSlot = availableSlots.some(
            (s) => format(new Date(s.startTime), 'yyyy-MM-dd') === formatDate(date)
        );
        const isPast = date < new Date(todayStr);
        // ...
    };
    
    const slotsOf = (date: Date) => {
        // ❌ Data filtering logic
        return availableSlots.filter(
            (s) => format(new Date(s.startTime), 'yyyy-MM-dd') === formatDate(date)
        );
    };
    
    // ❌ API call in component
    const preloadRange = async () => {
        await axios.get(`/api/slots?startDate=${start}&endDate=${end}`)
            .then((res) => setAvailableSlots(res.data?.slots || []));
    };
}
```

**API Call Yapan Component'ler (20+ match):**
```
components/frontend/Features/Appointments/AppointmentCalendar/index.tsx
components/frontend/Features/Appointments/AppointmentCalendar/AppointmentModal.tsx
components/frontend/Features/CategoryBullets/index.tsx
components/frontend/Features/Newsletter/index.tsx
components/frontend/Features/Hero/GitContributions/Partial/HeatMap.tsx
components/frontend/Features/Hero/Projects/index.tsx
components/frontend/Features/Hero/Contact/index.tsx
components/frontend/Features/Blog/Feed/index.tsx
components/frontend/Features/Blog/Comments/index.tsx
components/frontend/Features/Settings/Tabs/*.tsx
...
```

---

### 5. Custom Hooks - ⚠️ Minimal Kullanım

**Bulunan Hooks:**
```
components/frontend/Features/Settings/Tabs/OTPTab/hooks/
├── useTOTP.ts
└── useOTP.ts
```

**Örnek - useTOTP.ts (İyi Pattern):**
```typescript
// hooks/useTOTP.ts
import { useState } from 'react';
import axiosInstance from '@/libs/axios';

export function useTOTP(
    userSecurity: SafeUserSecurity, 
    onUserSecurityUpdate: (updated: SafeUserSecurity) => void
) {
    // State management
    const [totpModalOpen, setTotpModalOpen] = useState(false);
    const [totpCode, setTotpCode] = useState('');
    const [totpLoadingSetup, setTotpLoadingSetup] = useState(false);
    
    // Business operations
    const startTotpSetup = async () => {
        setTotpLoadingSetup(true);
        const res = await axiosInstance.post('/api/auth/totp/setup');
        setTotpOtpauthUrl(res.data.otpauthUrl);
        setTotpLoadingSetup(false);
    };
    
    const verifyTotpEnable = async () => {
        await axiosInstance.post('/api/auth/totp/enable', { otpToken: totpCode });
    };
    
    return {
        totpModalOpen,
        openTotpSetup,
        closeTotpModal,
        verifyTotpEnable,
        // ...
    };
}
```

**Eksiklikler:**
- ❌ Sadece 2 custom hook mevcut
- ❌ Data fetching için genel hook yok (`usePost`, `useCategories` vb.)
- ❌ TanStack Query / SWR kullanımı yok

---

### 6. State Management - ⚠️ Minimal

**Zustand Store:**
```typescript
// libs/zustand/index.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

type GlobalState = {
    user: SafeUser | null;
    language: string;
    theme: string;
    setUser: (user: SafeUser | null) => void;
    setLanguage: (language: string) => void;
    setTheme: (theme: string) => void;
};

export const useGlobalStore = create<GlobalState>()(
    persist(
        (set) => ({
            user: null,
            language: 'en',
            theme: 'dark',
            setUser: (user) => set({ user }),
            setLanguage: (language) => set({ language }),
            setTheme: (theme) => set({ theme }),
        }),
        { name: 'global-storage' }
    )
);
```

**Değerlendirme:**
- ✅ Zustand ile hafif state management
- ✅ Persist middleware ile localStorage senkronizasyonu
- ❌ Server state (posts, categories) client'ta yönetilmiyor
- ❌ Her component kendi local state'ini tutuyor

---

## 📊 Clean Architecture Uyumluluk Matrisi

### Dependency Rule Analizi

```
Mevcut Durum:
┌───────────────────────────────────────────────────────────┐
│                                                           │
│   Components ─────────────► axios ─────────► API Routes   │
│       │                                          │        │
│       │                                          ▼        │
│       └──────────── @prisma/client types ◄── Services     │
│                           ▲                      │        │
│                           │                      ▼        │
│                           └────────────────── Prisma      │
│                                                           │
└───────────────────────────────────────────────────────────┘

İdeal Clean Architecture:
┌───────────────────────────────────────────────────────────┐
│                                                           │
│   Components ──► Hooks ──► API Client ──► API Routes      │
│       │                                        │          │
│       ▼                                        ▼          │
│   UI Types ◄──────────────────────────────── DTOs         │
│                                                │          │
│                                                ▼          │
│                                            Services       │
│                                                │          │
│                                                ▼          │
│   Domain Types ◄─────────────────────────── Use Cases     │
│       │                                        │          │
│       ▼                                        ▼          │
│   Entities ◄─────────────────────────────── Repository    │
│                                                │          │
│                                                ▼          │
│                                             Prisma        │
└───────────────────────────────────────────────────────────┘
```

### Katman Bağımlılık Tablosu

| Kaynak Katman | Hedef Katman | Durum | Clean Architecture |
|---------------|--------------|-------|-------------------|
| Components | axios/API | ❌ Doğrudan | Hooks üzerinden olmalı |
| Components | @prisma/client types | ⚠️ Sadece type | types/ kullanılmalı |
| Components | Services | ❌ Kullanılmıyor | Hooks üzerinden olmalı |
| API Routes | Services | ✅ Doğru | ✅ Doğru |
| API Routes | DTOs | ✅ Doğru | ✅ Doğru |
| Services | Prisma | ⚠️ Doğrudan | Repository üzerinden olmalı |
| Services | Types | ✅ Doğru | ✅ Doğru |

---

## 🚨 Anti-Pattern'ler

### 1. Fat Components

```typescript
// ❌ YANLIŞ: Component içinde business logic
function AppointmentCalendar() {
    const formatDate = (date: Date) => format(date, 'yyyy-MM-dd');
    const slotsOf = (date: Date) => availableSlots.filter(...);
    const getTileClassName = ({ date }) => { /* complex logic */ };
}

// ✅ DOĞRU: Logic hook'a taşınmalı
function AppointmentCalendar() {
    const { formatDate, slotsOf, getTileClassName } = useAppointmentLogic();
}
```

### 2. Missing Repository Layer

```typescript
// ❌ YANLIŞ: Service doğrudan Prisma kullanıyor
class PostService {
    static async getAll() {
        return prisma.post.findMany({ ... });
    }
}

// ✅ DOĞRU: Repository pattern
interface IPostRepository {
    findAll(): Promise<Post[]>;
    findById(id: string): Promise<Post | null>;
}

class PostRepository implements IPostRepository {
    async findAll() {
        return prisma.post.findMany({ ... });
    }
}

class PostService {
    constructor(private repo: IPostRepository) {}
    
    async getAll() {
        return this.repo.findAll();
    }
}
```

### 3. Validation Code Duplication

```typescript
// ❌ Her serviste tekrarlanan kod
class PostService {
    static SQL_INJECTION_REGEX = /[\s\[\]{}()*+?.,\\^$|#]/;
}
class CategoryService {
    static SQL_INJECTION_REGEX = /[\s\[\]{}()*+?.,\\^$|#]/;
}

// ✅ Merkezi validation
// utils/validators.ts
export const sanitizeInput = (input: string) => { ... };
```

### 4. Direct API Calls

```typescript
// ❌ YANLIŞ: Component'te API call
function Feed() {
    useEffect(() => {
        axiosInstance.get('/api/posts').then(setFeeds);
    }, []);
}

// ✅ DOĞRU: Custom hook ile
function Feed() {
    const { data: feeds, isLoading } = usePosts({ page, pageSize });
}
```

---

## 🎯 İyileştirme Önerileri

### Öncelik 1: Custom Hooks Katmanı

```typescript
// hooks/data/usePosts.ts
import useSWR from 'swr';
import { axiosInstance } from '@/libs/axios';
import { Post } from '@/types/content/BlogTypes';

interface UsePostsParams {
    page?: number;
    pageSize?: number;
    categoryId?: string;
}

interface UsePostsReturn {
    posts: Post[];
    total: number;
    isLoading: boolean;
    isError: boolean;
    mutate: () => void;
}

export function usePosts(params: UsePostsParams = {}): UsePostsReturn {
    const { page = 0, pageSize = 10, categoryId } = params;
    
    const queryString = new URLSearchParams({
        page: page.toString(),
        pageSize: pageSize.toString(),
        ...(categoryId && { categoryId }),
    }).toString();
    
    const { data, error, mutate } = useSWR(
        `/api/posts?${queryString}`,
        (url) => axiosInstance.get(url).then(res => res.data),
        { revalidateOnFocus: false }
    );
    
    return {
        posts: data?.posts ?? [],
        total: data?.total ?? 0,
        isLoading: !error && !data,
        isError: !!error,
        mutate,
    };
}
```

### Öncelik 2: Repository Pattern

```typescript
// repositories/interfaces/IPostRepository.ts
export interface IPostRepository {
    findAll(params: FindAllParams): Promise<{ posts: Post[]; total: number }>;
    findById(id: string): Promise<Post | null>;
    findBySlug(slug: string): Promise<Post | null>;
    create(data: CreatePostDTO): Promise<Post>;
    update(id: string, data: UpdatePostDTO): Promise<Post>;
    delete(id: string): Promise<void>;
}

// repositories/PostRepository.ts
export class PostRepository implements IPostRepository {
    private prisma = prisma;
    
    async findAll(params: FindAllParams) {
        const { page, pageSize, status, categoryId } = params;
        
        const [posts, total] = await this.prisma.$transaction([
            this.prisma.post.findMany({
                where: { status, categoryId },
                skip: page * pageSize,
                take: pageSize,
                include: { author: true, category: true }
            }),
            this.prisma.post.count({ where: { status, categoryId } })
        ]);
        
        return { posts, total };
    }
}
```

### Öncelik 3: Domain Entities

```typescript
// domain/entities/Post.ts
export class PostEntity {
    private constructor(
        public readonly postId: string,
        public readonly title: string,
        public readonly content: string,
        public readonly slug: string,
        public readonly status: PostStatus,
        public readonly authorId: string,
        public readonly categoryId: string,
        public readonly createdAt: Date,
    ) {}
    
    static create(props: CreatePostProps): PostEntity {
        const slug = this.generateSlug(props.title);
        return new PostEntity(
            generateId(),
            props.title,
            props.content,
            slug,
            PostStatus.DRAFT,
            props.authorId,
            props.categoryId,
            new Date()
        );
    }
    
    private static generateSlug(title: string): string {
        return title
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-|-$/g, '');
    }
    
    publish(): PostEntity {
        if (this.status === PostStatus.PUBLISHED) {
            throw new DomainError('Post already published');
        }
        return new PostEntity(
            this.postId,
            this.title,
            this.content,
            this.slug,
            PostStatus.PUBLISHED,
            this.authorId,
            this.categoryId,
            this.createdAt
        );
    }
}
```

### Öncelik 4: Use Case Layer

```typescript
// useCases/posts/CreatePostUseCase.ts
export class CreatePostUseCase {
    constructor(
        private postRepository: IPostRepository,
        private categoryRepository: ICategoryRepository,
        private knowledgeGraphService: KnowledgeGraphService
    ) {}
    
    async execute(input: CreatePostInput): Promise<CreatePostOutput> {
        // Validate category exists
        const category = await this.categoryRepository.findById(input.categoryId);
        if (!category) {
            throw new NotFoundError('Category not found');
        }
        
        // Create post entity
        const post = PostEntity.create({
            title: input.title,
            content: input.content,
            authorId: input.authorId,
            categoryId: input.categoryId,
        });
        
        // Persist
        const saved = await this.postRepository.create(post);
        
        // Side effects
        await this.knowledgeGraphService.queueUpdatePost(saved.postId);
        
        return { post: saved };
    }
}
```

---

## 📈 Önerilen Yeni Mimari

```
src/
├── domain/                      # Enterprise Business Rules
│   ├── entities/
│   │   ├── Post.ts
│   │   ├── User.ts
│   │   └── Category.ts
│   ├── value-objects/
│   │   ├── Email.ts
│   │   ├── Slug.ts
│   │   └── PostStatus.ts
│   └── errors/
│       └── DomainError.ts
│
├── application/                 # Application Business Rules
│   ├── use-cases/
│   │   ├── posts/
│   │   │   ├── CreatePostUseCase.ts
│   │   │   ├── UpdatePostUseCase.ts
│   │   │   └── GetPostsUseCase.ts
│   │   └── users/
│   │       ├── RegisterUserUseCase.ts
│   │       └── LoginUserUseCase.ts
│   ├── interfaces/
│   │   ├── repositories/
│   │   │   ├── IPostRepository.ts
│   │   │   └── IUserRepository.ts
│   │   └── services/
│   │       └── IEmailService.ts
│   └── dtos/                   # Application DTOs
│
├── infrastructure/             # Frameworks & Drivers
│   ├── repositories/
│   │   ├── PrismaPostRepository.ts
│   │   └── PrismaUserRepository.ts
│   ├── services/
│   │   └── SendGridEmailService.ts
│   └── database/
│       └── prisma.ts
│
├── presentation/               # Interface Adapters
│   ├── api/                   # API Routes (Controllers)
│   │   └── posts/
│   │       └── route.ts
│   ├── hooks/                 # React Hooks
│   │   ├── usePosts.ts
│   │   └── useAuth.ts
│   └── components/            # React Components
│       ├── features/
│       └── ui/
│
└── shared/                    # Shared utilities
    ├── types/
    ├── utils/
    └── constants/
```

---

## ✅ Sonuç ve Aksiyon Planı

### Mevcut Durumun Özeti

| Katman | Var mı? | Kalite | Aksiyon |
|--------|---------|--------|---------|
| Services | ✅ | 8/10 | Repository pattern ekle |
| DTOs | ✅ | 8/10 | Application/Presentation ayrımı |
| Types | ✅ | 7/10 | Domain entities'e dönüştür |
| Repositories | ❌ | - | Oluştur |
| Use Cases | ❌ | - | Karmaşık işlemler için oluştur |
| Custom Hooks | ⚠️ | 3/10 | Data fetching hooks ekle |
| Domain Entities | ❌ | - | Kritik domain'ler için oluştur |

### Kısa Vadeli (1-2 Sprint)

1. **Custom Hooks Layer** oluştur (`usePosts`, `useCategories`, `useAuth`)
2. **SWR veya TanStack Query** entegre et
3. Component'lerden API call'ları hooks'a taşı
4. `@prisma/client` type import'larını `types/` klasörüne yönlendir

### Orta Vadeli (3-4 Sprint)

5. **Repository Pattern** uygula (önce PostRepository, UserRepository)
6. Services'leri refactor et (Prisma yerine Repository kullan)
7. Validation kodunu merkezi hale getir
8. Transaction handling'i standardize et

### Uzun Vadeli (5+ Sprint)

9. **Domain Entities** oluştur (Post, User, Appointment)
10. **Use Cases** ekle (karmaşık iş akışları için)
11. Dependency Injection container ekle
12. Unit test coverage artır (Use Cases için)

---

## 📚 Referanslar

- [Clean Architecture by Robert C. Martin](https://blog.cleancoder.com/uncle-bob/2012/08/13/the-clean-architecture.html)
- [Hexagonal Architecture](https://alistair.cockburn.us/hexagonal-architecture/)
- [Domain-Driven Design](https://martinfowler.com/bliki/DomainDrivenDesign.html)
- [SWR Data Fetching](https://swr.vercel.app/)
- [TanStack Query](https://tanstack.com/query/latest)
