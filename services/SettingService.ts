//SettingService.tsx

import { Setting } from '@/types/common/SettingTypes'
import { prisma } from '@/libs/prisma'
import redis from '@/libs/redis'

const SETTING_CACHE_KEY = (key: string) => `setting:${key}`
const SETTING_CACHE_TTL = 60 // seconds
const SETTING_CACHE_NULL = '__NULL__'

export default class SettingService {
  private static async invalidateSettingCache(key: string): Promise<void> {
    try {
      await redis.del(SETTING_CACHE_KEY(key))
    } catch {
      /* cache invalidation is best-effort */
    }
  }

  static async getSettings(): Promise<Setting[]> {
    return await prisma.setting.findMany()
  }

  static async getSettingByKey(key: string): Promise<Setting | null> {
    const cacheKey = SETTING_CACHE_KEY(key)
    try {
      const cached = await redis.get(cacheKey)
      if (cached !== null) {
        return cached === SETTING_CACHE_NULL ? null : (JSON.parse(cached) as Setting)
      }
    } catch {
      /* fall through to DB on cache read failure */
    }

    const setting = await prisma.setting.findFirst({
      where: {
        key: key,
      },
    })

    try {
      await redis.set(
        cacheKey,
        setting ? JSON.stringify(setting) : SETTING_CACHE_NULL,
        'EX',
        SETTING_CACHE_TTL,
      )
    } catch {
      /* best-effort cache write */
    }

    return setting
  }

  static async createSetting(key: string, value: string): Promise<Setting> {
    const existingSetting = await this.getSettingByKey(key)
    let result: Setting
    if (existingSetting) {
      result = await prisma.setting.update({
        where: {
          key: key,
        },
        data: {
          value: value,
        },
      })
    } else {
      result = await prisma.setting.create({
        data: {
          key: key,
          value: value,
        },
      })
    }

    await this.invalidateSettingCache(key)
    return result
  }

  static async deleteSetting(key: string): Promise<Setting | null> {
    const existingSetting = await this.getSettingByKey(key)
    if (!existingSetting) {
      return null
    }

    const result = await prisma.setting.delete({
      where: {
        key: key,
      },
    })

    await this.invalidateSettingCache(key)
    return result
  }

  static async updateSettings(settings: Record<string, string>): Promise<Setting[]> {
    const updatedSettings: Setting[] = []
    for (const key in settings) {
      const updatedSetting = await prisma.setting.upsert({
        where: {
          key: key,
        },
        update: {
          value: settings[key],
        },
        create: {
          key: key,
          value: settings[key],
        },
      })
      updatedSettings.push(updatedSetting)
      await this.invalidateSettingCache(key)
    }

    return updatedSettings
  }
}
