import type { Express } from "express";
import type { Server } from "http";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { z } from "zod";
import session from "express-session";
import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { insertUserSchema, users } from "@shared/schema";
import { db } from "./db";
import { eq } from "drizzle-orm";
// Use simple hash function for MVP, in production use bcrypt
const hashPassword = (password: string) =>
  Buffer.from(password).toString("base64");

export async function registerRoutes(
  httpServer: Server,
  app: Express,
): Promise<Server> {
  // Auth setup
  app.use(
    session({
      secret: process.env.SESSION_SECRET || "dev-secret",
      resave: false,
      saveUninitialized: false,
    }),
  );
  app.use(passport.initialize());
  app.use(passport.session());

  passport.use(
    new LocalStrategy(
      { usernameField: "email" },
      async (email, password, done) => {
        try {
          const user = await storage.getUserByEmail(email);
          if (!user || user.password !== hashPassword(password)) {
            return done(null, false, { message: "Invalid credentials" });
          }
          return done(null, user);
        } catch (err) {
          return done(err);
        }
      },
    ),
  );

  passport.serializeUser((user: any, done) => done(null, user.id));
  passport.deserializeUser(async (id: string, done) => {
    try {
      const user = await storage.getUser(id);
      done(null, user);
    } catch (err) {
      done(err);
    }
  });

  const requireAuth = (req: any, res: any, next: any) => {
    if (req.isAuthenticated()) return next();
    res.status(401).json({ message: "Unauthorized" });
  };

  // Auth Routes
  app.post(api.auth.register.path, async (req, res, next) => {
    try {
      const input = api.auth.register.input.parse(req.body);
      const existing = await storage.getUserByEmail(input.email);
      if (existing) {
        return res.status(400).json({ message: "Email already taken" });
      }

      const user = await storage.createUser({
        ...input,
        password: hashPassword(input.password),
      });

      req.login(user, (err) => {
        if (err) return next(err);
        res.status(201).json(user);
      });
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({
          message: err.errors[0].message,
          field: err.errors[0].path.join("."),
        });
      }
      next(err);
    }
  });

  app.post(api.auth.login.path, passport.authenticate("local"), (req, res) => {
    res.json(req.user);
  });

  app.post(api.auth.logout.path, (req, res, next) => {
    req.logout((err) => {
      if (err) return next(err);
      res.json({ message: "Logged out" });
    });
  });

  app.get(api.auth.me.path, (req, res) => {
    if (req.isAuthenticated()) {
      res.json(req.user);
    } else {
      res.status(401).json({ message: "Unauthorized" });
    }
  });

  // Class Routes
  app.get(api.classes.list.path, requireAuth, async (req: any, res) => {
    const classesList = await storage.getClasses(req.user.id);
    res.json(classesList);
  });

  app.post(api.classes.create.path, requireAuth, async (req: any, res) => {
    try {
      const input = api.classes.create.input.parse(req.body);
      const cls = await storage.createClass({
        ...input,
        description: input.description ?? null,
        teacherId: req.user.id,
      });
      res.status(201).json(cls);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      res.status(500).json({ message: "Internal Error" });
    }
  });

  app.get(api.classes.get.path, requireAuth, async (req: any, res) => {
    const cls = await storage.getClass(req.params.id);
    if (!cls || cls.teacherId !== req.user.id) {
      return res.status(404).json({ message: "Class not found" });
    }
    res.json(cls);
  });

  app.get(api.classes.dashboard.path, requireAuth, async (req: any, res) => {
    const classId = req.params.id;
    const cls = await storage.getClass(classId);
    if (!cls || cls.teacherId !== req.user.id) {
      return res.status(404).json({ message: "Class not found" });
    }

    const students = await storage.getStudentsByClass(classId);
    const transactions = await storage.getTransactionsByClass(classId);
    const attendances = await storage.getAttendancesByClass(classId);

    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();

    let totalIncomeMonth = 0;
    let totalExpenseMonth = 0;
    let balance = 0;

    transactions.forEach((t) => {
      const amount = Number(t.amount);
      const tDate = new Date(t.date);

      if (t.type === "INCOME") balance += amount;
      else balance -= amount;

      if (
        tDate.getMonth() === currentMonth &&
        tDate.getFullYear() === currentYear
      ) {
        if (t.type === "INCOME") totalIncomeMonth += amount;
        else totalExpenseMonth += amount;
      }
    });

    let presentCount = 0;
    let totalAttendanceCount = attendances.length;

    attendances.forEach((a) => {
      if (a.status === "PRESENT") presentCount++;
    });

    res.json({
      totalStudents: students.length,
      totalIncomeMonth,
      totalExpenseMonth,
      balance,
      averageAttendance:
        totalAttendanceCount > 0
          ? (presentCount / totalAttendanceCount) * 100
          : 0,
    });
  });

  // Students
  app.get(api.students.list.path, requireAuth, async (req: any, res) => {
    const classId = req.params.classId;
    const cls = await storage.getClass(classId);
    if (!cls || cls.teacherId !== req.user.id) {
      return res.status(404).json({ message: "Class not found" });
    }
    const students = await storage.getStudentsByClass(classId);
    res.json(students);
  });

  app.post(api.students.create.path, requireAuth, async (req: any, res) => {
    try {
      const classId = req.params.classId;
      const cls = await storage.getClass(classId);
      if (!cls || cls.teacherId !== req.user.id) {
        return res.status(404).json({ message: "Class not found" });
      }
      const input = api.students.create.input.parse(req.body);
      const student = await storage.createStudent({
        ...input,
        dateOfBirth: input.dateOfBirth || null,
        phone: input.phone || null,
        parentPhone: input.parentPhone || null,
        note: input.note || null,
        nationality: input.nationality || null,
        startDate: input.startDate || null,
        level: input.level || null,
        healthStatus: input.healthStatus || null,
        address: input.address || null,
        occupation: input.occupation || null,
        height: input.height || null,
        weight: input.weight || null,
        trainingStatus: input.trainingStatus || null,
        classId,
      });
      res.status(201).json(student);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      res.status(500).json({ message: "Internal Error" });
    }
  });

  // Transactions
  app.get(api.transactions.list.path, requireAuth, async (req: any, res) => {
    const classId = req.params.classId;
    const cls = await storage.getClass(classId);
    if (!cls || cls.teacherId !== req.user.id) {
      return res.status(404).json({ message: "Class not found" });
    }
    const transactions = await storage.getTransactionsByClass(classId);
    res.json(transactions);
  });

  app.post(api.transactions.create.path, requireAuth, async (req: any, res) => {
    try {
      const classId = req.params.classId;
      const cls = await storage.getClass(classId);
      if (!cls || cls.teacherId !== req.user.id) {
        return res.status(404).json({ message: "Class not found" });
      }
      const input = api.transactions.create.input.parse(req.body);
      const transaction = await storage.createTransaction({
        ...input,
        description: input.description ?? null,
        person: input.person ?? null,
        note: input.note ?? null,
        classId,
        amount: input.amount.toString(),
        createdBy: req.user.id,
      });
      res.status(201).json(transaction);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      res.status(500).json({ message: "Internal Error" });
    }
  });

  // Attendance
  app.get(api.attendances.list.path, requireAuth, async (req: any, res) => {
    const classId = req.params.classId;
    const cls = await storage.getClass(classId);
    if (!cls || cls.teacherId !== req.user.id) {
      return res.status(404).json({ message: "Class not found" });
    }
    const date = req.query.date as string | undefined;
    const attendances = await storage.getAttendancesByClass(classId, date);
    res.json(attendances);
  });

  app.post(api.attendances.create.path, requireAuth, async (req: any, res) => {
    try {
      const classId = req.params.classId;
      const cls = await storage.getClass(classId);
      if (!cls || cls.teacherId !== req.user.id) {
        return res.status(404).json({ message: "Class not found" });
      }
      const input = api.attendances.create.input.parse(req.body);

      const records = input.records.map((r) => ({
        classId,
        studentId: r.studentId,
        date: input.date,
        status: r.status,
        note: r.note || null,
        createdBy: req.user.id,
      }));

      await storage.createAttendance(records);
      res.status(201).json({ success: true });
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      res.status(500).json({ message: "Internal Error" });
    }
  });

  seedDatabase();

  return httpServer;
}

