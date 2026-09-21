import 'reflect-metadata';
import { createApp } from './app';
import { env } from './config/env';
import { initializeDatabase } from './config/database';
import { seedDemoUsers } from './config/seed';

async function main() {
  try {
    await initializeDatabase();
    console.log('Conexion a la base de datos establecida.');
    await seedDemoUsers();
  } catch (err) {
    console.error('No se pudo conectar a la base de datos:', err);
    console.error('Revisa DB_HOST/DB_PORT/DB_USERNAME/DB_PASSWORD/DB_NAME en tu .env');
    process.exit(1);
  }

  const app = createApp();
  app.listen(env.port, () => {
    console.log(`API escuchando en http://localhost:${env.port}`);
  });
}

main();
