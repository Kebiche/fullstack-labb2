import { config } from '../config.js';

export async function authenticate(request, response, next) {
    const header = request.get('Authorization') || '';

    if (!header.startsWith('Basic ')) {
        return response.status(401).json({ message: 'Authorization header saknas' });
    }

    const decoded = Buffer.from(header.slice(6), 'base64').toString('utf8');
    const [username, password] = decoded.split(':');

    // Fråga auth-service om credentials stämmer
    const res = await fetch(`${config.authServiceUrl}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
    });

    if (!res.ok) {
        return response.status(401).json({ message: 'Fel användarnamn eller lösenord' });
    }

    request.user = await res.json();
    next();
}