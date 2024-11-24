import express from 'express';
import multer from 'multer';
import { v4 as uuidv4 } from 'uuid';
import { Card } from '../models/Card.js';
import { fileURLToPath } from 'url';
import { dirname, join, extname } from 'path';
import fs from 'fs';
import puppeteer from 'puppeteer';

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

router.post('/capture', async (req, res) => {
  const { html } = req.body;

  if (!html) {
    return res.status(400).json({ error: 'HTML content is required' });
  }

  try {
    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });

    const page = await browser.newPage();
    await page.setViewport({
      width: 450,
      height: 750,
      deviceScaleFactor: 1,
    });

    await page.setContent(html);
    await page.waitForSelector('img'); // Espera a que haya al menos una imagen en el HTML

    const screenshotBuffer = await page.screenshot({
      type: 'png',
      omitBackground: true,
    });

    await browser.close();

    // Generar un UUID para la imagen
    const uuid = uuidv4();
    const filename = `${uuid}.png`;
    const imagePath = join(cardsDir, filename);

    // Guardar la imagen en el sistema de archivos
    fs.writeFileSync(imagePath, screenshotBuffer);

    // Guardar la entrada en la base de datos
    const card = new Card({
      uuid,
      imagePath: filename,
    });

    await card.save();

    // Retornar el ID de la carta creada
    res.status(201).json({
      uuid: card.uuid,
      message: 'Captura almacenada con éxito',
    });
  } catch (error) {
    console.error('Error generating screenshot:', error);
    res.status(500).json({ error: 'Error generating screenshot' });
  }
});




export { router };