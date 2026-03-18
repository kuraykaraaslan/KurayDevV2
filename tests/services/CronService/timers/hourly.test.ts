/**
 * Tests for the hourly cron timer array.
 * The hourly timer delegates to `publishScheduledPosts`.  We mock that job so
 * the timer-level tests are isolated from the job-level logic (which has its own
 * dedicated test file).
 */

// Mock the job imported by the hourly timer before the timer module is loaded
jest.mock('@/services/CronService/jobs/publishScheduledPosts', () => ({
  publishScheduledPosts: jest.fn().mockResolvedValue(undefined),
}))

import { hourlyJobs } from '@/services/CronService/timers/hourly'
import { publishScheduledPosts } from '@/services/CronService/jobs/publishScheduledPosts'

const publishMock = publishScheduledPosts as jest.Mock

describe('hourlyJobs', () => {
  beforeEach(() => jest.clearAllMocks())

  it('exports a non-empty array of job descriptors', () => {
    expect(Array.isArray(hourlyJobs)).toBe(true)
    expect(hourlyJobs.length).toBeGreaterThanOrEqual(1)
  })

  it('every job has a string name and a handler function', () => {
    for (const job of hourlyJobs) {
      expect(typeof job.name).toBe('string')
      expect(job.name.length).toBeGreaterThan(0)
      expect(typeof job.handler).toBe('function')
    }
  })

  it('includes the publishScheduledPosts job', () => {
    const job = hourlyJobs.find((j) => j.name === 'publishScheduledPosts')
    expect(job).toBeDefined()
  })

  it('publishScheduledPosts handler delegates to the job function', async () => {
    const job = hourlyJobs.find((j) => j.name === 'publishScheduledPosts')!
    await job.handler()
    expect(publishMock).toHaveBeenCalledTimes(1)
  })

  it('handler is idempotent — calling it twice invokes job twice without error', async () => {
    const job = hourlyJobs.find((j) => j.name === 'publishScheduledPosts')!
    await expect(job.handler()).resolves.toBeUndefined()
    await expect(job.handler()).resolves.toBeUndefined()
    expect(publishMock).toHaveBeenCalledTimes(2)
  })

  it('a job failure propagates as a rejected promise (caller is responsible for isolation)', async () => {
    publishMock.mockRejectedValueOnce(new Error('scheduler crashed'))

    const job = hourlyJobs.find((j) => j.name === 'publishScheduledPosts')!
    await expect(job.handler()).rejects.toThrow('scheduler crashed')
  })

  it('all job handlers resolve successfully under normal conditions', async () => {
    for (const job of hourlyJobs) {
      await expect(job.handler()).resolves.toBeUndefined()
    }
  })
})
