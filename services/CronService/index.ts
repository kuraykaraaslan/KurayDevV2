import Logger from "@/libs/logger";

// JOB IMPORTS
import { dailyJobs } from "./jobs/daily";
import { hourlyJobs } from "./jobs/hourly";
import { weeklyJobs } from "./jobs/weekly";
import { monthlyJobs } from "./jobs/monthly";
import { fiveMinJobs } from "./jobs/fiveMin";
import { yearlyJobs } from "./jobs/yearly";
import { StatFrequency } from '@/types/common/StatTypes';

export default class CronService {
  static jobMap: Record<StatFrequency, Array<{ name: string; handler: () => Promise<void> }>> = {
    daily: dailyJobs,
    hourly: hourlyJobs,
    weekly: weeklyJobs,
    monthly: monthlyJobs,
    yearly: yearlyJobs,
    fiveMin: fiveMinJobs,
    "all-time": [],
  };

  static async run(frequency: StatFrequency) {
    Logger.info(`CRON: Trigger received → ${frequency}`);

    const jobs = CronService.jobMap[frequency];

    if (!jobs) {
      Logger.error(`CRON: Unknown frequency "${frequency}"`);
      throw new Error(`Unknown cron frequency: ${frequency}`);
    }

    const results: any[] = [];

    for (const job of jobs) {
      const start = Date.now();
      try {
        Logger.info(`▶ Running job: ${job.name}`);
        await job.handler();
        const duration = Date.now() - start;
        Logger.info(`✔ Finished job: ${job.name} (${duration}ms)`);

        results.push({
          job: job.name,
          status: "success",
          duration,
        });
      } catch (err: any) {
        Logger.error(`✘ Job failed: ${job.name} — ${err.message}`);
        results.push({
          job: job.name,
          status: "failed",
          error: err.message,
        });
      }
    }

    return {
      ok: true,
      frequency,
      executed: results,
    };
  }
}
