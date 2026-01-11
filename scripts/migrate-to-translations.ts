/**
 * Migration Script: Post ve Category verilerini Translation tablolarına taşır
 *
 * Kullanım:
 *   npx tsx scripts/migrate-to-translations.ts
 *
 * Veya:
 *   npx ts-node scripts/migrate-to-translations.ts
 */

import 'dotenv/config'
import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from '../generated/prisma/client'

const connectionString = `${process.env.DATABASE_URL}`
const adapter = new PrismaPg({ connectionString })
const prisma = new PrismaClient({ adapter })

// Mevcut içeriklerin dili (değiştirilebilir)
const DEFAULT_LANGUAGE = 'en'

interface MigrationStats {
  posts: { total: number; migrated: number; skipped: number }
  categories: { total: number; migrated: number; skipped: number }
}

async function migratePostsToTranslations(): Promise<{ migrated: number; skipped: number }> {
  const posts = await prisma.post.findMany({
    select: {
      postId: true,
      title: true,
      content: true,
      description: true,
      slug: true,
      keywords: true,
    }
  })

  let migrated = 0
  let skipped = 0

  for (const post of posts) {
    // Zaten translation var mı kontrol et
    const existingTranslation = await prisma.postTranslation.findUnique({
      where: {
        postId_language: {
          postId: post.postId,
          language: DEFAULT_LANGUAGE
        }
      }
    })

    if (existingTranslation) {
      console.log(`  ⏭️  Post "${post.slug}" zaten ${DEFAULT_LANGUAGE} çevirisi var, atlanıyor`)
      skipped++
      continue
    }

    await prisma.postTranslation.create({
      data: {
        postId: post.postId,
        language: DEFAULT_LANGUAGE,
        title: post.title,
        content: post.content,
        description: post.description ?? '',
        slug: post.slug,
        keywords: post.keywords ?? []
      }
    })

    console.log(`  ✅ Post "${post.slug}" → ${DEFAULT_LANGUAGE} çevirisi oluşturuldu`)
    migrated++
  }

  return { migrated, skipped }
}

async function migrateCategoriesToTranslations(): Promise<{ migrated: number; skipped: number }> {
  const categories = await prisma.category.findMany({
    select: {
      categoryId: true,
      title: true,
      description: true,
      slug: true,
    }
  })

  let migrated = 0
  let skipped = 0

  for (const category of categories) {
    // Zaten translation var mı kontrol et
    const existingTranslation = await prisma.categoryTranslation.findUnique({
      where: {
        categoryId_language: {
          categoryId: category.categoryId,
          language: DEFAULT_LANGUAGE
        }
      }
    })

    if (existingTranslation) {
      console.log(`  ⏭️  Category "${category.slug}" zaten ${DEFAULT_LANGUAGE} çevirisi var, atlanıyor`)
      skipped++
      continue
    }

    await prisma.categoryTranslation.create({
      data: {
        categoryId: category.categoryId,
        language: DEFAULT_LANGUAGE,
        title: category.title,
        description: category.description ?? '',
        slug: category.slug,
      }
    })

    console.log(`  ✅ Category "${category.slug}" → ${DEFAULT_LANGUAGE} çevirisi oluşturuldu`)
    migrated++
  }

  return { migrated, skipped }
}

async function main() {
  console.log('═══════════════════════════════════════════════════════════')
  console.log('  🌐 Multi-Language Migration Script')
  console.log(`  📌 Varsayılan dil: ${DEFAULT_LANGUAGE}`)
  console.log('═══════════════════════════════════════════════════════════\n')

  const stats: MigrationStats = {
    posts: { total: 0, migrated: 0, skipped: 0 },
    categories: { total: 0, migrated: 0, skipped: 0 }
  }

  // Post sayısını al
  const postCount = await prisma.post.count()
  const categoryCount = await prisma.category.count()

  stats.posts.total = postCount
  stats.categories.total = categoryCount

  console.log(`📊 Mevcut veriler:`)
  console.log(`   - ${postCount} post`)
  console.log(`   - ${categoryCount} kategori\n`)

  // Posts migration
  console.log('📝 Post çevirileri oluşturuluyor...')
  console.log('─────────────────────────────────────')
  const postResult = await migratePostsToTranslations()
  stats.posts.migrated = postResult.migrated
  stats.posts.skipped = postResult.skipped
  console.log('')

  // Categories migration
  console.log('📁 Kategori çevirileri oluşturuluyor...')
  console.log('─────────────────────────────────────')
  const categoryResult = await migrateCategoriesToTranslations()
  stats.categories.migrated = categoryResult.migrated
  stats.categories.skipped = categoryResult.skipped
  console.log('')

  // Summary
  console.log('═══════════════════════════════════════════════════════════')
  console.log('  📋 ÖZET')
  console.log('═══════════════════════════════════════════════════════════')
  console.log(`  Posts:`)
  console.log(`    - Toplam: ${stats.posts.total}`)
  console.log(`    - Migrate edildi: ${stats.posts.migrated}`)
  console.log(`    - Atlandı: ${stats.posts.skipped}`)
  console.log(`  Categories:`)
  console.log(`    - Toplam: ${stats.categories.total}`)
  console.log(`    - Migrate edildi: ${stats.categories.migrated}`)
  console.log(`    - Atlandı: ${stats.categories.skipped}`)
  console.log('═══════════════════════════════════════════════════════════')
  console.log('  ✅ Migration tamamlandı!')
  console.log('═══════════════════════════════════════════════════════════')
}

main()
  .catch((error) => {
    console.error('❌ Migration hatası:', error)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
