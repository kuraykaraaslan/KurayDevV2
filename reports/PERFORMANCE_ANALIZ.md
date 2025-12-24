# Performans Analizi

**Analiz Tarihi:** 24 Aralık 2024  
**Proje:** KurayDev Portfolio (Next.js 16)  
**Analiz Kapsamı:** Image optimization, Font loading, Dynamic imports, Bundle size, Memoization

---

## 📊 Genel Değerlendirme

| Kriter | Puan | Açıklama |
|--------|------|----------|
| next/image Kullanımı | 5/10 | 15 dosyada var, 11 yerde raw `<img>` |
| next/font Kullanımı | 0/10 | Kullanılmıyor, CSS @font-face ile yükleme |
| Dynamic Import | 8/10 | 15+ yerde doğru kullanım, ssr: false |
| Bundle Size | 4/10 | Ağır kütüphaneler (Three.js, TinyMCE, Transformers) |
| Memoization | 4/10 | 26 kullanım var ama tutarsız |
| Caching Strategy | 3/10 | revalidate/cache kullanılmıyor |

**Genel Puan: 4.0/10**

---

## 🖼️ 1. next/image Analizi

### Kullanım Durumu

```
┌─────────────────────────────────────────────────────────────┐
│                   IMAGE KULLANIMI                           │
├─────────────────────────────────────────────────────────────┤
│  ✅ next/image kullanan dosyalar:     15                    │
│  ❌ Raw <img> kullanan dosyalar:      11                    │
│  ⚠️ layout="fill" (deprecated):       2                     │
│  ❌ priority attribute:               0                     │
│  ❌ placeholder="blur":               0                     │
│  ❌ sizes attribute:                  0                     │
└─────────────────────────────────────────────────────────────┘
```

### next/image Kullanan Dosyalar (✅)

| Dosya | Kullanım |
|-------|----------|
| `BackgroundImage.tsx` (Welcome) | Hero background |
| `BackgroundImage.tsx` (Timeline) | Section background |
| `SingleService.tsx` | Service card images |
| `SingleProject.tsx` | Project thumbnails |
| `SingleArticle.tsx` | Blog article images |
| `NavbarAuthButton.tsx` | User avatars |
| `ProjectTable.tsx` | Admin table images |
| `CategoryTable.tsx` | Category images |
| `PostTable.tsx` | Post thumbnails |
| `UserTable.tsx` | User avatars |

### Raw `<img>` Kullanan Dosyalar (❌ Problem)

```tsx
// ❌ components/frontend/Features/Blog/Feed/Partials/FeedCardImage.tsx
<img src={props.image!} alt={props.title}
     className="w-full object-cover rounded-t-lg" />

// ❌ components/frontend/Features/Blog/Article/index.tsx
<img src={image ? image : `${NEXT_PUBLIC_APPLICATION_HOST}/api/posts/${post.postId}/cover.jpeg`}

// ❌ components/frontend/Features/Hero/Platforms/Partials/SinglePlatform.tsx
<img src={icon} alt={name} className={"h-" + (zoom ? 12 * zoom : 12) + " w-auto"} />

// ❌ components/common/UI/Images/ImageLoad/index.tsx
<img src={image ? image as string : 'https://placehold.co/384x256'}

// ❌ components/frontend/Features/Knowledge/KnowledgeGraph2D/index.tsx
{tooltip.image && <img src={tooltip.image} alt="" className="w-full mb-2 rounded" />}

// ❌ components/frontend/Features/Knowledge/KnowledgeGraph3D/index.tsx  
{tooltip.image && <img src={tooltip.image} alt="" className="w-full mb-2 rounded" />}
```

### Deprecated API Kullanımı

```tsx
// ⚠️ BackgroundImage.tsx - Deprecated layout prop
<Image 
  src="/assets/img/heros/welcome4.webp" 
  layout="fill"        // ❌ Deprecated
  objectFit="cover"    // ❌ Deprecated
  alt="Hero Background" 
/>

// ✅ Doğru kullanım (Next.js 13+)
<Image 
  src="/assets/img/heros/welcome4.webp"
  fill                 // ✅ Yeni API
  className="object-cover"
  alt="Hero Background"
  priority             // ✅ LCP için gerekli
/>
```

