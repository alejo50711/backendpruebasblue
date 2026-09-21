import { createCreditRequestSchema, updateStatusSchema } from '../src/validators/creditRequest.validators';
import { parseWithSchema } from '../src/utils/validation';
import { ApiError } from '../src/errors/ApiError';
import { CreditRequestStatus } from '../src/entities/CreditRequest';

describe('createCreditRequestSchema', () => {
  const validPayload = { amount: 1000, termMonths: 12, applicantId: '0102030405' };

  it('accepts a payload within the allowed ranges', () => {
    const result = parseWithSchema(createCreditRequestSchema, validPayload);
    expect(result).toEqual(validPayload);
  });

  it.each([
    ['amount below the minimum', { ...validPayload, amount: 499 }],
    ['amount above the maximum', { ...validPayload, amount: 50001 }],
    ['termMonths below the minimum', { ...validPayload, termMonths: 5 }],
    ['termMonths above the maximum', { ...validPayload, termMonths: 61 }],
    ['termMonths not an integer', { ...validPayload, termMonths: 12.5 }],
    ['empty applicantId', { ...validPayload, applicantId: '' }],
  ])('rejects %s', (_label, payload) => {
    expect(() => parseWithSchema(createCreditRequestSchema, payload)).toThrow(ApiError);
  });

  it('accepts the boundary values 500 and 50000 for amount', () => {
    expect(() => parseWithSchema(createCreditRequestSchema, { ...validPayload, amount: 500 })).not.toThrow();
    expect(() => parseWithSchema(createCreditRequestSchema, { ...validPayload, amount: 50000 })).not.toThrow();
  });

  it('accepts the boundary values 6 and 60 for termMonths', () => {
    expect(() => parseWithSchema(createCreditRequestSchema, { ...validPayload, termMonths: 6 })).not.toThrow();
    expect(() => parseWithSchema(createCreditRequestSchema, { ...validPayload, termMonths: 60 })).not.toThrow();
  });
});

describe('updateStatusSchema', () => {
  it('accepts approved/rejected with a non-empty comment', () => {
    expect(() =>
      parseWithSchema(updateStatusSchema, { status: CreditRequestStatus.APPROVED, comment: 'Cumple requisitos' })
    ).not.toThrow();
  });

  it('rejects a status of "pending" (only approved/rejected are valid transitions)', () => {
    expect(() =>
      parseWithSchema(updateStatusSchema, { status: CreditRequestStatus.PENDING, comment: 'algo' })
    ).toThrow(ApiError);
  });

  it('rejects an empty comment', () => {
    expect(() =>
      parseWithSchema(updateStatusSchema, { status: CreditRequestStatus.APPROVED, comment: '   ' })
    ).toThrow(ApiError);
  });
});
