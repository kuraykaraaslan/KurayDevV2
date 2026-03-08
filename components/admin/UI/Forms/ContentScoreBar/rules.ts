import type { ScoreRule } from '.'

export const countWordsInHtml = (html: string): number =>
  html
    .replace(/<[^>]*>/g, ' ')
    .trim()
    .split(/\s+/)
    .filter((w) => w.length > 0).length

export const TITLE_SCORE_RULES: ScoreRule[] = [
  {
    label: 'Dolu',
    check: (v) => v.trim().length > 0,
    points: 10,
    hint: 'Başlık boş olamaz',
  },
  {
    label: '≥20 karakter',
    check: (v) => v.trim().length >= 20,
    points: 15,
    hint: 'En az 20 karakter olmalı',
  },
  {
    label: '50-60 karakter',
    check: (v) => v.trim().length >= 50 && v.trim().length <= 60,
    points: 25,
    hint: 'SEO için ideal başlık uzunluğu 50-60 karakter',
  },
  {
    label: '≤70 karakter',
    check: (v) => v.trim().length > 0 && v.trim().length <= 70,
    points: 15,
    hint: '70 karakterden uzun başlıklar arama sonuçlarında kesilebilir',
  },
]

export const DESCRIPTION_SCORE_RULES: ScoreRule[] = [
  {
    label: 'Dolu',
    check: (v) => v.trim().length > 0,
    points: 10,
    hint: 'Meta description boş olamaz',
  },
  {
    label: '≥80 karakter',
    check: (v) => v.trim().length >= 80,
    points: 15,
    hint: 'En az 80 karakter olmalı',
  },
  {
    label: '120-160 karakter',
    check: (v) => v.trim().length >= 120 && v.trim().length <= 160,
    points: 30,
    hint: 'SEO için ideal meta description: 120-160 karakter',
  },
  {
    label: '≤170 karakter',
    check: (v) => v.trim().length > 0 && v.trim().length <= 170,
    points: 10,
    hint: '170 karakterden uzun açıklamalar arama sonuçlarında kesilebilir',
  },
]

export const CONTENT_SCORE_RULES: ScoreRule[] = [
  {
    label: 'Dolu',
    check: (v) => v.replace(/<[^>]*>/g, '').trim().length > 0,
    points: 5,
    hint: 'İçerik boş olamaz',
  },
  {
    label: '≥300 kelime',
    check: (v) => countWordsInHtml(v) >= 300,
    points: 15,
    hint: 'İçerik en az 300 kelime olmalı',
  },
  {
    label: '≥600 kelime',
    check: (v) => countWordsInHtml(v) >= 600,
    points: 15,
    hint: 'SEO için ideal: 600+ kelime',
  },
  {
    label: 'Görsel',
    check: (v) => /<img\b/i.test(v),
    points: 15,
    hint: 'En az bir görsel ekleyin',
  },
  {
    label: 'Alt text',
    check: (v) => {
      const imgs = v.match(/<img\b[^>]*>/gi) ?? []
      if (imgs.length === 0) return false
      return imgs.every((img) => /\balt\s*=\s*["'][^"']+["']/i.test(img))
    },
    points: 25,
    hint: 'Tüm görsellerin dolu alt text içermesi gerekiyor',
  },
  {
    label: 'Link',
    check: (v) => /<a\s/i.test(v),
    points: 10,
    hint: 'En az bir link ekleyin',
  },
]

export const SLUG_SCORE_RULES: ScoreRule[] = [
  {
    label: 'Dolu',
    check: (v) => v.trim().length > 0,
    points: 10,
    hint: 'Slug boş olamaz',
  },
  {
    label: 'Küçük harf',
    check: (v) => v.trim().length > 0 && v === v.toLowerCase(),
    points: 20,
    hint: 'Slug büyük harf içermemeli',
  },
  {
    label: 'Boşluk yok',
    check: (v) => v.trim().length > 0 && !/\s/.test(v),
    points: 20,
    hint: 'Slug boşluk içermemeli',
  },
  {
    label: 'a-z 0-9 tire',
    check: (v) => /^[a-z0-9-]+$/.test(v),
    points: 20,
    hint: 'Slug sadece küçük harf, rakam ve tire içermeli',
  },
  {
    label: '≤75 karakter',
    check: (v) => v.trim().length > 0 && v.length <= 75,
    points: 15,
    hint: 'Slug 75 karakterden kısa olmalı',
  },
]

export const KEYWORDS_SCORE_RULES: ScoreRule[] = [
  {
    label: '≥1 kelime',
    check: (v) => v.split(',').filter((k) => k.trim().length > 0).length >= 1,
    points: 15,
    hint: 'En az bir anahtar kelime ekleyin',
  },
  {
    label: '≥3 kelime',
    check: (v) => v.split(',').filter((k) => k.trim().length > 0).length >= 3,
    points: 25,
    hint: 'En az 3 anahtar kelime önerilir',
  },
  {
    label: '≤10 kelime',
    check: (v) => {
      const count = v.split(',').filter((k) => k.trim().length > 0).length
      return count > 0 && count <= 10
    },
    points: 15,
    hint: 'En fazla 10 anahtar kelime kullanın',
  },
  {
    label: 'Kısa kelimeler',
    check: (v) => {
      const keywords = v.split(',').filter((k) => k.trim().length > 0)
      return keywords.length > 0 && keywords.every((k) => k.trim().length <= 50)
    },
    points: 10,
    hint: 'Her anahtar kelime 50 karakterden kısa olmalı',
  },
]
