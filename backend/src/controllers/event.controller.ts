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
    const { title, description, image, location, date, partnerIds } = req.body;

    if (!title || !description || !location) {
      return res.status(400).json({ error: 'Titlul, descrierea si locatia sunt obligatorii.' });
    }

    const event = await prisma.event.create({
      data: {
        title,
        description,
        image,
        location,
        date: date ? new Date(date) : null,
        creatorId: req.user!.id,
        partners: partnerIds && partnerIds.length > 0 ? {
          connect: partnerIds.map((id: string) => ({ id })),
        } : undefined,
      },
      include: {
        partners: { select: { id: true, name: true } },
      },
    });

    res.status(201).json(event);
  } catch (error) {
    res.status(500).json({ error: 'Nu s-a putut crea evenimentul.' });
  }
};