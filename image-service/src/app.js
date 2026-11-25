import express from 'express';
import cors from 'cors';
import { createImageRouter } from './controllers/imageController.js';
import { authenticate } from './middleware/authenticate.js';

export const app = express();

app.use(cors());
app.use('/api/images', authenticate, createImageRouter());