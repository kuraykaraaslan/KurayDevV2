import SettingService from '@/services/SettingService'
import { prisma } from '@/libs/prisma'

jest.mock('@/libs/prisma', () => ({
  prisma: {
    setting: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      upsert: jest.fn(),
    },
  },
}))

const prismaMock = prisma as any

const mockSetting = { key: 'site_name', value: 'KurayDev', settingId: 's-1' }

describe('SettingService', () => {
  beforeEach(() => jest.clearAllMocks())

  // ── getSettings ───────────────────────────────────────────────────────
  describe('getSettings', () => {
    it('returns all settings', async () => {
      prismaMock.setting.findMany.mockResolvedValueOnce([mockSetting])
      const result = await SettingService.getSettings()
      expect(result).toHaveLength(1)
      expect(result[0].key).toBe('site_name')
    })
  })

  // ── getSettingByKey ───────────────────────────────────────────────────
  describe('getSettingByKey', () => {
    it('returns setting when found', async () => {
      prismaMock.setting.findFirst.mockResolvedValueOnce(mockSetting)
      const result = await SettingService.getSettingByKey('site_name')
      expect(result?.value).toBe('KurayDev')
    })

    it('returns null when not found', async () => {
      prismaMock.setting.findFirst.mockResolvedValueOnce(null)
      const result = await SettingService.getSettingByKey('nonexistent')
      expect(result).toBeNull()
    })
  })

  // ── createSetting ─────────────────────────────────────────────────────
  describe('createSetting', () => {
    it('updates existing setting when key already exists', async () => {
      prismaMock.setting.findFirst.mockResolvedValueOnce(mockSetting)
      prismaMock.setting.update.mockResolvedValueOnce({ ...mockSetting, value: 'NewDev' })

      const result = await SettingService.createSetting('site_name', 'NewDev')
      expect(prismaMock.setting.update).toHaveBeenCalledWith(
        expect.objectContaining({ where: { key: 'site_name' }, data: { value: 'NewDev' } })
      )
      expect(result.value).toBe('NewDev')
    })

    it('creates new setting when key does not exist', async () => {
      prismaMock.setting.findFirst.mockResolvedValueOnce(null)
      prismaMock.setting.create.mockResolvedValueOnce({ key: 'new_key', value: 'val', settingId: 's-2' })

      await SettingService.createSetting('new_key', 'val')
      expect(prismaMock.setting.create).toHaveBeenCalledWith(
        expect.objectContaining({ data: { key: 'new_key', value: 'val' } })
      )
    })
  })

  // ── deleteSetting ─────────────────────────────────────────────────────
  describe('deleteSetting', () => {
    it('returns null when setting not found', async () => {
      prismaMock.setting.findFirst.mockResolvedValueOnce(null)
      const result = await SettingService.deleteSetting('nonexistent')
      expect(result).toBeNull()
      expect(prismaMock.setting.delete).not.toHaveBeenCalled()
    })

    it('deletes and returns setting when found', async () => {
      prismaMock.setting.findFirst.mockResolvedValueOnce(mockSetting)
      prismaMock.setting.delete.mockResolvedValueOnce(mockSetting)

      const result = await SettingService.deleteSetting('site_name')
      expect(prismaMock.setting.delete).toHaveBeenCalledWith(
        expect.objectContaining({ where: { key: 'site_name' } })
      )
      expect(result?.key).toBe('site_name')
    })
  })

  // ── updateSettings ────────────────────────────────────────────────────
  describe('updateSettings', () => {
    it('upserts each key-value pair and returns updated list', async () => {
      prismaMock.setting.upsert
        .mockResolvedValueOnce({ key: 'a', value: '1', settingId: 'x' })
        .mockResolvedValueOnce({ key: 'b', value: '2', settingId: 'y' })

      const result = await SettingService.updateSettings({ a: '1', b: '2' })
      expect(prismaMock.setting.upsert).toHaveBeenCalledTimes(2)
      expect(result).toHaveLength(2)
    })
  })
})
