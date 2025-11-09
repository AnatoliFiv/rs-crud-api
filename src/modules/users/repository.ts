import cluster from 'cluster';
import { randomUUID } from 'crypto';
import { HttpError, NotFoundError } from '../../errors/http-error.js';
import { HttpStatus } from '../../http/status-codes.js';
import type { User, UserPayload, UserUpdatePayload } from './types.js';
import {
  assertValidUuid,
  assertUserPayload,
  assertUserUpdatePayload,
} from './validator.js';

let localUsers: User[] = [];

const isClusterWorker = (): boolean => !cluster.isPrimary && cluster.isWorker;

type MasterRequestBase =
  | { type: 'getAll' }
  | { type: 'getById'; id: string }
  | { type: 'create'; data: UserPayload }
  | { type: 'updateById'; id: string; data: UserUpdatePayload }
  | { type: 'deleteById'; id: string };

type MasterResponse =
  | { type: 'response'; msgId: string; data?: unknown }
  | {
      type: 'error';
      msgId: string;
      error: { statusCode: number; message: string };
    };

async function sendToMaster<T>(message: MasterRequestBase): Promise<T> {
  return await new Promise<T>((resolve, reject) => {
    if (typeof process.send !== 'function') {
      reject(
        new HttpError(
          HttpStatus.INTERNAL_SERVER_ERROR,
          'Inter-process communication channel is unavailable'
        )
      );
      return;
    }

    const msgId = Math.random().toString(36).slice(2);
    process.send({ ...message, msgId });

    const listener = (raw: unknown) => {
      if (
        typeof raw !== 'object' ||
        raw === null ||
        (raw as { msgId?: string }).msgId !== msgId
      ) {
        return;
      }

      process.off('message', listener);
      const response = raw as MasterResponse;

      if (response.type === 'response') {
        resolve(response.data as T);
        return;
      }

      reject(new HttpError(response.error.statusCode, response.error.message));
    };

    process.on('message', listener);
  });
}

export async function getAllUsers(): Promise<User[]> {
  if (isClusterWorker()) {
    return sendToMaster<User[]>({ type: 'getAll' });
  }

  return [...localUsers];
}

export async function getUserById(id: string): Promise<User> {
  if (isClusterWorker()) {
    return sendToMaster<User>({ type: 'getById', id });
  }

  assertValidUuid(id);

  const user = localUsers.find((candidate) => candidate.id === id);

  if (!user) {
    throw new NotFoundError('User not found');
  }

  return user;
}

export async function createUser(data: UserPayload): Promise<User> {
  if (isClusterWorker()) {
    return sendToMaster<User>({ type: 'create', data });
  }

  assertUserPayload(data);

  const newUser: User = {
    id: randomUUID(),
    username: data.username,
    age: data.age,
    hobbies: data.hobbies,
  };

  localUsers.push(newUser);

  return newUser;
}

export async function updateUserById(
  id: string,
  data: UserUpdatePayload
): Promise<User> {
  if (isClusterWorker()) {
    return sendToMaster<User>({ type: 'updateById', id, data });
  }

  assertValidUuid(id);
  assertUserUpdatePayload(data);

  const index = localUsers.findIndex((candidate) => candidate.id === id);

  if (index === -1) {
    throw new NotFoundError('User not found');
  }

  const updatedUser: User = {
    ...localUsers[index],
    ...data,
  };

  localUsers[index] = updatedUser;

  return updatedUser;
}

export async function deleteUserById(id: string): Promise<void> {
  if (isClusterWorker()) {
    await sendToMaster<void>({ type: 'deleteById', id });
    return;
  }

  assertValidUuid(id);

  const initialLength = localUsers.length;
  localUsers = localUsers.filter((candidate) => candidate.id !== id);

  if (localUsers.length === initialLength) {
    throw new NotFoundError('User not found');
  }
}
