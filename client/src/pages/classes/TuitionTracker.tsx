import { useEffect, useMemo, useState } from "react";
import { useRoute } from "wouter";
import { useStudents } from "@/hooks/use-students";
import {
  useTransactions,
  useCreateTransaction,
  useUpdateTransaction,
} from "@/hooks/use-transactions";
import { useStudentSuspensionsByClass } from "@/hooks/use-students";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { formatFullName, formatVNDAccounting } from "@/lib/utils";

type CellKey = { studentId: string; period: string; txId?: string } | null;

export default function TuitionTracker() {
  const [, params] = useRoute("/classes/:id/tuition");
  const classId = params?.id || "";
  const { data: students } = useStudents(classId);
  const { data: transactions } = useTransactions(classId);
  const { data: suspensions } = useStudentSuspensionsByClass(classId);
  const createTx = useCreateTransaction(classId);
  const updateTx = useUpdateTransaction(classId);

  const currentYear = new Date().getFullYear();
  const availableYears = useMemo(() => {
    const set = new Set<number>([
      currentYear,
      currentYear - 1,
      currentYear - 2,
    ]);
    (transactions || []).forEach((tx: any) => {
      const ap = String(tx?.appliedPeriod || "");
      const m = ap.match(/^(\d{4})-(\d{2})$/);
      if (m) set.add(Number(m[1]));
    });
    return Array.from(set).sort((a, b) => b - a);
  }, [transactions, currentYear]);
  const [yearSel, setYearSel] = useState<number>(currentYear);
  const [filterMode, setFilterMode] = useState<"ALL" | "MONTH" | "RANGE">(
    "ALL",
  );
  const [monthFrom, setMonthFrom] = useState<number>(1);
  const [monthTo, setMonthTo] = useState<number>(12);
  useEffect(() => {
    try {
      const sp = new URLSearchParams(window.location.search);
      const modeRaw = (sp.get("mode") || "").toLowerCase();
      const yearRaw = sp.get("year");
      const mfRaw = sp.get("from");
      const mtRaw = sp.get("to");

      let yParsed: number | undefined;
      if (yearRaw && /^\d{4}$/.test(yearRaw)) {
        const y = Number(yearRaw);
        if (y >= 2000 && y <= 2100) yParsed = y;
      }
      let mfParsed: number | undefined;
      if (mfRaw && /^\d{1,2}$/.test(mfRaw)) {
        const mf = Number(mfRaw);
        if (!isNaN(mf) && mf >= 1 && mf <= 12) mfParsed = mf;
      }
      let mtParsed: number | undefined;
      if (mtRaw && /^\d{1,2}$/.test(mtRaw)) {
        const mt = Number(mtRaw);
        if (!isNaN(mt) && mt >= 1 && mt <= 12) mtParsed = mt;
      }

      if (yParsed !== undefined) setYearSel(yParsed);
      if (mfParsed !== undefined) setMonthFrom(mfParsed);
      if (mtParsed !== undefined) setMonthTo(mtParsed);

      if (modeRaw === "month") setFilterMode("MONTH");
      else if (modeRaw === "range") setFilterMode("RANGE");
      else if (mfParsed !== undefined || mtParsed !== undefined) {
        const mf = mfParsed ?? 1;
        const mt = mtParsed ?? 12;
        if (mf === 1 && mt === 12) setFilterMode("ALL");
        else if (mf === mt) setFilterMode("MONTH");
        else setFilterMode("RANGE");
      } else {
        setFilterMode("ALL");
      }
    } catch {}
  }, []);
  useEffect(() => {
    try {
      const sp = new URLSearchParams(window.location.search);
      sp.set("year", String(yearSel));
      if (filterMode === "ALL") {
        sp.delete("mode");
        sp.set("from", "1");
        sp.set("to", "12");
      } else if (filterMode === "MONTH") {
        sp.set("mode", "month");
        sp.set("from", String(monthFrom));
        sp.set("to", String(monthFrom));
      } else {
        sp.set("mode", "range");
        sp.set("from", String(monthFrom));
        sp.set("to", String(monthTo));
      }
      const url =
        window.location.pathname + "?" + sp.toString() + window.location.hash;
      window.history.replaceState(null, "", url);
    } catch {}
  }, [yearSel, monthFrom, monthTo, filterMode]);

  const months = useMemo(() => {
    const a =
      filterMode === "ALL"
        ? 1
        : filterMode === "MONTH"
          ? monthFrom
          : Math.min(monthFrom, monthTo);
    const b =
      filterMode === "ALL"
        ? 12
        : filterMode === "MONTH"
          ? monthFrom
          : Math.max(monthFrom, monthTo);
    return Array.from({ length: b - a + 1 }).map((_, i) => {
      const mm = String(a + i).padStart(2, "0");
      return `${yearSel}-${mm}`;
    });
  }, [yearSel, monthFrom, monthTo, filterMode]);

  const tuitionKey = "transactions.categories.income.tuition";
  function isTuition(tx: any) {
    if (!tx || tx.type !== "INCOME") return false;
    if (typeof tx.category === "string") {
      if (tx.category === tuitionKey) return true;
      if (/tuition|học phí/i.test(tx.category)) return true;
    }
    return false;
  }

  const byStudentPeriod = useMemo(() => {
    const map = new Map<string, any>();
    (transactions || []).forEach((tx: any) => {
      if (!isTuition(tx)) return;
      const sid = tx.studentId || "";
      const ap = tx.appliedPeriod || "";
      if (!sid || !ap) return;
      const key = `${sid}__${ap}`;
      // keep the earliest payment for that period
      const prev = map.get(key);
      if (!prev) map.set(key, tx);
      else if (new Date(tx.date) < new Date(prev.date)) map.set(key, tx);
    });
    return map;
  }, [transactions]);

  const suspensionsByStudent = useMemo(() => {
    const map = new Map<string, Array<{ from: string; to: string | null }>>();
    (suspensions || []).forEach((p: any) => {
      const sid = String(p.studentId || "");
      if (!sid) return;
      const arr = map.get(sid) || [];
      arr.push({
        from: String(p.effectiveFrom),
        to: p.effectiveTo ? String(p.effectiveTo) : null,
      });
      map.set(sid, arr);
    });
    return map;
  }, [suspensions]);

  const isSuspendedInMonth = (studentId: string, ym: string) => {
    const arr = suspensionsByStudent.get(studentId);
    if (!arr || arr.length === 0) return false;
    const [yy, mm] = ym.split("-");
    const monthStart = new Date(Number(yy), Number(mm) - 1, 1).getTime();
    const monthEnd = new Date(
      Number(yy),
      Number(mm),
      0,
      23,
      59,
      59,
      999,
    ).getTime();
    for (const p of arr) {
      const s = new Date(p.from).getTime();
      const e = p.to ? new Date(p.to).getTime() : Infinity;
      if (s <= monthEnd && monthStart <= e) return true;
    }
    return false;
  };

  const isSuspendedNow = (studentId: string) => {
    const arr = suspensionsByStudent.get(studentId);
    if (!arr || arr.length === 0) return false;
    const now = Date.now();
    for (const p of arr) {
      const s = new Date(p.from).getTime();
      const e = p.to ? new Date(p.to).getTime() : Infinity;
      if (s <= now && now <= e) return true;
    }
    return false;
  };

  const [editing, setEditing] = useState<CellKey>(null);
  const [amount, setAmount] = useState<string>("");
  const [paidDate, setPaidDate] = useState<string>("");
  const [isSaving, setIsSaving] = useState(false);

  return (
    <div className="p-6 md:p-10 max-w-7xl mx-auto space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-4">
          <CardTitle>Theo dõi học phí niên khóa {yearSel}</CardTitle>
          <div className="flex flex-wrap items-center gap-2">
            <select
              className="border rounded-md h-9 px-3"
              value={String(yearSel)}
              onChange={(e) => setYearSel(Number(e.target.value))}>
              {availableYears.map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
            <select
              className="border rounded-md h-9 px-3"
              value={filterMode}
              onChange={(e) => {
                const v = e.target.value as any;
                if (v === "ALL") {
                  setFilterMode("ALL");
                  setMonthFrom(1);
                  setMonthTo(12);
                } else if (v === "MONTH") {
                  setFilterMode("MONTH");
                  setMonthTo(monthFrom);
                } else {
                  setFilterMode("RANGE");
                }
              }}>
              <option value="ALL">Cả năm</option>
              <option value="MONTH">Theo tháng</option>
              <option value="RANGE">Theo khoảng tháng</option>
            </select>

            {filterMode === "MONTH" ? (
              <>
                <span className="text-sm text-muted-foreground">Tháng</span>
                <select
                  className="border rounded-md h-9 px-3"
                  value={String(monthFrom)}
                  onChange={(e) => {
                    const m = Number(e.target.value);
                    setMonthFrom(m);
                    setMonthTo(m);
                  }}>
                  {Array.from({ length: 12 }).map((_, i) => (
                    <option key={i + 1} value={i + 1}>
                      {String(i + 1).padStart(2, "0")}
                    </option>
                  ))}
                </select>
              </>
            ) : filterMode === "RANGE" ? (
              <>
                <span className="text-sm text-muted-foreground">Từ</span>
                <select
                  className="border rounded-md h-9 px-3"
                  value={String(monthFrom)}
                  onChange={(e) => setMonthFrom(Number(e.target.value))}>
                  {Array.from({ length: 12 }).map((_, i) => (
                    <option key={i + 1} value={i + 1}>
                      {String(i + 1).padStart(2, "0")}
                    </option>
                  ))}
                </select>
                <span className="text-sm text-muted-foreground">đến</span>
                <select
                  className="border rounded-md h-9 px-3"
                  value={String(monthTo)}
                  onChange={(e) => setMonthTo(Number(e.target.value))}>
                  {Array.from({ length: 12 }).map((_, i) => (
                    <option key={i + 1} value={i + 1}>
                      {String(i + 1).padStart(2, "0")}
                    </option>
                  ))}
                </select>
              </>
            ) : null}
            <Button
              variant="outline"
              onClick={() => {
                setFilterMode("ALL");
                setMonthFrom(1);
                setMonthTo(12);
              }}>
              Xóa bộ lọc
            </Button>
          </div>
        </CardHeader>
        <CardContent className="overflow-auto">
          <table className="w-full min-w-[1500px] text-sm border-collapse">
            <thead>
              <tr className="text-left">
                <th className="p-2 border-b w-[260px]">Học viên</th>
                {months.map((p) => (
                  <th key={p} className="p-2 border-b text-center">
                    {p}
                  </th>
                ))}
                <th className="p-2 border-b text-center">Đã nộp</th>
                <th className="p-2 border-b text-center">Thiếu</th>
                <th className="p-2 border-b text-center">Tổng</th>
                <th className="p-2 border-b text-center">Tổng tiền</th>
              </tr>
            </thead>
            <tbody>
              {(students || []).map((s) => {
                const sid = s.id;
                const status = String(
                  (s as any).trainingStatus || "",
                ).toUpperCase();
                const isSuspend = status === "SUSPEND" || isSuspendedNow(sid);
                const requiredMonthsCount = months.filter(
                  (m) => !isSuspendedInMonth(sid, m),
                ).length;
                let paidCount = 0;
                let totalAmount = 0;
                return (
                  <tr key={sid} className="border-b hover:bg-muted/30">
                    <td
                      className={`p-2 font-medium ${isSuspend ? "text-red-600" : ""}`}>
                      <div>
                        {formatFullName(s.firstName as any, s.lastName as any)}
                      </div>
                      {isSuspend ? (
                        <div className="text-xs text-red-600/80 font-normal mt-0.5">
                          Trạng thái: Tạm dừng (Suspend)
                        </div>
                      ) : null}
                    </td>
                    {months.map((p) => {
                      const k = `${sid}__${p}`;
                      const tx = byStudentPeriod.get(k);
                      const isRequired = !isSuspendedInMonth(sid, p);
                      if (
                        editing &&
                        editing.studentId === sid &&
                        editing.period === p
                      ) {
                        return (
                          <td key={p} className="p-2">
                            <div className="flex items-center gap-2">
                              <Input
                                className="w-28"
                                inputMode="numeric"
                                placeholder="0"
                                value={amount}
                                onChange={(e) =>
                                  setAmount(
                                    e.target.value.replace(/[^\d]/g, ""),
                                  )
                                }
                              />
                              <Input
                                className="w-40"
                                type="date"
                                value={paidDate}
                                onChange={(e) => setPaidDate(e.target.value)}
                              />
                              <Button
                                size="sm"
                                disabled={isSaving || !paidDate}
                                onClick={async () => {
                                  if (!paidDate) return;
                                  const n = Number(amount);
                                  if (!n || n <= 0) return;
                                  const [yyyy, mm] = p.split("-");
                                  const person =
                                    `${s.firstName || ""} ${s.lastName || ""}`.trim();
                                  setIsSaving(true);
                                  try {
                                    const payload: any = {
                                      type: "INCOME",
                                      amount: n as any,
                                      category: tuitionKey as any,
                                      description: `Học phí tháng ${mm}/${yyyy}`,
                                      person,
                                      studentId: sid,
                                      appliedPeriod: p,
                                      date: paidDate,
                                      note: null as any,
                                    };
                                    if (editing?.txId) {
                                      await updateTx.mutateAsync({
                                        id: editing.txId,
                                        data: payload,
                                      } as any);
                                    } else {
                                      await createTx.mutateAsync(payload);
                                    }
                                    setEditing(null);
                                    setAmount("");
                                    setPaidDate("");
                                  } finally {
                                    setIsSaving(false);
                                  }
                                }}>
                                Lưu
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  setEditing(null);
                                  setAmount("");
                                  setPaidDate("");
                                }}>
                                Hủy
                              </Button>
                            </div>
                          </td>
                        );
                      }
                      if (tx) {
                        if (isRequired) paidCount += 1;
                        const amtNum = Number(tx.amount || 0);
                        totalAmount += isNaN(amtNum) ? 0 : amtNum;
                        const paidAt = new Date(tx.date).getTime();
                        const [yy, mm] = p.split("-");
                        const end = new Date(
                          Number(yy),
                          Number(mm),
                          0,
                        ).getTime();
                        const late = paidAt > end;
                        return (
                          <td key={p} className="p-2 text-center">
                            <div className="inline-flex flex-col items-center gap-1">
                              <Badge
                                className={
                                  late
                                    ? "bg-amber-100 text-amber-700 border-amber-300"
                                    : "bg-emerald-100 text-emerald-700 border-emerald-300"
                                }>
                                {late ? "Nộp muộn" : "Đã nộp"}
                              </Badge>
                              <span className="text-xs text-muted-foreground">
                                {formatVNDAccounting(amtNum)}
                              </span>
                              <div className="flex items-center gap-2">
                                <a
                                  className="text-xs text-muted-foreground hover:underline"
                                  href={`/classes/${classId}/transactions?applied=${encodeURIComponent(
                                    p,
                                  )}&student=${encodeURIComponent(sid)}`}>
                                  Xem
                                </a>
                                <button
                                  className="text-xs hover:underline"
                                  type="button"
                                  onClick={() => {
                                    setEditing({
                                      studentId: sid,
                                      period: p,
                                      txId: tx.id,
                                    });
                                    setAmount(
                                      String(amtNum || "").replace(/\D/g, ""),
                                    );
                                    setPaidDate(String(tx.date || ""));
                                  }}>
                                  Sửa
                                </button>
                              </div>
                            </div>
                          </td>
                        );
                      }
                      if (!isRequired) {
                        return (
                          <td key={p} className="p-2 text-center">
                            <span className="text-xs text-red-600/80">
                              Tạm dừng
                            </span>
                          </td>
                        );
                      }
                      return (
                        <td key={p} className="p-2 text-center">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => {
                              setEditing({ studentId: sid, period: p });
                              setAmount("");
                              setPaidDate(format(new Date(), "yyyy-MM-dd"));
                            }}>
                            Thu
                          </Button>
                        </td>
                      );
                    })}
                    <td className="p-2 text-center">{paidCount}</td>
                    <td className="p-2 text-center">
                      {requiredMonthsCount - paidCount}
                    </td>
                    <td className="p-2 text-center">{requiredMonthsCount}</td>
                    <td className="p-2 text-center font-medium">
                      {formatVNDAccounting(totalAmount)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}
