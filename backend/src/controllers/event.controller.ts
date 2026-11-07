import { Response } from 'express';
import { AuthRequest } from '../middlewares/auth.middleware';
import { prisma } from '../config/prisma';

// Listă publică de evenimente (include creatorul, partenerii și recenziile)
export const getEvents = async (req: any, res: Response) => {
  try {
    const events = await prisma.event.findMany({
      include: {
        creator: { select: { id: true, name: true, phone: true } },
        partners: {
          select: {
            id: true,
            name: true,
            category: true,
            phone: true,
            location: true,
          },
        },
        reviews: true,
      },
      orderBy: { createdAt: 'desc' },
    });
    res.json(events);
  } catch (error) {
    res.status(500).json({ error: 'Eroare la preluarea evenimentelor.' });
  }
};

// Creare eveniment nou (creatorul este utilizatorul logat, partenerii sunt ID-uri de producători)
export const createEvent = async (req: AuthRequest, res: Response) => {
  try {
    const body = req.body ?? {};
    const title = typeof body.title === 'string' ? body.title.trim() : '';
    const location = typeof body.location === 'string' ? body.location.trim() : '';
    const dateValue = body.date;

    if (!title || !location) {
      return res.status(400).json({ error: 'Titlul și locația sunt obligatorii.' });
    }

    const eventDate = dateValue ? new Date(dateValue) : new Date();
    if (dateValue && Number.isNaN(eventDate.getTime())) {
      return res.status(400).json({ error: 'Data evenimentului nu este validă.' });
    }

    const requestedCreatorId =
      typeof body.creatorId === 'string' && body.creatorId.trim() ? body.creatorId.trim() : undefined;
    const creatorId = req.user?.id;
    if (!creatorId) {
      return res.status(401).json({ error: 'Autentificarea este necesară pentru a crea un eveniment.' });
    }
    if (requestedCreatorId && requestedCreatorId !== creatorId) {
      return res.status(403).json({ error: 'Nu poți crea un eveniment pentru alt utilizator.' });
    }

    const latitude = parseOptionalCoordinate(body.latitude);
    const longitude = parseOptionalCoordinate(body.longitude);
    const description = typeof body.description === 'string' ? body.description : '';
    const category = typeof body.category === 'string' ? body.category.trim() || null : null;
    const image = typeof body.image === 'string' ? body.image.trim() || null : null;

    const event = await prisma.event.create({
      data: {
        title,
        description,
        location,
        date: eventDate,
        image,
        latitude,
        longitude,
        category,
        creatorId,
        partners: { connect: [{ id: creatorId }] },
      },
      include: {
        partners: {
          select: {
            id: true,
            name: true,
            category: true,
            phone: true,
            location: true,
          },
        },
      },
    });

    return res.status(201).json(event);
  } catch (error) {
    console.error('Failed to create event:', error);
    return res.status(500).json({ error: 'Nu s-a putut crea evenimentul.' });
  }
};

function parseOptionalCoordinate(value: unknown): number | null {
  if (value === undefined || value === null || value === '') return null;
  const coordinate = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(coordinate) ? coordinate : null;
}