import cron from 'node-cron';
import { prisma } from '../config/database';
import { logger } from '../utils/logger';

export function startClaimFollowUp(): void {
  // Run daily at 8am
  cron.schedule('0 8 * * *', async () => {
    try {
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

      const staleClaims = await prisma.insuranceClaim.findMany({
        where: {
          status: { in: ['SUBMITTED', 'IN_REVIEW'] },
          submittedAt: { lt: thirtyDaysAgo },
        },
        include: {
          invoice: {
            include: {
              patient: { select: { firstName: true, lastName: true } },
            },
          },
        },
      });

      for (const claim of staleClaims) {
        await prisma.insuranceClaim.update({
          where: { id: claim.id },
          data: { followUpDate: new Date() },
        });

        logger.info(
          {
            claimId: claim.id,
            patient: `${claim.invoice.patient.firstName} ${claim.invoice.patient.lastName}`,
            amount: claim.amountClaimed,
          },
          'Insurance claim needs follow-up (>30 days)'
        );
      }

      // Also flag overdue invoices
      const overdueInvoices = await prisma.invoice.findMany({
        where: {
          status: 'PENDING',
          dueDate: { lt: new Date() },
        },
      });

      if (overdueInvoices.length > 0) {
        await prisma.invoice.updateMany({
          where: {
            id: { in: overdueInvoices.map((i) => i.id) },
          },
          data: { status: 'OVERDUE' },
        });
        logger.info(`Marked ${overdueInvoices.length} invoices as overdue`);
      }
    } catch (error) {
      logger.error(error, 'Claim follow-up job failed');
    }
  });

  logger.info('Claim follow-up job scheduled');
}
