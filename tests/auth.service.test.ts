import { AuthService, UserRepository } from '../src/services/auth.service';
import { User, UserRole } from '../src/entities/User';

class InMemoryUserRepository implements UserRepository {
  private rows: User[] = [];
  private nextId = 1;

  async findOneBy(where: { email?: string; id?: number }): Promise<User | null> {
    return (
      this.rows.find((row) => (where.email ? row.email === where.email : false) || (where.id ? row.id === where.id : false)) ??
      null
    );
  }

  create(data: Partial<User>): User {
    return { ...data } as User;
  }

  async save(entity: User): Promise<User> {
    if (!entity.id) {
      entity.id = this.nextId++;
      this.rows.push(entity);
    }
    return entity;
  }
}

function buildService() {
  const repository = new InMemoryUserRepository();
  return { service: new AuthService(repository), repository };
}

describe('AuthService', () => {
  const registerInput = { fullName: 'Ana Cliente', email: 'ana@example.com', password: 'secreta123' };

  it('registers a new user as a client and never stores the plain password', async () => {
    const { service, repository } = buildService();
    const result = await service.register(registerInput);

    expect(result.user.role).toBe(UserRole.CLIENT);
    expect(result.token).toEqual(expect.any(String));

    const stored = await repository.findOneBy({ email: registerInput.email });
    expect(stored?.passwordHash).toBeDefined();
    expect(stored?.passwordHash).not.toBe(registerInput.password);
  });

  it('rejects registering an email that is already taken', async () => {
    const { service } = buildService();
    await service.register(registerInput);

    await expect(service.register(registerInput)).rejects.toMatchObject({ statusCode: 409 });
  });

  it('logs in with the correct credentials', async () => {
    const { service } = buildService();
    await service.register(registerInput);

    const result = await service.login({ email: registerInput.email, password: registerInput.password });
    expect(result.user.email).toBe(registerInput.email);
    expect(result.token).toEqual(expect.any(String));
  });

  it('rejects login with a wrong password', async () => {
    const { service } = buildService();
    await service.register(registerInput);

    await expect(service.login({ email: registerInput.email, password: 'incorrecta' })).rejects.toMatchObject({
      statusCode: 401,
    });
  });

  it('rejects login for an email that does not exist', async () => {
    const { service } = buildService();
    await expect(service.login({ email: 'nadie@example.com', password: 'lo-que-sea' })).rejects.toMatchObject({
      statusCode: 401,
    });
  });
});
