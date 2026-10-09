import express from 'express';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';
import { createApp } from './server/app.js';
import { initDatabase } from './server/db.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = process.env.PORT || 3000;
const hasDist = fs.existsSync(path.join(__dirname, 'dist', 'index.html'));
const isProduction = process.env.NODE_ENV === 'production' || (process.env.NODE_ENV !== 'development' && hasDist);

async function startServer() {
  await initDatabase();
  const app = createApp();

  if (!isProduction) {
    const { createServer } = await import('vite');
    const vite = await createServer({
      server: { middlewareMode: true, allowedHosts: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, () => {
    console.log(`[HGC Solar Server] Running on http://localhost:${PORT}`);
  });
}

startServer();
