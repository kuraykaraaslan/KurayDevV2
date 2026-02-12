// libs/security/Encryptor.ts
import crypto from 'crypto'
import dotenv from 'dotenv'
dotenv.config()

const ENCRYPTION_KEY = Buffer.from(process.env.ENCRYPTION_SECRET_KEY!, 'hex') // 32 bytes
const ALGORITHM = 'aes-256-gcm'

export default class Encryptor {
  public static encrypt(text: string): string {
    const iv = crypto.randomBytes(12)
    const cipher = crypto.createCipheriv(ALGORITHM, ENCRYPTION_KEY, iv)

    const encrypted = Buffer.concat([cipher.update(text, 'utf8'), cipher.final()])
    const tag = cipher.getAuthTag()

    return Buffer.concat([iv, tag, encrypted]).toString('base64')
  }

  public static decrypt(enc: string): string {
    const bData = Buffer.from(enc, 'base64')
    const iv = bData.slice(0, 12)
    const tag = bData.slice(12, 28)
    const text = bData.slice(28)

    const decipher = crypto.createDecipheriv(ALGORITHM, ENCRYPTION_KEY, iv)
    decipher.setAuthTag(tag)

    return decipher.update(text.toString('utf8'), 'utf8', 'utf8') + decipher.final('utf8')
  }
}
