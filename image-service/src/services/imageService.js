import { randomUUID } from 'node:crypto';
import { mkdir, readFile, unlink, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { HttpError } from '../errors/HttpError.js';
import { validateAnnotations } from '../validation/annotationValidation.js';
import { convertImage, annotateImage } from './imageProcessingService.js';

function toResponse(image) {
  return {
    id: image.id,
    patientId: image.patientId,
    originalName: image.originalName,
    contentType: 'image/png',
    width: image.width,
    height: image.height,
    version: image.version,
    createdBy: image.createdBy,
    updatedBy: image.updatedBy,
    createdAt: image.createdAt,
    updatedAt: image.updatedAt,
    url: `/api/images/${image.id}`,
  };
}

export class ImageService {
  constructor(repository, journalClient, config) {
    this.repository = repository;
    this.journalClient = journalClient;
    this.config = config;
  }

  async checkPatientAccess(patientId, user) {
    const patient = await this.journalClient.getPatient(patientId);
    if (user.role === 'PATIENT' && patient.userId !== user.id) {
      throw new HttpError(403, 'Du kan bara läsa bilder som tillhör din egen patientprofil.');
    }
  }

  getImage(id) {
    const image = this.repository.findById(id);
    if (!image) {
      throw new HttpError(404, 'Bilden hittades inte.');
    }
    return image;
  }

  async saveFile(fileName, buffer) {
    const filePath = path.join(this.config.uploadDirectory, fileName);
    await mkdir(this.config.uploadDirectory, { recursive: true });
    try {
      await writeFile(filePath, buffer, { flag: 'wx' });
    } catch (error) {
      if (error.code !== 'EEXIST') {
        await unlink(filePath).catch(() => {});
      }
      throw error;
    }
    return filePath;
  }

  async upload(patientId, file, user) {
    if (!file) {
      throw new HttpError(400, 'En bild krävs i filfältet image.');
    }
    await this.checkPatientAccess(patientId, user);
    const converted = await convertImage(file.buffer, this.config.maxImagePixels);
    const id = randomUUID();
    const image = {
      id, patientId,
      originalName: file.originalname.slice(0, 255),
      fileName: `${id}.png`,
      width: converted.info.width,
      height: converted.info.height,
      createdBy: user.id,
      createdAt: new Date().toISOString(),
    };
    const filePath = await this.saveFile(image.fileName, converted.data);
    try {
      this.repository.insert(image);
    } catch (error) {
      await unlink(filePath).catch(() => {});
      throw error;
    }
    return toResponse(this.getImage(id));
  }

  async list(patientId, user) {
    await this.checkPatientAccess(patientId, user);
    return this.repository.findByPatient(patientId).map(toResponse);
  }

  async read(id, user) {
    const image = this.getImage(id);
    await this.checkPatientAccess(image.patientId, user);
    const bytes = await readFile(path.join(this.config.uploadDirectory, image.fileName));
    return { bytes, version: image.version };
  }

  async annotate(id, input, user) {
    const image = this.getImage(id);
    validateAnnotations(input, image);
    if (input.version !== undefined && input.version !== image.version) {
      throw new HttpError(409, 'Bilden har ändrats. Hämta aktuell version och försök igen.');
    }
    const buffer = await annotateImage(path.join(this.config.uploadDirectory, image.fileName),
      image, input.annotations, this.config.maxImagePixels);
    const fileName = `${id}-${randomUUID()}.png`;
    const filePath = await this.saveFile(fileName, buffer);
    try {
      const updated = this.repository.updateFile(id, image.version, fileName, user.id, new Date().toISOString());
      if (!updated) {
        throw new HttpError(409, 'Bilden har ändrats. Hämta aktuell version och försök igen.');
      }
    } catch (error) {
      await unlink(filePath).catch(() => {});
      throw error;
    }
    return toResponse(this.getImage(id));
  }
}
