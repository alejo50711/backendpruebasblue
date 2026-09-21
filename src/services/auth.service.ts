import bcrypt from 'bcryptjs';
import { User, UserRole } from '../entities/User';
import { ApiError } from '../errors/ApiError';
import { LoginInput, RegisterInput } from '../validators/auth.validators';
import { signToken } from '../utils/jwt';

const SALT_ROUNDS = 10;

export interface UserRepository {
  findOneBy(where: { email?: string; id?: number }): Promise<User | null>;
  create(data: Partial<User>): User;
  save(entity: User): Promise<User>;
}

export interface AuthResult {
  token: string;
  user: Pick<User, 'id' | 'fullName' | 'email' | 'role'>;
}

function toAuthResult(user: User): AuthResult {
  return {
    token: signToken({ sub: user.id, email: user.email, role: user.role }),
    user: { id: user.id, fullName: user.fullName, email: user.email, role: user.role },
  };
}

export class AuthService {
  constructor(private readonly repository: UserRepository) {}

  async register(input: RegisterInput): Promise<AuthResult> {
    const existing = await this.repository.findOneBy({ email: input.email });
    if (existing) {
      throw ApiError.conflict('Ya existe una cuenta con ese correo');
    }

    const passwordHash = await bcrypt.hash(input.password, SALT_ROUNDS);
    const user = this.repository.create({
      fullName: input.fullName,
      email: input.email,
      passwordHash,
      role: UserRole.CLIENT,
    });
    const saved = await this.repository.save(user);
    return toAuthResult(saved);
  }

  async login(input: LoginInput): Promise<AuthResult> {
    const user = await this.repository.findOneBy({ email: input.email });
    if (!user) {
      throw ApiError.unauthorized('Correo o contrasena incorrectos');
    }

    const passwordMatches = await bcrypt.compare(input.password, user.passwordHash);
    if (!passwordMatches) {
      throw ApiError.unauthorized('Correo o contrasena incorrectos');
    }

    return toAuthResult(user);
  }
}
