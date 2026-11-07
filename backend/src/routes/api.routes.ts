import { Router } from 'express';
import { register, login } from '../controllers/auth.controller';
import { getPendingUsers, updateUserStatus } from '../controllers/admin.controller';
import { getEvents, createEvent } from '../controllers/event.controller';
import { getProducers } from '../controllers/producer.controller';
import { addReview } from '../controllers/review.controller';
import { requireAuth, requireRole, optionalAuth } from '../middlewares/auth.middleware';
import mapRoutes from './map';

const router = Router();

// Auth
router.post('/auth/register', register);
router.post('/auth/login', login);

// Admin (doar cu rol de ADMIN)
router.get('/admin/pending-users', requireAuth, requireRole('ADMIN'), getPendingUsers);
router.patch('/admin/users/:id/status', requireAuth, requireRole('ADMIN'), updateUserStatus);

// Evenimente
router.get('/events', getEvents);
router.post('/events', requireAuth, createEvent);

// Producători
router.get('/producers', getProducers);

// Recenzii (acceptă atât vizitatori anonimi cât și utilizatori logați)
router.post('/reviews', optionalAuth, addReview);

// Map points
router.use('/map', mapRoutes);
router.use(mapRoutes);

export default router;