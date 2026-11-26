process.env.DB_URI = 'mongodb://127.0.0.1:27017/unused';
process.env.JWT_SECRET = 'test-secret-with-enough-length';

const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const { execFile } = require('child_process');
const { promisify } = require('util');
const path = require('path');
const request = require('supertest');
const app = require('./app');
const User = require('./models/User');
const Ticket = require('./models/Ticket');

jest.setTimeout(120000);

let mongo;
let userToken;
let otherToken;
let adminToken;
let ticketId;

beforeAll(async () => {
  mongo = await MongoMemoryServer.create();
  await mongoose.connect(mongo.getUri());
  await User.create({ name: 'Admin', email: 'admin@example.com', password: 'password123', role: 'ADMIN' });
});

afterAll(async () => {
  await mongoose.disconnect();
  if (mongo) await mongo.stop();
});

describe('Support ticket workflow', () => {
  it('registers users securely and authenticates an admin', async () => {
    const user = await request(app).post('/api/auth/register').send({
      name: 'First User', email: 'first@example.com', password: 'password123',
    });
    expect(user.status).toBe(201);
    expect(user.body.data.user.role).toBe('USER');
    expect(user.body.data.user.password).toBeUndefined();
    userToken = user.body.data.token;

    const other = await request(app).post('/api/auth/register').send({
      name: 'Second User', email: 'second@example.com', password: 'password123',
    });
    expect(other.status).toBe(201);
    otherToken = other.body.data.token;

    const escalation = await request(app).post('/api/auth/register').send({
      name: 'Bad User', email: 'bad@example.com', password: 'password123', role: 'ADMIN',
    });
    expect(escalation.status).toBe(400);

    const admin = await request(app).post('/api/auth/login').send({
      email: 'admin@example.com', password: 'password123',
    });
    expect(admin.status).toBe(200);
    adminToken = admin.body.data.token;
  });

  it('enforces ticket ownership and role permissions', async () => {
    const created = await request(app).post('/api/tickets').auth(userToken, { type: 'bearer' }).send({
      title: 'Printer offline', description: 'The office printer cannot be reached.',
      category: 'TECHNICAL', priority: 'HIGH',
    });
    expect(created.status).toBe(201);
    ticketId = created.body.data._id;

    const ownerDetail = await request(app).get(`/api/tickets/${ticketId}`).auth(userToken, { type: 'bearer' });
    expect(ownerDetail.status).toBe(200);
    expect(ownerDetail.body.data._id).toBe(ticketId);
    const denied = await request(app).get(`/api/tickets/${ticketId}`).auth(otherToken, { type: 'bearer' });
    expect(denied.status).toBe(404);
    const deniedComment = await request(app).post(`/api/tickets/${ticketId}/comments`).auth(otherToken, { type: 'bearer' }).send({ message: 'Not mine' });
    expect(deniedComment.status).toBe(404);
    const forbiddenUpdate = await request(app).patch(`/api/tickets/${ticketId}`).auth(userToken, { type: 'bearer' }).send({ status: 'RESOLVED' });
    expect(forbiddenUpdate.status).toBe(400);

    const edit = await request(app).patch(`/api/tickets/${ticketId}`).auth(userToken, { type: 'bearer' }).send({ title: 'Printer still offline' });
    expect(edit.status).toBe(200);
    const comment = await request(app).post(`/api/tickets/${ticketId}/comments`).auth(userToken, { type: 'bearer' }).send({ message: 'Please help.' });
    expect(comment.status).toBe(201);
    const update = await request(app).patch(`/api/tickets/${ticketId}`).auth(adminToken, { type: 'bearer' }).send({ status: 'RESOLVED', priority: 'LOW' });
    expect(update.status).toBe(200);

    const detail = await request(app).get(`/api/tickets/${ticketId}`).auth(adminToken, { type: 'bearer' });
    expect(detail.body.data.comments).toHaveLength(1);
    expect(detail.body.data.activity.map((item) => item.action)).toEqual(expect.arrayContaining([
      'CREATED', 'UPDATED', 'COMMENTED', 'STATUS_CHANGED', 'RESOLVED',
    ]));
    const deleteResolved = await request(app).delete(`/api/tickets/${ticketId}`).auth(userToken, { type: 'bearer' });
    expect(deleteResolved.status).toBe(403);
  });

  it('filters, paginates and scopes lists and statistics', async () => {
    const another = await request(app).post('/api/tickets').auth(otherToken, { type: 'bearer' }).send({
      title: 'Billing question', description: 'Please check the total on my invoice.',
      category: 'BILLING', priority: 'HIGH',
    });
    expect(another.status).toBe(201);
    const mine = await request(app).get('/api/tickets?search=printer&limit=1&page=1').auth(userToken, { type: 'bearer' });
    expect(mine.body.data.pagination.total).toBe(1);
    expect(mine.body.data.tickets[0]._id).toBe(ticketId);
    const otherSearch = await request(app).get('/api/tickets?search=printer').auth(otherToken, { type: 'bearer' });
    expect(otherSearch.body.data.pagination.total).toBe(0);
    const admin = await request(app).get('/api/tickets?priority=HIGH&limit=1').auth(adminToken, { type: 'bearer' });
    expect(admin.body.data.pagination.total).toBe(1);
    expect(admin.body.data.tickets[0]._id).toBe(another.body.data._id);
    const invalid = await request(app).get('/api/tickets?limit=51').auth(adminToken, { type: 'bearer' });
    expect(invalid.status).toBe(400);
    const stats = await request(app).get('/api/tickets/stats').auth(otherToken, { type: 'bearer' });
    expect(stats.body.data).toMatchObject({ total: 1, open: 1 });
    const deleted = await request(app).delete(`/api/tickets/${another.body.data._id}`).auth(otherToken, { type: 'bearer' });
    expect(deleted.status).toBe(200);
    expect(await Ticket.findById(another.body.data._id)).toBeNull();
  });

  it('seeds demo data without deleting or overwriting existing data', async () => {
    const run = promisify(execFile);
    const seed = path.join(__dirname, 'seed.js');
    const options = { env: { ...process.env, DB_URI: mongo.getUri() } };
    await User.create({ name: 'Existing Admin', email: 'admin@helpdesk.com', password: 'existing-password', role: 'ADMIN' });
    const usersBeforeSeed = await User.countDocuments();
    const ticketsBeforeSeed = await Ticket.countDocuments();
    await run(process.execPath, [seed], options);
    const totalUsers = await User.countDocuments();
    const totalTickets = await Ticket.countDocuments();
    expect(totalUsers).toBe(usersBeforeSeed + 1);
    expect(totalTickets).toBe(ticketsBeforeSeed + 2);
    const demoAdmin = await User.findOne({ email: 'admin@helpdesk.com' });
    const demoUser = await User.findOne({ email: 'user1@helpdesk.com' });
    expect(demoAdmin.role).toBe('ADMIN');
    expect(demoUser.role).toBe('USER');
    expect(await Ticket.countDocuments({ createdBy: demoAdmin.id })).toBe(1);
    expect(await Ticket.countDocuments({ createdBy: demoUser.id })).toBe(1);
    await run(process.execPath, [seed], options);
    expect(await User.countDocuments()).toBe(totalUsers);
    expect(await Ticket.countDocuments()).toBe(totalTickets);
    expect(await Ticket.findById(ticketId)).not.toBeNull();
    const existing = await User.findOne({ email: 'first@example.com' }).select('+password');
    expect(await existing.comparePassword('password123')).toBe(true);
    const existingDemoAdmin = await User.findOne({ email: 'admin@helpdesk.com' }).select('+password');
    expect(await existingDemoAdmin.comparePassword('existing-password')).toBe(true);
  });
});
