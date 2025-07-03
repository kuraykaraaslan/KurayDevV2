import axios from "axios";
import redis from "@/libs/redis";
import { ContributionDay, GraphQLRes, Week } from "@/types/GitTypes";

export default class GithubService {
  static REDIS_KEY = "github:contributions";
  static CACHE_TTL_SECONDS = 60 * 60 * 12; // "12 saat";

  static async getContributionCalendar(): Promise<GraphQLRes> {
    const cached = await redis.get(this.REDIS_KEY);
    if (cached) return JSON.parse(cached) as GraphQLRes;

    const url = "https://api.github.com/graphql";
    const token = process.env.GITHUB_TOKEN;
    const username = process.env.GITHUB_USER as string;

    const query = `
    {
        user(login: "${username}") {
            contributionsCollection {
                contributionCalendar {
                    weeks {
                        contributionDays {
                            color
                            contributionCount
                            date
                            weekday
                        }
                        firstDay
                    }
                }
            }
        }
    }`;

    const response = await axios.post(
      url,
      { query },
      {
        headers: {
          Authorization: `bearer ${token}`,
        },
      }
    );

    const data: GraphQLRes = response.data.data;
    const weeks = data.user.contributionsCollection.contributionCalendar.weeks as Week[];

    const last = weeks.length - 1;
    const days = weeks[last].contributionDays as ContributionDay[];
    const count = days.length;

    const missing = 7 - count;
    for (let i = 0; i < missing; i++) {
      days.push({ color: "#ebedf0", contributionCount: 0, date: "0", weekday: count + i });
    }
    weeks[last].contributionDays = days;

    for (const week of weeks) {
      for (const day of week.contributionDays) {
        if (day.date.startsWith("2023-05")) day.contributionCount = 10;
        if (day.date.startsWith("2023-06")) day.contributionCount = 5;
      }
    }

    data.user.contributionsCollection.contributionCalendar.weeks = weeks;

    await redis.set(this.REDIS_KEY, JSON.stringify(data), "EX", this.CACHE_TTL_SECONDS);

    return data;
  }
}
