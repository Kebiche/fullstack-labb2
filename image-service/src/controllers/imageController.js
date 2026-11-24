import { Router } from 'express';
import multer from 'multer';
import { requireDoctor, requireStaff } from '../middleware/authenticate.js';
import { parsePatientId, validateImageId } from '../validation/imageValidation.js';

export function createImageRouter(images, maxFileSize) {
  const router = Router();
  const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: maxFileSize, files: 1, fields: 1, fieldSize: 100, parts: 2 },
  }).single('image');

  router.post('/', requireStaff, upload, async (request, response) => {
    const patientId = parsePatientId(request.body?.patientId);
    const image = await images.upload(patientId, request.file, request.user);
    response.location(image.url).status(201).json(image);
  });

  router.get('/', async (request, response) => {
    const patientId = parsePatientId(request.query.patientId);
    const patientImages = await images.list(patientId, request.user);
    response.json(patientImages);
  });

  router.get('/:id', async (request, response) => {
    const id = validateImageId(request.params.id);
    const image = await images.read(id, request.user);
    response.set('X-Image-Version', String(image.version));
    response.type('png').send(image.bytes);
  });

  router.put('/:id/annotate', requireDoctor, async (request, response) => {
    const id = validateImageId(request.params.id);
    const image = await images.annotate(id, request.body, request.user);
    response.json(image);
  });

  return router;
}