### Gerçek Kullanıcı Etkisi

| Sorun | Etki | Core Web Vital |
|-------|------|----------------|
| Raw `<img>` kullanımı | Lazy loading yok, format optimizasyonu yok | LCP ⬆️ |
| `priority` eksik | Hero image geç yüklenir | LCP ⬆️ |
| `sizes` eksik | Responsive breakpoint'lerde gereksiz büyük resim | LCP ⬆️, Data ⬆️ |
| `placeholder` eksik | Layout shift yaşanır | CLS ⬆️ |

---

## 🔤 2. next/font Analizi

### Mevcut Durum (❌ Kullanılmıyor)

```css
/* globals.css - CSS @font-face ile yükleme */
@font-face {
  font-family: 'Bookerly';
  src: url('https://fonts.cdnfonts.com/s/22056/Bookerly.woff2') format('woff2');
  font-display: swap;
}

html {
  font-family: 'Bookerly', system-ui, sans-serif;
}
```

```typescript
// tailwind.config.ts
fontFamily: {
  sans: ['Bookerly', 'system-ui', 'sans-serif']
}
```

### Sorunlar

```
┌─────────────────────────────────────────────────────────────┐
│                   FONT LOADING SORUNLARI                    │
├─────────────────────────────────────────────────────────────┤
│  ❌ External CDN bağımlılığı (fonts.cdnfonts.com)           │
│  ❌ DNS lookup + TLS handshake overhead                     │
│  ❌ Font file caching kontrolü yok                          │
│  ❌ next/font self-hosting avantajı kullanılmıyor           │
│  ❌ Subset optimizasyonu yok                                │
│  ⚠️ font-display: swap var (iyi) ama FOUT riski            │
└─────────────────────────────────────────────────────────────┘
```

### Önerilen Yapı

```typescript
// app/layout.tsx - next/font ile
import localFont from 'next/font/local';

const bookerly = localFont({
  src: [
    {
      path: '../public/fonts/Bookerly.woff2',
      weight: '400',
      style: 'normal',
    },
    {
      path: '../public/fonts/Bookerly-Bold.woff2',
      weight: '700',
      style: 'normal',
    },
  ],
  variable: '--font-bookerly',
  display: 'swap',
  preload: true,
});

export default function RootLayout({ children }) {
  return (
    <html className={bookerly.variable}>
      <body>{children}</body>
    </html>
  );
}
```

### Gerçek Kullanıcı Etkisi

| Sorun | Etki | Metrik |
|-------|------|--------|
| External CDN | +50-150ms network latency | FCP ⬆️ |
| DNS lookup | +20-50ms per domain | TTFB ⬆️ |
| No preload | Font yüklenmeden render blocked | FCP ⬆️ |
| No subset | Gereksiz karakter yükleme | Data ⬆️ |

---

## ⚡ 3. Dynamic Import Analizi

### Kullanım Durumu (✅ İyi)

```
┌─────────────────────────────────────────────────────────────┐
│                 DYNAMIC IMPORT KULLANIMI                    │
├─────────────────────────────────────────────────────────────┤
│  ✅ Toplam dynamic import:           15+                    │
│  ✅ ssr: false kullanımı:            Yaygın                 │
│  ✅ Loading state:                   5 component            │
│  ❌ Suspense boundary:               Eksik                  │
└─────────────────────────────────────────────────────────────┘
```

### İyi Örnekler

```tsx
// ✅ MyImageVideoDialog.tsx - Doğru: Video player lazy loaded
const ReactPlayer = dynamic(() => import("react-player"), {
  ssr: false,
  loading: () => <LoadingElement title="Video Player" />,
});

// ✅ AppointmentCalendar/index.tsx - Doğru: Calendar lazy loaded
const Calendar = dynamic(() => import('react-calendar'), { 
  ssr: false, 
  loading: () => <LoadingElement title="Calendar" /> 
});

// ✅ Navbar/index.tsx - Auth button lazy loaded
const NavbarAuthButton = dynamic(
  () => import("@/components/common/UI/Navigation/NavbarAuthButton"),
  { ssr: false }
);

// ✅ Welcome/index.tsx - Multiple lazy components
const TypingEffect = dynamic(() => import("./Partials/TypingEffect"), { ssr: false });
const BackgroundImage = dynamic(() => import("./Partials/BackgroundImage"), { ssr: false });
const MyImage = dynamic(() => import("./Partials/MyImageVideo"), { ssr: false });
```

