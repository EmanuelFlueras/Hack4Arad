import { Router } from 'express';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

router.get('/points', async (_req, res) => {
  console.log('>>> [BACKEND] Cerere primita pe /points!');
  try {
    console.log('>>> [BACKEND] Caut producatori...');
    const producers = await prisma.user.findMany({
      where: {
        role: 'PRODUCER',
        status: 'APPROVED',
      },
      select: {
        id: true,
        name: true,
        phone: true,
        location: true,
        category: true,
        latitude: true,
        longitude: true,
      },
    });
    console.log(`>>> [BACKEND] Gasit ${producers.length} producatori.`);

    console.log('>>> [BACKEND] Caut evenimente...');
    const events = await prisma.event.findMany({
      select: {
        id: true,
        title: true,
        description: true,
        location: true,
        image: true,
        date: true,
        latitude: true,
        longitude: true,
      },
    });
    console.log(`>>> [BACKEND] Gasit ${events.length} evenimente.`);

    const points = [
      ...events
        .filter((e) => e.latitude !== null && e.longitude !== null)
        .map((e) => ({
          id: `event-${e.id}`,
          originalId: e.id,
          type: 'EVENT' as const,
          title: e.title,
          subtitle: e.location,
          description: e.description,
          image: e.image,
          date: e.date,
          latitude: e.latitude!,
          longitude: e.longitude!,
        })),
      ...producers
        .filter((p) => p.latitude !== null && p.longitude !== null)
        .map((p) => ({
          id: `producer-${p.id}`,
          originalId: p.id,
          type: 'PRODUCER' as const,
          title: p.name,
          subtitle: p.category || 'Producător Local',
          description: p.location,
          phone: p.phone,
          latitude: p.latitude!,
          longitude: p.longitude!,
        })),
    ];

    console.log(`>>> [BACKEND] Trimit raspunsul cu ${points.length} puncte.`);
    return res.json(points);
  } catch (error) {
    console.error('>>> [BACKEND EROARE]:', error);
    return res.status(500).json({ error: String(error) });
  }
});

export default router;