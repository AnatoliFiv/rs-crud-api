import http from 'node:http';
import { createRouter } from './router.js';

export const createServer = (port: number): http.Server => {
  const router = createRouter(port);

  return http.createServer((req, res) => {
    void router(req, res);
  });
};
