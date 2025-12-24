# 🔄 State Yönetimi Analizi

**Analiz Tarihi:** 24 Aralık 2025  
**Framework:** Next.js 16 (App Router)  
**State Kütüphanesi:** Zustand v5.0.0-rc.2

---

## 📊 State Yönetimi Özet Tablosu

| Kategori | Kullanım | Değerlendirme |
|----------|----------|---------------|
| Global State (Zustand) | ✅ Minimal | İyi |
| Local State (useState) | ⚠️ Aşırı Kullanım | Sorunlu |
| Server Actions | ❌ Kullanılmıyor | Eksik |
| React Context | ❌ Kullanılmıyor | - |
| useReducer | ❌ Kullanılmıyor | Eksik |
| URL State | ⚠️ Minimal | Yetersiz |

---

## 🟢 GLOBAL STATE ANALİZİ (Zustand)

### Store Yapısı

```typescript
// libs/zustand/index.ts
type GlobalState = {
  user: SafeUser | null;           // Kullanıcı bilgisi
  availableLanguages: string[];    // Dil seçenekleri
  language: string;                // Aktif dil
  availableThemes: string[];       // Tema seçenekleri
  theme: string;                   // Aktif tema

  setUser: (user: SafeUser | null) => void;
  clearUser: () => void;
  setLanguage: (language: string) => void;
  setTheme: (theme: string) => void;
};
```

### ✅ Doğru Yapılanlar

1. **Minimal Global State**
   - Sadece gerçekten global olması gereken veriler store'da
   - `user`, `language`, `theme` - doğru seçimler

2. **Persist Middleware**
   ```typescript
   persist(
     (set, _get) => ({...}),
     {
       name: 'global-storage',
       storage: createJSONStorage(() => localStorage),
       version: 0.7,
     }
   )
   ```
   - localStorage ile kalıcılık sağlanmış
   - Versiyon yönetimi mevcut

3. **Kullanım Noktaları**
   | Bileşen | Kullanılan State |
   |---------|------------------|
   | `AuthButton` | `user` |
   | `ThemeButton` | `theme`, `setTheme` |
   | `LangButton` | `language`, `setLanguage` |
   | `Menu` | `user` |
   | `BasicTab` | `user`, `setUser` |
   | `ProfileTab` | `user`, `setUser` |
   | `SecurityTab` | `setUser` |
   | `PreferencesTab` | `user`, `setUser` |
   | `AdminLayout` | `setUser` |
   | `LoginPage` | `setUser` |

### ⚠️ İyileştirme Önerileri

1. **Selector Kullanımı**
   ```typescript
   // ❌ Mevcut - Tüm state'i çekiyor
   const { user } = useGlobalStore();
   
   // ✅ Önerilen - Sadece gerekli slice
   const user = useGlobalStore((state) => state.user);
   ```

2. **Computed Values Eksik**
   ```typescript
   // ✅ Önerilen - Store'a eklenebilir
   isAuthenticated: () => get().user !== null,
   isAdmin: () => get().user?.userRole === 'ADMIN',
   ```

---

## 🔴 LOCAL STATE ANALİZİ (useState)

### Tespit: 100+ useState Kullanımı

**En Sorunlu Dosyalar:**

| Dosya | useState Sayısı | Değerlendirme |
|-------|-----------------|---------------|
| `admin/posts/[postId]/page.tsx` | 12 | 🔴 Kritik |
| `auth/login/page.tsx` | 10 | 🔴 Kritik |
| `admin/projects/[projectId]/page.tsx` | 10 | 🔴 Kritik |
| `admin/users/create/page.tsx` | 10 | ⚠️ Yüksek |
| `Contact/Partials/Form.tsx` | 10 | ⚠️ Yüksek |
| `TypingEffect.tsx` | 5 | ⚠️ Orta |

### Örnek: Post Edit Sayfası (12 useState)

