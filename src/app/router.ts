import type http from 'node:http';
import { URL } from 'node:url';
import { HttpError } from '../errors/http-error.js';
import { sendJson } from '../http/index.js';
import { usersController } from '../modules/users/index.js';

export type RequestHandler = (
  req: http.IncomingMessage,
  res: http.ServerResponse
) => Promise<void>;

export const createRouter = (port: number): RequestHandler => {
  return async (req, res) => {
    try {
      const { method, url } = req;

      if (!method || !url) {
        sendJson(res, 404, { message: 'Endpoint not found' });
        return;
      }

      const baseHost = req.headers.host ?? `localhost:${port}`;
      const parsedUrl = new URL(url, `http://${baseHost}`);
      const segments = parsedUrl.pathname.split('/').filter(Boolean);

      if (segments[0] !== 'api' || segments[1] !== 'users') {
        sendJson(res, 404, { message: 'Requested resource was not found' });
        return;
      }

      if (segments.length === 2) {
        if (method === 'GET') {
          await usersController.list({ req, res });
          return;
        }

        if (method === 'POST') {
          await usersController.create({ req, res });
          return;
        }

        sendJson(res, 405, {
          message: `Method ${method} is not allowed on /api/users`,
        });
        return;
      }

      if (segments.length === 3) {
        const userId = segments[2];

        switch (method) {
          case 'GET': {
            await usersController.getById({ req, res, userId });
            return;
          }
          case 'PUT': {
            await usersController.updateById({ req, res, userId });
            return;
          }
          case 'DELETE': {
            await usersController.deleteById({ req, res, userId });
            return;
          }
          default:
            sendJson(res, 405, {
              message: `Method ${method} is not allowed on /api/users/${userId}`,
            });
            return;
        }
      }

      sendJson(res, 404, { message: 'Requested resource was not found' });
    } catch (error) {
      if (error instanceof HttpError) {
        sendJson(res, error.statusCode, { message: error.message });
        return;
      }

      console.error('UnhandledError', error);
      sendJson(res, 500, { message: 'Internal server error' });
    }
  };
};
