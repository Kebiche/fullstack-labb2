import { HttpError } from '../errors/HttpError.js';

export function authenticate(authClient) {
  return async (request, response, next) => {
    const header = request.get('Authorization') || '';
    if (!header.startsWith('Basic ') || header.length > 4096) {
      throw new HttpError(401, 'Logga in med Basic Auth.');
    }
    const credentials = Buffer.from(header.slice(6), 'base64').toString('utf8');
    const separator = credentials.indexOf(':');
    if (separator < 1) {
      throw new HttpError(401, 'Användarnamn och lösenord krävs.');
    }
    const username = credentials.slice(0, separator);
    const password = credentials.slice(separator + 1);
    request.user = await authClient.login(username, password);
    next();
  };
}

export function requireStaff(request, response, next) {
  if (!['DOCTOR', 'PRACTITIONER'].includes(request.user.role)) {
    throw new HttpError(403, 'Endast personal kan ladda upp bilder.');
  }
  next();
}

export function requireDoctor(request, response, next) {
  if (request.user.role !== 'DOCTOR') {
    throw new HttpError(403, 'Endast läkare kan ändra bilder.');
  }
  next();
}
