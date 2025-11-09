import { v4 as uuidv4 } from 'uuid';
import { NotFoundError } from '../../errors/http-error.js';
import type { User, UserPayload, UserUpdatePayload } from './types.js';
import {
  assertValidUuid,
  assertUserPayload,
  assertUserUpdatePayload,
} from './validator.js';

let users: User[] = [];

export async function getAllUsers(): Promise<User[]> {
  return [...users];
}

export async function getUserById(id: string): Promise<User> {
  assertValidUuid(id);

  const user = users.find((candidate) => candidate.id === id);

  if (!user) {
    throw new NotFoundError('User not found');
  }

  return user;
}

export async function createUser(data: UserPayload): Promise<User> {
  assertUserPayload(data);

  const newUser: User = {
    id: uuidv4(),
    username: data.username,
    age: data.age,
    hobbies: data.hobbies,
  };

  users.push(newUser);

  return newUser;
}

export async function updateUserById(
  id: string,
  data: UserUpdatePayload
): Promise<User> {
  assertValidUuid(id);
  assertUserUpdatePayload(data);

  const index = users.findIndex((candidate) => candidate.id === id);

  if (index === -1) {
    throw new NotFoundError('User not found');
  }

  const updatedUser: User = {
    ...users[index],
    ...data,
  };

  users[index] = updatedUser;

  return updatedUser;
}

export async function deleteUserById(id: string): Promise<void> {
  assertValidUuid(id);

  const initialLength = users.length;
  users = users.filter((candidate) => candidate.id !== id);

  if (users.length === initialLength) {
    throw new NotFoundError('User not found');
  }
}
