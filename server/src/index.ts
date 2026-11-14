import { app } from './app.js';
import { ENV } from './config/env.js';

const HOST = '0.0.0.0';

app.listen(ENV.PORT, HOST, () => {
  console.log(`[HabitLess Server] Listening on http://${HOST}:${ENV.PORT} (PORT=${ENV.PORT}, NODE_ENV=${ENV.NODE_ENV})`);
});

