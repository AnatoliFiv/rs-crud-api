import supertest from 'supertest';
import { createServer } from '../src/app/index.js';
import { HttpMessage } from '../src/http/messages.js';
import { HttpStatus } from '../src/http/status-codes.js';

const server = createServer(4001);
const request = supertest(server);
const usersEndpoint = '/api/users';

describe('Users API', () => {
  let createdUserId: string;

  it('returns an empty user list on initial fetch', async () => {
    const response = await request.get(usersEndpoint);
    expect(response.status).toBe(HttpStatus.OK);
    expect(response.body).toEqual([]);
  });

  it('creates a new user', async () => {
    const newUser = {
      username: 'Anatoli',
      age: 25,
      hobbies: ['reading', 'coding'],
    };
    const response = await request.post(usersEndpoint).send(newUser);
    expect(response.status).toBe(HttpStatus.CREATED);
    expect(response.body).toHaveProperty('id');
    expect(response.body.username).toBe('Anatoli');
    expect(response.body.age).toBe(25);
    expect(response.body.hobbies).toEqual(['reading', 'coding']);
    createdUserId = response.body.id;
  });

  it('get user by id', async () => {
    const response = await request.get(`${usersEndpoint}/${createdUserId}`);
    expect(response.status).toBe(HttpStatus.OK);
    expect(response.body.id).toBe(createdUserId);
    expect(response.body.username).toBe('Anatoli');
  });

  it('update existing user', async () => {
    const updateData = { username: 'Anatoli update', age: 30 };
    const response = await request
      .put(`${usersEndpoint}/${createdUserId}`)
      .send(updateData);
    expect(response.status).toBe(HttpStatus.OK);
    expect(response.body.id).toBe(createdUserId);
    expect(response.body.username).toBe('Anatoli update');
    expect(response.body.age).toBe(30);
    expect(response.body.hobbies).toEqual(['reading', 'coding']);
  });

  it('delete user by id', async () => {
    const response = await request.delete(`${usersEndpoint}/${createdUserId}`);
    expect(response.status).toBe(HttpStatus.NO_CONTENT);
    expect(response.body).toEqual({});
  });

  it('returns 404 when requesting the deleted user', async () => {
    const response = await request.get(`${usersEndpoint}/${createdUserId}`);
    expect(response.status).toBe(HttpStatus.NOT_FOUND);
    expect(response.body).toEqual({ message: 'User not found' });
  });

  it('rejects GET request with invalid uuid', async () => {
    const response = await request.get(`${usersEndpoint}/blabla-uuid`);
    expect(response.status).toBe(HttpStatus.BAD_REQUEST);
    expect(response.body).toEqual({
      message: 'User id must be a valid UUID',
    });
  });

  it('rejects POST when required fields are missing', async () => {
    const invalidUser = { username: 'test' };
    const response = await request.post(usersEndpoint).send(invalidUser);
    expect(response.status).toBe(HttpStatus.BAD_REQUEST);
    expect(response.body.message).toContain('age');
  });

  it('returns 404 for an unknown endpoint', async () => {
    const response = await request.get('/api/unknown');
    expect(response.status).toBe(HttpStatus.NOT_FOUND);
    expect(response.body).toEqual({
      message: HttpMessage.RESOURCE_NOT_FOUND,
    });
  });
});
