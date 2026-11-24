import { createApp } from './app.js';
import { config } from './config.js';

const { app, repository } = createApp(config);
const server = app.listen(config.port, () => {
  console.log(`Bildtjänsten kör på http://localhost:${server.address().port}`);
});

function stop() {
  server.close(() => {
    repository.close();
    process.exit(0);
  });
}

process.once('SIGINT', stop);
process.once('SIGTERM', stop);
