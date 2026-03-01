/**
 * Usage:
 *   npx tsx scripts/user-create.ts --email user@example.com --password secret123 --role ADMIN
 *
 * Roles: USER | AUTHOR | ADMIN  (default: USER)
 */

import 'dotenv/config'
import { Pool } from 'pg'
import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient, UserRole } from '../generated/prisma'
import bcrypt from 'bcrypt'

// ── Parse CLI args ─────────────────────────────────────────────────────────────
function getArg(flag: string): string | undefined {
  const idx = process.argv.indexOf(flag)
  return idx !== -1 ? process.argv[idx + 1] : undefined
}

const email = getArg('--email')
const password = getArg('--password')
const roleArg = (getArg('--role') ?? 'USER').toUpperCase()

// ── Validate ───────────────────────────────────────────────────────────────────
if (!email) {
  console.error('❌  --email is required')
  process.exit(1)
}

if (!password) {
  console.error('❌  --password is required')
  process.exit(1)
}

if (!['USER', 'AUTHOR', 'ADMIN'].includes(roleArg)) {
  console.error(`❌  --role must be one of: USER, AUTHOR, ADMIN  (got: ${roleArg})`)
  process.exit(1)
}

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
if (!emailRegex.test(email)) {
  console.error(`❌  Invalid email address: ${email}`)
  process.exit(1)
}

if (password.length < 8) {
  console.error('❌  Password must be at least 8 characters')
  process.exit(1)
}

// ── Prisma client ──────────────────────────────────────────────────────────────
const pool = new Pool({ connectionString: process.env.DATABASE_URL })
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter } as any)

// ── Main ───────────────────────────────────────────────────────────────────────
async function main() {
  const existing = await prisma.user.findUnique({ where: { email: email!.toLowerCase() } })

  if (existing) {
    console.error(`❌  A user with email "${email}" already exists`)
    process.exit(1)
  }

  const hashedPassword = await bcrypt.hash(password!, 10)

  const user = await prisma.user.create({
    data: {
      email: email!.toLowerCase(),
      password: hashedPassword,
      userRole: roleArg as UserRole,
      userStatus: 'ACTIVE',
      userProfile: {
        name: null,
        bio: null,
        profilePicture: null,
        website: null,
        location: null,
        birthDate: null,
      },
      userPreferences: {
        language: 'en',
        theme: 'SYSTEM',
        notifications: true,
      },
      userSecurity: {
        otpMethods: [],
      },
    },
  })

  console.log(`✅  User created successfully`)
  console.log(`    ID    : ${user.userId}`)
  console.log(`    Email : ${user.email}`)
  console.log(`    Role  : ${user.userRole}`)
  console.log(`    Status: ${user.userStatus}`)
}

main()
  .catch((err) => {
    console.error('❌  Error:', err.message)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
