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

    res.json(producers.map(({ receivedReviews, ...producer }) => ({
      ...producer,
      reviewsReceived: receivedReviews,
      averageRating: receivedReviews.length
        ? receivedReviews.reduce((sum, review) => sum + review.rating, 0) / receivedReviews.length
        : 0,
    })));
  } catch (error) {
    res.status(500).json({ error: 'Eroare la preluarea producatorilor.' });
  }
};