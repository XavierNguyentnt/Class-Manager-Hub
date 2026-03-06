import {
  pgTable,
  text,
  uuid,
  numeric,
  timestamp,
  unique,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  fullName: text("full_name").notNull(),
  role: text("role").notNull().default("TEACHER"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const classes = pgTable("classes", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const classMonitors = pgTable("class_monitors", {
  id: uuid("id").primaryKey().defaultRandom(),
  classId: uuid("class_id")
    .notNull()
    .references(() => classes.id, { onDelete: "cascade" }),
  monitorId: uuid("monitor_id")
    .notNull()
    .references(() => users.id),
  monitorRole: text("monitor_role").notNull().default("CLASS_MONITOR"),
});
export const classTeachers = pgTable(
  "class_teachers",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    classId: uuid("class_id")
      .notNull()
      .references(() => classes.id, { onDelete: "cascade" }),
    teacherId: uuid("teacher_id")
      .notNull()
      .references(() => users.id),
    teacherRole: text("teacher_role").notNull().default("ASSISTANT_TEACHER"),
    createdAt: timestamp("created_at").defaultNow(),
  },
  (t) => ({
    uq: unique("class_teachers_class_teacher_uq").on(t.classId, t.teacherId),
  }),
);
export const students = pgTable("students", {
  id: uuid("id").primaryKey().defaultRandom(),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  gender: text("gender"),
  dateOfBirth: text("date_of_birth"),
  phone: text("phone"),
  parentPhone: text("parent_phone"),
  note: text("note"),
  nationality: text("nationality"),
  startDate: text("start_date"),
  level: text("level"),
  healthStatus: text("health_status"),
  address: text("address"),
  occupation: text("occupation"),
  height: text("height"),
  weight: text("weight"),
  trainingStatus: text("training_status"),
  classId: uuid("class_id")
    .notNull()
    .references(() => classes.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at").defaultNow(),
});

export const transactions = pgTable("transactions", {
  id: uuid("id").primaryKey().defaultRandom(),
  classId: uuid("class_id")
    .notNull()
    .references(() => classes.id, { onDelete: "cascade" }),
  type: text("type").notNull(),
  amount: numeric("amount", { precision: 12, scale: 2 }).notNull(),
  category: text("category").notNull(),
  description: text("description"),
  person: text("person"),
  note: text("note"),
  date: text("date").notNull(),
  createdBy: uuid("created_by")
    .notNull()
    .references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const attendances = pgTable("attendances", {
  id: uuid("id").primaryKey().defaultRandom(),
  classId: uuid("class_id")
    .notNull()
    .references(() => classes.id, { onDelete: "cascade" }),
  studentId: uuid("student_id")
    .notNull()
    .references(() => students.id, { onDelete: "cascade" }),
  date: text("date").notNull(),
  status: text("status").notNull(),
  note: text("note"),
  createdBy: uuid("created_by")
    .notNull()
    .references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
});

// Zod Schemas
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
});
export const insertClassSchema = createInsertSchema(classes).omit({
  id: true,
  createdAt: true,
});
export const insertStudentSchema = createInsertSchema(students).omit({
  id: true,
  createdAt: true,
  classId: true,
});
export const insertTransactionSchema = createInsertSchema(transactions).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  classId: true,
  createdBy: true,
});
export const insertAttendanceSchema = createInsertSchema(attendances).omit({
  id: true,
  createdAt: true,
  classId: true,
  createdBy: true,
});

// Types
export type User = typeof users.$inferSelect;
export type Class = typeof classes.$inferSelect;
export type ClassMonitor = typeof classMonitors.$inferSelect;
export type ClassTeacher = typeof classTeachers.$inferSelect;
export type Student = typeof students.$inferSelect;
export type Transaction = typeof transactions.$inferSelect;
export type Attendance = typeof attendances.$inferSelect;
export type InsertUser = typeof users.$inferInsert;
