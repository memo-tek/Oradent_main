import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting seed...');

  // Clean existing data in reverse dependency order
  console.log('Cleaning existing data...');
  await prisma.payment.deleteMany();
  await prisma.insuranceClaim.deleteMany();
  await prisma.treatment.deleteMany();
  await prisma.invoice.deleteMany();
  await prisma.treatmentPlanItem.deleteMany();
  await prisma.treatmentPlan.deleteMany();
  await prisma.clinicalNote.deleteMany();
  await prisma.aIAnalysis.deleteMany();
  await prisma.dentalImage.deleteMany();
  await prisma.perioReading.deleteMany();
  await prisma.toothCondition.deleteMany();
  await prisma.appointment.deleteMany();
  await prisma.insuranceInfo.deleteMany();
  await prisma.medicalHistory.deleteMany();
  await prisma.patient.deleteMany();
  await prisma.feeScheduleItem.deleteMany();
  await prisma.auditLog.deleteMany();
  await prisma.provider.deleteMany();
  await prisma.chair.deleteMany();
  await prisma.practiceSettings.deleteMany();
  await prisma.practice.deleteMany();

  // ─── Practice ───
  console.log('Creating practice...');
  const practice = await prisma.practice.create({
    data: {
      name: 'Bright Smiles Dental',
      address: '123 Dental Lane, Suite 100, Austin, TX 78701',
      phone: '(512) 555-0100',
      email: 'info@brightsmiles.com',
      taxId: '74-1234567',
      npi: '1234567890',
    },
  });

  // ─── Practice Settings ───
  await prisma.practiceSettings.create({
    data: {
      practiceId: practice.id,
      appointmentDuration: 30,
      workingHoursStart: '08:00',
      workingHoursEnd: '17:00',
      workingDays: [1, 2, 3, 4, 5],
      reminderHoursBefore: 24,
      currency: 'USD',
    },
  });

  // ─── Chairs ───
  console.log('Creating chairs...');
  const chairs = await Promise.all(
    ['Chair 1', 'Chair 2', 'Chair 3'].map((name) =>
      prisma.chair.create({
        data: { practiceId: practice.id, name },
      })
    )
  );

  // ─── Providers ───
  console.log('Creating providers...');
  const passwordHash = await bcrypt.hash('password123', 10);

  const drChen = await prisma.provider.create({
    data: {
      practiceId: practice.id,
      email: 'sarah@brightsmiles.com',
      passwordHash,
      name: 'Dr. Sarah Chen',
      title: 'DDS',
      role: 'OWNER',
      npi: '1234567891',
      licenseNumber: 'TX-DDS-45678',
      color: '#6366f1',
    },
  });

  const mariaLopez = await prisma.provider.create({
    data: {
      practiceId: practice.id,
      email: 'maria@brightsmiles.com',
      passwordHash,
      name: 'Maria Lopez',
      title: 'RDH',
      role: 'HYGIENIST',
      licenseNumber: 'TX-RDH-12345',
      color: '#ec4899',
    },
  });

  const jamesWilson = await prisma.provider.create({
    data: {
      practiceId: practice.id,
      email: 'james@brightsmiles.com',
      passwordHash,
      name: 'James Wilson',
      title: '',
      role: 'FRONT_DESK',
      color: '#f59e0b',
    },
  });

  // ─── Fee Schedule from CDT codes ───
  console.log('Loading CDT codes and creating fee schedule...');
  const cdtCodesPath = path.join(__dirname, '..', 'data', 'cdt-codes.json');
  const cdtCodes: Array<{ code: string; description: string; category: string; fee: number }> =
    JSON.parse(fs.readFileSync(cdtCodesPath, 'utf-8'));

  const feeScheduleItems = await Promise.all(
    cdtCodes.map((cdt) =>
      prisma.feeScheduleItem.create({
        data: {
          practiceId: practice.id,
          cdtCode: cdt.code,
          description: cdt.description,
          fee: cdt.fee,
          category: cdt.category,
        },
      })
    )
  );

  // Helper to look up fee by CDT code
  const feeFor = (code: string): number => {
    const item = cdtCodes.find((c) => c.code === code);
    return item?.fee ?? 0;
  };

  const descFor = (code: string): string => {
    const item = cdtCodes.find((c) => c.code === code);
    return item?.description ?? code;
  };

  // ─── Patients ───
  console.log('Creating patients...');

  const patientData = [
    { firstName: 'Robert', lastName: 'Johnson', dob: '1965-03-12', gender: 'male', phone: '(512) 555-0201', email: 'rjohnson@email.com', address: '456 Oak St', city: 'Austin', state: 'TX', zip: '78702' },
    { firstName: 'Emily', lastName: 'Martinez', dob: '1990-07-24', gender: 'female', phone: '(512) 555-0202', email: 'emartinez@email.com', address: '789 Elm Ave', city: 'Austin', state: 'TX', zip: '78703' },
    { firstName: 'David', lastName: 'Williams', dob: '1978-11-05', gender: 'male', phone: '(512) 555-0203', email: 'dwilliams@email.com', address: '321 Pine Rd', city: 'Austin', state: 'TX', zip: '78704' },
    { firstName: 'Aisha', lastName: 'Patel', dob: '1985-02-18', gender: 'female', phone: '(512) 555-0204', email: 'apatel@email.com', address: '654 Cedar Ln', city: 'Round Rock', state: 'TX', zip: '78664' },
    { firstName: 'Michael', lastName: 'Thompson', dob: '1952-09-30', gender: 'male', phone: '(512) 555-0205', email: 'mthompson@email.com', address: '987 Birch Dr', city: 'Austin', state: 'TX', zip: '78705' },
    { firstName: 'Sofia', lastName: 'Rodriguez', dob: '2016-04-15', gender: 'female', phone: '(512) 555-0206', email: null, address: '147 Maple Ct', city: 'Austin', state: 'TX', zip: '78745' },
    { firstName: 'James', lastName: 'Kim', dob: '1988-12-01', gender: 'male', phone: '(512) 555-0207', email: 'jkim@email.com', address: '258 Walnut St', city: 'Pflugerville', state: 'TX', zip: '78660' },
    { firstName: 'Lisa', lastName: 'Nguyen', dob: '1975-06-22', gender: 'female', phone: '(512) 555-0208', email: 'lnguyen@email.com', address: '369 Spruce Ave', city: 'Austin', state: 'TX', zip: '78731' },
    { firstName: 'Carlos', lastName: 'Garcia', dob: '1995-01-09', gender: 'male', phone: '(512) 555-0209', email: 'cgarcia@email.com', address: '741 Ash Blvd', city: 'Austin', state: 'TX', zip: '78748' },
    { firstName: 'Rachel', lastName: 'Brown', dob: '1962-08-14', gender: 'female', phone: '(512) 555-0210', email: 'rbrown@email.com', address: '852 Hickory Way', city: 'Cedar Park', state: 'TX', zip: '78613' },
    { firstName: 'Tyler', lastName: 'Davis', dob: '2000-05-27', gender: 'male', phone: '(512) 555-0211', email: 'tdavis@email.com', address: '963 Poplar St', city: 'Austin', state: 'TX', zip: '78723' },
    { firstName: 'Hannah', lastName: 'Lee', dob: '1983-10-03', gender: 'female', phone: '(512) 555-0212', email: 'hlee@email.com', address: '159 Willow Ln', city: 'Austin', state: 'TX', zip: '78741' },
    { firstName: 'Omar', lastName: 'Hassan', dob: '1970-04-19', gender: 'male', phone: '(512) 555-0213', email: 'ohassan@email.com', address: '267 Chestnut Dr', city: 'Austin', state: 'TX', zip: '78729' },
    { firstName: 'Priya', lastName: 'Sharma', dob: '1998-09-11', gender: 'female', phone: '(512) 555-0214', email: 'psharma@email.com', address: '378 Magnolia Ave', city: 'Georgetown', state: 'TX', zip: '78626' },
    { firstName: 'William', lastName: 'O\'Brien', dob: '1955-12-25', gender: 'male', phone: '(512) 555-0215', email: 'wobrien@email.com', address: '489 Sycamore Rd', city: 'Austin', state: 'TX', zip: '78757' },
  ];

  const patients = await Promise.all(
    patientData.map((p) =>
      prisma.patient.create({
        data: {
          practiceId: practice.id,
          firstName: p.firstName,
          lastName: p.lastName,
          dateOfBirth: new Date(p.dob),
          gender: p.gender,
          phone: p.phone,
          email: p.email,
          address: p.address,
          city: p.city,
          state: p.state,
          zipCode: p.zip,
          status: 'ACTIVE',
        },
      })
    )
  );

  // ─── Medical Histories (for some patients) ───
  console.log('Creating medical histories...');

  // Robert Johnson - hypertension, takes lisinopril
  await prisma.medicalHistory.create({
    data: {
      patientId: patients[0].id,
      allergies: JSON.parse('["Penicillin"]'),
      medications: JSON.parse('["Lisinopril 10mg daily", "Aspirin 81mg daily"]'),
      conditions: JSON.parse('["Hypertension", "High cholesterol"]'),
      smokingStatus: 'former',
      alcoholUse: 'moderate',
    },
  });

  // Emily Martinez - healthy
  await prisma.medicalHistory.create({
    data: {
      patientId: patients[1].id,
      allergies: JSON.parse('[]'),
      medications: JSON.parse('["Birth control"]'),
      conditions: JSON.parse('[]'),
      smokingStatus: 'never',
      alcoholUse: 'social',
    },
  });

  // David Williams - diabetes
  await prisma.medicalHistory.create({
    data: {
      patientId: patients[2].id,
      allergies: JSON.parse('["Sulfa drugs", "Latex"]'),
      medications: JSON.parse('["Metformin 500mg twice daily", "Atorvastatin 20mg daily"]'),
      conditions: JSON.parse('["Type 2 Diabetes", "Obesity"]'),
      smokingStatus: 'never',
      alcoholUse: 'none',
    },
  });

  // Aisha Patel - healthy, pregnant
  await prisma.medicalHistory.create({
    data: {
      patientId: patients[3].id,
      allergies: JSON.parse('["Codeine"]'),
      medications: JSON.parse('["Prenatal vitamins"]'),
      conditions: JSON.parse('[]'),
      isPregnant: true,
      smokingStatus: 'never',
      alcoholUse: 'none',
    },
  });

  // Michael Thompson - elderly, multiple conditions
  await prisma.medicalHistory.create({
    data: {
      patientId: patients[4].id,
      allergies: JSON.parse('["Ibuprofen", "Erythromycin"]'),
      medications: JSON.parse('["Warfarin 5mg daily", "Metoprolol 50mg daily", "Omeprazole 20mg daily"]'),
      conditions: JSON.parse('["Atrial fibrillation", "GERD", "Osteoarthritis"]'),
      bloodType: 'A+',
      smokingStatus: 'former',
      alcoholUse: 'none',
      previousSurgeries: JSON.parse('["Knee replacement 2018", "Appendectomy 1985"]'),
    },
  });

  // Lisa Nguyen - asthma
  await prisma.medicalHistory.create({
    data: {
      patientId: patients[7].id,
      allergies: JSON.parse('["Amoxicillin"]'),
      medications: JSON.parse('["Albuterol inhaler as needed", "Fluticasone inhaler daily"]'),
      conditions: JSON.parse('["Asthma"]'),
      smokingStatus: 'never',
      alcoholUse: 'social',
    },
  });

  // Omar Hassan - heart condition
  await prisma.medicalHistory.create({
    data: {
      patientId: patients[12].id,
      allergies: JSON.parse('[]'),
      medications: JSON.parse('["Enalapril 10mg daily", "Simvastatin 40mg daily"]'),
      conditions: JSON.parse('["Coronary artery disease", "Hypertension"]'),
      smokingStatus: 'current',
      alcoholUse: 'none',
    },
  });

  // William O'Brien - elderly
  await prisma.medicalHistory.create({
    data: {
      patientId: patients[14].id,
      allergies: JSON.parse('["Aspirin", "NSAIDs"]'),
      medications: JSON.parse('["Amlodipine 5mg daily", "Donepezil 10mg daily", "Vitamin D 1000IU daily"]'),
      conditions: JSON.parse('["Mild cognitive impairment", "Hypertension", "Osteoporosis"]'),
      bloodType: 'O+',
      smokingStatus: 'never',
      alcoholUse: 'none',
      previousSurgeries: JSON.parse('["Hip replacement 2020"]'),
    },
  });

  // ─── Insurance (for ~10 patients) ───
  console.log('Creating insurance records...');

  const insuranceData = [
    { patientIdx: 0, company: 'Delta Dental', plan: 'PPO Premier', group: 'GRP-10045', member: 'DDL-789012', annualMax: 2000, remaining: 1450, deductible: 50, deductibleMet: 50 },
    { patientIdx: 1, company: 'Cigna Dental', plan: 'DHMO', group: 'GRP-20078', member: 'CIG-345678', annualMax: 1500, remaining: 1200, deductible: 25, deductibleMet: 25 },
    { patientIdx: 2, company: 'MetLife Dental', plan: 'PDP Plus', group: 'GRP-30012', member: 'MET-567890', annualMax: 2500, remaining: 1800, deductible: 50, deductibleMet: 50 },
    { patientIdx: 3, company: 'Aetna Dental', plan: 'DMO', group: 'GRP-40099', member: 'AET-123456', annualMax: 1500, remaining: 1500, deductible: 0, deductibleMet: 0 },
    { patientIdx: 4, company: 'United Concordia', plan: 'Alliance', group: 'GRP-50034', member: 'UCO-234567', annualMax: 2000, remaining: 600, deductible: 75, deductibleMet: 75 },
    { patientIdx: 5, company: 'Delta Dental', plan: 'PPO', group: 'GRP-10045', member: 'DDL-789013', annualMax: 2000, remaining: 2000, deductible: 50, deductibleMet: 0 },
    { patientIdx: 7, company: 'Guardian Dental', plan: 'DentalGuard Preferred', group: 'GRP-60021', member: 'GRD-456789', annualMax: 1750, remaining: 1100, deductible: 50, deductibleMet: 50 },
    { patientIdx: 9, company: 'Humana Dental', plan: 'Loyalty Plus', group: 'GRP-70088', member: 'HUM-678901', annualMax: 2000, remaining: 950, deductible: 50, deductibleMet: 50 },
    { patientIdx: 11, company: 'Cigna Dental', plan: 'PPO', group: 'GRP-20055', member: 'CIG-890123', annualMax: 2000, remaining: 1700, deductible: 50, deductibleMet: 50 },
    { patientIdx: 13, company: 'Blue Cross Dental', plan: 'Blue Dental Choice', group: 'GRP-80011', member: 'BCD-012345', annualMax: 1500, remaining: 1400, deductible: 25, deductibleMet: 25 },
  ];

  for (const ins of insuranceData) {
    await prisma.insuranceInfo.create({
      data: {
        patientPrimaryId: patients[ins.patientIdx].id,
        company: ins.company,
        planName: ins.plan,
        groupNumber: ins.group,
        memberId: ins.member,
        subscriberName: `${patientData[ins.patientIdx].firstName} ${patientData[ins.patientIdx].lastName}`,
        relationship: 'self',
        effectiveDate: new Date('2024-01-01'),
        annualMax: ins.annualMax,
        remainingBenefit: ins.remaining,
        deductible: ins.deductible,
        deductibleMet: ins.deductibleMet,
        coveragePercent: { preventive: 100, basic: 80, major: 50, orthodontic: 50 },
        verifiedAt: new Date('2024-01-15'),
      },
    });
  }

  // ─── Dental Chart Conditions (~10 patients) ───
  console.log('Creating dental chart conditions...');

  // Robert Johnson - #14 MOD amalgam, #19 crown, #30 cavity
  await prisma.toothCondition.createMany({
    data: [
      { patientId: patients[0].id, toothNumber: 14, conditions: [{ type: 'filling', material: 'amalgam', surfaces: ['M', 'O', 'D'], date: '2023-03-15' }], status: 'PRESENT' },
      { patientId: patients[0].id, toothNumber: 19, conditions: [{ type: 'crown', material: 'PFM', date: '2022-08-10' }], status: 'PRESENT' },
      { patientId: patients[0].id, toothNumber: 30, conditions: [{ type: 'caries', surfaces: ['O'], severity: 'moderate' }], status: 'PRESENT' },
      { patientId: patients[0].id, toothNumber: 1, conditions: [], status: 'MISSING' },
    ],
  });

  // Emily Martinez - #3 composite filling, #12 sealant
  await prisma.toothCondition.createMany({
    data: [
      { patientId: patients[1].id, toothNumber: 3, conditions: [{ type: 'filling', material: 'composite', surfaces: ['O'], date: '2024-01-20' }], status: 'PRESENT' },
      { patientId: patients[1].id, toothNumber: 12, conditions: [{ type: 'sealant', date: '2023-06-10' }], status: 'PRESENT' },
    ],
  });

  // David Williams - multiple issues: #18 root canal + crown, #15 cavity, #31 large filling
  await prisma.toothCondition.createMany({
    data: [
      { patientId: patients[2].id, toothNumber: 18, conditions: [{ type: 'root_canal', date: '2023-05-20' }, { type: 'crown', material: 'ceramic', date: '2023-06-05' }], status: 'PRESENT' },
      { patientId: patients[2].id, toothNumber: 15, conditions: [{ type: 'caries', surfaces: ['M', 'O'], severity: 'moderate' }], status: 'PRESENT' },
      { patientId: patients[2].id, toothNumber: 31, conditions: [{ type: 'filling', material: 'amalgam', surfaces: ['M', 'O', 'D', 'B'], date: '2021-11-08' }], status: 'PRESENT' },
      { patientId: patients[2].id, toothNumber: 16, conditions: [], status: 'MISSING' },
      { patientId: patients[2].id, toothNumber: 17, conditions: [], status: 'MISSING' },
    ],
  });

  // Michael Thompson - many restorations, missing teeth
  await prisma.toothCondition.createMany({
    data: [
      { patientId: patients[4].id, toothNumber: 2, conditions: [{ type: 'crown', material: 'gold', date: '2015-02-20' }], status: 'PRESENT' },
      { patientId: patients[4].id, toothNumber: 3, conditions: [{ type: 'crown', material: 'PFM', date: '2018-07-12' }], status: 'PRESENT' },
      { patientId: patients[4].id, toothNumber: 14, conditions: [{ type: 'root_canal', date: '2019-09-05' }, { type: 'crown', material: 'PFM', date: '2019-10-01' }], status: 'PRESENT' },
      { patientId: patients[4].id, toothNumber: 18, conditions: [], status: 'MISSING' },
      { patientId: patients[4].id, toothNumber: 19, conditions: [], status: 'MISSING' },
      { patientId: patients[4].id, toothNumber: 30, conditions: [{ type: 'filling', material: 'amalgam', surfaces: ['O', 'D'], date: '2016-03-18' }], status: 'PRESENT' },
      { patientId: patients[4].id, toothNumber: 31, conditions: [], status: 'MISSING' },
    ],
  });

  // James Kim - #29 cavity
  await prisma.toothCondition.createMany({
    data: [
      { patientId: patients[6].id, toothNumber: 29, conditions: [{ type: 'caries', surfaces: ['O'], severity: 'mild' }], status: 'PRESENT' },
    ],
  });

  // Lisa Nguyen - #8 crown (front tooth), #9 veneer, #19 filling
  await prisma.toothCondition.createMany({
    data: [
      { patientId: patients[7].id, toothNumber: 8, conditions: [{ type: 'crown', material: 'ceramic', date: '2022-04-15' }], status: 'PRESENT' },
      { patientId: patients[7].id, toothNumber: 19, conditions: [{ type: 'filling', material: 'composite', surfaces: ['M', 'O'], date: '2023-09-20' }], status: 'PRESENT' },
    ],
  });

  // Carlos Garcia - #17 impacted wisdom tooth, #32 impacted
  await prisma.toothCondition.createMany({
    data: [
      { patientId: patients[8].id, toothNumber: 17, conditions: [{ type: 'impacted' }], status: 'IMPACTED' },
      { patientId: patients[8].id, toothNumber: 32, conditions: [{ type: 'impacted' }], status: 'IMPACTED' },
    ],
  });

  // Rachel Brown - multiple fillings, perio issues
  await prisma.toothCondition.createMany({
    data: [
      { patientId: patients[9].id, toothNumber: 3, conditions: [{ type: 'filling', material: 'composite', surfaces: ['O', 'D'], date: '2022-05-10' }], status: 'PRESENT' },
      { patientId: patients[9].id, toothNumber: 14, conditions: [{ type: 'filling', material: 'amalgam', surfaces: ['M', 'O'], date: '2020-03-15' }], status: 'PRESENT' },
      { patientId: patients[9].id, toothNumber: 19, conditions: [{ type: 'crown', material: 'PFM', date: '2021-11-20' }], status: 'PRESENT' },
      { patientId: patients[9].id, toothNumber: 30, conditions: [{ type: 'caries', surfaces: ['D'], severity: 'mild' }], status: 'PRESENT' },
    ],
  });

  // Omar Hassan - #5 root canal needed, #12 filling
  await prisma.toothCondition.createMany({
    data: [
      { patientId: patients[12].id, toothNumber: 5, conditions: [{ type: 'caries', surfaces: ['M', 'O', 'D'], severity: 'severe' }, { type: 'pulpitis' }], status: 'PRESENT' },
      { patientId: patients[12].id, toothNumber: 12, conditions: [{ type: 'filling', material: 'composite', surfaces: ['O'], date: '2023-01-15' }], status: 'PRESENT' },
    ],
  });

  // William O'Brien - implant, denture, multiple missing
  await prisma.toothCondition.createMany({
    data: [
      { patientId: patients[14].id, toothNumber: 8, conditions: [{ type: 'implant', date: '2021-06-15' }, { type: 'crown', material: 'ceramic', date: '2021-10-20' }], status: 'IMPLANT' },
      { patientId: patients[14].id, toothNumber: 9, conditions: [], status: 'MISSING' },
      { patientId: patients[14].id, toothNumber: 18, conditions: [], status: 'MISSING' },
      { patientId: patients[14].id, toothNumber: 19, conditions: [], status: 'MISSING' },
      { patientId: patients[14].id, toothNumber: 30, conditions: [{ type: 'filling', material: 'amalgam', surfaces: ['O', 'D', 'B'], date: '2010-05-10' }], status: 'PRESENT' },
      { patientId: patients[14].id, toothNumber: 31, conditions: [], status: 'MISSING' },
    ],
  });

  // ─── Past Treatments ───
  console.log('Creating past treatments...');

  // Robert Johnson - crown on #19 (2022), filling #14 (2023)
  await prisma.treatment.create({
    data: {
      patientId: patients[0].id,
      providerId: drChen.id,
      date: new Date('2022-08-10'),
      toothNumber: 19,
      surfaces: [],
      cdtCode: 'D2750',
      description: descFor('D2750'),
      diagnosisCodes: ['K02.52'],
      fee: feeFor('D2750'),
      status: 'completed',
    },
  });

  await prisma.treatment.create({
    data: {
      patientId: patients[0].id,
      providerId: drChen.id,
      date: new Date('2023-03-15'),
      toothNumber: 14,
      surfaces: ['M', 'O', 'D'],
      cdtCode: 'D2150',
      description: descFor('D2150'),
      diagnosisCodes: ['K02.52'],
      fee: feeFor('D2150'),
      status: 'completed',
    },
  });

  // Emily Martinez - cleaning (2024), filling #3 (2024)
  await prisma.treatment.create({
    data: {
      patientId: patients[1].id,
      providerId: mariaLopez.id,
      date: new Date('2024-01-20'),
      toothNumber: null,
      surfaces: [],
      cdtCode: 'D1110',
      description: descFor('D1110'),
      diagnosisCodes: ['Z01.20'],
      fee: feeFor('D1110'),
      status: 'completed',
    },
  });

  await prisma.treatment.create({
    data: {
      patientId: patients[1].id,
      providerId: drChen.id,
      date: new Date('2024-01-20'),
      toothNumber: 3,
      surfaces: ['O'],
      cdtCode: 'D2391',
      description: descFor('D2391'),
      diagnosisCodes: ['K02.51'],
      fee: feeFor('D2391'),
      status: 'completed',
    },
  });

  // David Williams - root canal + crown #18 (2023)
  await prisma.treatment.create({
    data: {
      patientId: patients[2].id,
      providerId: drChen.id,
      date: new Date('2023-05-20'),
      toothNumber: 18,
      surfaces: [],
      cdtCode: 'D3330',
      description: descFor('D3330'),
      diagnosisCodes: ['K04.02'],
      fee: feeFor('D3330'),
      status: 'completed',
    },
  });

  await prisma.treatment.create({
    data: {
      patientId: patients[2].id,
      providerId: drChen.id,
      date: new Date('2023-06-05'),
      toothNumber: 18,
      surfaces: [],
      cdtCode: 'D2740',
      description: descFor('D2740'),
      diagnosisCodes: ['K02.53'],
      fee: feeFor('D2740'),
      status: 'completed',
    },
  });

  // Michael Thompson - cleaning (2024)
  await prisma.treatment.create({
    data: {
      patientId: patients[4].id,
      providerId: mariaLopez.id,
      date: new Date('2024-06-15'),
      toothNumber: null,
      surfaces: [],
      cdtCode: 'D1110',
      description: descFor('D1110'),
      diagnosisCodes: ['Z01.21'],
      fee: feeFor('D1110'),
      status: 'completed',
    },
  });

  // Lisa Nguyen - crown #8, filling #19
  await prisma.treatment.create({
    data: {
      patientId: patients[7].id,
      providerId: drChen.id,
      date: new Date('2022-04-15'),
      toothNumber: 8,
      surfaces: [],
      cdtCode: 'D2740',
      description: descFor('D2740'),
      diagnosisCodes: ['K03.81'],
      fee: feeFor('D2740'),
      status: 'completed',
    },
  });

  await prisma.treatment.create({
    data: {
      patientId: patients[7].id,
      providerId: drChen.id,
      date: new Date('2023-09-20'),
      toothNumber: 19,
      surfaces: ['M', 'O'],
      cdtCode: 'D2392',
      description: descFor('D2392'),
      diagnosisCodes: ['K02.52'],
      fee: feeFor('D2392'),
      status: 'completed',
    },
  });

  // Rachel Brown - SRP (2024), maintenance (2024)
  await prisma.treatment.create({
    data: {
      patientId: patients[9].id,
      providerId: mariaLopez.id,
      date: new Date('2024-02-10'),
      toothNumber: null,
      surfaces: [],
      cdtCode: 'D4341',
      description: descFor('D4341'),
      diagnosisCodes: ['K05.312'],
      fee: feeFor('D4341'),
      notes: 'UR and LR quadrants',
      status: 'completed',
    },
  });

  await prisma.treatment.create({
    data: {
      patientId: patients[9].id,
      providerId: mariaLopez.id,
      date: new Date('2024-05-15'),
      toothNumber: null,
      surfaces: [],
      cdtCode: 'D4910',
      description: descFor('D4910'),
      diagnosisCodes: ['K05.312'],
      fee: feeFor('D4910'),
      status: 'completed',
    },
  });

  // William O'Brien - implant placement (2021)
  await prisma.treatment.create({
    data: {
      patientId: patients[14].id,
      providerId: drChen.id,
      date: new Date('2021-06-15'),
      toothNumber: 8,
      surfaces: [],
      cdtCode: 'D6010',
      description: descFor('D6010'),
      diagnosisCodes: ['K08.109'],
      fee: feeFor('D6010'),
      status: 'completed',
    },
  });

  await prisma.treatment.create({
    data: {
      patientId: patients[14].id,
      providerId: drChen.id,
      date: new Date('2021-10-20'),
      toothNumber: 8,
      surfaces: [],
      cdtCode: 'D6065',
      description: descFor('D6065'),
      diagnosisCodes: ['K08.109'],
      fee: feeFor('D6065'),
      status: 'completed',
    },
  });

  // ─── Appointments (past and future) ───
  console.log('Creating appointments...');

  // Past appointments
  const pastAppointments = [
    { patientIdx: 0, providerId: drChen.id, chairIdx: 0, start: '2024-09-15T09:00:00', duration: 60, type: 'EXAM' as const, status: 'COMPLETED' as const, reason: 'Annual exam and X-rays', procedures: ['D0120', 'D0274'] },
    { patientIdx: 1, providerId: mariaLopez.id, chairIdx: 1, start: '2024-10-02T10:00:00', duration: 60, type: 'CLEANING' as const, status: 'COMPLETED' as const, reason: 'Regular cleaning', procedures: ['D1110', 'D0120'] },
    { patientIdx: 2, providerId: drChen.id, chairIdx: 0, start: '2024-10-10T14:00:00', duration: 90, type: 'FILLING' as const, status: 'COMPLETED' as const, reason: 'Filling tooth #15', procedures: ['D2392'] },
    { patientIdx: 4, providerId: mariaLopez.id, chairIdx: 1, start: '2024-11-05T08:30:00', duration: 60, type: 'CLEANING' as const, status: 'COMPLETED' as const, reason: 'Perio maintenance', procedures: ['D4910'] },
    { patientIdx: 7, providerId: drChen.id, chairIdx: 0, start: '2024-11-20T11:00:00', duration: 30, type: 'EXAM' as const, status: 'COMPLETED' as const, reason: 'Check on crown #8', procedures: ['D0120'] },
    { patientIdx: 9, providerId: mariaLopez.id, chairIdx: 1, start: '2024-12-03T09:00:00', duration: 60, type: 'CLEANING' as const, status: 'COMPLETED' as const, reason: 'Perio maintenance', procedures: ['D4910'] },
    { patientIdx: 3, providerId: drChen.id, chairIdx: 0, start: '2025-01-08T10:00:00', duration: 60, type: 'EXAM' as const, status: 'COMPLETED' as const, reason: 'Comprehensive exam', procedures: ['D0150', 'D0210'] },
    { patientIdx: 12, providerId: drChen.id, chairIdx: 0, start: '2025-01-22T13:00:00', duration: 30, type: 'EMERGENCY' as const, status: 'COMPLETED' as const, reason: 'Tooth pain #5', procedures: ['D9110', 'D0220'] },
  ];

  for (const appt of pastAppointments) {
    const startTime = new Date(appt.start);
    const endTime = new Date(startTime.getTime() + appt.duration * 60000);
    await prisma.appointment.create({
      data: {
        patientId: patients[appt.patientIdx].id,
        providerId: appt.providerId,
        chairId: chairs[appt.chairIdx].id,
        startTime,
        endTime,
        duration: appt.duration,
        type: appt.type,
        status: appt.status,
        reason: appt.reason,
        procedures: appt.procedures,
        completedAt: startTime,
        confirmedAt: new Date(startTime.getTime() - 86400000),
        checkedInAt: startTime,
      },
    });
  }

  // Future / upcoming appointments
  const futureAppointments = [
    { patientIdx: 0, providerId: drChen.id, chairIdx: 0, start: '2025-03-15T09:00:00', duration: 60, type: 'FILLING' as const, status: 'SCHEDULED' as const, reason: 'Filling tooth #30', procedures: ['D2391'] },
    { patientIdx: 1, providerId: mariaLopez.id, chairIdx: 1, start: '2025-03-18T10:00:00', duration: 60, type: 'CLEANING' as const, status: 'CONFIRMED' as const, reason: '6-month cleaning', procedures: ['D1110', 'D0120'] },
    { patientIdx: 5, providerId: mariaLopez.id, chairIdx: 1, start: '2025-03-20T14:00:00', duration: 45, type: 'CLEANING' as const, status: 'SCHEDULED' as const, reason: 'Child cleaning and fluoride', procedures: ['D1120', 'D1206'] },
    { patientIdx: 6, providerId: drChen.id, chairIdx: 0, start: '2025-03-22T11:00:00', duration: 60, type: 'FILLING' as const, status: 'SCHEDULED' as const, reason: 'Filling tooth #29', procedures: ['D2391'] },
    { patientIdx: 8, providerId: drChen.id, chairIdx: 0, start: '2025-04-02T08:00:00', duration: 90, type: 'EXTRACTION' as const, status: 'SCHEDULED' as const, reason: 'Wisdom teeth extraction', procedures: ['D7240', 'D7241'] },
    { patientIdx: 9, providerId: mariaLopez.id, chairIdx: 1, start: '2025-04-05T09:00:00', duration: 60, type: 'CLEANING' as const, status: 'SCHEDULED' as const, reason: 'Perio maintenance', procedures: ['D4910'] },
    { patientIdx: 12, providerId: drChen.id, chairIdx: 0, start: '2025-04-10T13:00:00', duration: 120, type: 'ROOT_CANAL' as const, status: 'SCHEDULED' as const, reason: 'Root canal tooth #5', procedures: ['D3310'] },
    { patientIdx: 11, providerId: drChen.id, chairIdx: 0, start: '2025-04-15T10:00:00', duration: 60, type: 'EXAM' as const, status: 'SCHEDULED' as const, reason: 'New patient comprehensive exam', procedures: ['D0150', 'D0210'] },
    { patientIdx: 13, providerId: mariaLopez.id, chairIdx: 1, start: '2025-04-18T14:00:00', duration: 60, type: 'CLEANING' as const, status: 'SCHEDULED' as const, reason: 'Regular cleaning', procedures: ['D1110', 'D0120'] },
  ];

  for (const appt of futureAppointments) {
    const startTime = new Date(appt.start);
    const endTime = new Date(startTime.getTime() + appt.duration * 60000);
    await prisma.appointment.create({
      data: {
        patientId: patients[appt.patientIdx].id,
        providerId: appt.providerId,
        chairId: chairs[appt.chairIdx].id,
        startTime,
        endTime,
        duration: appt.duration,
        type: appt.type,
        status: appt.status,
        reason: appt.reason,
        procedures: appt.procedures,
        confirmedAt: appt.status === 'CONFIRMED' ? new Date('2025-03-16') : undefined,
      },
    });
  }

  // Update lastVisit / nextAppointment on patients
  await prisma.patient.update({ where: { id: patients[0].id }, data: { lastVisit: new Date('2024-09-15'), nextAppointment: new Date('2025-03-15') } });
  await prisma.patient.update({ where: { id: patients[1].id }, data: { lastVisit: new Date('2024-10-02'), nextAppointment: new Date('2025-03-18') } });
  await prisma.patient.update({ where: { id: patients[2].id }, data: { lastVisit: new Date('2024-10-10') } });
  await prisma.patient.update({ where: { id: patients[3].id }, data: { lastVisit: new Date('2025-01-08') } });
  await prisma.patient.update({ where: { id: patients[4].id }, data: { lastVisit: new Date('2024-11-05') } });
  await prisma.patient.update({ where: { id: patients[5].id }, data: { nextAppointment: new Date('2025-03-20') } });
  await prisma.patient.update({ where: { id: patients[6].id }, data: { nextAppointment: new Date('2025-03-22') } });
  await prisma.patient.update({ where: { id: patients[7].id }, data: { lastVisit: new Date('2024-11-20') } });
  await prisma.patient.update({ where: { id: patients[8].id }, data: { nextAppointment: new Date('2025-04-02') } });
  await prisma.patient.update({ where: { id: patients[9].id }, data: { lastVisit: new Date('2024-12-03'), nextAppointment: new Date('2025-04-05') } });
  await prisma.patient.update({ where: { id: patients[12].id }, data: { lastVisit: new Date('2025-01-22'), nextAppointment: new Date('2025-04-10') } });

  // ─── Invoices and Payments ───
  console.log('Creating invoices and payments...');

  // Invoice 1: Robert Johnson - crown #19 (paid)
  const invoice1 = await prisma.invoice.create({
    data: {
      patientId: patients[0].id,
      invoiceNumber: 'INV-2022-001',
      date: new Date('2022-08-10'),
      dueDate: new Date('2022-09-10'),
      subtotal: 1100,
      total: 1100,
      insurancePortion: 550,
      patientPortion: 550,
      status: 'PAID',
    },
  });

  await prisma.payment.create({
    data: {
      invoiceId: invoice1.id,
      amount: 550,
      method: 'INSURANCE',
      reference: 'CLM-DDL-20220810',
      date: new Date('2022-09-15'),
    },
  });

  await prisma.payment.create({
    data: {
      invoiceId: invoice1.id,
      amount: 550,
      method: 'CREDIT_CARD',
      reference: 'CC-****4521',
      date: new Date('2022-08-10'),
    },
  });

  // Invoice 2: David Williams - root canal + crown (partially paid)
  const invoice2 = await prisma.invoice.create({
    data: {
      patientId: patients[2].id,
      invoiceNumber: 'INV-2023-015',
      date: new Date('2023-06-05'),
      dueDate: new Date('2023-07-05'),
      subtotal: 2350,
      total: 2350,
      insurancePortion: 1175,
      patientPortion: 1175,
      status: 'PARTIALLY_PAID',
      notes: 'Payment plan: $200/month',
    },
  });

  await prisma.payment.create({
    data: {
      invoiceId: invoice2.id,
      amount: 1175,
      method: 'INSURANCE',
      reference: 'CLM-MET-20230605',
      date: new Date('2023-07-20'),
    },
  });

  await prisma.payment.create({
    data: {
      invoiceId: invoice2.id,
      amount: 800,
      method: 'CREDIT_CARD',
      reference: 'CC-****8834',
      date: new Date('2023-06-05'),
      notes: 'First payment of plan',
    },
  });

  // Invoice 3: Lisa Nguyen - crown #8 (paid)
  const invoice3 = await prisma.invoice.create({
    data: {
      patientId: patients[7].id,
      invoiceNumber: 'INV-2022-008',
      date: new Date('2022-04-15'),
      dueDate: new Date('2022-05-15'),
      subtotal: 1200,
      total: 1200,
      insurancePortion: 600,
      patientPortion: 600,
      status: 'PAID',
    },
  });

  await prisma.payment.create({
    data: {
      invoiceId: invoice3.id,
      amount: 600,
      method: 'INSURANCE',
      reference: 'CLM-GRD-20220415',
      date: new Date('2022-05-20'),
    },
  });

  await prisma.payment.create({
    data: {
      invoiceId: invoice3.id,
      amount: 600,
      method: 'DEBIT_CARD',
      reference: 'DC-****2219',
      date: new Date('2022-04-15'),
    },
  });

  // Invoice 4: Rachel Brown - SRP (pending insurance)
  const invoice4 = await prisma.invoice.create({
    data: {
      patientId: patients[9].id,
      invoiceNumber: 'INV-2024-003',
      date: new Date('2024-02-10'),
      dueDate: new Date('2024-03-10'),
      subtotal: 240,
      total: 240,
      insurancePortion: 192,
      patientPortion: 48,
      status: 'PAID',
    },
  });

  await prisma.payment.create({
    data: {
      invoiceId: invoice4.id,
      amount: 192,
      method: 'INSURANCE',
      reference: 'CLM-HUM-20240210',
      date: new Date('2024-03-15'),
    },
  });

  await prisma.payment.create({
    data: {
      invoiceId: invoice4.id,
      amount: 48,
      method: 'CASH',
      date: new Date('2024-02-10'),
    },
  });

  // Invoice 5: William O'Brien - implant (paid)
  const invoice5 = await prisma.invoice.create({
    data: {
      patientId: patients[14].id,
      invoiceNumber: 'INV-2021-022',
      date: new Date('2021-10-20'),
      dueDate: new Date('2021-11-20'),
      subtotal: 3750,
      total: 3750,
      insurancePortion: 0,
      patientPortion: 3750,
      status: 'PAID',
      notes: 'No insurance coverage for implant',
    },
  });

  await prisma.payment.create({
    data: {
      invoiceId: invoice5.id,
      amount: 3750,
      method: 'FINANCING',
      reference: 'CARECREDIT-OB-2021',
      date: new Date('2021-10-20'),
      notes: 'CareCredit 18-month plan',
    },
  });

  // ─── Clinical Notes ───
  console.log('Creating clinical notes...');

  // Robert Johnson - exam note
  await prisma.clinicalNote.create({
    data: {
      patientId: patients[0].id,
      providerId: drChen.id,
      date: new Date('2024-09-15'),
      type: 'progress',
      subjective: 'Patient presents for routine exam. No complaints. Reports occasional sensitivity to cold on lower right side.',
      objective: 'Exam reveals moderate caries on #30 occlusal surface. All existing restorations intact. Soft tissue WNL. Oral hygiene fair - moderate plaque accumulation on lingual of lower anteriors.',
      assessment: 'Dental caries #30 (K02.52). Existing restorations stable. Periodontal health adequate.',
      plan: 'Schedule filling for #30 (D2391). Reinforce home care instructions. Return in 6 months for cleaning and exam.',
      vitals: { bp: '132/84', pulse: 72 },
      signedAt: new Date('2024-09-15'),
    },
  });

  // Emily Martinez - cleaning note
  await prisma.clinicalNote.create({
    data: {
      patientId: patients[1].id,
      providerId: mariaLopez.id,
      date: new Date('2024-10-02'),
      type: 'progress',
      subjective: 'Patient here for 6-month cleaning. No concerns or complaints.',
      objective: 'Light calculus removed from lower anteriors. Minimal plaque. All restorations intact. Probing depths 1-3mm throughout. No BOP.',
      assessment: 'Good oral health. No new pathology (Z01.20).',
      plan: 'Continue current home care routine. Schedule next cleaning in 6 months.',
      signedAt: new Date('2024-10-02'),
    },
  });

  // David Williams - filling note
  await prisma.clinicalNote.create({
    data: {
      patientId: patients[2].id,
      providerId: drChen.id,
      date: new Date('2024-10-10'),
      type: 'progress',
      subjective: 'Patient presents for scheduled filling on tooth #15. Blood sugar checked prior - 142 mg/dL (acceptable for treatment). Reports no recent hypoglycemic episodes.',
      objective: 'Administered 1.7mL 2% lidocaine with 1:100k epi. Caries removed from MO of #15. Moderate decay extending into dentin. No pulp exposure. Restored with composite resin (shade A2). Bite adjusted and polished.',
      assessment: 'Dental caries #15 successfully treated (K02.52). Prognosis good.',
      plan: 'Monitor diabetes management. Post-op instructions given. Return for exam in 6 months.',
      vitals: { bp: '140/88', pulse: 78, bloodSugar: 142 },
      signedAt: new Date('2024-10-10'),
    },
  });

  // Omar Hassan - emergency visit note
  await prisma.clinicalNote.create({
    data: {
      patientId: patients[12].id,
      providerId: drChen.id,
      date: new Date('2025-01-22'),
      type: 'progress',
      subjective: 'Patient presents with severe pain in upper left area, onset 3 days ago. Pain is spontaneous, throbbing, and wakes him at night. Cold makes it worse, heat provides temporary relief. Pain rated 8/10.',
      objective: 'PA radiograph of #5 shows large radiolucency at apex. Deep caries approaching pulp. Percussion positive. Cold test: lingering pain >30 seconds. EPT: delayed response. Palpation tender over buccal apical region.',
      assessment: 'Irreversible pulpitis #5 with symptomatic apical periodontitis (K04.02, K04.4). Root canal therapy indicated.',
      plan: 'Prescribed Amoxicillin 500mg TID x 7 days, Ibuprofen 600mg Q6H PRN. Scheduled root canal #5 in 2 weeks. Patient consented to treatment plan. If pain worsens, patient to call for emergency pulpotomy.',
      vitals: { bp: '148/92', pulse: 88 },
      signedAt: new Date('2025-01-22'),
    },
  });

  // Aisha Patel - comprehensive exam note
  await prisma.clinicalNote.create({
    data: {
      patientId: patients[3].id,
      providerId: drChen.id,
      date: new Date('2025-01-08'),
      type: 'progress',
      subjective: 'New patient comprehensive exam. Patient is 24 weeks pregnant. Reports bleeding gums when brushing. No pain. Last dental visit was approximately 2 years ago.',
      objective: 'FMS radiographs deferred due to pregnancy. Clinical exam performed. Generalized marginal erythema with BOP in posterior regions. Probing depths 2-4mm. Moderate plaque and calculus. No caries detected visually. Oral cancer screening negative.',
      assessment: 'Pregnancy gingivitis (K05.10). Otherwise healthy dentition.',
      plan: 'Schedule cleaning within 2 weeks (safe during 2nd trimester). Emphasize gentle but thorough brushing and flossing. Will defer non-urgent treatment until postpartum. Revisit radiographic evaluation after delivery.',
      signedAt: new Date('2025-01-08'),
    },
  });

  console.log('✅ Seed completed successfully!');
  console.log(`  Practice: ${practice.name}`);
  console.log(`  Providers: 3 (Dr. Chen, Maria Lopez, James Wilson)`);
  console.log(`  Chairs: 3`);
  console.log(`  Patients: ${patients.length}`);
  console.log(`  CDT codes loaded: ${cdtCodes.length}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
