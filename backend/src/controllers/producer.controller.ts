import { Request, Response } from 'express';
import { prisma } from '../config/prisma';

// Catalogul public al producătorilor aprobați
export const getProducers = async (req: Request, res: Response) => {
  try {
    const producers = await prisma.user.findMany({
      where: { role: 'PRODUCER', status: 'APPROVED' },
      select: {
        id: true,
        name: true,
        phone: true,
        location: true,
        receivedReviews: true,
      },
    });
    res.json(producers);
  } catch (error) {
    res.status(500).json({ error: 'Eroare la preluarea producatorilor.' });
  }
};