import { prisma } from '../config/database';

interface TimeSlot {
  start: Date;
  end: Date;
  available: boolean;
  chairId?: string;
  chairName?: string;
}

export async function getAvailableSlots(
  practiceId: string,
  date: Date,
  duration: number,
  providerId?: string
): Promise<TimeSlot[]> {
  const settings = await prisma.practiceSettings.findFirst({
    where: { practiceId },
  });

  if (!settings) return [];

  const [startHour, startMin] = settings.workingHoursStart.split(':').map(Number);
  const [endHour, endMin] = settings.workingHoursEnd.split(':').map(Number);

  const dayStart = new Date(date);
  dayStart.setHours(startHour, startMin, 0, 0);
  const dayEnd = new Date(date);
  dayEnd.setHours(endHour, endMin, 0, 0);

  // Check if this day is a working day
  const dayOfWeek = date.getDay();
  if (!settings.workingDays.includes(dayOfWeek)) {
    return [];
  }

  // Get existing appointments for the day
  const where: Record<string, unknown> = {
    provider: { practiceId },
    startTime: { gte: dayStart },
    endTime: { lte: dayEnd },
    status: { notIn: ['CANCELLED', 'NO_SHOW', 'RESCHEDULED'] },
  };

  if (providerId) {
    where.providerId = providerId;
  }

  const existingAppointments = await prisma.appointment.findMany({
    where: where as any,
    select: { startTime: true, endTime: true, providerId: true, chairId: true },
  });

  const chairs = await prisma.chair.findMany({
    where: { practiceId, isActive: true },
  });

  const slots: TimeSlot[] = [];
  const slotDuration = settings.appointmentDuration;
  let current = new Date(dayStart);

  while (current.getTime() + duration * 60 * 1000 <= dayEnd.getTime()) {
    const slotEnd = new Date(current.getTime() + duration * 60 * 1000);

    // Check each chair
    for (const chair of chairs) {
      const hasConflict = existingAppointments.some(
        (apt) =>
          apt.chairId === chair.id &&
          apt.startTime.getTime() < slotEnd.getTime() &&
          apt.endTime.getTime() > current.getTime()
      );

      if (!hasConflict) {
        slots.push({
          start: new Date(current),
          end: new Date(slotEnd),
          available: true,
          chairId: chair.id,
          chairName: chair.name,
        });
      }
    }

    current = new Date(current.getTime() + slotDuration * 60 * 1000);
  }

  return slots;
}

export async function checkSlotAvailability(
  practiceId: string,
  providerId: string,
  chairId: string | null,
  startTime: Date,
  endTime: Date,
  excludeAppointmentId?: string
): Promise<boolean> {
  const where: Record<string, unknown> = {
    provider: { practiceId },
    status: { notIn: ['CANCELLED', 'NO_SHOW', 'RESCHEDULED'] },
    OR: [
      {
        providerId,
        startTime: { lt: endTime },
        endTime: { gt: startTime },
      },
      ...(chairId
        ? [{
            chairId,
            startTime: { lt: endTime },
            endTime: { gt: startTime },
          }]
        : []),
    ],
  };

  if (excludeAppointmentId) {
    where.id = { not: excludeAppointmentId };
  }

  const conflict = await prisma.appointment.findFirst({
    where: where as any,
  });

  return !conflict;
}
