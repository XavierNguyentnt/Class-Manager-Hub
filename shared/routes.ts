import { z } from "zod";
import {
  insertUserSchema,
  insertClassSchema,
  insertStudentSchema,
  insertStudentSuspensionSchema,
  insertTransactionSchema,
  insertAttendanceSchema,
  users,
  classes,
  students,
  studentSuspensions,
  transactions,
  attendances,
  classOffDays,
} from "./schema";

export const errorSchemas = {
  validation: z.object({ message: z.string(), field: z.string().optional() }),
  notFound: z.object({ message: z.string() }),
  internal: z.object({ message: z.string() }),
  unauthorized: z.object({ message: z.string() }),
};

export const api = {
  auth: {
    login: {
      method: "POST" as const,
      path: "/api/login" as const,
      input: z.object({ email: z.string().email(), password: z.string() }),
      responses: {
        200: z.custom<typeof users.$inferSelect>(),
        401: errorSchemas.unauthorized,
      },
    },
    register: {
      method: "POST" as const,
      path: "/api/register" as const,
      input: insertUserSchema,
      responses: {
        201: z.custom<typeof users.$inferSelect>(),
        400: errorSchemas.validation,
      },
    },
    logout: {
      method: "POST" as const,
      path: "/api/logout" as const,
      responses: { 200: z.object({ message: z.string() }) },
    },
    me: {
      method: "GET" as const,
      path: "/api/me" as const,
      responses: {
        200: z.custom<typeof users.$inferSelect>(),
        401: errorSchemas.unauthorized,
      },
    },
  },
  classes: {
    list: {
      method: "GET" as const,
      path: "/api/classes" as const,
      responses: { 200: z.array(z.custom<typeof classes.$inferSelect>()) },
    },
    get: {
      method: "GET" as const,
      path: "/api/classes/:id" as const,
      responses: {
        200: z.custom<typeof classes.$inferSelect>(),
        404: errorSchemas.notFound,
      },
    },
    create: {
      method: "POST" as const,
      path: "/api/classes" as const,
      input: insertClassSchema.extend({
        teacherId: z.string().uuid().optional(),
      }),
      responses: {
        201: z.custom<typeof classes.$inferSelect>(),
        400: errorSchemas.validation,
      },
    },
    updateSchedule: {
      method: "PATCH" as const,
      path: "/api/classes/:id/schedule" as const,
      input: z.object({
        scheduleDays: z
          .array(
            z.enum(["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"])
          )
          .nullable(),
      }),
      responses: {
        200: z.custom<typeof classes.$inferSelect>(),
        404: errorSchemas.notFound,
        400: errorSchemas.validation,
      },
    },
    updateTeacher: {
      method: "PATCH" as const,
      path: "/api/classes/:id/teacher" as const,
      input: z.object({ teacherId: z.string().uuid() }),
      responses: {
        200: z.custom<typeof classes.$inferSelect>(),
        404: errorSchemas.notFound,
        400: errorSchemas.validation,
      },
    },
    addTeacher: {
      method: "POST" as const,
      path: "/api/classes/:id/teachers" as const,
      input: z.object({
        teacherId: z.string().uuid(),
        teacherRole: z
          .enum(["PRIMARY_TEACHER", "ASSISTANT_TEACHER"])
          .optional(),
      }),
      responses: {
        200: z.object({ success: z.boolean() }),
        400: errorSchemas.validation,
        404: errorSchemas.notFound,
      },
    },
    removeTeacher: {
      method: "DELETE" as const,
      path: "/api/classes/:id/teachers/:teacherId" as const,
      responses: {
        200: z.object({ success: z.boolean() }),
        404: errorSchemas.notFound,
      },
    },
    listTeachers: {
      method: "GET" as const,
      path: "/api/classes/:id/teachers" as const,
      responses: {
        200: z.array(
          z.object({
            user: z.custom<typeof users.$inferSelect>(),
            teacherRole: z.enum(["PRIMARY_TEACHER", "ASSISTANT_TEACHER"]),
          }),
        ),
        404: errorSchemas.notFound,
      },
    },
    addMonitor: {
      method: "POST" as const,
      path: "/api/classes/:id/monitors" as const,
      input: z.object({
        monitorId: z.string().uuid(),
        monitorRole: z.enum(["CLASS_MONITOR", "VICE_MONITOR"]).optional(),
      }),
      responses: {
        200: z.object({ success: z.boolean() }),
        400: errorSchemas.validation,
        404: errorSchemas.notFound,
      },
    },
    removeMonitor: {
      method: "DELETE" as const,
      path: "/api/classes/:id/monitors/:monitorId" as const,
      responses: {
        200: z.object({ success: z.boolean() }),
        404: errorSchemas.notFound,
      },
    },
    listMonitors: {
      method: "GET" as const,
      path: "/api/classes/:id/monitors" as const,
      responses: {
        200: z.array(
          z.object({
            user: z.custom<typeof users.$inferSelect>(),
            monitorRole: z.enum(["CLASS_MONITOR", "VICE_MONITOR"]),
          }),
        ),
        404: errorSchemas.notFound,
      },
    },
    dashboard: {
      method: "GET" as const,
      path: "/api/classes/:id/dashboard" as const,
      responses: {
        200: z.object({
          totalStudents: z.number(),
          totalIncomeMonth: z.number(),
          totalExpenseMonth: z.number(),
          balance: z.number(),
          averageAttendance: z.number(),
        }),
        404: errorSchemas.notFound,
      },
    },
  },
  teachers: {
    list: {
      method: "GET" as const,
      path: "/api/teachers" as const,
      responses: { 200: z.array(z.custom<typeof users.$inferSelect>()) },
    },
  },
  monitors: {
    list: {
      method: "GET" as const,
      path: "/api/monitors" as const,
      responses: { 200: z.array(z.custom<typeof users.$inferSelect>()) },
    },
  },
  students: {
    list: {
      method: "GET" as const,
      path: "/api/classes/:classId/students" as const,
      responses: { 200: z.array(z.custom<typeof students.$inferSelect>()) },
    },
    create: {
      method: "POST" as const,
      path: "/api/classes/:classId/students" as const,
      input: insertStudentSchema,
      responses: {
        201: z.custom<typeof students.$inferSelect>(),
        400: errorSchemas.validation,
      },
    },
    update: {
      method: "PATCH" as const,
      path: "/api/classes/:classId/students/:id" as const,
      input: insertStudentSchema.partial(),
      responses: {
        200: z.custom<typeof students.$inferSelect>(),
        400: errorSchemas.validation,
        404: errorSchemas.notFound,
      },
    },
    delete: {
      method: "DELETE" as const,
      path: "/api/classes/:classId/students/:id" as const,
      responses: {
        200: z.object({ success: z.boolean() }),
        404: errorSchemas.notFound,
      },
    },
    suspensionsByClass: {
      method: "GET" as const,
      path: "/api/classes/:classId/student-suspensions" as const,
      responses: {
        200: z.array(z.custom<typeof studentSuspensions.$inferSelect>()),
      },
    },
    suspensions: {
      list: {
        method: "GET" as const,
        path: "/api/classes/:classId/students/:id/suspensions" as const,
        responses: {
          200: z.array(z.custom<typeof studentSuspensions.$inferSelect>()),
        },
      },
      create: {
        method: "POST" as const,
        path: "/api/classes/:classId/students/:id/suspensions" as const,
        input: insertStudentSuspensionSchema.extend({
          effectiveFrom: z.string(),
          effectiveTo: z.string().optional().nullable(),
        }),
        responses: {
          201: z.custom<typeof studentSuspensions.$inferSelect>(),
          400: errorSchemas.validation,
        },
      },
      update: {
        method: "PATCH" as const,
        path: "/api/classes/:classId/students/:id/suspensions/:suspensionId" as const,
        input: insertStudentSuspensionSchema
          .extend({
            effectiveFrom: z.string().optional(),
            effectiveTo: z.string().optional().nullable(),
          })
          .partial(),
        responses: {
          200: z.custom<typeof studentSuspensions.$inferSelect>(),
          400: errorSchemas.validation,
          404: errorSchemas.notFound,
        },
      },
      delete: {
        method: "DELETE" as const,
        path: "/api/classes/:classId/students/:id/suspensions/:suspensionId" as const,
        responses: {
          200: z.object({ success: z.boolean() }),
          404: errorSchemas.notFound,
        },
      },
    },
  },
  transactions: {
    list: {
      method: "GET" as const,
      path: "/api/classes/:classId/transactions" as const,
      responses: { 200: z.array(z.custom<typeof transactions.$inferSelect>()) },
    },
    create: {
      method: "POST" as const,
      path: "/api/classes/:classId/transactions" as const,
      input: insertTransactionSchema.extend({
        amount: z
          .union([z.string(), z.number()])
          .transform((val) => Number(val)),
      }),
      responses: {
        201: z.custom<typeof transactions.$inferSelect>(),
        400: errorSchemas.validation,
      },
    },
    update: {
      method: "PATCH" as const,
      path: "/api/classes/:classId/transactions/:id" as const,
      input: insertTransactionSchema
        .extend({
          amount: z
            .union([z.string(), z.number()])
            .optional()
            .transform((val) => (val === undefined ? val : Number(val))),
        })
        .partial(),
      responses: {
        200: z.custom<typeof transactions.$inferSelect>(),
        400: errorSchemas.validation,
        404: errorSchemas.notFound,
      },
    },
    delete: {
      method: "DELETE" as const,
      path: "/api/classes/:classId/transactions/:id" as const,
      responses: {
        200: z.object({ success: z.boolean() }),
        404: errorSchemas.notFound,
      },
    },
  },
  attendances: {
    list: {
      method: "GET" as const,
      path: "/api/classes/:classId/attendances" as const,
      input: z.object({ date: z.string().optional() }).optional(),
      responses: { 200: z.array(z.custom<typeof attendances.$inferSelect>()) },
    },
    create: {
      method: "POST" as const,
      path: "/api/classes/:classId/attendances" as const,
      input: z.object({
        date: z.string(),
        records: z.array(
          z.object({
            studentId: z.string(),
            status: z.enum(["PRESENT", "ABSENT", "LATE"]),
            note: z.string().optional(),
          }),
        ),
      }),
      responses: {
        201: z.object({ success: z.boolean() }),
        400: errorSchemas.validation,
      },
    },
  },
  offDays: {
    get: {
      method: "GET" as const,
      path: "/api/classes/:classId/off-days" as const,
      input: z.object({ date: z.string().optional() }).optional(),
      responses: {
        200: z.array(z.custom<typeof classOffDays.$inferSelect>()),
      },
    },
    set: {
      method: "POST" as const,
      path: "/api/classes/:classId/off-days" as const,
      input: z.object({
        date: z.string(),
        reason: z.string().min(1),
      }),
      responses: { 201: z.object({ success: z.boolean() }) },
    },
    clear: {
      method: "DELETE" as const,
      path: "/api/classes/:classId/off-days/:date" as const,
      responses: { 200: z.object({ success: z.boolean() }) },
    },
  },
};

export function buildUrl(
  path: string,
  params?: Record<string, string | number>,
): string {
  let url = path;
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      url = url.replace(`:${key}`, String(value));
    });
  }
  return url;
}
