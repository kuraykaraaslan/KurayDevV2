type ContributionDay = {
    color: string;
    contributionCount: number;
    date: string;
    weekday: number;
};
type Week = {
    contributionDays: ContributionDay[];
    firstDay: string;
    isMilitaryTime?: boolean;
};

type Weeks = Week[];

type GraphQLRes = {
    user: {
        contributionsCollection: {
            contributionCalendar: {
                weeks: Weeks;
            };
        };
    };
};

export type { ContributionDay, Week, Weeks, GraphQLRes };