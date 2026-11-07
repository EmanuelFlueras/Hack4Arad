import { Router } from 'express';
import { prisma } from '../config/prisma';

const router = Router();

interface MapPoint {
  id: string;
  title: string;
  type: 'PRODUCER' | 'EVENT';
  latitude: number;
  longitude: number;
  category?: string;
  address?: string;
  description?: string;
}

interface Coordinates {
  latitude: number;
  longitude: number;
}

interface OptionalProducerMapFields {
  email?: string | null;
  latitude?: number | null;
  longitude?: number | null;
}

const fallbackCoordinates: Record<string, Coordinates> = {
  arad: { latitude: 46.1866, longitude: 21.3123 },
  pecica: { latitude: 46.1697, longitude: 21.0714 },
  minis: { latitude: 46.1511, longitude: 21.6133 },
  lipova: { latitude: 46.0931, longitude: 21.6914 },
  macea: { latitude: 46.3889, longitude: 21.3117 },
};

function getFallbackCoordinates(value: string): Coordinates {
  const normalized = value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();

  for (const town of ['pecica', 'minis', 'lipova', 'macea']) {
    if (normalized.includes(town)) {
      return fallbackCoordinates[town];
    }
  }

  return fallbackCoordinates.arad;
}

router.get('/points', async (_req, res) => {
  try {
    const [producers, events] = await Promise.all([
      prisma.user.findMany({
        where: { role: 'PRODUCER', status: 'APPROVED' },
      }),
      prisma.event.findMany({
        select: { id: true, title: true, location: true, description: true },
      }),
    ]);

    const points: MapPoint[] = [
      ...producers.map((record) => {
        const producer = record as typeof record & OptionalProducerMapFields;
        const latitude = producer.latitude;
        const longitude = producer.longitude;
        const coordinates =
          typeof latitude === 'number' &&
          Number.isFinite(latitude) &&
          typeof longitude === 'number' &&
          Number.isFinite(longitude)
            ? { latitude, longitude }
            : getFallbackCoordinates(producer.location);

        return {
          id: producer.id,
          title: producer.name,
          type: 'PRODUCER' as const,
          ...coordinates,
          category: producer.category || 'Producător Local',
          address: producer.location,
          description: `Contact: ${producer.phone || producer.email || 'Nespecificat'}`,
        };
      }),
      ...events.map((event) => ({
        id: `event-${event.id}`,
        title: event.title,
        type: 'EVENT' as const,
        ...getFallbackCoordinates(`${event.title} ${event.location}`),
        category: undefined,
        address: event.location,
        description: event.description,
      })),
    ];

    return res.json(points);
  } catch (error) {
    console.error('Failed to fetch map points:', error);
    return res.status(500).json({ error: 'Could not fetch map points.' });
  }
});

export default router;