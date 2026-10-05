import PDFDocument from 'pdfkit';
import fs from 'fs';
import path from 'path';
import { formatCurrency, formatDate } from '../utils/formatters';

interface InvoiceData {
  invoiceNumber: string;
  date: Date;
  dueDate: Date;
  practice: { name: string; address: string; phone: string; email: string; npi?: string | null };
  patient: { firstName: string; lastName: string; address?: string | null; phone: string };
  treatments: Array<{ cdtCode: string; description: string; toothNumber?: number | null; fee: number }>;
  subtotal: number;
  discount: number;
  taxAmount: number;
  total: number;
  insurancePortion: number;
  patientPortion: number;
}

export async function generateInvoicePDF(data: InvoiceData, outputPath: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const dir = path.dirname(outputPath);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

    const doc = new PDFDocument({ size: 'LETTER', margin: 50 });
    const stream = fs.createWriteStream(outputPath);

    doc.pipe(stream);

    // Header
    doc.fontSize(24).fillColor('#0d9488').text(data.practice.name, 50, 50);
    doc.fontSize(10).fillColor('#57534e')
      .text(data.practice.address, 50, 80)
      .text(`Phone: ${data.practice.phone} | Email: ${data.practice.email}`, 50, 95);

    if (data.practice.npi) {
      doc.text(`NPI: ${data.practice.npi}`, 50, 110);
    }

    // Invoice title
    doc.fontSize(18).fillColor('#1c1917').text('INVOICE', 400, 50, { align: 'right' });
    doc.fontSize(10).fillColor('#57534e')
      .text(`Invoice #: ${data.invoiceNumber}`, 400, 75, { align: 'right' })
      .text(`Date: ${formatDate(data.date)}`, 400, 90, { align: 'right' })
      .text(`Due: ${formatDate(data.dueDate)}`, 400, 105, { align: 'right' });

    // Divider
    doc.moveTo(50, 135).lineTo(562, 135).strokeColor('#e7e5e4').stroke();

    // Patient info
    doc.fontSize(12).fillColor('#1c1917').text('Bill To:', 50, 150);
    doc.fontSize(10).fillColor('#57534e')
      .text(`${data.patient.firstName} ${data.patient.lastName}`, 50, 168)
      .text(data.patient.address || '', 50, 183)
      .text(`Phone: ${data.patient.phone}`, 50, 198);

    // Items table header
    const tableTop = 240;
    doc.fontSize(9).fillColor('#1c1917');
    doc.rect(50, tableTop, 512, 20).fill('#f5f5f4');
    doc.fillColor('#1c1917')
      .text('CDT Code', 55, tableTop + 5)
      .text('Description', 130, tableTop + 5)
      .text('Tooth', 370, tableTop + 5)
      .text('Fee', 430, tableTop + 5, { width: 127, align: 'right' });

    // Items
    let y = tableTop + 25;
    for (const item of data.treatments) {
      doc.fillColor('#57534e')
        .text(item.cdtCode, 55, y)
        .text(item.description, 130, y, { width: 230 })
        .text(item.toothNumber ? `#${item.toothNumber}` : '-', 370, y)
        .text(formatCurrency(item.fee), 430, y, { width: 127, align: 'right' });
      y += 20;
    }

    // Totals
    y += 10;
    doc.moveTo(350, y).lineTo(562, y).strokeColor('#e7e5e4').stroke();
    y += 10;

    doc.fillColor('#57534e')
      .text('Subtotal:', 350, y).text(formatCurrency(data.subtotal), 430, y, { width: 127, align: 'right' });
    y += 18;

    if (data.discount > 0) {
      doc.text('Discount:', 350, y).text(`-${formatCurrency(data.discount)}`, 430, y, { width: 127, align: 'right' });
      y += 18;
    }

    if (data.taxAmount > 0) {
      doc.text('Tax:', 350, y).text(formatCurrency(data.taxAmount), 430, y, { width: 127, align: 'right' });
      y += 18;
    }

    doc.fontSize(12).fillColor('#1c1917')
      .text('Total:', 350, y).text(formatCurrency(data.total), 430, y, { width: 127, align: 'right' });
    y += 22;

    doc.fontSize(10).fillColor('#57534e')
      .text('Insurance Estimate:', 350, y).text(formatCurrency(data.insurancePortion), 430, y, { width: 127, align: 'right' });
    y += 18;

    doc.fontSize(11).fillColor('#0d9488')
      .text('Patient Responsibility:', 350, y).text(formatCurrency(data.patientPortion), 430, y, { width: 127, align: 'right' });

    // Footer
    doc.fontSize(8).fillColor('#a8a29e')
      .text('Thank you for choosing ' + data.practice.name, 50, 700, { align: 'center' })
      .text('Please remit payment by the due date shown above.', 50, 712, { align: 'center' });

    doc.end();

    stream.on('finish', () => resolve(outputPath));
    stream.on('error', reject);
  });
}

interface TreatmentPlanPDFData {
  practice: { name: string; address: string; phone: string; email: string; npi?: string | null };
  patient: { firstName: string; lastName: string; dateOfBirth: Date; phone: string };
  plan: {
    name: string;
    createdAt: Date;
    items: Array<{
      cdtCode: string;
      description: string;
      toothNumber?: number | null;
      surfaces: string[];
      fee: number;
      insurancePays: number;
      patientPays: number;
      priority: number;
    }>;
    totalFee: number;
    insuranceEst: number;
    patientEst: number;
    notes?: string | null;
  };
  insurance?: { company: string; memberId: string; planName?: string | null } | null;
}

