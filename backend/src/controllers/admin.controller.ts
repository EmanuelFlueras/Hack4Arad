import { Request, Response } from 'express';
import { prisma } from '../config/prisma';

// Lista utilizatorilor care așteaptă aprobare
export const getPendingUsers = async (req: Request, res: Response) => {
  try {
    const users = await prisma.user.findMany({
      where: { status: 'PENDING' },
      select: { id: true, name: true, phone: true, location: true, role: true, createdAt: true },
      orderBy: { createdAt: 'desc' },
    });
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: 'Nu s-au putut prelua cererile.' });
  }
};

// Aprobare sau respingere cont (APPROVED / REJECTED)
export const updateUserStatus = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!['APPROVED', 'REJECTED'].includes(status)) {
      return res.status(400).json({ error: 'Status invalid. Permis doar APPROVED sau REJECTED.' });
    }

    const updatedUser = await prisma.user.update({
      where: { id:String(id)},
      data: { status },
      select: { id: true, name: true, status: true },
    });

    res.json({ message: `Contul a fost marcat ca ${status}`, user: updatedUser });
  } catch (error) {
    res.status(500).json({ error: 'Eroare la actualizarea statusului contului.' });
  }
};