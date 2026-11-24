import { HttpError } from '../errors/HttpError.js';

export function createAuthClient(baseUrl) {
  return {
    async login(username, password) {
      let response;
      try {
        response = await fetch(new URL('/api/auth/login', baseUrl), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username, password }),
          signal: AbortSignal.timeout(5000),
        });
      } catch {
        throw new HttpError(503, 'Auth-tjänsten är inte tillgänglig.');
      }
      if (response.status === 400 || response.status === 401) {
        throw new HttpError(401, 'Fel användarnamn eller lösenord.');
      }
      if (!response.ok) {
        throw new HttpError(502, 'Auth-tjänsten kunde inte kontrollera inloggningen.');
      }
      const user = await response.json().catch(() => {
        throw new HttpError(502, 'Tjänsten returnerade ogiltig JSON.');
      });
      const roles = ['PATIENT', 'DOCTOR', 'PRACTITIONER'];
      if (!Number.isSafeInteger(user.id) || user.id < 1 || !roles.includes(user.role)) {
        throw new HttpError(502, 'Auth-tjänsten returnerade en ogiltig profil.');
      }
      return user;
    },
  };
}
