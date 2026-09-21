import 'reflect-metadata';
import { Client } from 'pg';
import { env } from '../config/env';

/** Utilidad de terminal para ver rapido que hay en la base, sin instalar un cliente aparte. */
async function main(): Promise<void> {
  const client = new Client({
    host: env.db.host,
    port: env.db.port,
    user: env.db.username,
    password: env.db.password,
    database: env.db.name,
  });
  await client.connect();
  await client.query(`SET search_path TO "${env.db.schema}"`);

  console.log(`Conectado a "${env.db.name}" (esquema "${env.db.schema}") en ${env.db.host}:${env.db.port}\n`);

  const { rows: tables } = await client.query<{ tablename: string }>(
    'SELECT tablename FROM pg_catalog.pg_tables WHERE schemaname = $1 ORDER BY tablename',
    [env.db.schema]
  );
  const tableNames = tables.map((t) => t.tablename);
  console.log('Tablas encontradas:', tableNames.length ? tableNames.join(', ') : '(ninguna todavia)');

  if (tableNames.includes('users')) {
    const { rows: users } = await client.query('SELECT id, full_name, email, role, created_at FROM users ORDER BY id');
    console.log(`\nUsuarios (${users.length}):`);
    console.table(users);
  }

  if (tableNames.includes('credit_requests')) {
    const { rows: requests } = await client.query(
      'SELECT id, applicant_id, amount, term_months, status, user_id, comment, created_at FROM credit_requests ORDER BY id DESC LIMIT 50'
    );
    console.log(`\nSolicitudes de credito (ultimas ${requests.length}):`);
    console.table(requests);
  }

  await client.end();
}

main().catch((err) => {
  console.error('No se pudo conectar o consultar la base de datos:');
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