### Eksik Dynamic Import Alanları

```tsx
// ❌ HireMeVideo.tsx - Direct import (ağır kütüphane)
import ReactPlayer from 'react-player';  // ~300KB

// ✅ Önerilen
const ReactPlayer = dynamic(() => import('react-player'), { 
  ssr: false,
  loading: () => <Skeleton className="w-full h-60" />
});

// ❌ KnowledgeGraph3D - Three.js direkt import (~500KB)
import * as THREE from 'three'
import { OrbitControls } from 'three/addons/controls/OrbitControls.js'

// ✅ Önerilen: Tüm component dynamic olmalı
// (Bu zaten Button.tsx içinde yapılıyor - ✅)
```

### Loading State Analizi

| Component | Loading State | Durum |
|-----------|--------------|-------|
| ReactPlayer | `<LoadingElement />` | ✅ |
| Calendar | `<LoadingElement />` | ✅ |
| KnowledgeGraph2DButton | `null` | ⚠️ (CLS riski) |
| GeoHeatmap | `<LoadingElement />` | ✅ |
| MyImageVideoDialog | `<LoadingElement />` | ✅ |
| ThemeButton | None | ❌ |
| LanguageModal | None | ❌ |
| NavbarAuthButton | None | ❌ |

---

## 📦 4. Bundle Size Analizi

### Ağır Bağımlılıklar

```
┌─────────────────────────────────────────────────────────────┐
│                 BÜYÜK KÜTÜPHANELER                          │
├─────────────────────────────────────────────────────────────┤
│  📦 three.js                    ~500KB (gzipped: ~150KB)    │
│  📦 @tinymce/tinymce-react      ~1.5MB (CDN'den yüklenir)   │
│  📦 tinymce                     ~800KB                      │
│  📦 @xenova/transformers        ~5MB+ (ML model dahil)      │
│  📦 react-player                ~300KB                      │
│  📦 @fortawesome/free-*-icons   ~200KB (tüm iconlar)        │
│  📦 @aws-sdk/client-s3          ~400KB                      │
│  📦 react-svg-worldmap          ~150KB                      │
│  📦 openai                      ~200KB                      │
└─────────────────────────────────────────────────────────────┘
```

### Bundle Analyzer Yapılandırması (✅ Mevcut)

```javascript
// next.config.mjs
import bundleAnalyzer from '@next/bundle-analyzer'

const withBundleAnalyzer = bundleAnalyzer({
  enabled: process.env.ANALYZE === 'true'
})

// Çalıştırma: npm run analyze
```

### FontAwesome Optimizasyonu (❌ Problem)

```tsx
// ❌ Mevcut: Tüm icon paketleri import ediliyor
import { faCode, faHome, faUser, ... } from '@fortawesome/free-solid-svg-icons';
import { faGithub, faLinkedin, ... } from '@fortawesome/free-brands-svg-icons';
import { faHeart, ... } from '@fortawesome/free-regular-svg-icons';

// Her dosyada ayrı ayrı import = tree-shaking çalışıyor
// AMA: 4 ayrı paket = ~200KB potential
```

### Transformers.js Kullanımı (⚠️ Dikkat)

```typescript
// app/(api)/api/comments/route.ts
import { pipeline } from "@xenova/transformers";

// Bu sadece server-side'da çalışıyor (API route) - ✅
// Model: "Xenova/toxic-bert" ~100MB (indirilir ve cache'lenir)
```

### Tahmini Bundle Boyutları

| Sayfa/Route | Tahmini Boyut | Notlar |
|-------------|---------------|--------|
| Homepage (/) | ~400KB | Hero, projects, services |
| Blog Feed | ~300KB | Feed cards, pagination |
| Blog Article | ~250KB | Article, comments |
| Admin Panel | ~800KB | TinyMCE, tables, forms |
| Knowledge Graph | ~600KB | Three.js (3D) veya Canvas (2D) |
| Appointments | ~350KB | Calendar, forms |