```tsx
// ❌ app/(admin)/admin/posts/[postId]/page.tsx
const [loading, setLoading] = useState(true);
const [title, setTitle] = useState('');
const [image, setImage] = useState('');
const [content, setContent] = useState('');
const [description, setDescription] = useState('');
const [slug, setSlug] = useState('');
const [keywords, setKeywords] = useState<string[]>([]);
const [authorId, setAuthorId] = useState<string>('');
const [categoryId, setCategoryId] = useState<string>('');
const [status, setStatus] = useState<PostStatus>('DRAFT');
const [createdAt, setCreatedAt] = useState<Date>(new Date());
const [views, setViews] = useState<number>(0);
```

**Sorunlar:**
- 12 ayrı state güncellemesi = 12 potansiyel re-render
- Form state'i dağınık
- Bakımı zor

### ✅ Önerilen Çözüm: useReducer veya Form State

```tsx
// ✅ Önerilen - useReducer ile
type PostState = {
  title: string;
  image: string;
  content: string;
  description: string;
  slug: string;
  keywords: string[];
  authorId: string;
  categoryId: string;
  status: PostStatus;
  createdAt: Date;
  views: number;
};

const [post, dispatch] = useReducer(postReducer, initialState);

// veya react-hook-form
const { register, handleSubmit, formState } = useForm<PostState>();
```

### Örnek: Login Sayfası (10 useState)

```tsx
// ❌ app/(auth)/auth/login/page.tsx
const [email, setEmail] = useState<string>("");
const [password, setPassword] = useState<string>("");
const [_availableMethods, setAvailableMethods] = useState<OTPMethod[]>([]);
const [selectedMethod, setSelectedMethod] = useState<OTPMethod | null>(null);
const [otpModalOpen, setOtpModalOpen] = useState(false);
const [otpCode, setOtpCode] = useState('');
const [otpSent, setOtpSent] = useState(false);
const [sendingOtp, setSendingOtp] = useState(false);
const [verifyingOtp, setVerifyingOtp] = useState(false);
```

**Sorunlar:**
- OTP state'leri ayrı bir hook olabilir
- Loading state'leri birleştirilebilir
- `_availableMethods` kullanılmıyor (dead code)

---

## 🟡 PROPS DRILLING ANALİZİ

### Tespit Edilen Durumlar

#### 1. SlotTemplateBuilder - 5 Prop
```tsx
interface SlotTemplateBuilderProps {
    selectedDay: Day
    selectedDate: Date
    DAYS: Day[]
    TIME_INTERVALS: number[]
    setSelectedDay: (day: Day) => void  // ⚠️ Setter prop
}
```

**Değerlendirme:** Orta seviye props drilling, kabul edilebilir.

#### 2. MenuItems → Navbar → Sidebar
```tsx
// app/(frontend)/layout.tsx
<Navbar menuItems={MenuItems} />
<Sidebar menuItems={MenuItems} />
```

**Değerlendirme:** Minimal drilling, sorun yok.

#### 3. Comment Bileşenleri
```tsx
// Comments → AddComment
<AddComment postId={postId} />

// Comments → SingleComment
<SingleComment 
  comment={comment} 
  gravatarUrl={gravatarUrl} 
/>
```

**Değerlendirme:** Doğru kullanım, her bileşen sadece ihtiyacını alıyor.

### Genel Props Drilling Skoru: ✅ İYİ

Projede ciddi bir props drilling sorunu **YOK**. Zustand global state ile çözülmüş.

---

## 🔴 VERİ AKIŞI ANALİZİ

### Mevcut Veri Akışı Paterni

```
┌─────────────────────────────────────────────────────────────┐
│                      CLIENT COMPONENT                        │
│  ┌──────────┐    ┌──────────┐    ┌──────────┐              │
│  │ useState │───▶│  axios   │───▶│   API    │              │
│  │ (local)  │◀───│  call    │◀───│  Route   │              │
│  └──────────┘    └──────────┘    └──────────┘              │
│       │                               │                      │
│       ▼                               ▼                      │
│  ┌──────────┐                   ┌──────────┐               │
│  │ Re-render│                   │ Database │               │
│  └──────────┘                   └──────────┘               │
└─────────────────────────────────────────────────────────────┘
```

