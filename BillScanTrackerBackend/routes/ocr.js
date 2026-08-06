const express = require('express');
const router = express.Router();
const multer = require('multer');
const { createWorker } = require('tesseract.js');
const sharp = require('sharp');

const upload = multer({ storage: multer.memoryStorage() });

let workerInstance = null;
let workerInitializing = null;

async function getOCRWorker() {
  if (workerInstance) return workerInstance;
  if (workerInitializing) return workerInitializing;

  workerInitializing = (async () => {
    try {
      const worker = await createWorker('eng');
      workerInstance = worker;
      return workerInstance;
    } catch (err) {
      workerInitializing = null;
      throw err;
    }
  })();

  return workerInitializing;
}

// Preprocess image buffer with Sharp for optimal OCR accuracy
async function preprocessImage(buffer) {
  try {
    const instance = sharp(buffer);
    const meta = await instance.metadata();
    const stats = await instance.stats();

    const targetWidth = meta.width && meta.width < 1200 ? 1600 : (meta.width || 1600);
    const meanLuminance = stats.channels.reduce((acc, c) => acc + c.mean, 0) / stats.channels.length;
    const isDarkMode = meanLuminance < 125;

    let pipeline = sharp(buffer)
      .resize({
        width: targetWidth,
        withoutEnlargement: false,
        fit: 'inside',
      });

    if (isDarkMode) {
      pipeline = pipeline.negate({ alpha: false });
    }

    const processedBuffer = await pipeline
      .grayscale()
      .normalize()
      .sharpen()
      .png({ quality: 100 })
      .toBuffer();

    return processedBuffer;
  } catch (err) {
    console.warn('Image preprocessing warning, using raw buffer:', err.message);
    return buffer;
  }
}

router.post('/', upload.single('file'), async (req, res) => {
  try {
    if (!req.file || !req.file.buffer) {
      return res.status(400).json({ error: 'No image file uploaded' });
    }

    const processedBuffer = await preprocessImage(req.file.buffer);
    const worker = await getOCRWorker();

    const ret = await worker.recognize(processedBuffer);

    const text = ret.data?.text || '';
    const confidence = Math.round(ret.data?.confidence || 90);

    const items = (ret.data?.lines || [])
      .map((line) => ({
        text: line.text ? line.text.trim() : '',
        confidence: Math.round(line.confidence || confidence),
        box: line.bbox
          ? {
              x: line.bbox.x0,
              y: line.bbox.y0,
              w: line.bbox.x1 - line.bbox.x0,
              h: line.bbox.y1 - line.bbox.y0,
            }
          : { x: 0, y: 0, w: 0, h: 0 },
      }))
      .filter((item) => item.text.length > 0);

    res.json({
      text,
      confidence,
      items,
    });
  } catch (err) {
    console.error('Backend OCR processing error:', err);
    res.status(500).json({
      error: 'Failed to process OCR on backend server',
      detail: err.message,
    });
  }
});

module.exports = router;
