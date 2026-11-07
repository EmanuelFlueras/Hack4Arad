import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../config/prisma';

const JWT_SECRET = process.env.JWT_SECRET || 'arad_pulse_secret_key_2025';

export const register = async (req: Request, res: Response) => {
  try {
    const name = typeof req.body?.name === 'string' ? req.body.name.trim() : '';
    const phone = typeof req.body?.phone === 'string' ? req.body.phone.trim() : '';
    const password = typeof req.body?.password === 'string' ? req.body.password : '';
    const location = typeof req.body?.location === 'string' ? req.body.location.trim() : '';
    const category = typeof req.body?.category === 'string' ? req.body.category.trim() : null;

    if (!name || !phone || !password || !location) {
      return res.status(400).json({ error: 'Numele, telefonul, parola și locația sunt obligatorii.' });
    }

    const existingUser = await prisma.user.findUnique({ where: { phone } });
    if (existingUser) {
      return res.status(400).json({ error: 'Numărul de telefon este deja înregistrat.' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const assignedRole = req.body?.role === 'INSTITUTION' ? 'INSTITUTION' : 'PRODUCER';

    await prisma.user.create({
      data: {
        name,
        phone,
        password: hashedPassword,
        location,
        category: category || null,
        role: assignedRole,
        status: 'PENDING',
      },
    });

    return res.status(201).json({
      message: 'Cererea ta a fost trimisă. Administratorul o va analiza pentru aprobare.',
    });
  } catch (error) {
    if (typeof error === 'object' && error !== null && 'code' in error && error.code === 'P2002') {
      return res.status(400).json({ error: 'Numărul de telefon este deja înregistrat.' });
    }
    console.error('Registration failed:', error);
    return res.status(500).json({ error: 'Eroare la înregistrare.' });
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    const phone = typeof req.body?.phone === 'string' ? req.body.phone.trim() : '';
    const password = typeof req.body?.password === 'string' ? req.body.password : '';

    if (!phone || !password) {
      return res.status(400).json({ error: 'Numărul de telefon și parola sunt obligatorii.' });
    }

    const user = await prisma.user.findUnique({ where: { phone } });
    if (!user) {
      return res.status(401).json({ error: 'Date de autentificare incorecte.' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Date de autentificare incorecte.' });
    }

    if (user.status === 'PENDING') {
      return res.status(403).json({ error: 'Contul tău este în curs de verificare de către administrator.' });
    }
    if (user.status === 'REJECTED') {
      return res.status(403).json({ error: 'Cererea de înrolare a fost respinsă.' });
    }
    if (user.status !== 'APPROVED') {
      return res.status(403).json({ error: 'Contul tău nu este aprobat.' });
    }

    const token = jwt.sign(
      { id: user.id, phone: user.phone, role: user.role },
      JWT_SECRET,
      { expiresIn: '30d' }
    );

    return res.status(200).json({
      token,
      user: {
        id: user.id,
        name: user.name,
        phone: user.phone,
        location: user.location,
        category: user.category,
        role: user.role,
      },
    });
  } catch (error) {
    console.error('Login failed:', error);
    return res.status(500).json({ error: 'Eroare la autentificare.' });
  }
};