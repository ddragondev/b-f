import express from 'express';
import multer from 'multer';
import { v4 as uuidv4 } from 'uuid';
import { Card } from '../models/Card.js';
import { fileURLToPath } from 'url';
import { dirname, join, extname } from 'path';
import fs from 'fs';

const router = express.Router();
const __dirname = dirname(fileURLToPath(import.meta.url));
const cardsDir = join(__dirname, '..', '..', 'cartas');

// Configuración de Multer
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, cardsDir);
  },
  filename: (req, file, cb) => {
    const uuid = uuidv4();
    req.fileUuid = uuid;
    cb(null, `${uuid}${extname(file.originalname)}`);
  }
});

const fileFilter = (req, file, cb) => {
  if (file.mimetype === 'image/png') {
    cb(null, true);
  } else {
    cb(new Error('Solo se permiten archivos PNG'), false);
  }
};

const upload = multer({ 
  storage, 
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB límite
  }
});

// POST /api/cartas
router.post('/cartas', upload.single('imagen'), async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No se ha proporcionado ningún archivo' });
    }

    const card = new Card({
      uuid: req.fileUuid,
      imagePath: req.file.filename
    });

    await card.save();

    res.status(201).json({
      uuid: card.uuid,
      message: 'Carta almacenada con éxito'
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/cartas/:uuid
router.get('/cartas/:uuid', async (req, res, next) => {
  try {
    const card = await Card.findOne({ uuid: req.params.uuid });
    
    if (!card) {
      return res.status(404).json({ error: 'Carta no encontrada' });
    }

    const imagePath = join(cardsDir, card.imagePath);
    
    if (!fs.existsSync(imagePath)) {
      return res.status(404).json({ error: 'Imagen no encontrada' });
    }

    res.sendFile(imagePath);
  } catch (error) {
    next(error);
  }
});

export { router };