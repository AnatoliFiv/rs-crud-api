import type http from 'node:http';

export const sendJson = (
  res: http.ServerResponse,
  statusCode: number,
  payload?: unknown
): void => {
  if (statusCode === 204) {
    res.writeHead(statusCode);
    res.end();
    return;
  }

  const body = JSON.stringify(payload);

  res.writeHead(statusCode, {
    'Content-Type': 'application/json; charset=utf-8',
    'Content-Length': Buffer.byteLength(body),
  });
  res.end(body);
};