### Sorunlar

1. **Server Actions Kullanılmıyor**
   ```typescript
   // ❌ Mevcut - Her şey client-side axios
   const handleSubmit = async () => {
     await axiosInstance.post('/api/posts', data);
   };
   
   // ✅ Önerilen - Server Action
   'use server'
   export async function createPost(data: PostData) {
     return await PostService.createPost(data);
   }
   ```

2. **Gereksiz Re-fetch**
   ```tsx
   // ❌ Feed bileşeni - Her page değişiminde fetch
   useEffect(() => {
     axiosInstance.get("/api/posts?page=" + page)
       .then(response => setFeeds(prev => [...prev, ...response.data.posts]));
   }, [page]);
   ```
   
   Cache mekanizması yok, aynı veri tekrar çekiliyor.

3. **Veri Tutarsızlığı Riski**
   ```
   User Login → setUser (Zustand) → Tab A gösterir
                                  → Tab B hala eski state
   ```

---

## 📋 STATE GEREKLİLİK ANALİZİ

### Gerçekten Gerekli State'ler

| State | Gerekli mi? | Neden? |
|-------|-------------|--------|
| `user` (global) | ✅ Evet | Auth bilgisi her yerde lazım |
| `theme` (global) | ✅ Evet | UI genelinde kullanılıyor |
| `language` (global) | ✅ Evet | i18n için gerekli |
| Form input states | ✅ Evet | Controlled inputs |
| `loading` states | ⚠️ Kısmen | Server actions ile azaltılabilir |
| `page/pageSize` | ⚠️ Kısmen | URL state olabilir |
| Modal open states | ⚠️ Kısmen | URL hash ile yapılabilir |

### Gereksiz State Kullanımları

| State | Dosya | Alternatif |
|-------|-------|------------|
| `_availableMethods` | login/page.tsx | Kullanılmıyor, silinmeli |
| `page`, `pageSize` | Table components | URL searchParams |
| `search` | Table components | URL searchParams |
| `mode` | admin/posts | URL'den türetilebilir (zaten yapılmış ama state var) |

---

## ⚠️ KARMAŞIKLIK ANALİZİ

### Cyclomatic Complexity Tahminleri

| Dosya | Karmaşıklık | Risk |
|-------|-------------|------|
| `admin/posts/[postId]/page.tsx` | 25+ | 🔴 Yüksek |
| `auth/login/page.tsx` | 20+ | 🔴 Yüksek |
| `Contact/Partials/Form.tsx` | 18+ | ⚠️ Orta-Yüksek |
| `SlotTemplateBuilder/index.tsx` | 15+ | ⚠️ Orta |
| `KnowledgeGraph3D/index.tsx` | 12+ | ⚠️ Orta |

### Bakım Maliyeti Faktörleri

1. **State Dağınıklığı**: 100+ useState → Her değişiklik için çok dosya taranmalı
2. **Test Zorluğu**: Client components test etmek zor
3. **Type Safety**: State'ler arası ilişki tip güvenliği zayıf
4. **Debugging**: DevTools'da hangi state nerede takibi zor

---

## 🛠️ İYİLEŞTİRME ÖNERİLERİ

### Öncelik 1: Form State'leri Birleştir

```tsx
// ✅ react-hook-form kullan
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

const PostForm = () => {
  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(PostSchema),
  });
  
  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <input {...register('title')} />
      {errors.title && <span>{errors.title.message}</span>}
    </form>
  );
};
```

### Öncelik 2: Server Actions Ekle

```tsx
// app/actions/post.ts
'use server'

import PostService from '@/services/PostService';
import { revalidatePath } from 'next/cache';

export async function createPost(formData: FormData) {
  const data = Object.fromEntries(formData);
  await PostService.createPost(data);
  revalidatePath('/admin/posts');
}

export async function deletePost(postId: string) {
  await PostService.deletePost(postId);
  revalidatePath('/admin/posts');
}
```

