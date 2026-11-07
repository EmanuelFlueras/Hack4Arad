import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import apiRoutes from './routes/api.routes';
import mapRoutes from './routes/map';

dotenv.config();

const app = express();
const PORT = Number(process.env.PORT) || 5000;

app.use(cors({ origin: '*', credentials: true }));
app.use(express.json());

// Toate rutele pornesc de la prefixul /api
app.use('/api', apiRoutes);
app.use('/api/map', mapRoutes);

app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'Arad Pulse Backend' });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server running on http://0.0.0.0:${PORT}`);
});