---

## 🧠 5. Memoization Analizi

### Kullanım İstatistikleri

```
┌─────────────────────────────────────────────────────────────┐
│                MEMOIZATION KULLANIMI                        │
├─────────────────────────────────────────────────────────────┤
│  useMemo kullanımı:              12                         │
│  useCallback kullanımı:          10                         │
│  React.memo kullanımı:           0                          │
│  Toplam:                         22 (26 dosyada)            │
└─────────────────────────────────────────────────────────────┘
```

### İyi Örnekler

```tsx
// ✅ Modal/index.tsx - Doğru useCallback kullanımı
const openModal = useCallback(() => setOpen(true), [])
const closeModal = useCallback(() => setOpen(false), [])
const toggleModal = useCallback(() => setOpen((v) => !v), [])

// ✅ Modal/index.tsx - Doğru useMemo kullanımı
const sizeClass = useMemo(() => {
  switch (size) {
    case "sm": return "max-w-sm";
    case "md": return "max-w-md";
    case "lg": return "max-w-lg";
    case "xl": return "max-w-xl";
    case "2xl": return "max-w-2xl";
    case "full": return "max-w-full";
    default: return "max-w-lg";
  }
}, [size])

// ✅ ShareButtons/index.tsx - Static data memoization
const shareLinks = useMemo(() => [
  { name: 'Twitter', url: `https://twitter.com/intent/tweet?...` },
  { name: 'LinkedIn', url: `https://www.linkedin.com/shareArticle?...` },
  // ...
], [textToShare, props.slug]);

// ✅ OtherPosts/index.tsx - Async function memoization
const fetchPosts = useCallback(async () => {
  // API call...
}, [slug]);
```

### Eksik Memoization Alanları

```tsx
// ❌ FeedCardImage.tsx - Her render'da date calculation
useEffect(() => {
  // Date calculation logic - useMemo olabilir
  const diff = today.getTime() - new Date(props.createdAt).getTime();
  // ...
}, [props.createdAt]);

// ✅ Önerilen
const dateText = useMemo(() => {
  if (!props.createdAt) return "";
  const today = new Date();
  const diff = today.getTime() - new Date(props.createdAt).getTime();
  // ...
  return formattedDate;
}, [props.createdAt]);

// ❌ List rendering without key optimization
{posts.map((post) => (
  <PostCard post={post} />  // key eksik bazı yerlerde
))}

// ❌ React.memo kullanılmıyor (0 kullanım)
// Ağır child component'lar memo ile sarılmalı
export default React.memo(PostCard);
export default React.memo(SingleProject);
export default React.memo(FeedCardImage);
```

### React.memo Önerileri

```tsx
// Önerilen memo kullanımı
// components/frontend/Features/Blog/OtherPosts/Partials/PostCard.tsx

import { memo } from 'react';

interface PostCardProps {
  post: PostWithData;
}

const PostCard = memo(({ post }: PostCardProps) => {
  // Component logic...
}, (prevProps, nextProps) => {
  // Shallow comparison yeterli mi?
  return prevProps.post.postId === nextProps.post.postId;
});

export default PostCard;
```

---

## 🚀 6. Caching Strategy Analizi

### Mevcut Durum (❌ Eksik)

```
┌─────────────────────────────────────────────────────────────┐
│                   CACHING DURUMU                            │
├─────────────────────────────────────────────────────────────┤
│  ❌ revalidate export:              0 sayfa                 │
│  ❌ generateStaticParams:           0 sayfa                 │
│  ❌ unstable_cache:                 0 kullanım              │
│  ⚠️ fetch cache:                    Varsayılan (no-store)   │
│  ✅ Redis cache:                    Session/Auth için var   │
│  ✅ Sitemap cache header:           1 yerde                 │
└─────────────────────────────────────────────────────────────┘
```

### Önerilen Caching Stratejisi

```typescript
// app/(frontend)/blog/[categorySlug]/[postSlug]/page.tsx

