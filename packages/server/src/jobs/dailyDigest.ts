import cron from 'node-cron';
import { prisma } from '../config/database';
import { logger } from '../utils/logger';

export function startDailyDigest(): void {
  // Run at 7am on weekdays
  cron.schedule('0 7 * * 1-5', async () => {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      const practices = await prisma.practice.findMany({
        select: { id: true, name: true },
      });

      for (const practice of practices) {
        const [appointments, pendingClaims, overdueInvoices] = await Promise.all([
          prisma.appointment.count({
            where: {
              provider: { practiceId: practice.id },
              startTime: { gte: today, lt: tomorrow },
              status: { notIn: ['CANCELLED', 'NO_SHOW'] },
            },
          }),
          prisma.insuranceClaim.count({
            where: {
              invoice: { patient: { practiceId: practice.id } },
              status: { in: ['SUBMITTED', 'IN_REVIEW'] },
            },
          }),
          prisma.invoice.count({
            where: {
              patient: { practiceId: practice.id },
              status: 'OVERDUE',
            },
          }),
        ]);

        logger.info(
          {
            practice: practice.name,
            todayAppointments: appointments,
            pendingClaims,
            overdueInvoices,
          },
          'Daily digest generated'
        );
      }
    } catch (error) {
      logger.error(error, 'Daily digest job failed');
    }
  });

  logger.info('Daily digest job scheduled');
}
