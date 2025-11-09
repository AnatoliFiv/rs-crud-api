import cluster, { Worker } from 'cluster';
import http from 'node:http';
import os from 'node:os';
import { randomUUID } from 'node:crypto';
import dotenv from 'dotenv';
import { HttpError } from './errors/http-error.js';
import {
  assertValidUuid,
  assertUserPayload,
  assertUserUpdatePayload,
} from './modules/users/validator.js';
import type {
  User,
  UserPayload,
  UserUpdatePayload,
} from './modules/users/types.js';
import { createRouter } from './app/router.js';
import { HttpMessage } from './http/messages.js';
import { HttpStatus } from './http/status-codes.js';
dotenv.config({ quiet: true });

interface WorkerInfo {
  worker: Worker;
  port: number;
}

const basePort = Number(process.env.PORT) || 4000;
const available =
  typeof os.availableParallelism === 'function'
    ? os.availableParallelism()
    : os.cpus().length;
const numWorkers = Math.max(available - 1, 1);

if (cluster.isPrimary) {
  console.log(`Master process ${process.pid} is running`);

  const workers: WorkerInfo[] = [];

  for (let index = 0; index < numWorkers; index += 1) {
    const workerPort = basePort + index + 1;
    const worker = cluster.fork({ WORKER_PORT: workerPort.toString() });
    workers.push({ worker, port: workerPort });
  }

  let sharedUsers: User[] = [];

  cluster.on(
    'message',
    (
      worker,
      message: {
        type: string;
        data?: UserPayload | UserUpdatePayload;
        id?: string;
        msgId: string;
      }
    ) => {
      const response: {
        msgId: string;
        type?: 'response' | 'error';
        data?: unknown;
        error?: { statusCode: number; message: string };
      } = { msgId: message.msgId };

      try {
        switch (message.type) {
          case 'getAll': {
            response.type = 'response';
            response.data = [...sharedUsers];
            break;
          }
          case 'getById': {
            assertValidUuid(message.id);
            const user = sharedUsers.find(
              (candidate) => candidate.id === message.id
            );
            if (!user) {
              response.type = 'error';
              response.error = {
                statusCode: HttpStatus.NOT_FOUND,
                message: 'User not found',
              };
              break;
            }
            response.type = 'response';
            response.data = user;
            break;
          }
          case 'create': {
            assertUserPayload(message.data);
            const payload = message.data as UserPayload;
            const newUser: User = {
              id: randomUUID(),
              username: payload.username,
              age: payload.age,
              hobbies: payload.hobbies,
            };
            sharedUsers.push(newUser);
            response.type = 'response';
            response.data = newUser;
            break;
          }
          case 'updateById': {
            assertValidUuid(message.id);
            assertUserUpdatePayload(message.data);
            const index = sharedUsers.findIndex(
              (candidate) => candidate.id === message.id
            );
            if (index === -1) {
              response.type = 'error';
              response.error = {
                statusCode: HttpStatus.NOT_FOUND,
                message: 'User not found',
              };
              break;
            }
            const updatedUser: User = {
              ...sharedUsers[index],
              ...(message.data as Partial<User>),
            };
            sharedUsers[index] = updatedUser;
            response.type = 'response';
            response.data = updatedUser;
            break;
          }
          case 'deleteById': {
            assertValidUuid(message.id);
            const initialLength = sharedUsers.length;
            sharedUsers = sharedUsers.filter(
              (candidate) => candidate.id !== message.id
            );
            if (sharedUsers.length === initialLength) {
              response.type = 'error';
              response.error = {
                statusCode: HttpStatus.NOT_FOUND,
                message: 'User not found',
              };
              break;
            }
            response.type = 'response';
            break;
          }
          default: {
            response.type = 'error';
            response.error = {
              statusCode: HttpStatus.BAD_REQUEST,
              message: 'Unknown operation',
            };
          }
        }
      } catch (error) {
        response.type = 'error';
        response.error =
          error instanceof HttpError
            ? { statusCode: error.statusCode, message: error.message }
            : {
                statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
                message: HttpMessage.INTERNAL_SERVER_ERROR,
              };
      }

      worker.send(response);
    }
  );

  let currentWorkerIndex = 0;

  const balancer = http.createServer((req, res) => {
    const target = workers[currentWorkerIndex];
    currentWorkerIndex = (currentWorkerIndex + 1) % workers.length;

    console.log(
      `[balancer] ${req.method ?? 'UNKNOWN'} ${req.url ?? ''} -> worker ${
        target.worker.process.pid
      } (port ${target.port})`
    );

    const proxyRequest = http.request(
      {
        hostname: 'localhost',
        port: target.port,
        path: req.url,
        method: req.method,
        headers: req.headers,
      },
      (proxyResponse) => {
        res.writeHead(
          proxyResponse.statusCode ?? HttpStatus.INTERNAL_SERVER_ERROR,
          proxyResponse.headers
        );
        proxyResponse.pipe(res);
      }
    );

    req.pipe(proxyRequest);

    proxyRequest.on('error', (error) => {
      console.error(`Proxy error to worker on port ${target.port}:`, error);
      res.writeHead(HttpStatus.INTERNAL_SERVER_ERROR, {
        'Content-Type': 'application/json',
      });
      res.end(JSON.stringify({ message: HttpMessage.INTERNAL_SERVER_ERROR }));
    });
  });

  balancer.listen(basePort, () => {
    console.log(`Load balancer listening on port ${basePort}`);
  });

  cluster.on('exit', (deadWorker) => {
    console.log(`Worker ${deadWorker.process.pid} died. Forking new`);
    const index = workers.findIndex((item) => item.worker.id === deadWorker.id);
    const workerPort =
      index !== -1 ? workers[index].port : basePort + workers.length + 1;
    const newWorker = cluster.fork({ WORKER_PORT: workerPort.toString() });
    if (index !== -1) {
      workers[index] = { worker: newWorker, port: workerPort };
    } else {
      workers.push({ worker: newWorker, port: workerPort });
    }
  });
} else {
  const workerPort = Number(process.env.WORKER_PORT);
  console.log(`Worker ${process.pid} started on port ${workerPort}`);

  const routerHandler = createRouter(workerPort);
  const server = http.createServer((req, res) => {
    console.log(
      `[worker ${process.pid}] ${req.method ?? 'UNKNOWN'} ${req.url ?? ''}`
    );
    routerHandler(req, res).catch((error) => {
      console.error('Worker error:', error);
      res.writeHead(HttpStatus.INTERNAL_SERVER_ERROR, {
        'Content-Type': 'application/json',
      });
      res.end(JSON.stringify({ message: HttpMessage.INTERNAL_SERVER_ERROR }));
    });
  });

  server.listen(workerPort, () => {
    console.log(`Worker listening on port ${workerPort}`);
  });
}