// 1. ISR ile sayfa caching
export const revalidate = 3600; // 1 saat

// 2. Static params generation
export async function generateStaticParams() {
  const posts = await prisma.post.findMany({
    select: { slug: true, category: { select: { slug: true } } },
    where: { isPublished: true },
  });
  
  return posts.map((post) => ({
    categorySlug: post.category.slug,
    postSlug: post.slug,
  }));
}

// 3. Fetch caching
async function getPost(slug: string) {
  return fetch(`${API_URL}/api/posts/${slug}`, {
    next: { 
      revalidate: 3600,
      tags: ['posts', `post-${slug}`]
    }
  });
}
```

---

## 📈 7. Core Web Vitals Etki Analizi

### LCP (Largest Contentful Paint)

| Sorun | Tahmini Etki | Öncelik |
|-------|--------------|---------|
| Hero image priority yok | +500ms | 🔴 Yüksek |
| External font CDN | +150ms | 🔴 Yüksek |
| Raw `<img>` kullanımı | +200-400ms | 🔴 Yüksek |
| Three.js bundle | +300ms (3D sayfalar) | 🟡 Orta |

### CLS (Cumulative Layout Shift)

| Sorun | Tahmini Etki | Öncelik |
|-------|--------------|---------|
| Image placeholder yok | 0.1-0.3 | 🔴 Yüksek |
| Font FOUT | 0.05-0.1 | 🟡 Orta |
| Dynamic loading: null | 0.05-0.15 | 🟡 Orta |

### FID/INP (Interaction to Next Paint)

| Sorun | Tahmini Etki | Öncelik |
|-------|--------------|---------|
| Memoization eksik | +50-100ms | 🟡 Orta |
| Event handler recreation | +20-50ms | 🟢 Düşük |

### Tahmini Lighthouse Skoru

```
┌─────────────────────────────────────────────────────────────┐
│                 TAHMİNİ LIGHTHOUSE SKORU                    │
├─────────────────────────────────────────────────────────────┤
│  Performance:        60-70                                  │
│  Accessibility:      75-85                                  │
│  Best Practices:     80-90                                  │
│  SEO:               70-80                                   │
├─────────────────────────────────────────────────────────────┤
│  Hedef Performance:  90+                                    │
└─────────────────────────────────────────────────────────────┘
```

---

## 🔧 8. Önerilen İyileştirmeler

### Öncelik 1: Image Optimizasyonu (Hemen)

```tsx
// 1. Hero image'a priority ekle
<Image 
  src="/assets/img/heros/welcome4.webp"
  fill
  priority  // ✅ LCP için kritik
  placeholder="blur"
  blurDataURL="data:image/jpeg;base64,..."
  sizes="100vw"
  className="object-cover"
  alt="Hero Background"
/>

// 2. Raw <img>'leri next/image'a çevir
// FeedCardImage.tsx
<Image 
  src={props.image!} 
  alt={props.title}
  width={400}
  height={240}
  className="w-full object-cover rounded-t-lg"
  loading="lazy"
/>
```

### Öncelik 2: Font Optimizasyonu

```typescript
// 1. Font dosyasını local'e taşı
// public/fonts/Bookerly.woff2

// 2. next/font kullan
import localFont from 'next/font/local';

const bookerly = localFont({
  src: './fonts/Bookerly.woff2',
  display: 'swap',
  preload: true,
  variable: '--font-bookerly',
});
```

### Öncelik 3: Bundle Splitting

```typescript
// Heavy component'ları lazy load
const TinyMCEEditor = dynamic(
  () => import('@/components/admin/UI/Forms/Editor'),
  { 
    ssr: false,
    loading: () => <Skeleton className="h-[500px]" />
  }
);

const KnowledgeGraph3D = dynamic(
  () => import('./KnowledgeGraph3D'),
  { 
    ssr: false,
    loading: () => <div className="h-[600px] bg-base-200 animate-pulse" />
  }
);
```

### Öncelik 4: Memoization Standardizasyonu

```typescript
// utils/memo.ts - Standart memo wrapper
import { memo, ComponentType } from 'react';

