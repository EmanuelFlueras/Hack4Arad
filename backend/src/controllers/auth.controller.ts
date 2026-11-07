import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../config/prisma';

const JWT_SECRET = process.env.JWT_SECRET || 'arad_pulse_secret_key_2025';

// 1. Înregistrare Producător sau Instituție (contul pornește ca PENDING)
export const register = async (req: Request, res: Response) => {
  try {
    const { name, phone, password, location, role } = req.body;

    if (!name || !phone || !password || !location) {
      return res.status(400).json({ error: 'Toate campurile sunt obligatorii.' });
    }

    const existingUser = await prisma.user.findUnique({ where: { phone } });
    if (existingUser) {
      return res.status(400).json({ error: 'Exista deja un cont cu acest numar de telefon.' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const assignedRole = role === 'INSTITUTION' ? 'INSTITUTION' : 'PRODUCER';

    const user = await prisma.user.create({
      data: {
        name,
        phone,
        password: hashedPassword,
        location,
        role: assignedRole,
        status: 'PENDING', // Așteaptă aprobarea administratorului
      },
      select: { id: true, name: true, phone: true, role: true, status: true },
    });

    res.status(201).json({
      message: 'Cererea de cont a fost inregistrata. Vei putea intra dupa aprobarea administratorului.',
      user,
    });
  } catch (error) {
    res.status(500).json({ error: 'Eroare la inregistrare.' });
  }
};

// 2. Autentificare (doar conturile APPROVED se pot loga)
export const login = async (req: Request, res: Response) => {
  try {
    const { phone, password } = req.body;

    const user = await prisma.user.findUnique({ where: { phone } });
    if (!user) {
      return res.status(401).json({ error: 'Date de autentificare incorecte.' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Date de autentificare incorecte.' });
    }

    // Verificare aprobare admin
    if (user.status === 'PENDING') {
      return res.status(403).json({ error: 'Contul tau este inca in curs de aprobare de catre administrator.' });
    }
    if (user.status === 'REJECTED') {
      return res.status(403).json({ error: 'Cererea ta de cont a fost respinsa.' });
    }

    const token = jwt.sign(
      { id: user.id, role: user.role, name: user.name },
      JWT_SECRET,
      { expiresIn: '30d' }
    );

    res.json({
      message: 'Autentificare reusita.',
      token,
      user: {
        id: user.id,
        name: user.name,
        role: user.role,
        phone: user.phone,
        location: user.location,
      },
    });
  } catch (error) {
    res.status(500).json({ error: 'Eroare la autentificare.' });
  }
};