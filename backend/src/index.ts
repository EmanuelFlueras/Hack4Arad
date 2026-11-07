import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import apiRoutes from './routes/api.routes';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Toate rutele pornesc de la prefixul /api
app.use('/api', apiRoutes);

app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'Arad Pulse Backend' });
});

app.listen(5000, '0.0.0.0', () => {
  console.log('Serverul rulează pe portul 5000');
});