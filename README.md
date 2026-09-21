# Credito Backend

API REST para gestion de solicitudes de credito: crearlas, listarlas con filtros por estado, y
aprobarlas/rechazarlas dejando un comentario. Incluye login con JWT y dos roles: **cliente**
(crea solicitudes y ve las propias) y **trabajador** (ve todas las solicitudes y las aprueba/rechaza).

- **Stack:** Node.js + TypeScript + Express + TypeORM
- **Base de datos:** PostgreSQL (Aurora, instancia compartida entregada en la prueba)
- **Autenticacion:** JWT (login + token), con autorizacion por rol

> Este repositorio es solo el backend. El frontend (Angular) vive en un repositorio aparte.

## Requisitos previos

- Node.js 18 o superior
- npm
- Acceso de red a la base de datos PostgreSQL entregada en la prueba (host/puerto abajo)

No se usa Docker en esta entrega (se dejo fuera a proposito).

## Como correrlo

```bash
cp .env.example .env
npm install
npm run dev
```

El servidor queda escuchando en `http://localhost:3000` (o el `PORT` que definas).

### Variables de entorno (`.env`)

| Variable | Descripcion | Valor de la prueba |
|---|---|---|
| `PORT` | Puerto del API | `3000` |
| `CORS_ORIGIN` | Origen permitido para CORS (URL del frontend) | `http://localhost:4300` |
| `DB_HOST` | Host de PostgreSQL (Aurora) | `demo-aurora-postgresql.cluster-cbyco0wyw688.us-east-1.rds.amazonaws.com` |
| `DB_PORT` | Puerto de PostgreSQL | `5432` |
| `DB_USERNAME` | Usuario | `usuario_c` |
| `DB_PASSWORD` | Password | `PasswordSeguroC` |
| `DB_NAME` | Base de datos | `demo` (compartida entre candidatos) |
| `DB_SCHEMA` | Esquema propio dentro de `demo` | `esquema_c` (ver nota abajo) |
| `JWT_SECRET` | Secreto para firmar los tokens | cualquier cadena larga (ver `.env.example`) |
| `JWT_EXPIRES_IN` | Duracion del token | `8h` |

**Sobre el esquema:** la base `demo` es compartida entre candidatos; el esquema `public` no tiene
permiso de `CREATE` para el usuario `usuario_c` (comportamiento default desde Postgres 15). Cada
candidato tiene su propio esquema aislado (en este caso `esquema_c`, ya creado y con permisos
completos para `usuario_c`) — ahi es donde vive todo. Confirmado corriendo el proyecto contra la
base real:

1. El backend se conecta a `demo` e intenta `CREATE SCHEMA IF NOT EXISTS` sobre `DB_SCHEMA` (no
   hace nada si ya existe; si el usuario no tuviera permiso ni para eso, se ignora y sigue).
2. TypeORM sincroniza las entidades dentro de ese esquema y crea `users` y `credit_requests` si
   no existen.
3. Se crean automaticamente dos **cuentas demo** (una cliente, una trabajador) si todavia no
   existen — ver la seccion de login mas abajo.

Si te dan un usuario distinto con su propio esquema, solo cambia `DB_USERNAME`, `DB_PASSWORD` y
`DB_SCHEMA` en `.env` y corre `npm run dev` de nuevo. En un entorno real esto se resolveria con
migraciones versionadas en vez de `synchronize`; aqui se opto por `synchronize` porque no habia
forma de correr una migracion a mano contra esta base.

**¿Se recrea la base cada vez que arranca?** No. `CREATE SCHEMA IF NOT EXISTS` no hace nada si el
esquema ya existe, y `synchronize` solo agrega tablas/columnas que falten — no borra datos
existentes en cada arranque. Es seguro reiniciar el backend las veces que quieras, los datos quedan.

### Ver los datos desde la terminal

Sin instalar nada aparte:

```bash
npm run db:check
```

Imprime las tablas que existen en tu esquema y el contenido de `users` y `credit_requests`.

Si preferis un cliente de verdad: `brew install libpq` (Mac, trae `psql`) y despues

```bash
psql "host=demo-aurora-postgresql.cluster-cbyco0wyw688.us-east-1.rds.amazonaws.com port=5432 dbname=demo user=usuario_c"
# pass: PasswordSeguroC
```

y una vez adentro `SET search_path TO esquema_c; \dt; SELECT * FROM credit_requests;`. Tambien
funciona cualquier cliente grafico (TablePlus, DBeaver, Postico) con esos mismos datos de conexion
(recordando fijar el schema a `esquema_c`, no `public`).

### Tests

```bash
npm test
```

Corre las pruebas unitarias de las validaciones de negocio, el login/registro y el servicio de
solicitudes (con repositorios en memoria, sin necesidad de conexion a la base de datos).

## Login y roles

Al arrancar el backend por primera vez se crean dos cuentas de prueba:

| Rol | Correo | Contrasena |
|---|---|---|
| Cliente | `cliente@bluecore.test` | `Bluecore123` |
| Trabajador | `trabajador@bluecore.test` | `Bluecore123` |

- **Cliente**: puede crear solicitudes y ver el estado de **las suyas**. No ve las de otros
  clientes ni puede aprobar/rechazar.
- **Trabajador**: ve **todas** las solicitudes con filtros por estado y puede aprobar/rechazar.
  No crea solicitudes.

