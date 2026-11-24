import { HttpError } from '../errors/HttpError.js';

export function createJournalClient(baseUrl) {
  return {
    async getPatient(patientId) {
      let response;
      try {
        response = await fetch(new URL(`/api/patients/${patientId}`, baseUrl), {
          signal: AbortSignal.timeout(5000),
        });
      } catch {
        throw new HttpError(503, 'Journal-tjänsten är inte tillgänglig.');
      }
      if (response.status === 404) {
        throw new HttpError(404, 'Patienten hittades inte.');
      }
      if (!response.ok) {
        throw new HttpError(502, 'Journal-tjänsten kunde inte hämta patienten.');
      }
      const patient = await response.json().catch(() => {
        throw new HttpError(502, 'Tjänsten returnerade ogiltig JSON.');
      });
      if (patient.id !== patientId) {
        throw new HttpError(502, 'Journal-tjänsten returnerade en ogiltig patient.');
      }
      return patient;
    },
  };
}
