import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { Client } from 'pg';
import { env } from './env';
import { CreditRequest } from '../entities/CreditRequest';
import { User } from '../entities/User';

/**
 * La base ("demo") ya existe y es compartida entre varios candidatos, cada
 * uno con su propio esquema (DB_SCHEMA). "public" suele venir sin permiso de
 * CREATE (default desde Postgres 15), asi que creamos el esquema propio si
 * todavia no existe. Si el usuario no tiene ni ese permiso, se ignora y se
 * intenta usar el esquema tal cual (puede que ya exista y este listo).
 */
async function ensureSchemaExists(): Promise<void> {
  const client = new Client({
    host: env.db.host,
    port: env.db.port,
    user: env.db.username,
    password: env.db.password,
    database: env.db.name,
  });

  await client.connect();
  try {
    await client.query(`CREATE SCHEMA IF NOT EXISTS "${env.db.schema}"`);
  } finally {
    await client.end();
  }
}

export const AppDataSource = new DataSource({
  type: 'postgres',
  host: env.db.host,
  port: env.db.port,
  username: env.db.username,
  password: env.db.password,
  database: env.db.name,
  schema: env.db.schema,
  entities: [CreditRequest, User],
  // Sin migraciones: la prueba no da acceso a un cliente para correrlas a mano,
  // asi que el esquema se sincroniza solo al arrancar. En un entorno real esto
  // se reemplazaria por migraciones versionadas.
  synchronize: true,
  logging: false,
});

export async function initializeDatabase(): Promise<void> {
  try {
    await ensureSchemaExists();
  } catch (err) {
    console.warn(
      `No se pudo verificar/crear el esquema "${env.db.schema}" (puede ser normal si el usuario no tiene ese permiso). Se intenta usarlo tal cual:`,
      err instanceof Error ? err.message : err
    );
  }
  await AppDataSource.initialize();
}