export function withMemo<P extends object>(
  Component: ComponentType<P>,
  propsAreEqual?: (prevProps: P, nextProps: P) => boolean
) {
  return memo(Component, propsAreEqual);
}

// Kullanım
const MemoizedPostCard = withMemo(PostCard, (prev, next) => 
  prev.post.postId === next.post.postId
);
```

### Öncelik 5: Caching Implementasyonu

```typescript
// lib/cache.ts
import { unstable_cache } from 'next/cache';

export const getCachedPosts = unstable_cache(
  async () => {
    return prisma.post.findMany({
      where: { isPublished: true },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });
  },
  ['posts'],
  { revalidate: 300, tags: ['posts'] }
);

// Sayfalarda kullan
export const revalidate = 300; // 5 dakika ISR
```

---

## 🗓️ 9. İyileştirme Yol Haritası

### Hafta 1: Kritik Performans
- [ ] Hero image'lara `priority` ekle
- [ ] `layout="fill"` → `fill` prop migration
- [ ] `sizes` attribute ekle
- [ ] Font'u local'e taşı ve next/font kullan

### Hafta 2: Image Migration
- [ ] Tüm raw `<img>` → `next/image`
- [ ] `placeholder="blur"` ekle
- [ ] WebP/AVIF format desteği kontrol

### Hafta 3: Bundle Optimization
- [ ] Bundle analyzer çalıştır
- [ ] Heavy component'ları lazy load
- [ ] FontAwesome tree-shaking kontrol
- [ ] TinyMCE'yi sadece admin'de yükle

### Hafta 4: Caching & Memoization
- [ ] ISR implementasyonu (revalidate)
- [ ] generateStaticParams ekle
- [ ] React.memo yaygınlaştır
- [ ] unstable_cache kullan

---

## 📊 10. Performans Test Komutları

```bash
# Bundle analizi
npm run analyze

# Lighthouse CI
npx lighthouse https://kuray.dev --output=json --output-path=./lighthouse-report.json

# Core Web Vitals
npx web-vitals-cli https://kuray.dev

# Next.js build analizi
npm run build
# .next/analyze klasörünü kontrol et
```

---

## 📚 11. Referanslar

- [Next.js Image Optimization](https://nextjs.org/docs/app/building-your-application/optimizing/images)
- [Next.js Font Optimization](https://nextjs.org/docs/app/building-your-application/optimizing/fonts)
- [Dynamic Imports](https://nextjs.org/docs/pages/building-your-application/optimizing/lazy-loading)
- [Core Web Vitals](https://web.dev/vitals/)
- [Bundle Analyzer](https://www.npmjs.com/package/@next/bundle-analyzer)

---

## 🎯 Sonuç

### Güçlü Yönler
1. ✅ Dynamic import yaygın ve doğru kullanılıyor
2. ✅ Heavy component'lar (Calendar, ReactPlayer) lazy loaded
3. ✅ Bundle analyzer kurulu
4. ✅ Redis caching auth için mevcut
5. ✅ `font-display: swap` kullanılıyor

### Kritik İyileştirmeler
1. 🔴 Hero image'lara `priority` ekle → **LCP -500ms**
2. 🔴 Font'u next/font ile local yükle → **FCP -150ms**
3. 🔴 Raw `<img>` → `next/image` → **LCP -300ms**
4. 🟡 ISR/revalidate ekle → **TTFB -200ms**
5. 🟡 React.memo yaygınlaştır → **INP -50ms**

### Tahmini İyileştirme Sonrası

```
┌─────────────────────────────────────────────────────────────┐
│             TAHMİNİ LIGHTHOUSE İYİLEŞTİRMESİ               │
├─────────────────────────────────────────────────────────────┤
│  Mevcut Performance:        60-70                           │
│  Hedeflenen Performance:    85-95                           │
├─────────────────────────────────────────────────────────────┤
│  LCP:  3.5s → 1.5s   (-57%)                                │
│  FID:  150ms → 50ms  (-67%)                                │
│  CLS:  0.25 → 0.05   (-80%)                                │
└─────────────────────────────────────────────────────────────┘
```

---

**Analizi Yapan:** GitHub Copilot  
**Son Güncelleme:** 24 Aralık 2024
