import type { Express } from "express";
import type { Server } from "http";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { z } from "zod";
import session from "express-session";
import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import {
  insertUserSchema,
  users,
  classes,
  classTeachers,
  classMonitors,
} from "@shared/schema";
import { db } from "./db";
import { eq, and } from "drizzle-orm";
// Use simple hash function for MVP, in production use bcrypt
const hashPassword = (password: string) =>
  Buffer.from(password).toString("base64");

export async function registerRoutes(
  httpServer: Server,
  app: Express,
): Promise<Server> {
  type MembershipRole =
    | "ADMIN"
    | "PRIMARY_TEACHER"
    | "ASSISTANT_TEACHER"
    | "CLASS_MONITOR"
    | "VICE_MONITOR"
    | null;
  type ClassPermission =
    | "class_access"
    | "dashboard"
    | "students_view"
    | "students_manage"
    | "financials_view"
    | "financials_manage"
    | "attendance_view"
    | "attendance_take";

  async function getTeacherById(teacherId: string) {
    const [teacher] = await db
      .select()
      .from(users)
      .where(eq(users.id, teacherId));
    if (!teacher) return null;
    if (teacher.role !== "TEACHER") return null;
    return teacher;
  }

  async function getMonitorById(monitorId: string) {
    const [monitor] = await db
      .select()
      .from(users)
      .where(eq(users.id, monitorId));
    if (!monitor) return null;
    if (monitor.role !== "CLASS_MONITOR") return null;
    return monitor;
  }

  async function listClassTeachers(classId: string) {
    const rows = await db
      .select({ user: users, teacherRole: classTeachers.teacherRole })
      .from(classTeachers)
      .innerJoin(users, eq(users.id, classTeachers.teacherId))
      .where(eq(classTeachers.classId, classId));
    return rows;
  }

  async function listClassMonitors(classId: string) {
    const rows = await db
      .select({ user: users, monitorRole: classMonitors.monitorRole })
      .from(classMonitors)
      .innerJoin(users, eq(users.id, classMonitors.monitorId))
      .where(eq(classMonitors.classId, classId));
    return rows;
  }

  async function userCanAccessClass(user: any, classId: string) {
    return (await getUserMembershipRole(user, classId)) !== null;
  }

  async function getUserMembershipRole(
    user: any,
    classId: string,
  ): Promise<MembershipRole> {
    if (user.role === "ADMIN") return "ADMIN";
    const [teacherMembership] = await db
      .select()
      .from(classTeachers)
      .where(
        and(
          eq(classTeachers.classId, classId),
          eq(classTeachers.teacherId, user.id),
        ),
      );
    if (teacherMembership) {
      if (teacherMembership.teacherRole === "PRIMARY_TEACHER") {
        return "PRIMARY_TEACHER";
      }
      return "ASSISTANT_TEACHER";
    }
    const [monitorMembership] = await db
      .select()
      .from(classMonitors)
      .where(
        and(
          eq(classMonitors.classId, classId),
          eq(classMonitors.monitorId, user.id),
        ),
      );
    if (monitorMembership) {
      if (monitorMembership.monitorRole === "CLASS_MONITOR") {
        return "CLASS_MONITOR";
      }
      return "VICE_MONITOR";
    }
    return null;
  }

  function roleCan(role: MembershipRole, permission: ClassPermission) {
    if (!role) return false;
    if (role === "ADMIN") return true;
    const fullRoles: MembershipRole[] = ["PRIMARY_TEACHER", "CLASS_MONITOR"];
    const limitedRoles: MembershipRole[] = [
      "ASSISTANT_TEACHER",
      "VICE_MONITOR",
    ];
    if (permission === "class_access") {
      return fullRoles.includes(role) || limitedRoles.includes(role);
    }
    if (permission === "dashboard") return fullRoles.includes(role);
    if (permission === "students_view")
      return fullRoles.includes(role) || limitedRoles.includes(role);
    if (permission === "students_manage") return fullRoles.includes(role);
    if (permission === "financials_view") return fullRoles.includes(role);
    if (permission === "financials_manage") return fullRoles.includes(role);
    if (permission === "attendance_view")
      return fullRoles.includes(role) || limitedRoles.includes(role);
    if (permission === "attendance_take")
      return fullRoles.includes(role) || limitedRoles.includes(role);
    return false;
  }

  async function requireClassPermission(
    req: any,
    res: any,
    classId: string,
    permission: ClassPermission,
  ) {
    const cls = await storage.getClass(classId);
    if (!cls) {
      res.status(404).json({ message: "Class not found" });
      return null;
    }
    const membership = await getUserMembershipRole(req.user, classId);
    if (!roleCan(membership, permission)) {
      res.status(404).json({ message: "Class not found" });
      return null;
    }
    return cls;
  }
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
    if (req.user.role === "ADMIN") {
      const all = await db.select().from(classes);
      return res.json(all);
    }
    const classesList = await storage.getClasses(req.user.id);
    res.json(classesList);
  });

  // Users: Teachers list (ADMIN only)
  app.get("/api/teachers", requireAuth, async (req: any, res) => {
    if (req.user.role !== "ADMIN") {
      return res.status(403).json({ message: "Forbidden" });
    }
    const teacherRows = await db
      .select()
      .from(users)
      .where(eq(users.role, "TEACHER"));
    res.json(teacherRows);
  });

  app.get("/api/monitors", requireAuth, async (req: any, res) => {
    if (req.user.role !== "ADMIN") {
      return res.status(403).json({ message: "Forbidden" });
    }
    const monitorRows = await db
      .select()
      .from(users)
      .where(eq(users.role, "CLASS_MONITOR"));
    res.json(monitorRows);
  });

  app.post(api.classes.create.path, requireAuth, async (req: any, res) => {
    try {
      const input = api.classes.create.input.parse(req.body);
      const ownerTeacherId =
        req.user.role === "ADMIN" && typeof input.teacherId === "string"
          ? input.teacherId
          : req.user.id;
      const teacher = await getTeacherById(ownerTeacherId);
      if (!teacher) {
        return res.status(400).json({ message: "Teacher not found" });
      }
      const cls = await storage.createClass({
        name: input.name,
        description: input.description ?? null,
        scheduleDays: (input as any).scheduleDays ?? null,
      });
      await db.insert(classTeachers).values({
        classId: cls.id,
        teacherId: ownerTeacherId,
        teacherRole: "PRIMARY_TEACHER",
      });
      res.status(201).json(cls);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      res.status(500).json({ message: "Internal Error" });
    }
  });

  // Update class teacher (ADMIN only)
  app.patch(
    api.classes.updateTeacher.path,
    requireAuth,
    async (req: any, res) => {
      try {
        if (req.user.role !== "ADMIN") {
          return res.status(403).json({ message: "Forbidden" });
        }
        const classId = req.params.id;
        const input = api.classes.updateTeacher.input.parse(req.body);
        const cls = await storage.getClass(classId);
        if (!cls) {
          return res.status(404).json({ message: "Class not found" });
        }
        const teacher = await getTeacherById(input.teacherId);
        if (!teacher) {
          return res.status(400).json({ message: "Teacher not found" });
        }
        await db
          .update(classTeachers)
          .set({ teacherRole: "ASSISTANT_TEACHER" })
          .where(
            and(
              eq(classTeachers.classId, classId),
              eq(classTeachers.teacherRole, "PRIMARY_TEACHER"),
            ),
          );
        await db
          .insert(classTeachers)
          .values({
            classId,
            teacherId: input.teacherId,
            teacherRole: "PRIMARY_TEACHER",
          })
          .onConflictDoUpdate({
            target: [classTeachers.classId, classTeachers.teacherId],
            set: { teacherRole: "PRIMARY_TEACHER" },
          });
        const [updated] = await db
          .select()
          .from(classes)
          .where(eq(classes.id, classId));
        res.json(updated);
      } catch (err) {
        if (err instanceof z.ZodError) {
          return res.status(400).json({ message: err.errors[0].message });
        }
        res.status(500).json({ message: "Internal Error" });
      }
    },
  );

  // Update class schedule (PRIMARY_TEACHER, CLASS_MONITOR, ADMIN)
  app.patch(
    api.classes.updateSchedule.path,
    requireAuth,
    async (req: any, res) => {
      try {
        const classId = req.params.id;
        const cls = await requireClassPermission(
          req,
          res,
          classId,
          "dashboard",
        );
        if (!cls) return;
        const input = api.classes.updateSchedule.input.parse(req.body);
        const [updated] = await db
          .update(classes)
          .set({ scheduleDays: input.scheduleDays })
          .where(eq(classes.id, classId))
          .returning();
        res.json(updated);
      } catch (err) {
        if (err instanceof z.ZodError) {
          return res.status(400).json({ message: err.errors[0].message });
        }
        res.status(500).json({ message: "Internal Error" });
      }
    },
  );

  // Add teacher to class (ADMIN)
  app.post(api.classes.addTeacher.path, requireAuth, async (req: any, res) => {
    try {
      if (req.user.role !== "ADMIN")
        return res.status(403).json({ message: "Forbidden" });
      const classId = req.params.id;
      const input = api.classes.addTeacher.input.parse(req.body);
      const cls = await storage.getClass(classId);
      if (!cls) return res.status(404).json({ message: "Class not found" });
      const teacher = await getTeacherById(input.teacherId);
      if (!teacher)
        return res.status(400).json({ message: "Teacher not found" });
      const teacherRole = input.teacherRole ?? "ASSISTANT_TEACHER";
      if (teacherRole === "PRIMARY_TEACHER") {
        await db
          .update(classTeachers)
          .set({ teacherRole: "ASSISTANT_TEACHER" })
          .where(
            and(
              eq(classTeachers.classId, classId),
              eq(classTeachers.teacherRole, "PRIMARY_TEACHER"),
            ),
          );
      }
      await db
        .insert(classTeachers)
        .values({ classId, teacherId: input.teacherId, teacherRole })
        .onConflictDoUpdate({
          target: [classTeachers.classId, classTeachers.teacherId],
          set: { teacherRole },
        });
      res.json({ success: true });
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      res.status(500).json({ message: "Internal Error" });
    }
  });

  // Remove teacher from class (ADMIN)
  app.delete(
    api.classes.removeTeacher.path,
    requireAuth,
    async (req: any, res) => {
      try {
        if (req.user.role !== "ADMIN")
          return res.status(403).json({ message: "Forbidden" });
        const classId = req.params.id;
        const teacherId = req.params.teacherId;
        const cls = await storage.getClass(classId);
        if (!cls) return res.status(404).json({ message: "Class not found" });
        const [existingMembership] = await db
          .select()
          .from(classTeachers)
          .where(
            and(
              eq(classTeachers.classId, classId),
              eq(classTeachers.teacherId, teacherId),
            ),
          );
        if (
          existingMembership &&
          existingMembership.teacherRole === "PRIMARY_TEACHER"
        ) {
          const remainingPrimary = await db
            .select()
            .from(classTeachers)
            .where(
              and(
                eq(classTeachers.classId, classId),
                eq(classTeachers.teacherRole, "PRIMARY_TEACHER"),
              ),
            );
          if (remainingPrimary.length <= 1) {
            return res.status(400).json({
              message: "Cannot remove the only primary teacher of class",
            });
          }
        }
        await db
          .delete(classTeachers)
          .where(
            and(
              eq(classTeachers.classId, classId),
              eq(classTeachers.teacherId, teacherId),
            ),
          );
        res.json({ success: true });
      } catch {
        res.status(500).json({ message: "Internal Error" });
      }
    },
  );

  app.get(api.classes.listTeachers.path, requireAuth, async (req: any, res) => {
    const classId = req.params.id;
    const cls = await storage.getClass(classId);
    if (!cls) return res.status(404).json({ message: "Class not found" });
    if (!(await userCanAccessClass(req.user, classId))) {
      return res.status(404).json({ message: "Class not found" });
    }
    const teachers = await listClassTeachers(classId);
    res.json(teachers);
  });

  app.post(api.classes.addMonitor.path, requireAuth, async (req: any, res) => {
    try {
      if (req.user.role !== "ADMIN") {
        return res.status(403).json({ message: "Forbidden" });
      }
      const classId = req.params.id;
      const input = api.classes.addMonitor.input.parse(req.body);
      const cls = await storage.getClass(classId);
      if (!cls) return res.status(404).json({ message: "Class not found" });
      const monitor = await getMonitorById(input.monitorId);
      if (!monitor)
        return res.status(400).json({ message: "Monitor not found" });
      await db
        .insert(classMonitors)
        .values({
          classId,
          monitorId: input.monitorId,
          monitorRole: input.monitorRole ?? "CLASS_MONITOR",
        })
        .onConflictDoUpdate({
          target: [classMonitors.classId, classMonitors.monitorId],
          set: { monitorRole: input.monitorRole ?? "CLASS_MONITOR" },
        });
      res.json({ success: true });
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      res.status(500).json({ message: "Internal Error" });
    }
  });

  app.delete(
    api.classes.removeMonitor.path,
    requireAuth,
    async (req: any, res) => {
      try {
        if (req.user.role !== "ADMIN") {
          return res.status(403).json({ message: "Forbidden" });
        }
        const classId = req.params.id;
        const monitorId = req.params.monitorId;
        const cls = await storage.getClass(classId);
        if (!cls) return res.status(404).json({ message: "Class not found" });
        await db
          .delete(classMonitors)
          .where(
            and(
              eq(classMonitors.classId, classId),
              eq(classMonitors.monitorId, monitorId),
            ),
          );
        res.json({ success: true });
      } catch {
        res.status(500).json({ message: "Internal Error" });
      }
    },
  );

  app.get(api.classes.listMonitors.path, requireAuth, async (req: any, res) => {
    const classId = req.params.id;
    const cls = await storage.getClass(classId);
    if (!cls) return res.status(404).json({ message: "Class not found" });
    if (!(await userCanAccessClass(req.user, classId))) {
      return res.status(404).json({ message: "Class not found" });
    }
    const monitors = await listClassMonitors(classId);
    res.json(monitors);
  });

  app.get(api.classes.get.path, requireAuth, async (req: any, res) => {
    const cls = await storage.getClass(req.params.id);
    if (!cls) return res.status(404).json({ message: "Class not found" });
    if (!(await userCanAccessClass(req.user, cls.id))) {
      return res.status(404).json({ message: "Class not found" });
    }
    res.json(cls);
  });

  app.get(api.classes.dashboard.path, requireAuth, async (req: any, res) => {
    const classId = req.params.id;
    const cls = await requireClassPermission(req, res, classId, "dashboard");
    if (!cls) return;

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
    const cls = await requireClassPermission(
      req,
      res,
      classId,
      "students_view",
    );
    if (!cls) return;
    const students = await storage.getStudentsByClass(classId);
    res.json(students);
  });

  app.post(api.students.create.path, requireAuth, async (req: any, res) => {
    try {
      const classId = req.params.classId;
      const cls = await requireClassPermission(
        req,
        res,
        classId,
        "students_manage",
      );
      if (!cls) return;
      const input = api.students.create.input.parse(req.body);
      const normalize = (v?: string | null) => {
        if (!v) return null;
        const s = v.trim();
        if (!s) return null;
        if (/^\d{4}$/.test(s)) return `${s}-01-01`;
        if (/^\d{4}-\d{2}$/.test(s)) return `${s}-01`;
        if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
        throw new Error("Invalid date format. Use YYYY or YYYY-MM-DD");
      };
      const student = await storage.createStudent({
        ...input,
        gender: input.gender ?? null,
        dateOfBirth: normalize(input.dateOfBirth),
        phone: input.phone || null,
        parentPhone: input.parentPhone || null,
        note: input.note || null,
        nationality: input.nationality || null,
        startDate: normalize(input.startDate),
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
      console.error("Create student failed:", err);
      if (err instanceof Error && /Invalid date format/.test(err.message)) {
        return res.status(400).json({ message: err.message, field: "date" });
      }
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      res.status(500).json({ message: "Internal Error" });
    }
  });

  app.patch(api.students.update.path, requireAuth, async (req: any, res) => {
    try {
      const classId = req.params.classId;
      const id = req.params.id;
      const cls = await requireClassPermission(
        req,
        res,
        classId,
        "students_manage",
      );
      if (!cls) return;
      const input = api.students.update.input.parse(req.body);
      const normalize = (v?: string | null) => {
        if (v === undefined || v === null) return v as any;
        const s = String(v).trim();
        if (!s) return null;
        if (/^\d{4}$/.test(s)) return `${s}-01-01`;
        if (/^\d{4}-\d{2}$/.test(s)) return `${s}-01`;
        if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
        throw new Error("Invalid date format. Use YYYY or YYYY-MM-DD");
      };
      const patch: any = { ...input };
      if ("dateOfBirth" in patch)
        patch.dateOfBirth = normalize(patch.dateOfBirth);
      if ("startDate" in patch) patch.startDate = normalize(patch.startDate);
      const updated = await storage.updateStudent(classId, id, patch);
      if (!updated)
        return res.status(404).json({ message: "Student not found" });
      res.json(updated);
    } catch (err) {
      if (err instanceof Error && /Invalid date format/.test(err.message)) {
        return res.status(400).json({ message: err.message, field: "date" });
      }
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      res.status(500).json({ message: "Internal Error" });
    }
  });

  app.delete(api.students.delete.path, requireAuth, async (req: any, res) => {
    try {
      const classId = req.params.classId;
      const id = req.params.id;
      const cls = await requireClassPermission(
        req,
        res,
        classId,
        "students_manage",
      );
      if (!cls) return;
      const ok = await storage.deleteStudent(classId, id);
      if (!ok) return res.status(404).json({ message: "Student not found" });
      res.json({ success: true });
    } catch {
      res.status(500).json({ message: "Internal Error" });
    }
  });

  // Transactions
  app.get(api.transactions.list.path, requireAuth, async (req: any, res) => {
    const classId = req.params.classId;
    const cls = await requireClassPermission(
      req,
      res,
      classId,
      "financials_view",
    );
    if (!cls) return;
    const transactions = await storage.getTransactionsByClass(classId);
    res.json(transactions);
  });

  app.post(api.transactions.create.path, requireAuth, async (req: any, res) => {
    try {
      const classId = req.params.classId;
      const cls = await requireClassPermission(
        req,
        res,
        classId,
        "financials_manage",
      );
      if (!cls) return;
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

  app.patch(
    api.transactions.update.path,
    requireAuth,
    async (req: any, res) => {
      try {
        const classId = req.params.classId;
        const id = req.params.id;
        const cls = await requireClassPermission(
          req,
          res,
          classId,
          "financials_manage",
        );
        if (!cls) return;
        const input = api.transactions.update.input.parse(req.body);
        const patch: any = { ...input };
        if (patch.amount !== undefined) patch.amount = Number(patch.amount);
        const updated = await storage.updateTransaction(classId, id, patch);
        if (!updated)
          return res.status(404).json({ message: "Transaction not found" });
        res.json(updated);
      } catch (err) {
        if (err instanceof z.ZodError) {
          return res.status(400).json({ message: err.errors[0].message });
        }
        res.status(500).json({ message: "Internal Error" });
      }
    },
  );

  app.delete(
    api.transactions.delete.path,
    requireAuth,
    async (req: any, res) => {
      try {
        const classId = req.params.classId;
        const id = req.params.id;
        const cls = await requireClassPermission(
          req,
          res,
          classId,
          "financials_manage",
        );
        if (!cls) return;
        const ok = await storage.deleteTransaction(classId, id);
        if (!ok)
          return res.status(404).json({ message: "Transaction not found" });
        res.json({ success: true });
      } catch {
        res.status(500).json({ message: "Internal Error" });
      }
    },
  );
  // Attendance
  app.get(api.attendances.list.path, requireAuth, async (req: any, res) => {
    const classId = req.params.classId;
    const cls = await requireClassPermission(
      req,
      res,
      classId,
      "attendance_view",
    );
    if (!cls) return;
    const date = req.query.date as string | undefined;
    const attendances = await storage.getAttendancesByClass(classId, date);
    res.json(attendances);
  });

  // Off days
  app.get(api.offDays.get.path, requireAuth, async (req: any, res) => {
    const classId = req.params.classId;
    const cls = await requireClassPermission(
      req,
      res,
      classId,
      "attendance_view",
    );
    if (!cls) return;
    const date = (req.query.date as string | undefined) ?? undefined;
    if (date) {
      const off = await storage.getOffDay(classId, date);
      res.json(off ? [off] : []);
    } else {
      // For simplicity, return empty array if no range provided
      res.json([]);
    }
  });

  app.post(api.offDays.set.path, requireAuth, async (req: any, res) => {
    try {
      const classId = req.params.classId;
      const cls = await requireClassPermission(
        req,
        res,
        classId,
        "attendance_take",
      );
      if (!cls) return;
      const input = api.offDays.set.input.parse(req.body);
      await storage.setOffDay(classId, input.date, input.reason, req.user.id);
      res.status(201).json({ success: true });
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      res.status(500).json({ message: "Internal Error" });
    }
  });

  app.delete(api.offDays.clear.path, requireAuth, async (req: any, res) => {
    try {
      const classId = req.params.classId;
      const cls = await requireClassPermission(
        req,
        res,
        classId,
        "attendance_take",
      );
      if (!cls) return;
      const date = req.params.date;
      await storage.clearOffDay(classId, date);
      res.json({ success: true });
    } catch {
      res.status(500).json({ message: "Internal Error" });
    }
  });

  app.post(api.attendances.create.path, requireAuth, async (req: any, res) => {
    try {
      const classId = req.params.classId;
      const cls = await requireClassPermission(
        req,
        res,
        classId,
        "attendance_take",
      );
      if (!cls) return;
      const input = api.attendances.create.input.parse(req.body);
      const off = await storage.getOffDay(classId, input.date);
      if (off) {
        return res.status(400).json({ message: "Class is off on this date" });
      }

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
      scheduleDays: ["SUN"],
    });
    await db.insert(classTeachers).values({
      classId: cls.id,
      teacherId: teacher.id,
      teacherRole: "PRIMARY_TEACHER",
    });

    const student1 = await storage.createStudent({
      firstName: "Van A",
      lastName: "Nguyen",
      gender: null,
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
      gender: null,
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
