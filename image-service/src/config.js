import path from 'node:path';
import { fileURLToPath } from 'node:url';

const serviceDirectory = fileURLToPath(new URL('../', import.meta.url));

export const config = {
    port: Number(process.env.PORT || 3001),
    authServiceUrl: process.env.AUTH_SERVICE_URL || 'http://localhost:8081',
    uploadDirectory: path.resolve(serviceDirectory, 'uploads'),
};