Cualquier persona puede crear una cuenta nueva de **cliente** (`POST /api/auth/register` siempre
asigna rol `client`); las cuentas de trabajador solo se crean por seed, simulando que son cuentas
internas provistas por la empresa.

## API

Todas las respuestas tienen el formato `{ "success": boolean, "data" | "message"/"errors" }`.

### Autenticacion

| Metodo | Ruta | Descripcion | Body |
|---|---|---|---|
| `POST` | `/api/auth/register` | Crea una cuenta de cliente y devuelve `{ token, user }` | `{ "fullName": string, "email": string, "password": string }` |
| `POST` | `/api/auth/login` | Login, devuelve `{ token, user }` | `{ "email": string, "password": string }` |
| `GET` | `/api/auth/me` | Devuelve el usuario del token actual | — (requiere `Authorization: Bearer <token>`) |

### Solicitudes de credito

Todas requieren `Authorization: Bearer <token>`.

| Metodo | Ruta | Rol | Descripcion | Body |
|---|---|---|---|---|
| `POST` | `/api/credit-requests` | cliente | Crea una solicitud propia (queda `pending`) | `{ "amount": number, "termMonths": number, "applicantId": string }` |
| `GET` | `/api/credit-requests` | cliente/trabajador | Cliente: solo las propias. Trabajador: todas. | Query opcional `?status=pending\|approved\|rejected` |
| `GET` | `/api/credit-requests/:id` | cliente/trabajador | Una solicitud (404 si es de otro cliente) | — |
| `PATCH` | `/api/credit-requests/:id/status` | trabajador | Aprueba o rechaza una solicitud pendiente | `{ "status": "approved"\|"rejected", "comment": string }` |
| `GET` | `/api/health` | — | Chequeo de salud del servicio | — |

### Reglas de negocio

- Monto: entre `500` y `50000`.
- Plazo: entre `6` y `60` meses.
- La cedula del solicitante es obligatoria.
- Una solicitud nace en estado `pending` y queda asociada al cliente que la creo.
- Solo una solicitud `pending` puede aprobarse o rechazarse (una vez decidida, no se puede
  volver a modificar) — devuelve `409 Conflict` si se intenta.
- El comentario es obligatorio al aprobar/rechazar.
- Un cliente nunca ve ni modifica solicitudes de otro cliente.

### Codigos de estado usados

- `200` operacion exitosa / `201` creado
- `400` datos invalidos (incluye el detalle de cada campo en `errors`)
- `401` falta token, token invalido/expirado, o credenciales de login incorrectas
- `403` token valido pero el rol no tiene permiso para esa accion
- `404` la solicitud no existe (o es de otro cliente — se oculta, no se distingue de "no existe")
- `409` conflicto (la solicitud ya fue decidida)
- `500` error inesperado del servidor

## Decisiones de diseño

- **TypeORM + `synchronize`** en vez de migraciones: no habia acceso a un cliente para correr
  migraciones a mano sobre la base entregada, asi que el propio arranque del backend deja el
  esquema listo. Ver nota en la seccion de variables de entorno.
- **Capa de servicio separada del controlador** (`CreditRequestService`, `AuthService`), con el
  repositorio inyectado por una interfaz propia en vez de depender directo de TypeORM: permite
  probar las reglas de negocio (montos, plazos, transiciones de estado, login/registro) con un
  repositorio en memoria, sin levantar la base de datos.
- **Esquema propio en vez de `public`**: la base `demo` es compartida entre candidatos y `public`
  viene sin permiso de `CREATE` (default de Postgres 15+). El backend usa `DB_SCHEMA` para
  trabajar en un esquema aislado (`esquema_c` en este caso) en vez de asumir `public`.
- **Validacion con Zod**: los limites de negocio (500-50000, 6-60 meses) viven en un solo lugar
  (`src/validators/`) y los mensajes de error van en un array `errors` para que el frontend los
  muestre de forma legible, no solo el codigo HTTP.
- **Solo se puede decidir una solicitud `pending`**: una vez aprobada o rechazada queda fija.
  Es una regla de negocio razonable no explicitada en el enunciado; se documenta aqui para
  poder discutirla.
- **Una solicitud ajena responde 404, no 403**: para un cliente, el id de otro cliente se trata
  como si no existiera, para no confirmar que ese id es valido.
- **JWT basico**: un solo token de acceso (sin refresh token), expira en `8h`, guarda
  `{ sub, email, role }`. Las contrasenas se guardan con `bcrypt`. Es "basico" a proposito —
  no incluye recuperacion de contrasena ni verificacion de correo, fuera del alcance pedido.
- **Registro publico solo crea clientes**: las cuentas de trabajador se aprovisionan por seed
  (`src/config/seed.ts`), simulando que son cuentas internas, no de autoregistro.

## Fuera de alcance en esta entrega

- **Docker**: no se incluye `docker-compose.yml` por decision explicita para esta entrega.

## Estructura

```
src/
  app.ts               Ensamblado de la app Express
  index.ts              Punto de entrada (conecta DB, siembra usuarios demo, levanta el server)
  config/               Env, conexion a la base, seed de usuarios demo
  entities/              Entidades de TypeORM (User, CreditRequest)
  validators/            Esquemas de validacion (Zod)
  services/               Reglas de negocio
  controllers/            Handlers de Express
  routes/                 Definicion de rutas
  middleware/             Autenticacion, autorizacion, manejo de errores
  scripts/                 Utilidades de terminal (db:check)
tests/                    Tests unitarios (Jest)
```
