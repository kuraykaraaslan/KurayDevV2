import 'dotenv/config'
import { Pool } from 'pg'
import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from '../../generated/prisma/client'

const connectionString = `${process.env.DATABASE_URL}`

const prismaClientSingleton = () => {
  // Create a connection pool with proper timeout settings
  const pool = new Pool({
    connectionString,
    max: 20, // Maximum number of connections
    idleTimeoutMillis: 30000, // Close idle connections after 30 seconds
    connectionTimeoutMillis: 10000, // Timeout for new connections
    statement_timeout: 30000, // 30 second query timeout
  })

  const adapter = new PrismaPg(pool)
  return new PrismaClient({ adapter })
}

declare global {
  // eslint-disable-next-line no-var
  var prismaGlobal: undefined | ReturnType<typeof prismaClientSingleton>
}

const prisma = globalThis.prismaGlobal ?? prismaClientSingleton()

if (process.env.NODE_ENV !== 'production') {
  globalThis.prismaGlobal = prisma
}

export { prisma }
