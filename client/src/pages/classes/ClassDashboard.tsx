import { useRoute } from "wouter";
import {
  useClass,
  useClassDashboard,
  useClassTeachers,
  useAddClassTeacher,
  useRemoveClassTeacher,
  useClassMonitors,
  useAddClassMonitor,
  useRemoveClassMonitor,
} from "@/hooks/use-classes";
import { useTeachers } from "@/hooks/use-teachers";
import { useMonitors } from "@/hooks/use-monitors";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  Loader2,
  Users,
  TrendingUp,
  TrendingDown,
  Wallet,
  ArrowUpRight,
  ArrowDownRight,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { useTranslation } from "react-i18next";

export default function ClassDashboard() {
  const [, params] = useRoute("/classes/:id/dashboard");
  const classId = params?.id || "";

  const { data: cls, isLoading: isClassLoading } = useClass(classId);
  const { data: dashboard, isLoading: isDashboardLoading } =
    useClassDashboard(classId);
  const { user } = useAuth();
  const { toast } = useToast();
  const { data: teachers } = useTeachers(user?.role === "ADMIN");
  const { data: monitors } = useMonitors(user?.role === "ADMIN");
  const { data: classTeachers } = useClassTeachers(classId);
  const { data: classMonitors } = useClassMonitors(classId);
  const addClassTeacher = useAddClassTeacher(classId);
  const removeClassTeacher = useRemoveClassTeacher(classId);
  const addClassMonitor = useAddClassMonitor(classId);
  const removeClassMonitor = useRemoveClassMonitor(classId);
  const { t } = useTranslation("common");
  const [selectedTeacher, setSelectedTeacher] = useState<string>("");
  const [selectedTeacherRole, setSelectedTeacherRole] = useState<
    "PRIMARY_TEACHER" | "ASSISTANT_TEACHER"
  >("ASSISTANT_TEACHER");
  const [selectedMonitor, setSelectedMonitor] = useState<string>("");
  const [selectedMonitorRole, setSelectedMonitorRole] = useState<
    "CLASS_MONITOR" | "VICE_MONITOR"
  >("CLASS_MONITOR");

  if (isClassLoading || isDashboardLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!cls || !dashboard) return <div>{t("dashboard.failedLoad")}</div>;

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(val);
  };

  const chartData = [
    {
      name: t("chart.legend.income"),
      amount: dashboard.totalIncomeMonth,
      fill: "hsl(var(--chart-3))",
    },
    {
      name: t("chart.legend.expense"),
      amount: dashboard.totalExpenseMonth,
      fill: "hsl(var(--chart-4))",
    },
  ];

  return (
    <div className="p-6 md:p-10 max-w-7xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h1 className="text-3xl font-display font-bold text-foreground tracking-tight">
          {t("dashboard.title", { name: cls.name })}
        </h1>
        <p className="text-muted-foreground mt-1">{t("dashboard.subtitle")}</p>
      </div>
      {user?.role === "ADMIN" && (
        <div className="bg-card border border-border/50 rounded-xl p-4 space-y-3">
          <div className="text-sm font-medium">
            {t("dashboard.assignedTeachers")}
          </div>
          <div className="flex flex-wrap gap-2">
            {classTeachers?.map((teacher) => (
              <Button
                key={teacher.user.id}
                variant="outline"
                size="sm"
                disabled={removeClassTeacher.isPending}
                onClick={async () => {
                  try {
                    await removeClassTeacher.mutateAsync(teacher.user.id);
                  } catch (error: any) {
                    toast({
                      variant: "destructive",
                      title: "Error",
                      description: error.message,
                    });
                  }
                }}>
                {teacher.user.fullName} (
                {t(`teacherRoles.${teacher.teacherRole}`)})
              </Button>
            ))}
          </div>
          <div className="flex items-end gap-4">
            <div className="flex-1">
              <Label htmlFor="teacherId">
                {t("dashboard.assignedTeacherLabel")}
              </Label>
              <select
                id="teacherId"
                className="border w-full rounded-md h-9 px-3 mt-1"
                value={selectedTeacher}
                onChange={(e) => setSelectedTeacher(e.target.value)}>
                <option value="">{t("forms.selectTeacherPlaceholder")}</option>
                {teachers?.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.fullName} ({t.email})
                  </option>
                ))}
              </select>
            </div>
            <div className="w-[220px]">
              <Label htmlFor="teacherRole">
                {t("dashboard.teacherRoleLabel")}
              </Label>
              <select
                id="teacherRole"
                className="border w-full rounded-md h-9 px-3 mt-1"
                value={selectedTeacherRole}
                onChange={(e) =>
                  setSelectedTeacherRole(
                    e.target.value as "PRIMARY_TEACHER" | "ASSISTANT_TEACHER",
                  )
                }>
                <option value="PRIMARY_TEACHER">
                  {t("teacherRoles.PRIMARY_TEACHER")}
                </option>
                <option value="ASSISTANT_TEACHER">
                  {t("teacherRoles.ASSISTANT_TEACHER")}
                </option>
              </select>
            </div>
            <Button
              disabled={!selectedTeacher || addClassTeacher.isPending}
              onClick={async () => {
                if (!selectedTeacher) return;
                try {
                  await addClassTeacher.mutateAsync({
                    teacherId: selectedTeacher,
                    teacherRole: selectedTeacherRole,
                  });
                  setSelectedTeacher("");
                } catch (error: any) {
                  toast({
                    variant: "destructive",
                    title: "Error",
                    description: error.message,
                  });
                }
              }}>
              {addClassTeacher.isPending
                ? t("common.adding")
                : t("dashboard.addTeacher")}
            </Button>
          </div>
          <div className="pt-2 border-t border-border/50">
            <div className="text-sm font-medium mb-2">
              {t("dashboard.assignedMonitors")}
            </div>
            <div className="flex flex-wrap gap-2 mb-3">
              {classMonitors?.map((m) => (
                <Button
                  key={m.user.id}
                  variant="outline"
                  size="sm"
                  disabled={removeClassMonitor.isPending}
                  onClick={async () => {
                    try {
                      await removeClassMonitor.mutateAsync(m.user.id);
                    } catch (error: any) {
                      toast({
                        variant: "destructive",
                        title: "Error",
                        description: error.message,
                      });
                    }
                  }}>
                  {m.user.fullName} (
                  {m.monitorRole === "CLASS_MONITOR" ? "Lớp trưởng" : "Lớp phó"}
                  )
                </Button>
              ))}
            </div>
            <div className="flex items-end gap-4">
              <div className="flex-1">
                <Label htmlFor="monitorId">
                  {t("dashboard.monitorAssignLabel")}
                </Label>
                <select
                  id="monitorId"
                  className="border w-full rounded-md h-9 px-3 mt-1"
                  value={selectedMonitor}
                  onChange={(e) => setSelectedMonitor(e.target.value)}>
                  <option value="">
                    {t("forms.selectMonitorPlaceholder")}
                  </option>
                  {monitors?.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.fullName} ({m.email})
                    </option>
                  ))}
                </select>
              </div>
              <div className="w-[220px]">
                <Label htmlFor="monitorRole">
                  {t("dashboard.monitorRoleLabel")}
                </Label>
                <select
                  id="monitorRole"
                  className="border w-full rounded-md h-9 px-3 mt-1"
                  value={selectedMonitorRole}
                  onChange={(e) =>
                    setSelectedMonitorRole(
                      e.target.value as "CLASS_MONITOR" | "VICE_MONITOR",
                    )
                  }>
                  <option value="CLASS_MONITOR">
                    {t("monitorRoles.CLASS_MONITOR")}
                  </option>
                  <option value="VICE_MONITOR">
                    {t("monitorRoles.VICE_MONITOR")}
                  </option>
                </select>
              </div>
              <Button
                disabled={!selectedMonitor || addClassMonitor.isPending}
                onClick={async () => {
                  if (!selectedMonitor) return;
                  try {
                    await addClassMonitor.mutateAsync({
                      monitorId: selectedMonitor,
                      monitorRole: selectedMonitorRole,
                    });
                    setSelectedMonitor("");
                  } catch (error: any) {
                    toast({
                      variant: "destructive",
                      title: "Error",
                      description: error.message,
                    });
                  }
                }}>
                {addClassMonitor.isPending
                  ? t("common.adding")
                  : t("dashboard.addMonitor")}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="shadow-sm border-border/50">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {t("stats.totalStudents")}
            </CardTitle>
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
              <Users className="h-4 w-4 text-primary" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-display font-bold">
              {dashboard.totalStudents}
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm border-border/50">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {t("stats.monthlyIncome")}
            </CardTitle>
            <div className="w-8 h-8 rounded-full bg-emerald-500/10 flex items-center justify-center">
              <TrendingUp className="h-4 w-4 text-emerald-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-display font-bold text-emerald-600">
              {formatCurrency(dashboard.totalIncomeMonth)}
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm border-border/50">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {t("stats.monthlyExpense")}
            </CardTitle>
            <div className="w-8 h-8 rounded-full bg-rose-500/10 flex items-center justify-center">
              <TrendingDown className="h-4 w-4 text-rose-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-display font-bold text-rose-600">
              {formatCurrency(dashboard.totalExpenseMonth)}
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm border-border/50">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {t("stats.currentBalance")}
            </CardTitle>
            <div className="w-8 h-8 rounded-full bg-indigo-500/10 flex items-center justify-center">
              <Wallet className="h-4 w-4 text-indigo-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-display font-bold">
              {formatCurrency(dashboard.balance)}
            </div>
            <p className="text-xs text-muted-foreground mt-1 flex items-center">
              {dashboard.balance >= 0 ? (
                <>
                  <ArrowUpRight className="w-3 h-3 mr-1 text-emerald-500" />{" "}
                  {t("stats.healthy")}
                </>
              ) : (
                <>
                  <ArrowDownRight className="w-3 h-3 mr-1 text-rose-500" />{" "}
                  {t("stats.deficit")}
                </>
              )}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="shadow-sm border-border/50">
          <CardHeader>
            <CardTitle className="font-display">
              {t("charts.financialOverview.title")}
            </CardTitle>
            <CardDescription>
              {t("charts.financialOverview.subtitle")}
            </CardDescription>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={chartData}
                margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                  stroke="hsl(var(--border))"
                />
                <XAxis
                  dataKey="name"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "hsl(var(--muted-foreground))" }}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "hsl(var(--muted-foreground))" }}
                  tickFormatter={(value) => `$${value}`}
                />
                <Tooltip
                  cursor={{ fill: "hsl(var(--muted))", opacity: 0.4 }}
                  contentStyle={{
                    borderRadius: "8px",
                    border: "1px solid hsl(var(--border))",
                    boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                  }}
                />
                <Bar dataKey="amount" radius={[6, 6, 0, 0]} maxBarSize={60}>
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="shadow-sm border-border/50 bg-primary/5 border-primary/20">
          <CardHeader>
            <CardTitle className="font-display text-primary">
              {t("charts.classActivity.title")}
            </CardTitle>
            <CardDescription>
              {t("charts.classActivity.subtitle")}
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center justify-center h-[250px]">
            <div className="relative w-48 h-48 flex items-center justify-center">
              <svg
                className="w-full h-full transform -rotate-90"
                viewBox="0 0 100 100">
                <circle
                  cx="50"
                  cy="50"
                  r="45"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="10"
                  className="text-primary/10"
                />
                <circle
                  cx="50"
                  cy="50"
                  r="45"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="10"
                  className="text-primary transition-all duration-1000 ease-out"
                  strokeDasharray={`${2 * Math.PI * 45}`}
                  strokeDashoffset={`${2 * Math.PI * 45 * (1 - dashboard.averageAttendance / 100)}`}
                  strokeLinecap="round"
                />
              </svg>
              <div className="absolute flex flex-col items-center justify-center">
                <span className="text-4xl font-display font-bold text-foreground">
                  {dashboard.averageAttendance.toFixed(1)}%
                </span>
                <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider mt-1">
                  {t("nav.attendance")}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
