import type http from 'node:http';
import { BadRequestError } from '../errors/http-error.js';

const MAX_BODY_SIZE = 2e6;

export const parseJsonBody = async <T>(
  req: http.IncomingMessage
): Promise<T> => {
  const chunks: Buffer[] = [];
  let received = 0;

  for await (const chunk of req) {
    const bufferChunk = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
    received += bufferChunk.length;

    if (received > MAX_BODY_SIZE) {
      throw new BadRequestError('Request body is too large');
    }

    chunks.push(bufferChunk);
  }

  if (chunks.length === 0) {
    throw new BadRequestError('Request body is required');
  }

  try {
    const raw = Buffer.concat(chunks).toString('utf-8');
    return JSON.parse(raw) as T;
  } catch {
    throw new BadRequestError('Request body contains invalid JSON');
  }
};
