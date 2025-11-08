# RS CRUD API

Training project for the RS School “Course Program” module. The goal is to build an in-memory CRUD API.

## Requirements

- Node.js ≥ 24.10.0
- npm ≥ 10

## Installation

```bash
npm install
```

## Environment variables

Create an `.env` file based on `.env.example` and provide the required values, e.g.:

```
PORT=4000
```

## Scripts

- `npm run start:dev` — start the server in development mode (ESM with automatic restart)
- `npm run build` — compile TypeScript sources into `dist`
- `npm run start:prod` — production build and run (`npm run build` + `node dist/index.js`)
- `npm test` — run Jest tests
- `npm run lint` — run ESLint

## Current status

- TypeScript, Jest, ESLint, and nodemon are configured for an ESM project
- A placeholder HTTP server (`src/index.ts`) returns a simple JSON response and reads `PORT` from `.env`
- CRUD implementation and final tests will be added next


