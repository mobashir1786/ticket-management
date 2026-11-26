const connectDb = require('./config/db');
const User = require('./models/User');
const Ticket = require('./models/Ticket');
const ticketService = require('./services/ticketService');
const commentService = require('./services/commentService');

const samples = [
  {
    owner: 'user1',
    title: 'VPN drops every few minutes',
    description: 'The office VPN disconnects every five minutes on Windows. I need a stable connection for the client call.',
    category: 'TECHNICAL',
    priority: 'HIGH',
    status: 'OPEN',
    userComment: 'It started after yesterday evening.',
  },
  {
    owner: 'admin',
    title: 'Invoice total does not match the quote',
    description: 'Invoice INV-204 shows a higher total than the approved quote. Please check the billing line items.',
    category: 'BILLING',
    priority: 'MEDIUM',
    status: 'IN_PROGRESS',
    adminComment: 'We are comparing the quote and the invoice now.',
  },
];

async function seed() {
  await connectDb();

  async function demoUser(input) {
    const existing = await User.findOne({ email: input.email });
    if (existing) {
      if (existing.role !== input.role) {
        throw new Error(`Existing account ${input.email} has a different role; refusing to change it`);
      }
      console.log(`Using existing account ${input.email}; its password was not changed.`);
      return existing;
    }
    return User.create(input);
  }

  const admin = await demoUser({
    name: 'Helpdesk Admin',
    email: 'admin@helpdesk.com',
    password: 'Admin@123',
    role: 'ADMIN',
  });

  const users = {
    admin,
    user1: await demoUser({
      name: 'Aisha Khan',
      email: 'user1@helpdesk.com',
      password: 'User@123',
      role: 'USER',
    }),
  };

  for (const sample of samples) {
    const owner = users[sample.owner];
    const existing = await Ticket.findOne({ createdBy: owner.id, title: sample.title });
    if (existing) {
      continue;
    }
    const ticket = await ticketService.createTicket(owner, {
      title: sample.title,
      description: sample.description,
      category: sample.category,
      priority: sample.priority,
    });

    if (sample.userComment) {
      await commentService.addComment(owner, ticket.id, sample.userComment);
    }
    if (sample.adminComment) {
      await commentService.addComment(admin, ticket.id, sample.adminComment);
    }
    if (sample.status !== 'OPEN') {
      await ticketService.updateTicket(admin, ticket.id, { status: sample.status });
    }
  }

  console.log('Seed complete. Existing demo accounts were left unchanged.');
  process.exit(0);
}

seed().catch((error) => {
  console.error('Seed failed:', error);
  process.exit(1);
});