### Öncelik 3: URL State Kullan

```tsx
// ✅ Pagination için URL state
'use client';
import { useSearchParams, useRouter } from 'next/navigation';

const PostTable = () => {
  const searchParams = useSearchParams();
  const router = useRouter();
  
  const page = Number(searchParams.get('page')) || 1;
  const search = searchParams.get('search') || '';
  
  const updateParams = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams);
    params.set(key, value);
    router.push(`?${params.toString()}`);
  };
  
  // ...
};
```

### Öncelik 4: Custom Hooks Oluştur

```tsx
// hooks/useOTP.ts
export function useOTPFlow() {
  const [state, setState] = useState<OTPState>({
    isOpen: false,
    code: '',
    isSending: false,
    isVerifying: false,
    availableMethods: [],
    selectedMethod: null,
  });
  
  const sendOTP = async () => {...};
  const verifyOTP = async () => {...};
  
  return { state, sendOTP, verifyOTP };
}

// Kullanım
const { state, sendOTP, verifyOTP } = useOTPFlow();
```

### Öncelik 5: Zustand Store'u Geliştir

```tsx
// libs/zustand/index.ts
type GlobalState = {
  // ... mevcut
  
  // Computed
  isAuthenticated: boolean;
  isAdmin: boolean;
  
  // Async actions
  fetchUser: () => Promise<void>;
  logout: () => Promise<void>;
};

export const useGlobalStore = create<GlobalState>()(
  persist(
    (set, get) => ({
      // ... mevcut
      
      isAuthenticated: false,
      isAdmin: false,
      
      fetchUser: async () => {
        const res = await fetch('/api/auth/session');
        const { user } = await res.json();
        set({ 
          user, 
          isAuthenticated: !!user,
          isAdmin: user?.userRole === 'ADMIN' 
        });
      },
      
      logout: async () => {
        await fetch('/api/auth/logout', { method: 'POST' });
        set({ user: null, isAuthenticated: false, isAdmin: false });
      },
    }),
    // ...
  )
);
```

---

## 📊 SONUÇ VE SKORLAR

| Kriter | Mevcut | Hedef |
|--------|--------|-------|
| Global State Kullanımı | 8/10 | 9/10 |
| Local State Yönetimi | 4/10 | 7/10 |
| Props Drilling | 8/10 | 9/10 |
| Veri Akışı Okunabilirliği | 5/10 | 8/10 |
| Karmaşıklık | 4/10 | 7/10 |
| Bakım Maliyeti | 5/10 | 8/10 |

**Genel Skor: 5.7/10**

### Özet

| ✅ Güçlü Yönler | ❌ Zayıf Yönler |
|-----------------|-----------------|
| Zustand minimal ve doğru kullanılmış | 100+ useState dağınık |
| Props drilling yok | Server Actions kullanılmıyor |
| Persist middleware mevcut | Form state'leri birleştirilmemiş |
| Global state sadece gerekli veriler | URL state kullanılmıyor |
| | Karmaşık bileşenler refactor edilmeli |

---

## 📅 AKSIYON PLANI

### Hafta 1: Hızlı Kazanımlar
- [ ] Dead code temizliği (`_availableMethods` vb.)
- [ ] Zustand selector'lar ekle
- [ ] URL state için pagination

### Hafta 2: Form Refactoring
- [ ] react-hook-form entegrasyonu
- [ ] Post edit form refactor
- [ ] Login form refactor

### Hafta 3: Server Actions
- [ ] CRUD işlemleri için server actions
- [ ] revalidatePath kullanımı
- [ ] Loading states azaltma

### Hafta 4: Custom Hooks
- [ ] useOTP hook
- [ ] usePagination hook
- [ ] useAuth hook

---

*Bu analiz, kod tabanının mevcut durumunu yansıtmaktadır.*
