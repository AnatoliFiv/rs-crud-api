import type { User, UserPayload, UserUpdatePayload } from './types.js';
import {
  createUser as createUserRecord,
  deleteUserById as deleteUserRecord,
  getAllUsers as getAllUserRecords,
  getUserById as getUserRecordById,
  updateUserById as updateUserRecordById,
} from './repository.js';

export const getAllUsers = async (): Promise<User[]> => {
  return getAllUserRecords();
};

export const getUserById = async (id: string): Promise<User> => {
  return getUserRecordById(id);
};

export const createUser = async (data: UserPayload): Promise<User> => {
  return createUserRecord(data);
};

export const updateUserById = async (
  id: string,
  data: UserUpdatePayload
): Promise<User> => {
  return updateUserRecordById(id, data);
};

export const deleteUserById = async (id: string): Promise<void> => {
  await deleteUserRecord(id);
};
