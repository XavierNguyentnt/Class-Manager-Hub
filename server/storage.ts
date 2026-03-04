import { db } from "./db";
import { eq, and } from "drizzle-orm";
import {
  users, classes, classMonitors, students, transactions, attendances,
  type User, type Class, type Student, type Transaction, type Attendance,
  type InsertUser
} from "@shared/schema";

export interface IStorage {
  // User
  getUser(id: number): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;

  // Classes
  getClasses(userId: number): Promise<Class[]>;
  getClass(id: number): Promise<Class | undefined>;
  createClass(classData: Omit<Class, "id" | "createdAt">): Promise<Class>;

  // Students
  getStudentsByClass(classId: number): Promise<Student[]>;
  createStudent(student: Omit<Student, "id" | "createdAt">): Promise<Student>;

  // Transactions
  getTransactionsByClass(classId: number): Promise<Transaction[]>;
  createTransaction(transaction: Omit<Transaction, "id" | "createdAt" | "updatedAt">): Promise<Transaction>;

  // Attendance
  getAttendancesByClass(classId: number, date?: string): Promise<Attendance[]>;
  createAttendance(attendances: Omit<Attendance, "id" | "createdAt">[]): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: number): Promise<User | undefined> {
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

  async getClasses(userId: number): Promise<Class[]> {
    return await db.select().from(classes).where(eq(classes.teacherId, userId));
  }

  async getClass(id: number): Promise<Class | undefined> {
    const [cls] = await db.select().from(classes).where(eq(classes.id, id));
    return cls;
  }

  async createClass(classData: Omit<Class, "id" | "createdAt">): Promise<Class> {
    const [cls] = await db.insert(classes).values(classData).returning();
    return cls;
  }

  async getStudentsByClass(classId: number): Promise<Student[]> {
    return await db.select().from(students).where(eq(students.classId, classId));
  }

  async createStudent(student: Omit<Student, "id" | "createdAt">): Promise<Student> {
    const [newStudent] = await db.insert(students).values(student).returning();
    return newStudent;
  }

  async getTransactionsByClass(classId: number): Promise<Transaction[]> {
    return await db.select().from(transactions).where(eq(transactions.classId, classId));
  }

  async createTransaction(transaction: Omit<Transaction, "id" | "createdAt" | "updatedAt">): Promise<Transaction> {
    const [newTransaction] = await db.insert(transactions).values({
      ...transaction,
      amount: transaction.amount.toString(), // ensure amount is string for numeric field
    }).returning();
    return newTransaction;
  }

  async getAttendancesByClass(classId: number, date?: string): Promise<Attendance[]> {
    if (date) {
      return await db.select().from(attendances).where(
        and(eq(attendances.classId, classId), eq(attendances.date, date))
      );
    }
    return await db.select().from(attendances).where(eq(attendances.classId, classId));
  }

  async createAttendance(records: Omit<Attendance, "id" | "createdAt">[]): Promise<void> {
    if (records.length > 0) {
      // First delete any existing records for these students on this date
      const date = records[0].date;
      const classId = records[0].classId;
      await db.delete(attendances).where(
        and(eq(attendances.classId, classId), eq(attendances.date, date))
      );
      
      await db.insert(attendances).values(records);
    }
  }
}

export const storage = new DatabaseStorage();
