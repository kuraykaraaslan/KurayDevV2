import AnalyticsService from "@/services/AnalyticsService";

export const monthlyJobs = [
  {
    name: "Generate Monthly Analytics Report",
    handler: async () => {
      await AnalyticsService.generateMonthlyReport?.();
    },
  },
];
