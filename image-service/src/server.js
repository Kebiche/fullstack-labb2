import { app } from './app.js';
import { config } from './config.js';

app.listen(config.port, () => {
    console.log(`Image-service kör på http://localhost:${config.port}`);
});