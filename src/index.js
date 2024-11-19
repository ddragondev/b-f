import express from 'express';
import mongoose from 'mongoose';
import { router } from './routes/cards.js';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const cardsDir = join(__dirname, '..', 'cartas');

// Crear directorio de cartas si no existe
if (!fs.existsSync(cardsDir)) {
  fs.mkdirSync(cardsDir, { recursive: true });
}

const app = express();
const PORT = process.env.PORT || 7894;

// Conexión a MongoDB
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('Conectado a MongoDB'))
  .catch(err => console.error('Error conectando a MongoDB:', err));

app.use('/api', router);

// Manejo de errores global
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    error: 'Error interno del servidor',
    message: err.message 
  });
});

app.listen(PORT, () => {
  console.log(`Servidor ejecutándose en puerto ${PORT}`);
});