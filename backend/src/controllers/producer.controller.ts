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
        category: true,
        createdAt: true,
        receivedReviews: true,
      },
    });

    return res.status(200).json(producers.map(({ receivedReviews, ...producer }) => ({
      ...producer,
      reviewsReceived: receivedReviews,
      averageRating: receivedReviews.length
        ? receivedReviews.reduce((sum, review) => sum + review.rating, 0) / receivedReviews.length
        : 0,
    })));
  } catch (error) {
    console.error('Failed to fetch producers:', error);
    return res.status(500).json({ error: 'Nu s-au putut prelua producătorii.' });
  }
};