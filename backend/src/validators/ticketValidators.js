const { z } = require('zod');
const { CATEGORIES, PRIORITIES, STATUSES } = require('../models/Ticket');

const objectId = z.string().regex(/^[a-f\d]{24}$/i, 'Invalid id');

const createTicketSchema = z.object({
  body: z.object({
    title: z.string().trim().min(3).max(120),
    description: z.string().trim().min(10).max(5000),
    category: z.enum(CATEGORIES),
    priority: z.enum(PRIORITIES).optional(),
  }).strict(),
  query: z.object({}).passthrough(),
  params: z.object({}).passthrough(),
});

const listTicketsSchema = z.object({
  body: z.object({}).passthrough(),
  query: z.object({
    status: z.enum(STATUSES).optional(),
    priority: z.enum(PRIORITIES).optional(),
    search: z.string().trim().max(100).optional(),
    sortBy: z.enum(['createdAt', 'updatedAt', 'priority', 'status']).optional(),
    sortOrder: z.enum(['asc', 'desc']).optional(),
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(50).default(10),
  }).strict(),
  params: z.object({}).passthrough(),
});

const ticketIdSchema = z.object({
  body: z.object({}).passthrough(),
  query: z.object({}).passthrough(),
  params: z.object({
    id: objectId,
  }),
});

const userUpdateSchema = z.object({
  body: z.object({
    title: z.string().trim().min(3).max(120).optional(),
    description: z.string().trim().min(10).max(5000).optional(),
    category: z.enum(CATEGORIES).optional(),
  }).strict().refine((data) => Object.keys(data).length > 0, {
    message: 'Provide at least one field to update',
  }),
  query: z.object({}).passthrough(),
  params: z.object({
    id: objectId,
  }),
});

const adminUpdateSchema = z.object({
  body: z.object({
    status: z.enum(STATUSES).optional(),
    priority: z.enum(PRIORITIES).optional(),
  }).strict().refine((data) => Object.keys(data).length > 0, {
    message: 'Provide status or priority',
  }),
  query: z.object({}).passthrough(),
  params: z.object({
    id: objectId,
  }),
});

const commentSchema = z.object({
  body: z.object({
    message: z.string().trim().min(1).max(1000),
  }).strict(),
  query: z.object({}).passthrough(),
  params: z.object({
    id: objectId,
  }),
});

module.exports = {
  createTicketSchema,
  listTicketsSchema,
  ticketIdSchema,
  userUpdateSchema,
  adminUpdateSchema,
  commentSchema,
};
