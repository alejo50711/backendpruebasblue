import { CreditRequest, CreditRequestStatus } from '../src/entities/CreditRequest';
import { CreditRequestRepository, CreditRequestService, RequestingUser } from '../src/services/creditRequest.service';
import { UserRole } from '../src/entities/User';
import { ApiError } from '../src/errors/ApiError';

class InMemoryCreditRequestRepository implements CreditRequestRepository {
  private rows: CreditRequest[] = [];
  private nextId = 1;

  async find(options?: { where?: Partial<Pick<CreditRequest, 'status' | 'userId'>> }): Promise<CreditRequest[]> {
    const where = options?.where;
    return this.rows.filter((row) => {
      if (where?.status && row.status !== where.status) return false;
      if (where?.userId && row.userId !== where.userId) return false;
      return true;
    });
  }

  async findOneBy(where: { id: number }): Promise<CreditRequest | null> {
    return this.rows.find((row) => row.id === where.id) ?? null;
  }

  create(data: Partial<CreditRequest>): CreditRequest {
    return { ...data } as CreditRequest;
  }

  async save(entity: CreditRequest): Promise<CreditRequest> {
    if (!entity.id) {
      entity.id = this.nextId++;
      this.rows.push(entity);
    } else {
      const index = this.rows.findIndex((row) => row.id === entity.id);
      this.rows[index] = entity;
    }
    return entity;
  }
}

function buildService() {
  const repository = new InMemoryCreditRequestRepository();
  return { service: new CreditRequestService(repository), repository };
}

const baseInput = { amount: 1000, termMonths: 12, applicantId: '0102030405' };
const client1: RequestingUser = { userId: 1, role: UserRole.CLIENT };
const client2: RequestingUser = { userId: 2, role: UserRole.CLIENT };
const worker: RequestingUser = { userId: 99, role: UserRole.WORKER };

describe('CreditRequestService', () => {
  it('creates a request owned by the requesting client, with status "pending"', async () => {
    const { service } = buildService();
    const created = await service.create(baseInput, client1);
    expect(created.id).toBeDefined();
    expect(created.userId).toBe(client1.userId);
    expect(created.status).toBe(CreditRequestStatus.PENDING);
    expect(created.comment).toBeNull();
  });

  it('filters the list by status', async () => {
    const { service } = buildService();
    const pending = await service.create(baseInput, worker);
    const toReject = await service.create(baseInput, worker);
    await service.updateStatus(toReject.id, { status: CreditRequestStatus.REJECTED, comment: 'No cumple' }, worker);

    const pendingOnly = await service.list(CreditRequestStatus.PENDING, worker);
    expect(pendingOnly.map((r) => r.id)).toEqual([pending.id]);

    const rejectedOnly = await service.list(CreditRequestStatus.REJECTED, worker);
    expect(rejectedOnly.map((r) => r.id)).toEqual([toReject.id]);
  });

  it('approves a pending request and stores the comment', async () => {
    const { service } = buildService();
    const created = await service.create(baseInput, client1);

    const updated = await service.updateStatus(
      created.id,
      { status: CreditRequestStatus.APPROVED, comment: 'Cumple con el perfil crediticio' },
      worker
    );

    expect(updated.status).toBe(CreditRequestStatus.APPROVED);
    expect(updated.comment).toBe('Cumple con el perfil crediticio');
  });

  it('does not allow changing the status of a request that was already decided', async () => {
    const { service } = buildService();
    const created = await service.create(baseInput, client1);
    await service.updateStatus(created.id, { status: CreditRequestStatus.APPROVED, comment: 'Aprobada' }, worker);

    await expect(
      service.updateStatus(created.id, { status: CreditRequestStatus.REJECTED, comment: 'Cambio de opinion' }, worker)
    ).rejects.toThrow(ApiError);
  });

  it('throws a 404 ApiError when the request does not exist', async () => {
    const { service } = buildService();
    await expect(service.getById(999, worker)).rejects.toMatchObject({ statusCode: 404 });
  });

  it('only returns a client their own requests, never another client\'s', async () => {
    const { service } = buildService();
    const own = await service.create(baseInput, client1);
    await service.create(baseInput, client2);

    const list = await service.list(undefined, client1);
    expect(list.map((r) => r.id)).toEqual([own.id]);
  });

  it('hides another client\'s request behind a 404 instead of a 403', async () => {
    const { service } = buildService();
    const other = await service.create(baseInput, client2);

    await expect(service.getById(other.id, client1)).rejects.toMatchObject({ statusCode: 404 });
  });

  it('lets a worker see requests created by any client', async () => {
    const { service } = buildService();
    await service.create(baseInput, client1);
    await service.create(baseInput, client2);

    const list = await service.list(undefined, worker);
    expect(list).toHaveLength(2);
  });
});
