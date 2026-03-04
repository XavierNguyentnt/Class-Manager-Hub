import {
  pgTable,
  text,
  serial,
  integer,
  numeric,
  timestamp,
  date,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  fullName: text("full_name").notNull(),
  role: text("role").notNull().default("TEACHER"), // TEACHER | CLASS_MONITOR | ADMIN
  createdAt: timestamp("created_at").defaultNow(),
});

export const classes = pgTable("classes", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  teacherId: integer("teacher_id")
    .notNull()
    .references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
});

export const classMonitors = pgTable("class_monitors", {
  id: serial("id").primaryKey(),
  classId: integer("class_id")
    .notNull()
    .references(() => classes.id, { onDelete: "cascade" }),
  monitorId: integer("monitor_id")
    .notNull()
    .references(() => users.id),
});

export const students = pgTable("students", {
  id: serial("id").primaryKey(),
  fullName: text("full_name").notNull(),
  dateOfBirth: text("date_of_birth"), // Format YYYY-MM-DD
  phone: text("phone"),
  parentPhone: text("parent_phone"),
  note: text("note"),
  classId: integer("class_id")
    .notNull()
    .references(() => classes.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at").defaultNow(),
});

export const transactions = pgTable("transactions", {
  id: serial("id").primaryKey(),
  classId: integer("class_id")
    .notNull()
    .references(() => classes.id, { onDelete: "cascade" }),
  type: text("type").notNull(), // INCOME | EXPENSE
  amount: numeric("amount", { precision: 12, scale: 2 }).notNull(),
  category: text("category").notNull(),
  description: text("description"),
  person: text("person"),
  note: text("note"),
  date: text("date").notNull(), // Format YYYY-MM-DD
  createdBy: integer("created_by")
    .notNull()
    .references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const attendances = pgTable("attendances", {
  id: serial("id").primaryKey(),
  classId: integer("class_id")
    .notNull()
    .references(() => classes.id, { onDelete: "cascade" }),
  studentId: integer("student_id")
    .notNull()
    .references(() => students.id, { onDelete: "cascade" }),
  date: text("date").notNull(), // Format YYYY-MM-DD
  status: text("status").notNull(), // PRESENT | ABSENT | LATE
  note: text("note"),
  createdBy: integer("created_by")
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
  teacherId: true,
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
export type Student = typeof students.$inferSelect;
export type Transaction = typeof transactions.$inferSelect;
export type Attendance = typeof attendances.$inferSelect;
export type InsertUser = typeof users.$inferInsert;
