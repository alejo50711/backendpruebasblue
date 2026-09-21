import 'dotenv/config';

function required(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Falta la variable de entorno ${name}. Revisa tu archivo .env (usa .env.example como referencia).`);
  }
  return value;
}

export const env = {
  port: Number(process.env.PORT ?? 3000),
  corsOrigin: process.env.CORS_ORIGIN ?? 'http://localhost:4200',
  // Getter: solo valida DB_* cuando algo realmente se conecta a la base
  // (config/database.ts), no con solo importar este modulo. Así los tests
  // unitarios de servicios/validaciones corren sin necesitar un .env.
  get db() {
    return {
      host: required('DB_HOST'),
      port: Number(process.env.DB_PORT ?? 5432),
      username: required('DB_USERNAME'),
      password: required('DB_PASSWORD'),
      name: required('DB_NAME'),
      // Esquema de Postgres a usar (cada candidato tiene el suyo, "public" no
      // siempre es escribible). Default "public" si no se especifica.
      schema: process.env.DB_SCHEMA ?? 'public',
    };
  },
  jwt: {
    secret: process.env.JWT_SECRET ?? 'dev-secret-change-me',
    expiresIn: process.env.JWT_EXPIRES_IN ?? '8h',
  },
};
