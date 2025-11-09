import type http from 'node:http';
import { parseJsonBody, sendJson } from '../../http/index.js';
import { HttpStatus } from '../../http/status-codes.js';
import type { UserPayload, UserUpdatePayload } from './types.js';
import {
  createUser,
  deleteUserById,
  getAllUsers,
  getUserById,
  updateUserById,
} from './service.js';

interface ControllerContext {
  req: http.IncomingMessage;
  res: http.ServerResponse;
}

interface ControllerWithIdContext extends ControllerContext {
  userId: string;
}

type Controller = (context: ControllerContext) => Promise<void>;
type ControllerWithId = (context: ControllerWithIdContext) => Promise<void>;

const listUsers: Controller = async ({ res }) => {
  const users = await getAllUsers();
  sendJson(res, HttpStatus.OK, users);
};

const createUserController: Controller = async ({ req, res }) => {
  const payload = await parseJsonBody<UserPayload>(req);
  const user = await createUser(payload);
  sendJson(res, HttpStatus.CREATED, user);
};

const getUserController: ControllerWithId = async ({ res, userId }) => {
  const user = await getUserById(userId);
  sendJson(res, HttpStatus.OK, user);
};

const updateUserController: ControllerWithId = async ({ req, res, userId }) => {
  const payload = await parseJsonBody<UserUpdatePayload>(req);
  const user = await updateUserById(userId, payload);
  sendJson(res, HttpStatus.OK, user);
};

const deleteUserController: ControllerWithId = async ({ res, userId }) => {
  await deleteUserById(userId);
  sendJson(res, HttpStatus.NO_CONTENT);
};

export const usersController = {
  list: listUsers,
  create: createUserController,
  getById: getUserController,
  updateById: updateUserController,
  deleteById: deleteUserController,
};
