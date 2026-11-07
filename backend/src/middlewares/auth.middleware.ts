import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'arad_pulse_secret_key_2025';

export interface AuthRequest extends Request {
  user?: {
    id: string;
    role: string;
    name: string;
  };
}

// Blochează cererea dacă nu există token valid
export const requireAuth = (req: AuthRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Acces neautorizat. Token lipsa.' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { id: string; role: string; name: string };
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Token invalid sau expirat.' });
  }
};

// Verifică dacă utilizatorul are un anumit rol (ex: ADMIN)
export const requireRole = (role: string) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user || req.user.role !== role) {
      return res.status(403).json({ error: 'Nu ai permisiuni pentru aceasta actiune.' });
    }
    next();
  };
};

// Pentru recenzii: nu blochează cererea, dar extrage datele dacă e logat
export const optionalAuth = (req: AuthRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    try {
      const decoded = jwt.verify(token, JWT_SECRET) as { id: string; role: string; name: string };
      req.user = decoded;
    } catch {
      // Ignorăm eroarea; utilizatorul continuă ca vizitator anonim
    }
  }
  next();
};