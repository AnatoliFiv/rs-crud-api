# RS CRUD API

Training project for the RS School “Course Program” module. The goal is to build a TypeScript CRUD API with in-memory storage and horizontal scaling.

## Requirements

- Node.js ≥ 24.10.0
- npm ≥ 10

## Installation

```bash
npm install
```

## Environment variables

Create an `.env` file based on `.env.example`:

```
PORT=4000
```

## Scripts

- `npm run start:dev` — development mode (nodemon + ts-node, auto restart)
- `npm run build` — compile TypeScript into `dist/`
- `npm run start:prod` — production build and run (`build` + `node dist/index.js`)
- `npm run start:multi` — multi-process mode (master on `PORT`, workers on `PORT + n` via Node.js Cluster)
- `npm test` — e2e tests (Jest + Supertest)
- `npm run lint` — run ESLint
- `npm run format` — auto-fix lint warnings

> **Note:** if any start script fails with `EADDRINUSE`, make sure port `4000` is not already taken by another Node.js process (stop previous runs before starting a new one).

## Usage

1. `npm install`
2. Create `.env` based on `.env.example`
3. Choose a mode:
   - Development: `npm run start:dev`
   - Production: `npm run start:prod`
   - Cluster mode: `npm run start:multi`
4. (Optional) Automated tests: `npm test`
5. Manual smoke-test (curl/Postman):

   ```bash
   # 1. Empty list
   curl http://localhost:4000/api/users

   # 2. Create user
   curl -X POST http://localhost:4000/api/users \
     -H "Content-Type: application/json" \
     -d '{"username":"Test","age":30,"hobbies":["gaming"]}'

   # 3. Fetch by ID
   curl http://localhost:4000/api/users/<userId>

   # 4. Update
   curl -X PUT http://localhost:4000/api/users/<userId> \
     -H "Content-Type: application/json" \
     -d '{"age":31}'

   # 5. Delete
   curl -X DELETE http://localhost:4000/api/users/<userId>

   # 6. Ensure 404 after deletion
   curl http://localhost:4000/api/users/<userId>
   ```

## Endpoints

- `GET /api/users` — list all users
- `GET /api/users/{id}` — fetch user by ID
- `POST /api/users` — create a user (`username`, `age`, `hobbies[]`)
- `PUT /api/users/{id}` — update an existing user
- `DELETE /api/users/{id}` — delete a user
