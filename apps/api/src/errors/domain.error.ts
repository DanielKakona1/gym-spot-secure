export type DomainErrorCode = 'NOT_FOUND' | 'CONFLICT' | 'CAPACITY_EXCEEDED';

export interface DomainError {
  code: DomainErrorCode;
  message: string;
}

export function createNotFoundError(message: string): DomainError {
  return { code: 'NOT_FOUND', message };
}

export function createConflictError(message: string): DomainError {
  return { code: 'CONFLICT', message };
}

export function createCapacityExceededError(message: string): DomainError {
  return { code: 'CAPACITY_EXCEEDED', message };
}

function isDomainErrorWithCode(error: unknown, code: DomainErrorCode): error is DomainError {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    'message' in error &&
    (error as { code?: unknown }).code === code &&
    typeof (error as { message?: unknown }).message === 'string'
  );
}

export function isNotFoundError(error: unknown): error is DomainError {
  return isDomainErrorWithCode(error, 'NOT_FOUND');
}

export function isConflictError(error: unknown): error is DomainError {
  return isDomainErrorWithCode(error, 'CONFLICT');
}

export function isCapacityExceededError(error: unknown): error is DomainError {
  return isDomainErrorWithCode(error, 'CAPACITY_EXCEEDED');
}
