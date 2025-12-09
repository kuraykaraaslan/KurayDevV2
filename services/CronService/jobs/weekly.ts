import SubscriptionService from "@/services/SubscriptionService";
import AnalyticsService  from "@/services/AnalyticsService";

export const weeklyJobs = [
  {
    name: "Send Weekly Digest",
    handler: async () => {
      await SubscriptionService.sendWeeklyDigestToAll?.();
    },
  },
  {
    name: "Admin Weekly Analytics Summary",
    handler: async () => {
      await AnalyticsService.sendWeeklyAnalyticsReport?.();
    },
  },
];
