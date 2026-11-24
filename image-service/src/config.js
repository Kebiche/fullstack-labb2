import path from 'node:path';
import { fileURLToPath } from 'node:url';

const serviceDirectory = fileURLToPath(new URL('../', import.meta.url));

export const config = {
  port: Number(process.env.PORT || 3001),
  authServiceUrl: process.env.AUTH_SERVICE_URL || 'http://localhost:8081',
  journalServiceUrl: process.env.JOURNAL_SERVICE_URL || 'http://localhost:8082',
  uploadDirectory: path.resolve(serviceDirectory, process.env.UPLOAD_DIRECTORY || 'uploads'),
  databasePath: path.resolve(serviceDirectory, process.env.DATABASE_PATH || 'data/images.sqlite'),
  frontendOrigin: process.env.FRONTEND_ORIGIN || 'http://localhost:5173',
  maxFileSize: 10 * 1024 * 1024,
  maxImagePixels: 20_000_000,
};
