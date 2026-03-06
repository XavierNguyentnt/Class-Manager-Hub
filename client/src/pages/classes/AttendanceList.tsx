import { useState, useEffect, useMemo } from "react";
import { useRoute } from "wouter";
import { useStudents } from "@/hooks/use-students";
import { useAttendances, useCreateAttendances } from "@/hooks/use-attendances";
import { useClass } from "@/hooks/use-classes";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Loader2,
  Save,
  CheckCircle2,
  XCircle,
  Clock,
  Calendar as CalendarIcon,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { useTranslation } from "react-i18next";
import { formatFullName, parseDateInputToISO } from "@/lib/utils";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar as DayCalendar } from "@/components/ui/calendar";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { useOffDay, useSetOffDay, useClearOffDay } from "@/hooks/use-off-days";

type Status = "PRESENT" | "ABSENT" | "LATE";

export default function AttendanceList() {
  const [, params] = useRoute("/classes/:id/attendance");
  const classId = params?.id || "";
  const { t } = useTranslation("common");

  const [selectedDate, setSelectedDate] = useState(
    format(new Date(), "yyyy-MM-dd"),
  );
  const [dateText, setDateText] = useState(format(new Date(), "dd/MM/yyyy"));
  const [selectedYear, setSelectedYear] = useState<number>(
    new Date().getFullYear(),
  );
  const [selectedMonth, setSelectedMonth] = useState<number>(
    new Date().getMonth() + 1,
  ); // 1-12

  const { data: cls } = useClass(classId);
  const { data: students, isLoading: isLoadingStudents } = useStudents(classId);
  const { data: attendances, isLoading: isLoadingAttendances } = useAttendances(
    classId,
    selectedDate,
  );
  const saveAttendances = useCreateAttendances(classId);
  const { data: offDay } = useOffDay(classId, selectedDate);
  const setOffDay = useSetOffDay(classId);
  const clearOffDay = useClearOffDay(classId);

  const { toast } = useToast();
  const [offOpen, setOffOpen] = useState(false);
  const [offReason, setOffReason] = useState("");

  // Local state for the current editing view
  const [attendanceState, setAttendanceState] = useState<
    Record<string, Status>
  >({});

  const activeStudents = useMemo(
    () => students?.filter((s) => s.trainingStatus === "ACTIVE") ?? [],
    [students],
  );

  // Sync state when data is fetched (only ACTIVE students)
  useEffect(() => {
    if (activeStudents && attendances) {
      const newState: Record<string, Status> = {};
      // Default everyone to PRESENT if no records exist for this date
      activeStudents.forEach((s) => {
        const record = attendances.find((a) => a.studentId === s.id);
        newState[s.id] = record ? (record.status as Status) : "PRESENT";
      });
      setAttendanceState(newState);
    }
  }, [activeStudents, attendances]);

  const scheduleIndices = useMemo(() => {
    const map: Record<string, number> = {
      SUN: 0,
      MON: 1,
      TUE: 2,
      WED: 3,
      THU: 4,
      FRI: 5,
      SAT: 6,
    };
    const sd = (cls as any)?.scheduleDays as string[] | null | undefined;
    if (!sd || sd.length === 0) return null;
    return sd.map((d) => map[d]).filter((n) => n >= 0 && n <= 6);
  }, [cls]);

  const monthSessions = useMemo(() => {
    if (!scheduleIndices || scheduleIndices.length === 0) return [];
    const result: string[] = [];
    const start = new Date(selectedYear, selectedMonth - 1, 1);
    const end = new Date(selectedYear, selectedMonth, 0); // last day of month
    const cursor = new Date(start);
    while (cursor <= end) {
      if (scheduleIndices.includes(cursor.getDay())) {
        const yyyy = cursor.getFullYear();
        const mm = String(cursor.getMonth() + 1).padStart(2, "0");
        const dd = String(cursor.getDate()).padStart(2, "0");
        result.push(`${yyyy}-${mm}-${dd}`);
      }
      cursor.setDate(cursor.getDate() + 1);
    }
    return result;
  }, [scheduleIndices, selectedYear, selectedMonth]);

  useEffect(() => {
    if (scheduleIndices && scheduleIndices.length > 0) {
      const d = new Date(selectedDate);
      if (!scheduleIndices.includes(d.getDay())) {
        const next = monthSessions[0];
        if (next) {
          setSelectedDate(next);
          const [y, m, day] = next.split("-");
          setDateText(`${day}/${m}/${y}`);
        }
      }
    }
  }, [scheduleIndices]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleStatusChange = (studentId: string, status: Status) => {
    setAttendanceState((prev) => ({ ...prev, [studentId]: status }));
  };

  const handleSave = async () => {
    try {
      const records = Object.entries(attendanceState).map(
        ([studentId, status]) => ({
          studentId,
          status,
        }),
      );

      await saveAttendances.mutateAsync({
        date: selectedDate,
        records,
      });

      toast({ title: "OK" });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message,
      });
    }
  };

  const isLoading = isLoadingStudents || isLoadingAttendances;
  const [filter, setFilter] = useState<"ALL" | "PRESENT" | "ABSENT">("ALL");
  const total = activeStudents.length;
  const presentCount = useMemo(
    () =>
      activeStudents.reduce(
        (acc, s) =>
          acc + ((attendanceState[s.id] ?? "PRESENT") === "PRESENT" ? 1 : 0),
        0,
      ),
    [activeStudents, attendanceState],
  );
  const absentCount = useMemo(
    () =>
      activeStudents.reduce(
        (acc, s) =>
          acc + ((attendanceState[s.id] ?? "PRESENT") === "ABSENT" ? 1 : 0),
        0,
      ),
    [activeStudents, attendanceState],
  );
  const filteredStudents = useMemo(() => {
    if (filter === "ALL") return activeStudents;
    return activeStudents.filter((s) =>
      filter === "PRESENT"
        ? (attendanceState[s.id] ?? "PRESENT") === "PRESENT"
        : (attendanceState[s.id] ?? "PRESENT") === "ABSENT",
    );
  }, [filter, activeStudents, attendanceState]);

  return (
    <div className="p-6 md:p-10 max-w-7xl mx-auto space-y-6 animate-in fade-in duration-300">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold text-foreground tracking-tight">
            {t("attendance.title")}
          </h1>
          <p className="text-muted-foreground mt-1">
            {t("attendance.subtitle")}
          </p>
        </div>

        <div className="flex items-end gap-4">
          <div className="space-y-1">
            <Label
              htmlFor="date-picker"
              className="text-xs text-muted-foreground">
              {t("attendance.selectDate")}
            </Label>
            <div className="flex items-center gap-2">
              <Input
                id="date-picker"
                type="text"
                value={dateText}
                placeholder="dd/MM/yyyy"
                onChange={(e) => {
                  const v = normalizeDateTyping(e.target.value);
                  setDateText(v);
                  const iso = parseDateInputToISO(v);
                  if (iso) setSelectedDate(iso);
                }}
                className="h-10 w-[160px] md:w-[180px] font-medium"
              />
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    type="button"
                    variant="outline"
                    className="h-10 w-10 p-0">
                    <CalendarIcon className="h-4 w-4" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="p-0">
                  <DayCalendar
                    mode="single"
                    selected={
                      new Date(parseDateInputToISO(dateText) || selectedDate)
                    }
                    defaultMonth={new Date()}
                    modifiers={
                      scheduleIndices
                        ? { study: [{ dayOfWeek: scheduleIndices }] }
                        : undefined
                    }
                    modifiersClassNames={{
                      study: "bg-primary/10 text-foreground rounded-md",
                    }}
                    disabled={
                      scheduleIndices
                        ? [
                            {
                              dayOfWeek: [0, 1, 2, 3, 4, 5, 6].filter(
                                (i) => !scheduleIndices.includes(i),
                              ),
                            },
                          ]
                        : undefined
                    }
                    onSelect={(d) => {
                      if (!d) return;
                      const dd = String(d.getDate()).padStart(2, "0");
                      const mm = String(d.getMonth() + 1).padStart(2, "0");
                      const yyyy = d.getFullYear();
                      const disp = `${dd}/${mm}/${yyyy}`;
                      setDateText(disp);
                      setSelectedDate(`${yyyy}-${mm}-${dd}`);
                    }}
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>
          {offDay ? (
            <div className="flex items-center gap-2">
              <div className="text-sm text-amber-700 bg-amber-50 border border-amber-200 px-3 py-2 rounded">
                {t("attendance.off.banner", { reason: offDay.reason || "-" })}
              </div>
              <Button
                variant="outline"
                onClick={async () => {
                  try {
                    await clearOffDay.mutateAsync(selectedDate);
                    toast({ title: t("attendance.off.clear") });
                  } catch (e: any) {
                    toast({
                      variant: "destructive",
                      title: "Error",
                      description: e.message,
                    });
                  }
                }}>
                {t("attendance.off.clear")}
              </Button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                className="h-10"
                onClick={() => setOffOpen(true)}>
                {t("attendance.off.set")}
              </Button>
              <Button
                onClick={handleSave}
                disabled={
                  isLoading || saveAttendances.isPending || !students?.length
                }
                className="h-10 shadow-md">
                {saveAttendances.isPending ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Save className="w-4 h-4 mr-2" />
                )}
                {t("attendance.save")}
              </Button>
            </div>
          )}
        </div>
      </div>

      <Dialog open={offOpen} onOpenChange={setOffOpen}>
        <DialogContent className="sm:max-w-[480px]">
          <DialogHeader>
            <DialogTitle>{t("attendance.off.set")}</DialogTitle>
            <DialogDescription>{t("attendance.off.reason")}</DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label>{t("attendance.off.reason")}</Label>
            <Textarea
              placeholder={t("attendance.off.reason.placeholder")}
              value={offReason}
              onChange={(e) => setOffReason(e.target.value)}
            />
          </div>
          <DialogFooter className="pt-2">
            <Button
              onClick={async () => {
                try {
                  await setOffDay.mutateAsync({
                    date: selectedDate,
                    reason: offReason.trim(),
                  });
                  setOffOpen(false);
                  setOffReason("");
                  toast({ title: t("attendance.off.confirm") });
                } catch (e: any) {
                  toast({
                    variant: "destructive",
                    title: "Error",
                    description: e.message,
                  });
                }
              }}
              disabled={!offReason.trim() || setOffDay.isPending}>
              {t("attendance.off.confirm")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex items-end gap-2">
          <div>
            <Label className="text-xs text-muted-foreground">
              {t("attendance.filter.year")}
            </Label>
            <select
              className="border rounded-md h-9 px-2"
              value={selectedYear}
              onChange={(e) => setSelectedYear(Number(e.target.value))}>
              {Array.from({ length: 6 }).map((_, i) => {
                const y = new Date().getFullYear() - 2 + i; // prev2..next3
                return (
                  <option key={y} value={y}>
                    {y}
                  </option>
                );
              })}
            </select>
          </div>
          <div>
            <Label className="text-xs text-muted-foreground">
              {t("attendance.filter.month")}
            </Label>
            <select
              className="border rounded-md h-9 px-2"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(Number(e.target.value))}>
              {Array.from({ length: 12 }).map((_, i) => (
                <option key={i + 1} value={i + 1}>
                  {String(i + 1).padStart(2, "0")}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {monthSessions.length > 0 && (
        <div className="flex items-center gap-2 flex-wrap mt-1">
          <Label className="text-xs text-muted-foreground">
            {t("attendance.sessions")}:
          </Label>
          {monthSessions.map((d) => (
            <Badge
              key={d}
              variant={d === selectedDate ? "default" : "outline"}
              className="cursor-pointer"
              onClick={() => {
                setSelectedDate(d);
                const [y, m, day] = d.split("-");
                setDateText(`${day}/${m}/${y}`);
              }}>
              {format(new Date(d), "dd/MM/yyyy")}
            </Badge>
          ))}
        </div>
      )}

      <div className="flex items-center gap-2">
        <Badge
          variant={filter === "PRESENT" ? "default" : "outline"}
          className="cursor-pointer"
          onClick={() => setFilter(filter === "PRESENT" ? "ALL" : "PRESENT")}>
          {t("attendance.status.present")}: {presentCount}/{total}
        </Badge>
        <Badge
          variant={filter === "ABSENT" ? "default" : "outline"}
          className="cursor-pointer"
          onClick={() => setFilter(filter === "ABSENT" ? "ALL" : "ABSENT")}>
          {t("attendance.status.absent")}: {absentCount}/{total}
        </Badge>
      </div>

      <Card className="border-border/50 shadow-sm overflow-hidden">
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex h-64 items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : offDay ? (
            <div className="text-center py-16 px-4">
              <h3 className="text-lg font-medium text-amber-800">OFF</h3>
              <p className="text-muted-foreground mt-1">
                {t("attendance.off.banner", { reason: offDay.reason || "-" })}
              </p>
            </div>
          ) : activeStudents.length === 0 ? (
            <div className="text-center py-16 px-4">
              <h3 className="text-lg font-medium">
                {t("attendance.empty.title")}
              </h3>
              <p className="text-muted-foreground mt-1">
                {t("attendance.empty.description")}
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader className="bg-muted/50">
                <TableRow>
                  <TableHead className="w-[300px]">
                    {t("attendance.table.studentName")}
                  </TableHead>
                  <TableHead>{t("attendance.table.statusSelection")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredStudents.map((student) => (
                  <TableRow
                    key={student.id}
                    className="hover:bg-muted/30 transition-colors">
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-full bg-secondary flex items-center justify-center text-secondary-foreground font-bold text-xs">
                          {(student.lastName || student.firstName)
                            .charAt(0)
                            .toUpperCase()}
                        </div>
                        {formatFullName(student.firstName, student.lastName)}
                      </div>
                    </TableCell>
                    <TableCell>
                      <RadioGroup
                        className="flex flex-row items-center gap-4"
                        value={attendanceState[student.id]}
                        onValueChange={(val) =>
                          handleStatusChange(student.id, val as Status)
                        }>
                        <div className="flex items-center space-x-2 border rounded-md p-2 cursor-pointer hover:bg-muted transition-colors data-[state=checked]:border-emerald-500 data-[state=checked]:bg-emerald-50">
                          <RadioGroupItem
                            value="PRESENT"
                            id={`present-${student.id}`}
                            className="text-emerald-600 border-emerald-600"
                          />
                          <Label
                            htmlFor={`present-${student.id}`}
                            className="cursor-pointer flex items-center font-medium text-emerald-700">
                            <CheckCircle2 className="w-4 h-4 mr-1" />{" "}
                            {t("attendance.status.present")}
                          </Label>
                        </div>
                        <div className="flex items-center space-x-2 border rounded-md p-2 cursor-pointer hover:bg-muted transition-colors data-[state=checked]:border-rose-500 data-[state=checked]:bg-rose-50">
                          <RadioGroupItem
                            value="ABSENT"
                            id={`absent-${student.id}`}
                            className="text-rose-600 border-rose-600"
                          />
                          <Label
                            htmlFor={`absent-${student.id}`}
                            className="cursor-pointer flex items-center font-medium text-rose-700">
                            <XCircle className="w-4 h-4 mr-1" />{" "}
                            {t("attendance.status.absent")}
                          </Label>
                        </div>
                        <div className="flex items-center space-x-2 border rounded-md p-2 cursor-pointer hover:bg-muted transition-colors data-[state=checked]:border-amber-500 data-[state=checked]:bg-amber-50">
                          <RadioGroupItem
                            value="LATE"
                            id={`late-${student.id}`}
                            className="text-amber-600 border-amber-600"
                          />
                          <Label
                            htmlFor={`late-${student.id}`}
                            className="cursor-pointer flex items-center font-medium text-amber-700">
                            <Clock className="w-4 h-4 mr-1" />{" "}
                            {t("attendance.status.late")}
                          </Label>
                        </div>
                      </RadioGroup>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function normalizeDateTyping(value: string) {
  const digits = value.replace(/\D/g, "").slice(0, 8);
  if (digits.length >= 5)
    return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`;
  if (digits.length >= 3) return `${digits.slice(0, 2)}/${digits.slice(2)}`;
  return digits;
}
