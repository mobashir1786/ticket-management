process.env.DB_URI = 'mongodb://127.0.0.1:27017/helpdesk-test';
process.env.JWT_SECRET = 'test-secret-with-enough-length';

const request = require('supertest');
const app = require('./app');

describe('Health and routing', () => {
  it('returns API health', async () => {
    const response = await request(app).get('/api/health');
    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
  });

  it('returns a JSON 404 for unknown routes', async () => {
    const response = await request(app).get('/api/not-found');
    expect(response.status).toBe(404);
    expect(response.body.success).toBe(false);
  });

  it('requires authentication for ticket routes', async () => {
    const response = await request(app).get('/api/tickets');
    expect(response.status).toBe(401);
  });

  it('returns a validation error for malformed JSON', async () => {
    const response = await request(app).post('/api/auth/login')
      .set('Content-Type', 'application/json')
      .send('{"email":');
    expect(response.status).toBe(400);
    expect(response.body.message).toBe('Invalid JSON body');
  });
});