async function seedDatabase() {
  try {
    const usersCount = await db.select().from(users).limit(1);
    if (usersCount.length > 0) return; // Already seeded

    const teacher = await storage.createUser({
      email: "teacher@example.com",
      password: hashPassword("password123"),
      fullName: "Admin Teacher",
    });

    const cls = await storage.createClass({
      name: "IELTS Mastery 2026",
      description: "Intensive IELTS preparation class",
      teacherId: teacher.id,
    });

    const student1 = await storage.createStudent({
      firstName: "Van A",
      lastName: "Nguyen",
      dateOfBirth: "2000-01-01",
      phone: "0123456789",
      parentPhone: null,
      note: "Good student",
      nationality: null,
      startDate: null,
      level: null,
      healthStatus: null,
      address: null,
      occupation: null,
      height: null,
      weight: null,
      trainingStatus: null,
      classId: cls.id,
    });

    const student2 = await storage.createStudent({
      firstName: "Thi B",
      lastName: "Tran",
      dateOfBirth: "2001-05-15",
      phone: "0987654321",
      parentPhone: "0999888777",
      note: "",
      nationality: null,
      startDate: null,
      level: null,
      healthStatus: null,
      address: null,
      occupation: null,
      height: null,
      weight: null,
      trainingStatus: null,
      classId: cls.id,
    });

    await storage.createTransaction({
      classId: cls.id,
      type: "INCOME",
      amount: "5000000",
      category: "Tuition",
      description: "Tuition fee for March",
      person: "Nguyen Van A",
      note: "",
      date: new Date().toISOString().split("T")[0],
      createdBy: teacher.id,
    });

    await storage.createTransaction({
      classId: cls.id,
      type: "EXPENSE",
      amount: "500000",
      category: "Materials",
      description: "Books and printing",
      person: "Bookstore",
      note: "",
      date: new Date().toISOString().split("T")[0],
      createdBy: teacher.id,
    });
  } catch (err) {
    console.error("Failed to seed database:", err);
  }
}
