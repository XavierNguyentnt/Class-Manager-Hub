import { z } from 'zod';
import { 
  insertUserSchema, insertClassSchema, insertStudentSchema, 
  insertTransactionSchema, insertAttendanceSchema,
  users, classes, students, transactions, attendances
} from './schema';

export const errorSchemas = {
  validation: z.object({ message: z.string(), field: z.string().optional() }),
  notFound: z.object({ message: z.string() }),
  internal: z.object({ message: z.string() }),
  unauthorized: z.object({ message: z.string() }),
};

export const api = {
  auth: {
    login: {
      method: 'POST' as const,
      path: '/api/login' as const,
      input: z.object({ email: z.string().email(), password: z.string() }),
      responses: { 200: z.custom<typeof users.$inferSelect>(), 401: errorSchemas.unauthorized }
    },
    register: {
      method: 'POST' as const,
      path: '/api/register' as const,
      input: insertUserSchema,
      responses: { 201: z.custom<typeof users.$inferSelect>(), 400: errorSchemas.validation }
    },
    logout: {
      method: 'POST' as const,
      path: '/api/logout' as const,
      responses: { 200: z.object({ message: z.string() }) }
    },
    me: {
      method: 'GET' as const,
      path: '/api/me' as const,
      responses: { 200: z.custom<typeof users.$inferSelect>(), 401: errorSchemas.unauthorized }
    }
  },
  classes: {
    list: {
      method: 'GET' as const,
      path: '/api/classes' as const,
      responses: { 200: z.array(z.custom<typeof classes.$inferSelect>()) }
    },
    get: {
      method: 'GET' as const,
      path: '/api/classes/:id' as const,
      responses: { 200: z.custom<typeof classes.$inferSelect>(), 404: errorSchemas.notFound }
    },
    create: {
      method: 'POST' as const,
      path: '/api/classes' as const,
      input: insertClassSchema,
      responses: { 201: z.custom<typeof classes.$inferSelect>(), 400: errorSchemas.validation }
    },
    dashboard: {
      method: 'GET' as const,
      path: '/api/classes/:id/dashboard' as const,
      responses: { 
        200: z.object({
          totalStudents: z.number(),
          totalIncomeMonth: z.number(),
          totalExpenseMonth: z.number(),
          balance: z.number(),
          averageAttendance: z.number()
        }), 
        404: errorSchemas.notFound 
      }
    }
  },
  students: {
    list: {
      method: 'GET' as const,
      path: '/api/classes/:classId/students' as const,
      responses: { 200: z.array(z.custom<typeof students.$inferSelect>()) }
    },
    create: {
      method: 'POST' as const,
      path: '/api/classes/:classId/students' as const,
      input: insertStudentSchema,
      responses: { 201: z.custom<typeof students.$inferSelect>(), 400: errorSchemas.validation }
    },
  },
  transactions: {
    list: {
      method: 'GET' as const,
      path: '/api/classes/:classId/transactions' as const,
      responses: { 200: z.array(z.custom<typeof transactions.$inferSelect>()) }
    },
    create: {
      method: 'POST' as const,
      path: '/api/classes/:classId/transactions' as const,
      input: insertTransactionSchema.extend({
        amount: z.union([z.string(), z.number()]).transform(val => Number(val))
      }),
      responses: { 201: z.custom<typeof transactions.$inferSelect>(), 400: errorSchemas.validation }
    },
  },
  attendances: {
    list: {
      method: 'GET' as const,
      path: '/api/classes/:classId/attendances' as const,
      input: z.object({ date: z.string().optional() }).optional(),
      responses: { 200: z.array(z.custom<typeof attendances.$inferSelect>()) }
    },
    create: {
      method: 'POST' as const,
      path: '/api/classes/:classId/attendances' as const,
      input: z.object({
        date: z.string(),
        records: z.array(z.object({
          studentId: z.number(),
          status: z.enum(['PRESENT', 'ABSENT', 'LATE']),
          note: z.string().optional()
        }))
      }),
      responses: { 201: z.object({ success: z.boolean() }), 400: errorSchemas.validation }
    },
  }
};

export function buildUrl(path: string, params?: Record<string, string | number>): string {
  let url = path;
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      url = url.replace(`:${key}`, String(value));
    });
  }
  return url;
}
