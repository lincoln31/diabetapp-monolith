import { createApp } from './app';
import { env } from './config/env';

const app = createApp();

// '0.0.0.0' para aceptar conexiones del móvil en la red local
app.listen(env.PORT, '0.0.0.0', () => {
  console.log(`🚀 Servidor escuchando en el puerto ${env.PORT} (${env.NODE_ENV})`);
});
