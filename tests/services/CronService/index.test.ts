import CronService from '@/services/CronService'
import Logger from '@/libs/logger'

jest.mock('@/libs/logger', () => ({
  __esModule: true,
  default: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  },
}))

const loggerMock = Logger as jest.Mocked<typeof Logger>

describe('CronService.run', () => {
  const originalDailyJobs = CronService.jobMap.daily

  afterEach(() => {
    CronService.jobMap.daily = originalDailyJobs
    jest.clearAllMocks()
  })

  it('throws for unknown frequency and logs error telemetry', async () => {
    await expect(CronService.run('invalid' as any)).rejects.toThrow(
      'Unknown cron frequency: invalid'
    )

    expect(loggerMock.info).toHaveBeenCalledWith('CRON: Trigger received → invalid')
    expect(loggerMock.error).toHaveBeenCalledWith('CRON: Unknown frequency "invalid"')
  })

  it('continues after failed job and returns execution summary', async () => {
    const okJob = jest.fn().mockResolvedValue(undefined)
    const failJob = jest.fn().mockRejectedValue(new Error('boom'))
    const trailingJob = jest.fn().mockResolvedValue(undefined)

    CronService.jobMap.daily = [
      { name: 'okJob', handler: okJob },
      { name: 'failJob', handler: failJob },
      { name: 'trailingJob', handler: trailingJob },
    ]

    const result = await CronService.run('daily')

    expect(okJob).toHaveBeenCalledTimes(1)
    expect(failJob).toHaveBeenCalledTimes(1)
    expect(trailingJob).toHaveBeenCalledTimes(1)

    expect(result).toEqual(
      expect.objectContaining({
        ok: true,
        frequency: 'daily',
        executed: [
          expect.objectContaining({ job: 'okJob', status: 'success' }),
          expect.objectContaining({ job: 'failJob', status: 'failed', error: 'boom' }),
          expect.objectContaining({ job: 'trailingJob', status: 'success' }),
        ],
      })
    )

    expect(loggerMock.info).toHaveBeenCalledWith('▶ Running job: okJob')
    expect(loggerMock.info).toHaveBeenCalledWith('▶ Running job: failJob')
    expect(loggerMock.info).toHaveBeenCalledWith('▶ Running job: trailingJob')
    expect(loggerMock.error).toHaveBeenCalledWith('✘ Job failed: failJob — boom')
  })
})
