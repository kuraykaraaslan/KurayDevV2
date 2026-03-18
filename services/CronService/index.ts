import Logger from '@/libs/logger'

// JOB IMPORTS
import { bootJobs } from './timers/boot'
import { dailyJobs } from './timers/daily'
import { hourlyJobs } from './timers/hourly'
import { weeklyJobs } from './timers/weekly'
import { monthlyJobs } from './timers/monthly'
import { fiveMinJobs } from './timers/fiveMin'
import { yearlyJobs } from './timers/yearly'
import { StatFrequency } from '@/types/common/StatTypes'

export default class CronService {
  static jobMap: Record<StatFrequency, Array<{ name: string; handler: () => Promise<void> }>> = {
    boot: bootJobs,
    daily: dailyJobs,
    hourly: hourlyJobs,
    weekly: weeklyJobs,
    monthly: monthlyJobs,
    yearly: yearlyJobs,
    fiveMin: fiveMinJobs,
    'all-time': [],
  }

  /**
   * Uygulama başladığında yapılacak işlemler (boot jobs)
   */
  static async boot() {
    Logger.info('CRON: Boot işlemleri başlatılıyor')
    const jobs = CronService.jobMap['boot'] || [];
    for (const job of jobs) {
      const start = Date.now();
      try {
        Logger.info(`▶ Boot job: ${job.name}`);
        await job.handler();
        const duration = Date.now() - start;
        Logger.info(`✔ Boot job finished: ${job.name} (${duration}ms)`);
      } catch (err: any) {
        Logger.error(`✘ Boot job failed: ${job.name} — ${err.message}`);
      }
    }
    Logger.info('CRON: Boot işlemleri tamamlandı');
  }

  static async run(frequency: StatFrequency) {
    Logger.info(`CRON: Trigger received → ${frequency}`)

    const jobs = CronService.jobMap[frequency]

    if (!jobs) {
      Logger.error(`CRON: Unknown frequency "${frequency}"`)
      throw new Error(`Unknown cron frequency: ${frequency}`)
    }

    const results: any[] = []

    for (const job of jobs) {
      const start = Date.now()
      try {
        Logger.info(`▶ Running job: ${job.name}`)
        await job.handler()
        const duration = Date.now() - start
        Logger.info(`✔ Finished job: ${job.name} (${duration}ms)`)

        results.push({
          job: job.name,
          status: 'success',
          duration,
        })
      } catch (err: any) {
        Logger.error(`✘ Job failed: ${job.name} — ${err.message}`)
        results.push({
          job: job.name,
          status: 'failed',
          error: err.message,
        })
      }
    }

    return {
      ok: true,
      frequency,
      executed: results,
    }
  }
}
