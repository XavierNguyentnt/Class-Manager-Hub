import { db } from "./db";
import { eq, and } from "drizzle-orm";
import {
  users,
  classes,
  classMonitors,
  classTeachers,
  students,
  transactions,
  attendances,
  classOffDays,
  type User,
  type Class,
  type Student,
  type Transaction,
  type Attendance,
  type InsertUser,
} from "@shared/schema";

export interface IStorage {
  // User
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;

  // Classes
  getClasses(userId: string): Promise<Class[]>;
  getClass(id: string): Promise<Class | undefined>;
  createClass(classData: Omit<Class, "id" | "createdAt">): Promise<Class>;

  // Students
  getStudentsByClass(classId: string): Promise<Student[]>;
  createStudent(student: Omit<Student, "id" | "createdAt">): Promise<Student>;
  updateStudent(
    classId: string,
    id: string,
    patch: Partial<Omit<Student, "id" | "classId" | "createdAt">>,
  ): Promise<Student | undefined>;
  deleteStudent(classId: string, id: string): Promise<boolean>;

  // Transactions
  getTransactionsByClass(classId: string): Promise<Transaction[]>;
  createTransaction(
    transaction: Omit<Transaction, "id" | "createdAt" | "updatedAt">,
  ): Promise<Transaction>;
  updateTransaction(
    classId: string,
    id: string,
    patch: Partial<Omit<Transaction, "id" | "classId" | "createdBy" | "createdAt" | "updatedAt">>,
  ): Promise<Transaction | undefined>;
  deleteTransaction(classId: string, id: string): Promise<boolean>;

  // Attendance
  getAttendancesByClass(classId: string, date?: string): Promise<Attendance[]>;
  createAttendance(
    attendances: Omit<Attendance, "id" | "createdAt">[],
  ): Promise<void>;
  // Off days
  getOffDay(classId: string, date: string): Promise<{ id: string; date: string; reason: string | null } | null>;
  setOffDay(classId: string, date: string, reason: string, createdBy: string): Promise<void>;
  clearOffDay(classId: string, date: string): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  async getClasses(userId: string): Promise<Class[]> {
    const teacherRows = await db
      .select({ cls: classes })
      .from(classes)
      .innerJoin(classTeachers, eq(classTeachers.classId, classes.id))
      .where(eq(classTeachers.teacherId, userId));
    const monitorRows = await db
      .select({ cls: classes })
      .from(classes)
      .innerJoin(classMonitors, eq(classMonitors.classId, classes.id))
      .where(eq(classMonitors.monitorId, userId));
    const map = new Map<string, Class>();
    for (const row of teacherRows) map.set(row.cls.id, row.cls);
    for (const row of monitorRows) map.set(row.cls.id, row.cls);
    return Array.from(map.values());
  }

  async getClass(id: string): Promise<Class | undefined> {
    const [cls] = await db.select().from(classes).where(eq(classes.id, id));
    return cls;
  }

  async createClass(
    classData: Omit<Class, "id" | "createdAt">,
  ): Promise<Class> {
    const [cls] = await db.insert(classes).values(classData).returning();
    return cls;
  }

  async getStudentsByClass(classId: string): Promise<Student[]> {
    return await db
      .select()
      .from(students)
      .where(eq(students.classId, classId));
  }

  async createStudent(
    student: Omit<Student, "id" | "createdAt">,
  ): Promise<Student> {
    const [newStudent] = await db.insert(students).values(student).returning();
    return newStudent;
  }

  async updateStudent(
    classId: string,
    id: string,
    patch: Partial<Omit<Student, "id" | "classId" | "createdAt">>,
  ): Promise<Student | undefined> {
    const [updated] = await db
      .update(students)
      .set(patch as any)
      .where(and(eq(students.id, id), eq(students.classId, classId)))
      .returning();
    return updated;
  }

  async deleteStudent(classId: string, id: string): Promise<boolean> {
    const result = await db
      .delete(students)
      .where(and(eq(students.id, id), eq(students.classId, classId)));
    return !!result;
  }

  async getTransactionsByClass(classId: string): Promise<Transaction[]> {
    return await db
      .select()
      .from(transactions)
      .where(eq(transactions.classId, classId));
  }

  async createTransaction(
    transaction: Omit<Transaction, "id" | "createdAt" | "updatedAt">,
  ): Promise<Transaction> {
    const [newTransaction] = await db
      .insert(transactions)
      .values({
        ...transaction,
        amount: transaction.amount.toString(), // ensure amount is string for numeric field
      })
      .returning();
    return newTransaction;
  }

  async updateTransaction(
    classId: string,
    id: string,
    patch: Partial<Omit<Transaction, "id" | "classId" | "createdBy" | "createdAt" | "updatedAt">>,
  ): Promise<Transaction | undefined> {
    const updates: any = { ...patch };
    if (updates.amount !== undefined) {
      updates.amount = String(updates.amount);
    }
    const [updated] = await db
      .update(transactions)
      .set({ ...updates, updatedAt: new Date() } as any)
      .where(and(eq(transactions.id, id), eq(transactions.classId, classId)))
      .returning();
    return updated;
  }

  async deleteTransaction(classId: string, id: string): Promise<boolean> {
    const result = await db
      .delete(transactions)
      .where(and(eq(transactions.id, id), eq(transactions.classId, classId)));
    return !!result;
  }

  async getAttendancesByClass(
    classId: string,
    date?: string,
  ): Promise<Attendance[]> {
    if (date) {
      return await db
        .select()
        .from(attendances)
        .where(
          and(eq(attendances.classId, classId), eq(attendances.date, date)),
        );
    }
    return await db
      .select()
      .from(attendances)
      .where(eq(attendances.classId, classId));
  }

  async createAttendance(
    records: Omit<Attendance, "id" | "createdAt">[],
  ): Promise<void> {
    if (records.length > 0) {
      // First delete any existing records for these students on this date
      const date = records[0].date;
      const classId = records[0].classId;
      await db
        .delete(attendances)
        .where(
          and(eq(attendances.classId, classId), eq(attendances.date, date)),
        );

      await db.insert(attendances).values(records);
    }
  }

  async getOffDay(classId: string, date: string) {
    const [row] = await db
      .select()
      .from(classOffDays)
      .where(and(eq(classOffDays.classId, classId), eq(classOffDays.date, date)));
    return row || null;
  }

  async setOffDay(classId: string, date: string, reason: string, createdBy: string) {
    // Upsert: remove existing and insert
    await db
      .delete(classOffDays)
      .where(and(eq(classOffDays.classId, classId), eq(classOffDays.date, date)));
    await db
      .insert(classOffDays)
      .values({ classId, date, reason, createdBy });
  }

  async clearOffDay(classId: string, date: string) {
    await db
      .delete(classOffDays)
      .where(and(eq(classOffDays.classId, classId), eq(classOffDays.date, date)));
  }
}

export const storage = new DatabaseStorage();
