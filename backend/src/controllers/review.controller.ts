import { Response } from 'express';
import { AuthRequest } from '../middlewares/auth.middleware';
import { prisma } from '../config/prisma';

export const addReview = async (req: AuthRequest, res: Response) => {
  try {
    const { rating, description, authorName, eventId, targetUserId } = req.body;

    if (!rating || !description) {
      return res.status(400).json({ error: 'Nota si descrierea sunt obligatorii.' });
    }

    if (!eventId && !targetUserId) {
      return res.status(400).json({ error: 'Trebuie sa specificati un eventId sau un targetUserId.' });
    }

    // Dacă utilizatorul este logat, numele este preluat automat din contul său
    let finalAuthorName = authorName;
    let authorId: string | null = null;

    if (req.user) {
      finalAuthorName = req.user.name;
      authorId = req.user.id;
    } else if (!authorName) {
      return res.status(400).json({ error: 'Utilizatorii anonimi trebuie sa isi specifice numele.' });
    }

    const review = await prisma.review.create({
      data: {
        rating: Number(rating),
        description,
        authorName: finalAuthorName,
        authorId,
        eventId: eventId || null,
        targetUserId: targetUserId || null,
      },
    });

    res.status(201).json(review);
  } catch (error) {
    res.status(500).json({ error: 'Nu s-a putut adauga recenzia.' });
  }
};