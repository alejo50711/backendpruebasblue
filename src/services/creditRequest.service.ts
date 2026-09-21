import { CreditRequest, CreditRequestStatus } from '../entities/CreditRequest';
import { UserRole } from '../entities/User';
import { ApiError } from '../errors/ApiError';
import { CreateCreditRequestInput, UpdateStatusInput } from '../validators/creditRequest.validators';

export interface RequestingUser {
  userId: number;
  role: UserRole;
}

/**
 * Subconjunto de Repository<CreditRequest> de TypeORM que el servicio necesita.
 * Al depender de esta interfaz (en vez de TypeORM directamente) las reglas de
 * negocio se pueden probar con un repositorio en memoria, sin base de datos.
 */
export interface CreditRequestRepository {
  find(options?: {
    where?: Partial<Pick<CreditRequest, 'status' | 'userId'>>;
    order?: Record<string, 'ASC' | 'DESC'>;
  }): Promise<CreditRequest[]>;
  findOneBy(where: { id: number }): Promise<CreditRequest | null>;
  create(data: Partial<CreditRequest>): CreditRequest;
  save(entity: CreditRequest): Promise<CreditRequest>;
}

export class CreditRequestService {
  constructor(private readonly repository: CreditRequestRepository) {}

  async create(input: CreateCreditRequestInput, requester: RequestingUser): Promise<CreditRequest> {
    const entity = this.repository.create({
      amount: input.amount.toFixed(2),
      termMonths: input.termMonths,
      applicantId: input.applicantId,
      userId: requester.userId,
      status: CreditRequestStatus.PENDING,
      comment: null,
    });
    return this.repository.save(entity);
  }

  /** Un cliente solo ve sus propias solicitudes; un trabajador las ve todas. */
  async list(status: CreditRequestStatus | undefined, requester: RequestingUser): Promise<CreditRequest[]> {
    const where: Partial<Pick<CreditRequest, 'status' | 'userId'>> = {};
    if (status) {
      where.status = status;
    }
    if (requester.role === UserRole.CLIENT) {
      where.userId = requester.userId;
    }

    return this.repository.find({ where, order: { createdAt: 'DESC' } });
  }

  /** Para un cliente, una solicitud ajena se trata como inexistente (no se filtra por permisos, se oculta). */
  async getById(id: number, requester: RequestingUser): Promise<CreditRequest> {
    const found = await this.repository.findOneBy({ id });
    const belongsToClient = requester.role === UserRole.CLIENT && found?.userId !== requester.userId;
    if (!found || belongsToClient) {
      throw ApiError.notFound(`No existe una solicitud con id ${id}`);
    }
    return found;
  }

  async updateStatus(id: number, input: UpdateStatusInput, requester: RequestingUser): Promise<CreditRequest> {
    const request = await this.getById(id, requester);

    if (request.status !== CreditRequestStatus.PENDING) {
      throw ApiError.conflict(
        `La solicitud ${id} ya fue ${request.status === CreditRequestStatus.APPROVED ? 'aprobada' : 'rechazada'} y no se puede modificar`
      );
    }

    request.status = input.status;
    request.comment = input.comment;
    return this.repository.save(request);
  }
}
