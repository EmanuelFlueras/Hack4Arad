import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Curatare baza de date veche...');
  await prisma.review.deleteMany();
  await prisma.event.deleteMany();
  await prisma.user.deleteMany();

  const defaultPassword = await bcrypt.hash('parola123', 10);
  const adminPassword = await bcrypt.hash('adminArad2025!', 10);

  console.log('Inserare utilizatori si producatori locali...');

  // 1. Cont de Administrator (Centrul Municipal de Cultura / Primaria)
  const admin = await prisma.user.create({
    data: {
      name: 'Centrul Municipal de Cultură Arad',
      phone: '0257123456',
      password: adminPassword,
      location: 'Bulevardul Revoluției 97, Arad',
      role: 'ADMIN',
      status: 'APPROVED',
    },
  });

  // 2. Producători locali autentici din județul Arad
  const brutariaPecica = await prisma.user.upsert({
    where: { phone: '0740111222' },
    update: { category: 'Panificație' },
    create: {
      name: 'Pita Tradițională de Pecica',
      phone: '0740111222',
      password: defaultPassword,
      location: 'Strada Principală 45, Pecica, Arad',
      role: 'PRODUCER',
      category: 'Panificație',
      status: 'APPROVED',
    },
  });

  const cramaMinis = await prisma.user.upsert({
    where: { phone: '0740222333' },
    update: { category: 'Vinificație' },
    create: {
      name: 'Cramele Podgoria Miniș-Măderat (Balla Géza)',
      phone: '0740222333',
      password: defaultPassword,
      location: 'Păuliș / Miniș nr. 288, Arad',
      role: 'PRODUCER',
      category: 'Vinificație',
      status: 'APPROVED',
    },
  });

  const legumeMacea = await prisma.user.upsert({
    where: { phone: '0740333444' },
    update: { category: 'Legumicultură' },
    create: {
      name: 'Legume Proaspete de Macea & Curtici',
      phone: '0740333444',
      password: defaultPassword,
      location: 'Comuna Macea, Jud. Arad',
      role: 'PRODUCER',
      category: 'Legumicultură',
      status: 'APPROVED',
    },
  });

  const apiculturaLipova = await prisma.user.upsert({
    where: { phone: '0740444555' },
    update: { category: 'Apicultură' },
    create: {
      name: 'Stupina Văii Mureșului - Miere Lipova',
      phone: '0740444555',
      password: defaultPassword,
      location: 'Str. Lugojului 12, Lipova, Arad',
      role: 'PRODUCER',
      category: 'Apicultură',
      status: 'APPROVED',
    },
  });

  console.log('Inserare evenimente locale...');

  // 3. Evenimente locale reprezentative
  const targPrimavara = await prisma.event.create({
    data: {
      title: 'Târgul Meșteșugarilor și al Produselor Tradiționale',
      description: 'Eveniment dedicat producătorilor locali arădeni cu degustări de produse tradiționale, pâine de Pecica și produse apicole.',
      image: 'https://images.unsplash.com/photo-1488459716781-31db52582fe9?auto=format&fit=crop&w=800&q=80',
      location: 'Piața Catedralei / Parcul Reconcilierii, Arad',
      date: new Date('2025-05-15T10:00:00Z'),
      creatorId: admin.id,
      partners: {
        connect: [
          { id: brutariaPecica.id },
          { id: apiculturaLipova.id },
          { id: legumeMacea.id },
        ],
      },
    },
  });

  const festivalVin = await prisma.event.create({
    data: {
      title: 'Zilele Vinului în Podgoria Aradului',
      description: 'Degustări ghidate de vinuri locale Cadarcă și Mustoasă de Măderat, acompaniate de gastronomie specifică zonei.',
      image: 'https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?auto=format&fit=crop&w=800&q=80',
      location: 'Podgoria Miniș, Arad',
      date: new Date('2025-06-20T16:00:00Z'),
      creatorId: admin.id,
      partners: {
        connect: [
          { id: cramaMinis.id },
        ],
      },
    },
  });

  console.log('Inserare recenzii de pornire...');

  // 4. Câteva recenzii demonstrative
  await prisma.review.create({
    data: {
      rating: 5,
      description: 'Pita de Pecica rămâne fără egal, proaspătă și cu o coajă crocantă excepțională!',
      authorName: 'Marius T. (Vizitator)',
      targetUserId: brutariaPecica.id,
    },
  });

  await prisma.review.create({
    data: {
      rating: 5,
      description: 'O selecție excelentă de producători locali și o atmosferă foarte frumoasă în Piața Catedralei.',
      authorName: 'Elena Popa',
      eventId: targPrimavara.id,
    },
  });

  console.log('Baza de date a fost populata cu succes!');
}

main()
  .catch((e) => {
    console.error(e);
    throw(e);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });