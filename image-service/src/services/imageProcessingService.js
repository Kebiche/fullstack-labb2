import sharp from 'sharp';
import { HttpError } from '../errors/HttpError.js';

export async function convertImage(buffer, maxImagePixels) {
  try {
    const image = sharp(buffer, { limitInputPixels: maxImagePixels });
    const metadata = await image.metadata();
    if (!['jpeg', 'png', 'webp'].includes(metadata.format) || metadata.pages > 1) {
      throw new Error('Unsupported image format');
    }
    return await image.rotate().png().toBuffer({ resolveWithObject: true });
  } catch {
    throw new HttpError(400, 'Skicka en giltig PNG-, JPEG- eller WebP-bild, högst 20 megapixlar.');
  }
}

// Texten ska visas som vanlig text i bildens SVG-lager.
function escapeText(text) {
  return text.replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&apos;');
}

function draw(annotation) {
  switch (annotation.type) {
    case 'text':
      return `<text x="${annotation.x}" y="${annotation.y + annotation.fontSize}"
                    font-family="sans-serif" font-size="${annotation.fontSize}"
                    fill="${annotation.color}">${escapeText(annotation.text)}</text>`;
    case 'line':
      return `<line x1="${annotation.x1}" y1="${annotation.y1}"
                    x2="${annotation.x2}" y2="${annotation.y2}"
                    stroke="${annotation.color}" stroke-width="${annotation.strokeWidth}"
                    stroke-linecap="round" />`;
    case 'rectangle':
      return `<rect x="${annotation.x}" y="${annotation.y}"
                    width="${annotation.width}" height="${annotation.height}"
                    fill="none" stroke="${annotation.color}"
                    stroke-width="${annotation.strokeWidth}" />`;
  }
}

export async function annotateImage(filePath, image, annotations, maxImagePixels) {
  const drawing = annotations.map(draw).join('\n');
  const overlay = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg"
      width="${image.width}" height="${image.height}">${drawing}</svg>`);
  return sharp(filePath, { limitInputPixels: maxImagePixels })
    .composite([{ input: overlay }])
    .png()
    .toBuffer();
}
