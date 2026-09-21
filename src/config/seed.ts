import bcrypt from 'bcryptjs';
import { AppDataSource } from './database';
import { User, UserRole } from '../entities/User';

const DEMO_PASSWORD = 'Bluecore123';

const DEMO_USERS: Array<Pick<User, 'fullName' | 'email' | 'role'>> = [
  { fullName: 'Cliente Demo', email: 'cliente@bluecore.test', role: UserRole.CLIENT },
  { fullName: 'Analista Bluecore', email: 'trabajador@bluecore.test', role: UserRole.WORKER },
];

/** Crea cuentas demo si no existen, para poder probar login y roles sin acceso manual a la base. */
export async function seedDemoUsers(): Promise<void> {
  const repository = AppDataSource.getRepository(User);

  for (const demo of DEMO_USERS) {
    const existing = await repository.findOneBy({ email: demo.email });
    if (existing) {
      continue;
    }
    const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 10);
    await repository.save(repository.create({ ...demo, passwordHash }));
    console.log(`Usuario demo creado: ${demo.email} (${demo.role})`);
  }
}
