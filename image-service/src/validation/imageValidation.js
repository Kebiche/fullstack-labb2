import { HttpError } from '../errors/HttpError.js';

export function parsePatientId(value) {
  if (typeof value !== 'string' || value.trim() === '') {
    throw new HttpError(400, 'Ett patientId krävs.');
  }
  const id = Number(value);
  if (!Number.isSafeInteger(id) || id < 1) {
    throw new HttpError(400, 'patientId måste vara ett positivt heltal.');
  }
  return id;
}

export function validateImageId(value) {
  if (typeof value !== 'string' || value.length !== 36 || !/^[a-f0-9-]+$/i.test(value)) {
    throw new HttpError(400, 'Ogiltigt bild-id.');
  }
  return value;
}
