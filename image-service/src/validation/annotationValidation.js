import { HttpError } from '../errors/HttpError.js';

function numberInRange(value, minimum, maximum, field) {
  if (!Number.isFinite(value) || value < minimum || value > maximum) {
    throw new HttpError(400, `${field} måste vara mellan ${minimum} och ${maximum}.`);
  }
}

export function validateAnnotations(input, image) {
  if (input?.version !== undefined && (!Number.isSafeInteger(input.version) || input.version < 1)) {
    throw new HttpError(400, 'version måste vara ett positivt heltal om det anges.');
  }
  if (!input || !Array.isArray(input.annotations) || input.annotations.length < 1 || input.annotations.length > 100) {
    throw new HttpError(400, 'Skicka mellan 1 och 100 annoteringar.');
  }
  for (const annotation of input.annotations) {
    if (!annotation || typeof annotation !== 'object') {
      throw new HttpError(400, 'Ogiltig annotering.');
    }
    if (typeof annotation.color !== 'string' || !/^#[0-9a-f]{6}$/i.test(annotation.color)) {
      throw new HttpError(400, 'Ange färgen som sex hexadecimala tecken, till exempel #ff0000.');
    }
    switch (annotation.type) {
      case 'text':
        if (typeof annotation.text !== 'string' || !annotation.text.trim() || annotation.text.length > 200) {
          throw new HttpError(400, 'Texten måste innehålla mellan 1 och 200 tecken.');
        }
        if (/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/.test(annotation.text)) {
          throw new HttpError(400, 'Texten innehåller ogiltiga kontrolltecken.');
        }
        numberInRange(annotation.fontSize, 8, 128, 'fontSize');
        numberInRange(annotation.x, 0, image.width - 1, 'x');
        numberInRange(annotation.y, 0, image.height - annotation.fontSize, 'y');
        break;
      case 'line':
        numberInRange(annotation.x1, 0, image.width - 1, 'x1');
        numberInRange(annotation.y1, 0, image.height - 1, 'y1');
        numberInRange(annotation.x2, 0, image.width - 1, 'x2');
        numberInRange(annotation.y2, 0, image.height - 1, 'y2');
        numberInRange(annotation.strokeWidth, 1, 20, 'strokeWidth');
        break;
      case 'rectangle':
        numberInRange(annotation.x, 0, image.width - 1, 'x');
        numberInRange(annotation.y, 0, image.height - 1, 'y');
        numberInRange(annotation.width, 1, image.width - annotation.x, 'width');
        numberInRange(annotation.height, 1, image.height - annotation.y, 'height');
        numberInRange(annotation.strokeWidth, 1, 20, 'strokeWidth');
        break;
      default:
        throw new HttpError(400, 'Tillåtna typer är text, line och rectangle.');
    }
  }
}
