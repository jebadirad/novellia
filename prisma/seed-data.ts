import { normalizeProviderName } from '../src/domain/providers';
import { createHash } from 'node:crypto';
import { addDays, toDate, todayIn } from '../src/domain/dates';
import type { PrismaClient } from '../src/generated/prisma/client';
export async function seedDemo(
  db: PrismaClient,
  day = todayIn(process.env.APP_TIME_ZONE ?? 'America/Phoenix'),
) {
  const pets = [
    {
      id: '10000000-0000-4000-8000-000000000001',
      name: 'Luna',
      species: 'dog',
      breed: 'Golden Retriever',
      sex: 'female',
      birthDate: toDate(addDays(day, -1461)),
      notes: 'A gentle soul who loves a long walk and a sunny spot by the window.',
    },
    {
      id: '10000000-0000-4000-8000-000000000002',
      name: 'Milo',
      species: 'cat',
      breed: 'Domestic Shorthair',
      sex: 'male',
      birthDate: toDate(addDays(day, -1095)),
      notes: 'Curious about everything. Happiest watching birds from his favorite windowsill.',
    },
    {
      id: '10000000-0000-4000-8000-000000000003',
      name: 'Oliver',
      species: 'dog',
      breed: 'Cavalier King Charles Spaniel',
      sex: 'male',
      birthDate: null,
      notes: 'Adopted as an adult. His exact birthday is unknown.',
    },
    {
      id: '10000000-0000-4000-8000-000000000004',
      name: 'Juniper',
      species: 'rabbit',
      breed: 'Holland Lop',
      sex: 'female',
      birthDate: toDate(addDays(day, -730)),
      notes: 'A new addition to the family. Loves exploring cardboard tunnels.',
    },
  ];
  const records = [
    {
      pet: 0,
      title: 'Annual wellness check',
      type: 'vet_visit',
      ago: 7,
      details: {
        reason: 'Annual checkup',
        assessment: 'Routine examination recorded by the clinic.',
      },
      follow: -2,
      followUpNote: 'Book Luna’s follow-up visit',
    },
    {
      pet: 1,
      title: 'Dental checkup',
      type: 'vet_visit',
      ago: 12,
      details: { reason: 'Dental examination', assessment: 'Discussed home dental care.' },
      follow: 0,
      followUpNote: 'Check in with Milo’s clinic',
    },
    {
      pet: 0,
      title: 'Rabies booster',
      type: 'vaccination',
      ago: 20,
      details: { vaccineName: 'Rabies', lotNumber: 'DEMO-R24' },
      follow: 8,
      followUpNote: 'Collect vaccination certificate',
    },
    {
      pet: 2,
      title: 'Ear drops prescription',
      type: 'medication',
      ago: 6,
      details: {
        medicationName: 'Example ear drops',
        dose: 'See clinic instructions',
        frequency: 'As directed by the vet',
        endDate: addDays(day, 4),
      },
      follow: 5,
      followUpNote: 'Review Oliver’s progress with the vet',
    },
    {
      pet: 1,
      title: 'Feline vaccination visit',
      type: 'vaccination',
      ago: 45,
      details: { vaccineName: 'FVRCP', lotNumber: 'DEMO-F12' },
      follow: 60,
      followUpNote: 'Review Milo’s care plan',
    },
    {
      pet: 2,
      title: 'New patient examination',
      type: 'vet_visit',
      ago: 65,
      details: {
        reason: 'First visit after adoption',
        assessment: 'Established a baseline medical history.',
      },
      follow: -30,
      followUpNote: 'Collect previous clinic records',
      completed: true,
    },
    {
      pet: 0,
      title: 'Seasonal skin check',
      type: 'vet_visit',
      ago: 90,
      details: {
        reason: 'Discuss seasonal scratching',
        assessment: 'Owner observations documented.',
      },
    },
    {
      pet: 0,
      title: 'Skin care prescription',
      type: 'medication',
      ago: 88,
      details: {
        medicationName: 'Example topical treatment',
        dose: null,
        frequency: 'See prescription',
        endDate: addDays(day, -75),
      },
    },
    {
      pet: 1,
      title: 'Routine wellness visit',
      type: 'vet_visit',
      ago: 180,
      details: { reason: 'Routine wellness visit', assessment: null },
    },
    {
      pet: 1,
      title: 'Medication history review',
      type: 'medication',
      ago: 170,
      details: {
        medicationName: 'Historical prescription',
        dose: null,
        frequency: null,
        endDate: null,
      },
    },
    {
      pet: 2,
      title: 'Vaccination history',
      type: 'vaccination',
      ago: 80,
      details: { vaccineName: 'Rabies', lotNumber: null },
    },
    {
      pet: 0,
      title: 'Puppy records transferred',
      type: 'vaccination',
      ago: 365,
      details: { vaccineName: 'DHPP', lotNumber: null },
    },
  ];
  await db.$transaction(async (tx) => {
    for (const pet of pets) {
      await tx.pet.upsert({ where: { id: pet.id }, create: pet, update: {} });
    }
    const providers = await Promise.all(
      ['Green Valley Animal Care', 'Willow Creek Veterinary'].map(async (name) => {
        const normalizedName = normalizeProviderName(name);
        // Match the migration's deterministic IDs so seeding preserves renamed providers.
        const hex = createHash('md5').update(normalizedName).digest('hex');
        const id = `${hex.slice(0, 8)}-${hex.slice(8, 12)}-8${hex.slice(13, 16)}-8${hex.slice(17, 20)}-${hex.slice(20)}`;
        return (
          (await tx.careProvider.findFirst({ where: { OR: [{ id }, { normalizedName }] } })) ??
          (await tx.careProvider.create({ data: { id, name, normalizedName, kind: 'clinic' } }))
        );
      }),
    );
    for (const [index, record] of records.entries()) {
      const id = `20000000-0000-4000-8000-${String(index + 1).padStart(12, '0')}`;
      await tx.medicalRecord.upsert({
        where: { id },
        update: {},
        create: {
          id,
          petId: pets[record.pet].id,
          type: record.type,
          title: record.title,
          occurredOn: toDate(addDays(day, -record.ago))!,
          providerId: providers[record.pet === 1 ? 1 : 0].id,
          details: record.details,
          notes:
            'Fictional demonstration record. Not medical advice or a treatment recommendation.',
          followUpOn: record.follow !== undefined ? toDate(addDays(day, record.follow)) : null,
          followUpNote: record.followUpNote ?? null,
          followUpCompletedAt: record.completed ? toDate(addDays(day, -29)) : null,
        },
      });
    }
  });
}
