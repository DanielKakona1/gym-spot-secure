import type { FastifyReply } from 'fastify';

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

export function sendError(error: unknown, reply: FastifyReply): void {
  if (isNotFoundError(error)) {
    reply.status(404).send({ success: false, error: error.message, message: error.message });
    return;
  }

  if (isConflictError(error) || isCapacityExceededError(error)) {
    reply.status(409).send({ success: false, error: error.message, message: error.message });
    return;
  }

  reply.status(500).send({ success: false, error: 'Unexpected error', message: 'Unexpected error' });
}
