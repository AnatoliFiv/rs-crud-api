import 'dotenv/config';
import { createServer } from './app/index.js';

const normalizePort = (value: string | undefined): number => {
  if (!value) return 4000;

  const parsed = Number(value);

  if (!Number.isFinite(parsed) || parsed <= 0) throw new Error(`Invalid PORT value: ${value}`);

  return parsed;
};

const port = normalizePort(process.env.PORT);

const server = createServer(port);

server.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
