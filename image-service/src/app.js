import express from 'express';
import cors from 'cors';
import { createAuthClient } from './clients/authClient.js';
import { createJournalClient } from './clients/journalClient.js';
import { createImageRouter } from './controllers/imageController.js';
import { authenticate } from './middleware/authenticate.js';
import { errorHandler } from './middleware/errorHandler.js';
import { ImageRepository } from './repositories/imageRepository.js';
import { ImageService } from './services/imageService.js';

export function createApp(config) {
  const repository = new ImageRepository(config.databasePath);
  const authClient = createAuthClient(config.authServiceUrl);
  const journalClient = createJournalClient(config.journalServiceUrl);
  const images = new ImageService(repository, journalClient, config);
  const app = express();

  app.disable('x-powered-by');
  app.use(cors({ origin: config.frontendOrigin, exposedHeaders: ['X-Image-Version'] }));
  app.use((request, response, next) => {
    response.set('Cache-Control', 'no-store');
    response.set('X-Content-Type-Options', 'nosniff');
    next();
  });
  app.use('/api/images', authenticate(authClient), express.json({ limit: '128kb' }),
    createImageRouter(images, config.maxFileSize));
  app.use((request, response) => response.status(404).json({ message: 'Adressen hittades inte.' }));
  app.use(errorHandler);

  return { app, repository };
}
