require('dotenv/config');
const { Pool } = require('pg');
const { PrismaPg } = require('@prisma/adapter-pg');
const { PrismaClient } = require('../generated/prisma');

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  // İlk admin/user'ı bul
  const user = await prisma.user.findFirst({
    orderBy: { createdAt: 'asc' },
  });

  if (!user) {
    throw new Error('Hiç kullanıcı bulunamadı. Önce bir kullanıcı oluşturun.');
  }

  console.log(`Kullanıcı bulundu: ${user.email}`);

  // Kategori oluştur (varsa upsert)
  const category = await prisma.category.upsert({
    where: { slug: 'test-kategori' },
    update: {},
    create: {
      title: 'Test Kategori',
      slug: 'test-kategori',
      description: 'Test amaçlı oluşturulmuş kategori',
      keywords: ['test', 'kategori'],
    },
  });

  console.log(`Kategori oluşturuldu/bulundu: ${category.title} (${category.categoryId})`);

  // 5 test post oluştur
  const posts = [];
  for (let i = 1; i <= 5; i++) {
    const slug = `test-post-${i}`;
    const post = await prisma.post.upsert({
      where: { slug },
      update: {},
      create: {
        title: `Test Post ${i}`,
        slug,
        content: `Bu test post ${i} içeriğidir. Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.`,
        description: `Test Post ${i} açıklaması`,
        keywords: ['test', `post-${i}`],
        status: 'PUBLISHED',
        publishedAt: new Date(),
        authorId: user.userId,
        categoryId: category.categoryId,
      },
    });
    posts.push(post);
    console.log(`  ✓ Post oluşturuldu: ${post.title} (${post.postId})`);
  }

  console.log(`\nToplam ${posts.length} post oluşturuldu.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
