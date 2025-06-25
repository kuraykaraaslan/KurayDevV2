import prisma from '@/libs/prisma'

export default class WorkDayService {
  static async getWorkDays({
    startDate,
    endDate,
  }: {
    startDate: Date
    endDate: Date
  }) {
    return prisma.workDay.findMany({
      where: {
        date: {
          gte: startDate,
          lte: endDate,
        },
      },
      orderBy: { date: 'asc' },
    })
  }

  static async createWorkDay(date: Date) {
    return prisma.workDay.create({
      data: { date },
    })
  }

  static async updateWorkDay(id: number, data: Partial<{ date: Date }>) {
    return prisma.workDay.update({
      where: { id },
      data,
    })
  }
}