export async function generateTreatmentPlanPDF(data: TreatmentPlanPDFData, outputPath: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const dir = path.dirname(outputPath);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

    const doc = new PDFDocument({ size: 'LETTER', margin: 50 });
    const stream = fs.createWriteStream(outputPath);
    doc.pipe(stream);

    // Header
    doc.fontSize(24).fillColor('#0d9488').text(data.practice.name, 50, 50);
    doc.fontSize(10).fillColor('#57534e')
      .text(data.practice.address, 50, 80)
      .text(`Phone: ${data.practice.phone} | Email: ${data.practice.email}`, 50, 95);

    // Title
    doc.fontSize(18).fillColor('#1c1917').text('Treatment Plan', 400, 50, { align: 'right' });
    doc.fontSize(10).fillColor('#57534e')
      .text(`Date: ${formatDate(data.plan.createdAt)}`, 400, 75, { align: 'right' });

    doc.moveTo(50, 120).lineTo(562, 120).strokeColor('#e7e5e4').stroke();

    // Patient info
    doc.fontSize(12).fillColor('#1c1917').text('Patient Information', 50, 135);
    doc.fontSize(10).fillColor('#57534e')
      .text(`Name: ${data.patient.firstName} ${data.patient.lastName}`, 50, 155)
      .text(`Date of Birth: ${formatDate(data.patient.dateOfBirth)}`, 50, 170)
      .text(`Phone: ${data.patient.phone}`, 50, 185);

    if (data.insurance) {
      doc.text(`Insurance: ${data.insurance.company} (${data.insurance.memberId})`, 300, 155);
      if (data.insurance.planName) doc.text(`Plan: ${data.insurance.planName}`, 300, 170);
    }

    // Plan name
    doc.fontSize(14).fillColor('#1c1917').text(`Plan: ${data.plan.name}`, 50, 210);

    // Group by priority
    const priorities = [
      { label: 'Priority 1 — Urgent', items: data.plan.items.filter(i => i.priority === 1) },
      { label: 'Priority 2 — Recommended', items: data.plan.items.filter(i => i.priority === 2) },
      { label: 'Priority 3 — Elective', items: data.plan.items.filter(i => i.priority === 3) },
    ].filter(g => g.items.length > 0);

    let y = 240;

    for (const group of priorities) {
      // Priority header
      doc.fontSize(11).fillColor('#0d9488').text(group.label, 50, y);
      y += 20;

      // Table header
      doc.fontSize(8).fillColor('#1c1917');
      doc.rect(50, y, 512, 16).fill('#f5f5f4');
      doc.fillColor('#1c1917')
        .text('CDT', 55, y + 4)
        .text('Procedure', 105, y + 4)
        .text('Tooth', 295, y + 4)
        .text('Fee', 340, y + 4, { width: 70, align: 'right' })
        .text('Insurance', 410, y + 4, { width: 70, align: 'right' })
        .text('Your Cost', 480, y + 4, { width: 77, align: 'right' });
      y += 20;

      for (const item of group.items) {
        if (y > 700) { doc.addPage(); y = 50; }
        doc.fontSize(9).fillColor('#57534e')
          .text(item.cdtCode, 55, y)
          .text(item.description, 105, y, { width: 185 })
          .text(item.toothNumber ? `#${item.toothNumber}` : '-', 295, y)
          .text(formatCurrency(item.fee), 340, y, { width: 70, align: 'right' })
          .text(formatCurrency(item.insurancePays), 410, y, { width: 70, align: 'right' })
          .text(formatCurrency(item.patientPays), 480, y, { width: 77, align: 'right' });
        y += 18;
      }

      y += 8;
    }

    // Totals
    y += 5;
    doc.moveTo(340, y).lineTo(562, y).strokeColor('#e7e5e4').stroke();
    y += 10;
    doc.fontSize(10).fillColor('#57534e')
      .text('Total Fees:', 340, y).text(formatCurrency(data.plan.totalFee), 480, y, { width: 77, align: 'right' });
    y += 18;
    doc.text('Est. Insurance:', 340, y).text(formatCurrency(data.plan.insuranceEst), 480, y, { width: 77, align: 'right' });
    y += 18;
    doc.fontSize(12).fillColor('#0d9488')
      .text('Your Estimated Cost:', 340, y).text(formatCurrency(data.plan.patientEst), 480, y, { width: 77, align: 'right' });

    if (data.plan.notes) {
      y += 30;
      doc.fontSize(10).fillColor('#1c1917').text('Notes:', 50, y);
      doc.fontSize(9).fillColor('#57534e').text(data.plan.notes, 50, y + 15, { width: 512 });
    }

    // Signature lines
    y = Math.max(y + 60, 630);
    doc.fontSize(10).fillColor('#1c1917').text('Patient Acceptance', 50, y);
    y += 25;
    doc.moveTo(50, y).lineTo(250, y).strokeColor('#d6d3d1').stroke();
    doc.moveTo(300, y).lineTo(500, y).strokeColor('#d6d3d1').stroke();
    doc.fontSize(8).fillColor('#a8a29e')
      .text('Patient Signature', 50, y + 5)
      .text('Date', 300, y + 5);

    // Disclaimer
    doc.fontSize(7).fillColor('#a8a29e')
      .text('This treatment plan is an estimate based on current conditions. Actual costs may vary. Insurance estimates are not a guarantee of payment.', 50, 720, { align: 'center', width: 512 });

    doc.end();
    stream.on('finish', () => resolve(outputPath));
    stream.on('error', reject);
  });
}
