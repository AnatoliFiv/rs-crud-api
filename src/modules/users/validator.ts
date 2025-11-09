import { BadRequestError } from '../../errors/http-error.js';
import type { UserPayload, UserUpdatePayload } from './types.js';

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function assertValidUuid(id: unknown): asserts id is string {
  if (typeof id !== 'string' || !UUID_REGEX.test(id)) {
    throw new BadRequestError('User id must be a valid UUID');
  }
}

export function assertUserPayload(data: unknown): asserts data is UserPayload {
  if (typeof data !== 'object' || data === null) {
    throw new BadRequestError(
      'Request body must be an object with "username","age","hobbies"'
    );
  }

  const candidate = data as Record<string, unknown>;

  if (
    typeof candidate.username !== 'string' ||
    candidate.username.trim().length === 0
  ) {
    throw new BadRequestError(
      'Field "username" is required and must be a non-empty string'
    );
  }

  if (typeof candidate.age !== 'number' || Number.isNaN(candidate.age)) {
    throw new BadRequestError('Field "age" is required and must be a number');
  }

  if (!Array.isArray(candidate.hobbies)) {
    throw new BadRequestError(
      'Field "hobbies" is required and must be an array'
    );
  }

  if (!candidate.hobbies.every((h: unknown) => typeof h === 'string')) {
    throw new BadRequestError('Field "hobbies" must contain only strings');
  }
}

export function assertUserUpdatePayload(
  data: unknown
): asserts data is UserUpdatePayload {
  if (typeof data !== 'object' || data === null) {
    throw new BadRequestError('Request body must be an object');
  }

  const candidate = data as Record<string, unknown>;

  if (
    candidate.username !== undefined &&
    (typeof candidate.username !== 'string' ||
      candidate.username.trim().length === 0)
  ) {
    throw new BadRequestError('Field "username" must be a non-empty string');
  }

  if (
    candidate.age !== undefined &&
    (typeof candidate.age !== 'number' || Number.isNaN(candidate.age))
  ) {
    throw new BadRequestError('Field "age" must be a number');
  }

  if (candidate.hobbies !== undefined) {
    if (!Array.isArray(candidate.hobbies)) {
      throw new BadRequestError('Field "hobbies" must be an array');
    }
    if (!candidate.hobbies.every((h: unknown) => typeof h === 'string')) {
      throw new BadRequestError('Field "hobbies" must contain only strings');
    }
  }
}
