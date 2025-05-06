// routes/download.js
import express from 'express';
import axios from 'axios';

const router = express.Router();

router.get('/force-download', async (req, res) => {
  const { url, filename = 'archivo' } = req.query;

  if (!url) {
    return res.status(400).json({ error: 'Falta la URL del archivo' });
  }

  try {
    const response = await axios.get(url, { responseType: 'stream' });

    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Type', response.headers['content-type']);

    response.data.pipe(res);
  } catch (err) {
    console.error('Error al descargar desde Backblaze:', err.message);
    res.status(500).json({ error: 'No se pudo descargar el archivo' });
  }
});

export default router;
