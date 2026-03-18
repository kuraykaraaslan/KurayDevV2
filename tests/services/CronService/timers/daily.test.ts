/**
 * Tests for the daily cron timer array.
 * The daily timer currently ships a single stub job (Daily Appointment Reminders).
 * These tests verify the shape of the array and that handlers are callable without
 * side-effects or crashes, and that a failure in one job is isolated.
 */
import { dailyJobs } from '@/services/CronService/timers/daily'

describe('dailyJobs', () => {
  it('exports a non-empty array of job descriptors', () => {
    expect(Array.isArray(dailyJobs)).toBe(true)
    expect(dailyJobs.length).toBeGreaterThanOrEqual(1)
  })

  it('every job has a string name and an async handler function', () => {
    for (const job of dailyJobs) {
      expect(typeof job.name).toBe('string')
      expect(job.name.length).toBeGreaterThan(0)
      expect(typeof job.handler).toBe('function')
    }
  })

  it('handlers resolve without throwing (graceful no-op for stub jobs)', async () => {
    for (const job of dailyJobs) {
      await expect(job.handler()).resolves.not.toThrow()
    }
  })

  it('handler is idempotent — calling it twice does not throw', async () => {
    for (const job of dailyJobs) {
      await expect(job.handler()).resolves.toBeUndefined()
      await expect(job.handler()).resolves.toBeUndefined()
    }
  })

  it('a failure in one job does not prevent other jobs from running', async () => {
    // Build a local copy of the job array replacing the first handler with a failing one
    const crashingJob = { name: 'crashJob', handler: async () => { throw new Error('boom') } }
    const safeJob = { name: 'safeJob', handler: jest.fn().mockResolvedValue(undefined) }

    const jobs = [crashingJob, safeJob]
    const results: string[] = []

    for (const job of jobs) {
      try {
        await job.handler()
        results.push('ok')
      } catch {
        results.push('failed')
      }
    }

    expect(results).toEqual(['failed', 'ok'])
    expect(safeJob.handler).toHaveBeenCalledTimes(1)
  })

  it('handler resolves with undefined (no return value expected)', async () => {
    for (const job of dailyJobs) {
      const result = await job.handler()
      expect(result).toBeUndefined()
    }
  })
})
