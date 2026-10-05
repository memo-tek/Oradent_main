import cron from 'node-cron';
import { prisma } from '../config/database';
import { logger } from '../utils/logger';

export function startAppointmentReminders(): void {
  // Run every hour
  cron.schedule('0 * * * *', async () => {
    try {
      const settings = await prisma.practiceSettings.findFirst();
      const hoursAhead = settings?.reminderHoursBefore || 24;
      const now = new Date();
      const reminderTime = new Date(now.getTime() + hoursAhead * 60 * 60 * 1000);
      const reminderWindowEnd = new Date(reminderTime.getTime() + 60 * 60 * 1000);

      const appointments = await prisma.appointment.findMany({
        where: {
          startTime: { gte: reminderTime, lt: reminderWindowEnd },
          status: { in: ['SCHEDULED', 'CONFIRMED'] },
          reminderSent: false,
        },
        include: {
          patient: { select: { firstName: true, lastName: true, email: true, phone: true } },
          provider: { select: { name: true } },
          chair: { select: { name: true } },
        },
      });

      for (const apt of appointments) {
        // In production, send email/SMS here
        logger.info(
          { appointmentId: apt.id, patientName: `${apt.patient.firstName} ${apt.patient.lastName}` },
          'Would send appointment reminder'
        );

        await prisma.appointment.update({
          where: { id: apt.id },
          data: { reminderSent: true },
        });
      }

      if (appointments.length > 0) {
        logger.info(`Processed ${appointments.length} appointment reminders`);
      }
    } catch (error) {
      logger.error(error, 'Appointment reminder job failed');
    }
  });

  logger.info('Appointment reminder job scheduled');
}
