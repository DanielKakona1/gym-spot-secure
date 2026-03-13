import request from 'supertest';
import { FastifyInstance } from 'fastify';
import { buildApp } from '../app';

describe('gym.controller', () => {
  let app: FastifyInstance;

  beforeEach(async () => {
    app = await buildApp();
    await app.ready();
  });

  afterEach(async () => {
    await app.close();
  });

  it('GET /gyms/:id/capacity returns capacity', async () => {
    const slotTime = '2099-03-12T18:00:00.000Z';

    const response = await request(app.server).get(`/gyms/gym-1/capacity?slotTime=${encodeURIComponent(slotTime)}`).expect(200);

    expect(response.body.gymId).toBe('gym-1');
    expect(response.body.currentBookings).toBeGreaterThanOrEqual(0);
    expect(response.body.capacityLimit).toBe(30);
    expect(response.body.fullnessPercentage).toBe(
      Math.round((response.body.currentBookings / response.body.capacityLimit) * 100),
    );
  });

  it('GET /gyms/:id/capacity returns 404 for unknown gym', async () => {
    const response = await request(app.server).get('/gyms/missing/capacity').expect(404);

    expect(response.body.message).toBe('Gym missing was not found');
  });

  it('POST /gyms/:id/book creates booking', async () => {
    const payload = {
      userId: 'user-1',
      slotTime: '2099-03-12T18:00:00.000Z',
    };

    const response = await request(app.server).post('/gyms/gym-1/book').send(payload).expect(201);

    expect(response.body.gymId).toBe('gym-1');
    expect(response.body.userId).toBe('user-1');
    expect(response.body.slotTime).toBe(payload.slotTime);
    expect(typeof response.body.id).toBe('string');
  });

  it('POST /gyms/:id/book returns 409 on duplicate booking', async () => {
    const payload = {
      userId: 'user-1',
      slotTime: '2099-03-12T18:00:00.000Z',
    };

    await request(app.server).post('/gyms/gym-1/book').send(payload).expect(201);
    const response = await request(app.server).post('/gyms/gym-1/book').send(payload).expect(409);

    expect(response.body.message).toBe('User already has an active booking for this day.');
  });
});
