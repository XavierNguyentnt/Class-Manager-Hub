import { useState, useEffect } from "react";
import { useRoute } from "wouter";
import {
  useTransactions,
  useCreateTransaction,
  useUpdateTransaction,
  useDeleteTransaction,
} from "@/hooks/use-transactions";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar as DayCalendar } from "@/components/ui/calendar";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Plus,
  Loader2,
  ArrowUpCircle,
  ArrowDownCircle,
  Banknote,
  ChevronsUpDown,
  Check,
} from "lucide-react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { api } from "@shared/routes";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { useTranslation } from "react-i18next";
import {
  formatDateDisplay,
  formatVNDAccounting,
  vndToWords,
} from "@/lib/utils";
import { parseDateInputToISO } from "@/lib/utils";
import { useStudents, useCreateStudent } from "@/hooks/use-students";
import { cn } from "@/lib/utils";

// Need to extend schema on frontend to handle string -> number for the input
const formSchema = api.transactions.create.input.extend({
  amount: z.coerce.number().positive("Amount must be positive"),
});

export default function TransactionList() {
  const [, params] = useRoute("/classes/:id/transactions");
  const classId = params?.id || "";

  const { data: transactions, isLoading } = useTransactions(classId);
  const { data: students } = useStudents(classId);
  const createTx = useCreateTransaction(classId);
  const updateTx = useUpdateTransaction(classId);
  const deleteTx = useDeleteTransaction(classId);
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const { t } = useTranslation("common");
  const [categoryFilter, setCategoryFilter] = useState<string>("");
  const [typeFilter, setTypeFilter] = useState<"" | "INCOME" | "EXPENSE">("");
  const [dateFilter, setDateFilter] = useState<{
    year?: string;
    month?: string;
    from?: string;
    to?: string;
  }>({});
  const [sortState, setSortState] = useState<{
    key: "date" | "type" | "category" | "person" | "amount";
    dir: "asc" | "desc";
  }>({ key: "date", dir: "desc" });
  const [appliedPeriodFilter, setAppliedPeriodFilter] = useState<string>("");
  const [studentFilter, setStudentFilter] = useState<string>("");
  useEffect(() => {
    try {
      const sp = new URLSearchParams(window.location.search);
      const sort = sp.get("sort");
      const dir = sp.get("dir");
      const keys = ["date", "type", "category", "person", "amount"] as const;
      const validKey = keys.includes((sort as any) || "");
      const validDir = dir === "asc" || dir === "desc";
      if (validKey && validDir) {
        setSortState({ key: sort as any, dir: dir as any });
      }
    } catch {}
  }, []);
  useEffect(() => {
    try {
      const sp = new URLSearchParams(window.location.search);
      sp.set("sort", sortState.key);
      sp.set("dir", sortState.dir);
      const url =
        window.location.pathname + "?" + sp.toString() + window.location.hash;
      window.history.replaceState(null, "", url);
    } catch {}
  }, [sortState]);
  useEffect(() => {
    const handler = (e: Event) =>
      setCategoryFilter((e as CustomEvent<string>).detail || "");
    window.addEventListener("tx-category-filter", handler as any);
    return () =>
      window.removeEventListener("tx-category-filter", handler as any);
  }, []);
  useEffect(() => {
    const handler = (e: Event) =>
      setTypeFilter(((e as CustomEvent<string>).detail as any) || "");
    window.addEventListener("tx-type-filter", handler as any);
    return () => window.removeEventListener("tx-type-filter", handler as any);
  }, []);
  useEffect(() => {
    const handler = (e: Event) =>
      setDateFilter(((e as CustomEvent<any>).detail as any) || {});
    window.addEventListener("tx-date-filter", handler as any);
    return () => window.removeEventListener("tx-date-filter", handler as any);
  }, []);
  useEffect(() => {
    const handler = (e: Event) =>
      setAppliedPeriodFilter(((e as CustomEvent<string>).detail as any) || "");
    window.addEventListener("tx-applied-period", handler as any);
    return () =>
      window.removeEventListener("tx-applied-period", handler as any);
  }, []);
  useEffect(() => {
    try {
      const sp = new URLSearchParams(window.location.search);
      const applied = sp.get("applied");
      const student = sp.get("student");
      if (applied) setAppliedPeriodFilter(applied);
      if (student) setStudentFilter(student);
    } catch {}
  }, []);

  const {
    register,
    handleSubmit,
    control,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      type: "INCOME",
      date: format(new Date(), "yyyy-MM-dd"),
      appliedPeriod: format(new Date(), "yyyy-MM"),
    },
  });

  const incomeCategoriesKeys = [
    "transactions.categories.income.tuition",
    "transactions.categories.income.donation",
    "transactions.categories.other",
  ] as const;
  const expenseCategoriesKeys = [
    "transactions.categories.expense.field",
    "transactions.categories.expense.food",
    "transactions.categories.expense.developmentFund",
    "transactions.categories.expense.donation",
    "transactions.categories.expense.reward",
    "transactions.categories.expense.gift",
    "transactions.categories.other",
  ] as const;
  const typeVal = watch("type");
  const categories = (
    typeVal === "EXPENSE" ? expenseCategoriesKeys : incomeCategoriesKeys
  ) as readonly string[];
  if (!watch("category")) {
    setValue("category", categories[0]);
  }
  const categoryVal = watch("category");

  const ymNow = format(new Date(), "yyyy-MM");
  const monthIncome = (transactions || []).reduce((sum, tx) => {
    try {
      const d = new Date(tx.date as any);
      const ym = isNaN(d.getTime()) ? "" : format(d, "yyyy-MM");
      return ym === ymNow && tx.type === "INCOME"
        ? sum + Number(tx.amount)
        : sum;
    } catch {
      return sum;
    }
  }, 0);
  const monthExpense = (transactions || []).reduce((sum, tx) => {
    try {
      const d = new Date(tx.date as any);
      const ym = isNaN(d.getTime()) ? "" : format(d, "yyyy-MM");
      return ym === ymNow && tx.type === "EXPENSE"
        ? sum + Number(tx.amount)
        : sum;
    } catch {
      return sum;
    }
  }, 0);
  const currentBalance = (transactions || []).reduce((sum, tx) => {
    return tx.type === "INCOME"
      ? sum + Number(tx.amount)
      : sum - Number(tx.amount);
  }, 0);

  const findStudentIdByPerson = (person?: string | null) => {
    const p = (person || "").trim().toLowerCase().replace(/\s+/g, " ");
    if (!p) return undefined;
    const list = (students || []) as any[];
    const hit = list.find((s) => {
      const full = `${s.firstName || ""} ${s.lastName || ""}`
        .trim()
        .toLowerCase()
        .replace(/\s+/g, " ");
      return full === p;
    });
    return hit?.id as string | undefined;
  };

  const onSubmit = async (data: z.infer<typeof formSchema>) => {
    try {
      const payload = { ...data, date: parseDateInputToISO(data.date) as any };
      if (
        payload.type === "INCOME" &&
        payload.category === "transactions.categories.income.tuition" &&
        !payload.studentId &&
        payload.person
      ) {
        payload.studentId = findStudentIdByPerson(payload.person) || null;
      }
      await createTx.mutateAsync(payload as any);
      setOpen(false);
      reset({
        type: "INCOME",
        date: format(new Date(), "yyyy-MM-dd"),
        appliedPeriod: format(new Date(), "yyyy-MM"),
        studentId: "",
      });
      toast({ title: t("transactions.recorded") });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message,
      });
    }
  };

  const formatCurrency = (val: number | string) => formatVNDAccounting(val);
  const onUpdate = async (
    id: string,
    data: Partial<z.infer<typeof formSchema>>,
  ) => {
    try {
      const patch: any = { ...data };
      if (patch.date) patch.date = parseDateInputToISO(patch.date);
      await updateTx.mutateAsync({ id, data: patch });
      setEditId(null);
      toast({ title: t("transactions.recorded") });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message,
      });
    }
  };
  const onDelete = async (id: string) => {
    try {
      await deleteTx.mutateAsync(id);
      toast({ title: "OK" });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message,
      });
    }
  };

  return (
    <div className="p-6 md:p-10 max-w-7xl mx-auto space-y-6 animate-in fade-in duration-300">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold text-foreground tracking-tight">
            {t("transactions.title")}
          </h1>
          <p className="text-muted-foreground mt-1">
            {t("transactions.subtitle")}
          </p>
        </div>

        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="shadow-sm gap-2">
              <Plus className="w-4 h-4" />
              {t("transactions.add")}
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>{t("transactions.newTitle")}</DialogTitle>
              <DialogDescription>
                {t("transactions.newSubtitle")}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 pt-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>{t("transactions.type")}</Label>
                  <Controller
                    control={control}
                    name="type"
                    render={({ field }) => (
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}>
                        <SelectTrigger>
                          <SelectValue
                            placeholder={t("transactions.type.placeholder")}
                          />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="INCOME">
                            {t("transactions.type.income")}
                          </SelectItem>
                          <SelectItem value="EXPENSE">
                            {t("transactions.type.expense")}
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    )}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="date">{t("transactions.date")}</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      id="date"
                      type="text"
                      placeholder="dd/MM/yyyy"
                      {...register("date", {
                        onChange: (e) => {
                          e.target.value = normalizeDateTyping(e.target.value);
                        },
                      })}
                    />
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button type="button" variant="outline">
                          <ChevronsUpDown className="h-4 w-4" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="p-0">
                        <DayCalendar
                          mode="single"
                          onSelect={(d) => {
                            if (!d) return;
                            const dd = String(d.getDate()).padStart(2, "0");
                            const mm = String(d.getMonth() + 1).padStart(
                              2,
                              "0",
                            );
                            const yyyy = d.getFullYear();
                            setValue("date", `${dd}/${mm}/${yyyy}` as any, {
                              shouldDirty: true,
                            });
                          }}
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="amount">{t("transactions.amount")}</Label>
                <Controller
                  control={control}
                  name="amount"
                  render={({ field }) => (
                    <>
                      <Input
                        id="amount"
                        inputMode="numeric"
                        placeholder="0"
                        value={groupThousands(String(field.value ?? ""))}
                        onChange={(e) => {
                          const digits = e.target.value.replace(/\D/g, "");
                          const n = digits ? Number(digits) : 0;
                          field.onChange(n);
                        }}
                      />
                      <p className="text-xs text-muted-foreground italic mt-1">
                        {vndToWords(field.value || 0)}
                      </p>
                    </>
                  )}
                />
                {errors.amount && (
                  <p className="text-sm text-destructive">
                    {errors.amount.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="category">{t("transactions.category")}</Label>
                <Controller
                  control={control}
                  name="category"
                  render={({ field }) => (
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}>
                      <SelectTrigger>
                        <SelectValue placeholder={t("transactions.category")} />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map((key) => (
                          <SelectItem key={key} value={key}>
                            {t(key)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
                {errors.category && (
                  <p className="text-sm text-destructive">
                    {errors.category.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="person">{t("transactions.person")}</Label>
                <Controller
                  control={control}
                  name="person"
                  render={({ field }) => (
                    <PersonCombobox
                      classId={classId}
                      value={field.value || ""}
                      onChange={(label) => {
                        field.onChange(label);
                      }}
                      onSelectId={(id) => setValue("studentId", id as any)}
                    />
                  )}
                />
                <input type="hidden" {...register("studentId" as any)} />
              </div>

              {typeVal === "INCOME" &&
                categoryVal === "transactions.categories.income.tuition" && (
                  <div className="space-y-2">
                    <Label htmlFor="appliedPeriod">Kỳ học phí (YYYY-MM)</Label>
                    <Controller
                      control={control}
                      name="appliedPeriod"
                      render={({ field }) => (
                        <Input
                          id="appliedPeriod"
                          type="month"
                          value={field.value || ""}
                          onChange={(e) => field.onChange(e.target.value)}
                        />
                      )}
                    />
                  </div>
                )}

              <div className="space-y-2">
                <Label htmlFor="description">
                  {t("transactions.description")}
                </Label>
                <Input
                  id="description"
                  placeholder="Brief detail"
                  {...register("description")}
                />
              </div>

              <DialogFooter className="pt-4">
                <Button type="submit" disabled={createTx.isPending}>
                  {createTx.isPending ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    t("transactions.save")
                  )}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <Badge
          onClick={() =>
            window.dispatchEvent(
              new CustomEvent("tx-type-filter", {
                detail: typeFilter === "INCOME" ? "" : "INCOME",
              }),
            )
          }
          className={`cursor-pointer border-emerald-300 ${
            typeFilter === "INCOME"
              ? "bg-emerald-500/20 text-emerald-800"
              : "bg-emerald-500/10 text-emerald-700"
          }`}>
          {t("stats.totalIncome")}: {formatVNDAccounting(monthIncome)}
        </Badge>
        <Badge
          onClick={() =>
            window.dispatchEvent(
              new CustomEvent("tx-type-filter", {
                detail: typeFilter === "EXPENSE" ? "" : "EXPENSE",
              }),
            )
          }
          className={`cursor-pointer border-rose-300 ${
            typeFilter === "EXPENSE"
              ? "bg-rose-500/20 text-rose-800"
              : "bg-rose-500/10 text-rose-700"
          }`}>
          {t("stats.totalExpense")}: {formatVNDAccounting(monthExpense)}
        </Badge>
        <Badge className="bg-muted text-foreground border-neutral-300">
          {t("stats.currentBalance")}: {formatVNDAccounting(currentBalance)}
        </Badge>
      </div>

      <TransactionCategoryFilter />
      <TransactionDateFilters />
      <TuitionPeriodFilter />

      <Card className="border-border/50 shadow-sm overflow-hidden">
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex h-40 items-center justify-center">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : transactions?.length === 0 ? (
            <div className="text-center py-16 px-4">
              <Banknote className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
              <h3 className="text-lg font-medium">
                {t("transactions.empty.title")}
              </h3>
              <p className="text-muted-foreground mt-1">
                {t("transactions.empty.subtitle")}
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader className="bg-muted/50">
                <TableRow>
                  <TableHead>
                    <button
                      className="flex items-center gap-1"
                      onClick={() =>
                        setSortState((s) => ({
                          key: "date",
                          dir:
                            s.key === "date" && s.dir === "asc"
                              ? "desc"
                              : "asc",
                        }))
                      }>
                      {t("transactions.table.date")}
                      <ChevronsUpDown className="w-3 h-3" />
                    </button>
                  </TableHead>
                  <TableHead>
                    <button
                      className="flex items-center gap-1"
                      onClick={() =>
                        setSortState((s) => ({
                          key: "type",
                          dir:
                            s.key === "type" && s.dir === "asc"
                              ? "desc"
                              : "asc",
                        }))
                      }>
                      {t("transactions.table.type")}
                      <ChevronsUpDown className="w-3 h-3" />
                    </button>
                  </TableHead>
                  <TableHead>
                    <button
                      className="flex items-center gap-1"
                      onClick={() =>
                        setSortState((s) => ({
                          key: "category",
                          dir:
                            s.key === "category" && s.dir === "asc"
                              ? "desc"
                              : "asc",
                        }))
                      }>
                      {t("transactions.table.category")}
                      <ChevronsUpDown className="w-3 h-3" />
                    </button>
                  </TableHead>
                  <TableHead>{t("transactions.table.description")}</TableHead>
                  <TableHead>
                    <button
                      className="flex items-center gap-1"
                      onClick={() =>
                        setSortState((s) => ({
                          key: "person",
                          dir:
                            s.key === "person" && s.dir === "asc"
                              ? "desc"
                              : "asc",
                        }))
                      }>
                      {t("transactions.table.person")}
                      <ChevronsUpDown className="w-3 h-3" />
                    </button>
                  </TableHead>
                  <TableHead className="text-right">
                    <button
                      className="flex items-center gap-1 ml-auto"
                      onClick={() =>
                        setSortState((s) => ({
                          key: "amount",
                          dir:
                            s.key === "amount" && s.dir === "asc"
                              ? "desc"
                              : "asc",
                        }))
                      }>
                      {t("transactions.table.amount")}
                      <ChevronsUpDown className="w-3 h-3" />
                    </button>
                  </TableHead>
                  <TableHead className="text-right"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(transactions || [])
                  .filter((tx) => (typeFilter ? tx.type === typeFilter : true))
                  .filter((tx) =>
                    categoryFilter
                      ? typeof tx.category === "string" &&
                        tx.category.startsWith("transactions.categories.") &&
                        tx.category === categoryFilter
                      : true,
                  )
                  .filter((tx) =>
                    appliedPeriodFilter
                      ? (tx as any).appliedPeriod === appliedPeriodFilter
                      : true,
                  )
                  .filter((tx) =>
                    studentFilter
                      ? (tx as any).studentId === studentFilter
                      : true,
                  )
                  .filter((tx) => {
                    const d = new Date(tx.date as any);
                    if (isNaN(d.getTime())) return false;
                    const y = d.getFullYear();
                    const m = d.getMonth() + 1;
                    if (dateFilter.from || dateFilter.to) {
                      const fromISO = parseDateInputToISO(
                        dateFilter.from || "",
                      );
                      const toISO = parseDateInputToISO(dateFilter.to || "");
                      const from = fromISO ? new Date(fromISO) : undefined;
                      const to = toISO ? new Date(toISO) : undefined;
                      if (from && d < from) return false;
                      if (to) {
                        const tend = new Date(to);
                        tend.setHours(23, 59, 59, 999);
                        if (d > tend) return false;
                      }
                    } else {
                      if (dateFilter.year && y !== Number(dateFilter.year))
                        return false;
                      if (
                        dateFilter.month &&
                        Number(dateFilter.month) >= 1 &&
                        m !== Number(dateFilter.month)
                      )
                        return false;
                    }
                    return true;
                  })
                  .sort((a, b) => {
                    const dir = sortState.dir === "asc" ? 1 : -1;
                    const k = sortState.key;
                    if (k === "date") {
                      const da = new Date(a.date as any).getTime();
                      const db = new Date(b.date as any).getTime();
                      return da === db ? 0 : da < db ? -1 * dir : 1 * dir;
                    }
                    if (k === "amount") {
                      const aa = Number(a.amount);
                      const ab = Number(b.amount);
                      return aa === ab ? 0 : aa < ab ? -1 * dir : 1 * dir;
                    }
                    if (k === "type") {
                      const sa = a.type || "";
                      const sb = b.type || "";
                      return sa.localeCompare(sb) * dir;
                    }
                    if (k === "category") {
                      const sa =
                        typeof a.category === "string"
                          ? a.category
                          : String(a.category);
                      const sb =
                        typeof b.category === "string"
                          ? b.category
                          : String(b.category);
                      return sa.localeCompare(sb) * dir;
                    }
                    if (k === "person") {
                      const sa = (a.person || "").toLowerCase();
                      const sb = (b.person || "").toLowerCase();
                      return sa.localeCompare(sb) * dir;
                    }
                    return 0;
                  })
                  .map((tx) => (
                    <TableRow
                      key={tx.id}
                      className="hover:bg-muted/30 transition-colors">
                      <TableCell className="whitespace-nowrap">
                        {formatDateDisplay(tx.date)}
                      </TableCell>
                      <TableCell>
                        {tx.type === "INCOME" ? (
                          <Badge
                            variant="outline"
                            className="bg-emerald-500/10 text-emerald-600 border-emerald-200">
                            <ArrowUpCircle className="w-3 h-3 mr-1" />{" "}
                            {t("transactions.type.income")}
                          </Badge>
                        ) : (
                          <Badge
                            variant="outline"
                            className="bg-rose-500/10 text-rose-600 border-rose-200">
                            <ArrowDownCircle className="w-3 h-3 mr-1" />{" "}
                            {t("transactions.type.expense")}
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="font-medium text-sm">
                        {typeof tx.category === "string" &&
                        tx.category.startsWith("transactions.categories.")
                          ? t(tx.category)
                          : tx.category}
                        {(tx as any).appliedPeriod ? (
                          <div className="text-xs text-muted-foreground mt-0.5">
                            Kỳ học phí: {(tx as any).appliedPeriod}
                          </div>
                        ) : null}
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm max-w-[200px] truncate">
                        {tx.description || "-"}
                      </TableCell>
                      <TableCell className="text-sm">
                        {tx.person || "-"}
                      </TableCell>
                      <TableCell
                        className={`text-right font-display font-semibold ${tx.type === "INCOME" ? "text-emerald-600" : "text-rose-600"}`}>
                        <div>
                          {tx.type === "INCOME" ? "+" : "-"}
                          {formatCurrency(tx.amount)}
                        </div>
                        <div className="text-xs text-muted-foreground italic mt-0.5">
                          {vndToWords(tx.amount)}
                        </div>
                      </TableCell>
                      <TableCell className="text-right whitespace-nowrap">
                        <Dialog
                          open={editId === tx.id}
                          onOpenChange={(v) => setEditId(v ? tx.id : null)}>
                          <DialogTrigger asChild>
                            <Button variant="outline" size="sm">
                              Edit
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="sm:max-w-[500px]">
                            <DialogHeader>
                              <DialogTitle>
                                {t("transactions.newTitle")}
                              </DialogTitle>
                              <DialogDescription>
                                {t("transactions.newSubtitle")}
                              </DialogDescription>
                            </DialogHeader>
                            <EditTransactionForm
                              initial={tx}
                              onCancel={() => setEditId(null)}
                              onSave={(data) => onUpdate(tx.id, data)}
                            />
                          </DialogContent>
                        </Dialog>
                        <Button
                          variant="destructive"
                          size="sm"
                          className="ml-2"
                          onClick={() => {
                            if (confirm("Xóa giao dịch này?")) onDelete(tx.id);
                          }}>
                          Delete
                        </Button>
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

function TransactionCategoryFilter() {
  const { t } = useTranslation("common");
  const [typeSel, setTypeSel] = useState<"ALL" | "INCOME" | "EXPENSE">("ALL");
  const [catSel, setCatSel] = useState<string>("ALL");
  const incomeKeys = [
    "transactions.categories.income.tuition",
    "transactions.categories.income.donation",
    "transactions.categories.other",
  ];
  const expenseKeys = [
    "transactions.categories.expense.field",
    "transactions.categories.expense.food",
    "transactions.categories.expense.developmentFund",
    "transactions.categories.expense.donation",
    "transactions.categories.expense.reward",
    "transactions.categories.expense.gift",
    "transactions.categories.other",
  ];
  const keys =
    typeSel === "INCOME"
      ? incomeKeys
      : typeSel === "EXPENSE"
        ? expenseKeys
        : [];
  const publishType = (val: "ALL" | "INCOME" | "EXPENSE") => {
    setTypeSel(val);
    setCatSel("ALL");
    window.dispatchEvent(
      new CustomEvent("tx-type-filter", { detail: val === "ALL" ? "" : val }),
    );
    window.dispatchEvent(new CustomEvent("tx-category-filter", { detail: "" }));
  };
  useEffect(() => {
    const handler = (e: Event) => {
      const v = ((e as CustomEvent<string>).detail || "") as
        | ""
        | "INCOME"
        | "EXPENSE";
      setTypeSel((v || "ALL") as any);
      setCatSel("ALL");
    };
    window.addEventListener("tx-type-filter", handler as any);
    return () => window.removeEventListener("tx-type-filter", handler as any);
  }, []);
  const publishCat = (val: string) => {
    setCatSel(val);
    const key = val === "ALL" ? "" : val;
    window.dispatchEvent(
      new CustomEvent("tx-category-filter", { detail: key }),
    );
  };
  return (
    <div className="flex items-center gap-3">
      <div className="flex items-center gap-2">
        <Label className="text-sm">Loại</Label>
        <Select
          onValueChange={(v) => publishType(v as any)}
          defaultValue={typeSel}>
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="All" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All</SelectItem>
            <SelectItem value="INCOME">
              {t("transactions.type.income")}
            </SelectItem>
            <SelectItem value="EXPENSE">
              {t("transactions.type.expense")}
            </SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="flex items-center gap-2">
        <Label className="text-sm">{t("transactions.category")}</Label>
        <Select
          onValueChange={publishCat}
          defaultValue={catSel}
          disabled={typeSel === "ALL"}>
          <SelectTrigger className="w-[240px]">
            <SelectValue placeholder={`${t("transactions.category")} — All`} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All</SelectItem>
            {keys.map((key) => (
              <SelectItem key={key} value={key}>
                {t(key)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}

function TransactionDateFilters() {
  const years = (() => {
    const now = new Date().getFullYear();
    return Array.from({ length: 6 }).map((_, i) => String(now - i));
  })();
  const [yearSel, setYearSel] = useState<string>("ALL");
  const [monthSel, setMonthSel] = useState<string>("ALL");
  const [fromText, setFromText] = useState<string>("");
  const [toText, setToText] = useState<string>("");
  const publish = (payload: {
    year?: string;
    month?: string;
    from?: string;
    to?: string;
  }) => {
    window.dispatchEvent(
      new CustomEvent("tx-date-filter", { detail: payload }),
    );
  };
  const setYear = (v: string) => {
    setYearSel(v);
    const year = v === "ALL" ? undefined : v;
    publish({ year, month: monthSel === "ALL" ? undefined : monthSel });
  };
  const setMonth = (v: string) => {
    setMonthSel(v);
    const month = v === "ALL" ? undefined : v;
    publish({ year: yearSel === "ALL" ? undefined : yearSel, month });
  };
  const onFrom = (v: string) => {
    const txt = normalizeDateTyping(v);
    setFromText(txt);
    publish({ from: txt || undefined, to: toText || undefined });
  };
  const onTo = (v: string) => {
    const txt = normalizeDateTyping(v);
    setToText(txt);
    publish({ from: fromText || undefined, to: txt || undefined });
  };
  return (
    <div className="flex flex-wrap items-center gap-3">
      <div className="flex items-center gap-2">
        <Label className="text-sm">Năm</Label>
        <Select onValueChange={setYear} defaultValue={yearSel}>
          <SelectTrigger className="w-[120px]">
            <SelectValue placeholder="ALL" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All</SelectItem>
            {years.map((y) => (
              <SelectItem key={y} value={y}>
                {y}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="flex items-center gap-2">
        <Label className="text-sm">Tháng</Label>
        <Select onValueChange={setMonth} defaultValue={monthSel}>
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="ALL" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All</SelectItem>
            {Array.from({ length: 12 }).map((_, i) => (
              <SelectItem key={i + 1} value={String(i + 1)}>
                {String(i + 1).padStart(2, "0")}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="flex items-center gap-2">
        <Label className="text-sm">Từ ngày</Label>
        <div className="flex items-center gap-2">
          <Input
            className="w-[140px]"
            type="text"
            placeholder="dd/MM/yyyy"
            value={fromText}
            onChange={(e) => onFrom(e.target.value)}
          />
          <Popover>
            <PopoverTrigger asChild>
              <Button type="button" variant="outline">
                <ChevronsUpDown className="h-4 w-4" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="p-0">
              <DayCalendar
                mode="single"
                onSelect={(d) => {
                  if (!d) return;
                  const dd = String(d.getDate()).padStart(2, "0");
                  const mm = String(d.getMonth() + 1).padStart(2, "0");
                  const yyyy = d.getFullYear();
                  const v = `${dd}/${mm}/${yyyy}`;
                  setFromText(v);
                  publish({ from: v || undefined, to: toText || undefined });
                }}
              />
            </PopoverContent>
          </Popover>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <Label className="text-sm">Đến ngày</Label>
        <div className="flex items-center gap-2">
          <Input
            className="w-[140px]"
            type="text"
            placeholder="dd/MM/yyyy"
            value={toText}
            onChange={(e) => onTo(e.target.value)}
          />
          <Popover>
            <PopoverTrigger asChild>
              <Button type="button" variant="outline">
                <ChevronsUpDown className="h-4 w-4" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="p-0">
              <DayCalendar
                mode="single"
                onSelect={(d) => {
                  if (!d) return;
                  const dd = String(d.getDate()).padStart(2, "0");
                  const mm = String(d.getMonth() + 1).padStart(2, "0");
                  const yyyy = d.getFullYear();
                  const v = `${dd}/${mm}/${yyyy}`;
                  setToText(v);
                  publish({ from: fromText || undefined, to: v || undefined });
                }}
              />
            </PopoverContent>
          </Popover>
        </div>
      </div>
      <Button
        variant="outline"
        onClick={() => {
          setYearSel("ALL");
          setMonthSel("ALL");
          setFromText("");
          setToText("");
          publish({});
        }}>
        Xóa lọc ngày
      </Button>
    </div>
  );
}

function TuitionPeriodFilter() {
  const [value, setValue] = useState<string>("");
  return (
    <div className="flex items-center gap-3">
      <div className="flex items-center gap-2">
        <Label className="text-sm">Kỳ học phí</Label>
        <Input
          className="w-[160px]"
          type="month"
          value={value}
          onChange={(e) => {
            setValue(e.target.value);
            window.dispatchEvent(
              new CustomEvent("tx-applied-period", {
                detail: e.target.value || "",
              }),
            );
          }}
        />
        <Button
          variant="outline"
          onClick={() => {
            setValue("");
            window.dispatchEvent(
              new CustomEvent("tx-applied-period", { detail: "" }),
            );
          }}>
          Xóa kỳ
        </Button>
      </div>
    </div>
  );
}

function EditTransactionForm({
  initial,
  onSave,
  onCancel,
}: {
  initial: any;
  onSave: (data: any) => void;
  onCancel: () => void;
}) {
  const { t } = useTranslation("common");
  const { data: students } = useStudents(initial.classId);
  const { register, handleSubmit, control, watch, setValue } = useForm<any>({
    defaultValues: {
      type: initial.type,
      date: initial.date,
      amount: Number(initial.amount),
      category: initial.category,
      appliedPeriod: initial.appliedPeriod || "",
      studentId: initial.studentId || "",
      description: initial.description || "",
      person: initial.person || "",
      note: initial.note || "",
    },
  });
  const incomeCategoriesKeys = [
    "transactions.categories.income.tuition",
    "transactions.categories.income.donation",
    "transactions.categories.other",
  ] as const;
  const expenseCategoriesKeys = [
    "transactions.categories.expense.field",
    "transactions.categories.expense.food",
    "transactions.categories.expense.developmentFund",
    "transactions.categories.expense.donation",
    "transactions.categories.expense.reward",
    "transactions.categories.expense.gift",
    "transactions.categories.other",
  ] as const;
  const typeVal = watch("type");
  const categories = (
    typeVal === "EXPENSE" ? expenseCategoriesKeys : incomeCategoriesKeys
  ) as readonly string[];
  const currentCat = watch("category");
  if (!currentCat) setValue("category", categories[0]);
  const categoryVal = watch("category");
  const findStudentIdByPerson = (person?: string | null) => {
    const p = (person || "").trim().toLowerCase().replace(/\s+/g, " ");
    if (!p) return undefined;
    const list = (students || []) as any[];
    const hit = list.find((s) => {
      const full = `${s.firstName || ""} ${s.lastName || ""}`
        .trim()
        .toLowerCase()
        .replace(/\s+/g, " ");
      return full === p;
    });
    return hit?.id as string | undefined;
  };
  return (
    <form
      onSubmit={handleSubmit((data) => {
        Object.keys(data).forEach((k) => {
          if (data[k] === "") data[k] = null;
        });
        if (data.amount !== undefined) data.amount = Number(data.amount);
        if (data.appliedPeriod) {
          const v = String(data.appliedPeriod);
          // ensure format YYYY-MM
          if (/^\d{4}-\d{2}$/.test(v)) {
            // ok
          } else if (/^\d{2}\/\d{4}$/.test(v)) {
            const [mm, yyyy] = v.split("/");
            (data as any).appliedPeriod = `${yyyy}-${mm}`;
          }
        }
        if (
          data.type === "INCOME" &&
          data.category === "transactions.categories.income.tuition" &&
          !data.studentId &&
          data.person
        ) {
          data.studentId = findStudentIdByPerson(data.person) || null;
        }
        onSave(data);
      })}
      className="space-y-4 pt-2">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label>Loại</Label>
          <select
            {...register("type")}
            className="border w-full rounded-md h-9 px-3 mt-1">
            <option value="INCOME">Tiền vào</option>
            <option value="EXPENSE">Tiền ra</option>
          </select>
        </div>
        <div>
          <Label>Ngày</Label>
          <div className="flex items-center gap-2">
            <Input
              type="text"
              placeholder="dd/MM/yyyy"
              {...register("date", {
                onChange: (e) => {
                  e.target.value = normalizeDateTyping(e.target.value);
                },
              })}
            />
            <Popover>
              <PopoverTrigger asChild>
                <Button type="button" variant="outline">
                  <ChevronsUpDown className="h-4 w-4" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="p-0">
                <DayCalendar
                  mode="single"
                  onSelect={(d) => {
                    if (!d) return;
                    const dd = String(d.getDate()).padStart(2, "0");
                    const mm = String(d.getMonth() + 1).padStart(2, "0");
                    const yyyy = d.getFullYear();
                    setValue("date", `${dd}/${mm}/${yyyy}`);
                  }}
                />
              </PopoverContent>
            </Popover>
          </div>
        </div>
      </div>
      <div>
        <Label>Số tiền</Label>
        <Controller
          control={control}
          name="amount"
          render={({ field }) => (
            <>
              <Input
                inputMode="numeric"
                placeholder="0"
                value={groupThousands(String(field.value ?? ""))}
                onChange={(e) => {
                  const digits = e.target.value.replace(/\D/g, "");
                  const n = digits ? Number(digits) : 0;
                  field.onChange(n);
                }}
              />
              <p className="text-xs text-muted-foreground italic mt-1">
                {vndToWords(field.value || 0)}
              </p>
            </>
          )}
        />
      </div>
      <div>
        <Label>Danh mục</Label>
        <Controller
          control={control}
          name="category"
          render={({ field }) => (
            <Select onValueChange={field.onChange} defaultValue={field.value}>
              <SelectTrigger>
                <SelectValue placeholder="Danh mục" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((key) => (
                  <SelectItem key={key} value={key}>
                    {t(key)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        />
      </div>
      <div>
        <Label>Người liên quan</Label>
        <Controller
          control={control}
          name="person"
          render={({ field }) => (
            <PersonCombobox
              classId={initial.classId}
              value={field.value || ""}
              onChange={field.onChange}
              onSelectId={(id) =>
                setValue("studentId", id as any, { shouldDirty: true })
              }
            />
          )}
        />
        <input type="hidden" {...register("studentId")} />
      </div>
      {typeVal === "INCOME" &&
        categoryVal === "transactions.categories.income.tuition" && (
          <div>
            <Label>Kỳ học phí (YYYY-MM)</Label>
            <Controller
              control={control}
              name="appliedPeriod"
              render={({ field }) => (
                <Input
                  type="month"
                  value={field.value || ""}
                  onChange={(e) => field.onChange(e.target.value)}
                />
              )}
            />
          </div>
        )}
      <div>
        <Label>Mô tả</Label>
        <Input {...register("description")} />
      </div>
      <DialogFooter>
        <Button type="button" variant="outline" onClick={onCancel}>
          Hủy
        </Button>
        <Button type="submit">Lưu</Button>
      </DialogFooter>
    </form>
  );
}

function normalizeDateTyping(value: string) {
  const digits = value.replace(/\D/g, "").slice(0, 8);
  if (digits.length >= 5)
    return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`;
  if (digits.length >= 3) return `${digits.slice(0, 2)}/${digits.slice(2)}`;
  return digits;
}

function groupThousands(src: string) {
  const digits = src.replace(/\D/g, "");
  if (!digits) return "";
  return digits.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}

function PersonCombobox({
  classId,
  value,
  onChange,
  onSelectId,
}: {
  classId: string;
  value: string;
  onChange: (val: string) => void;
  onSelectId?: (id: string) => void;
}) {
  const { data: students } = useStudents(classId);
  const { t } = useTranslation("common");
  const createStudent = useCreateStudent(classId);
  const [open, setOpen] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");

  const currentLabel = value || "";

  const list =
    students?.map((s) => ({
      id: s.id,
      label:
        `${(s.firstName || "").trim()} ${(s.lastName || "").trim()}`.trim(),
    })) || [];

  return (
    <div className="flex items-center gap-2">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            className={cn(
              "w-[260px] justify-between",
              !currentLabel && "text-muted-foreground",
            )}>
            {currentLabel || "Chọn học viên / người liên quan"}
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[300px] p-0">
          <Command>
            <CommandInput placeholder="Tìm kiếm..." />
            <CommandList>
              <CommandEmpty>Không tìm thấy.</CommandEmpty>
              <CommandGroup heading="Học viên">
                {list.map((item) => (
                  <CommandItem
                    key={item.id}
                    value={item.label}
                    onSelect={(val) => {
                      onChange(val);
                      onSelectId?.(item.id);
                      setOpen(false);
                    }}>
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        currentLabel === item.label
                          ? "opacity-100"
                          : "opacity-0",
                      )}
                    />
                    <span>{item.label}</span>
                  </CommandItem>
                ))}
              </CommandGroup>
              <CommandGroup heading="Hành động">
                <CommandItem
                  value="+create-new"
                  onSelect={() => {
                    setOpen(false);
                    setCreateOpen(true);
                  }}>
                  <Plus className="mr-2 h-4 w-4" />
                  <span>Tạo mới học viên</span>
                </CommandItem>
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Thêm học viên</DialogTitle>
            <DialogDescription>
              Nhập tên để thêm nhanh học viên.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 pt-2">
            <div className="space-y-1">
              <Label>Họ</Label>
              <Input
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <Label>Tên</Label>
              <Input
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
              />
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setCreateOpen(false)}>
                Hủy
              </Button>
              <Button
                onClick={async () => {
                  const ln = lastName.trim();
                  const fn = firstName.trim();
                  if (!ln || !fn) return;
                  await createStudent.mutateAsync({
                    lastName: ln,
                    firstName: fn,
                    dateOfBirth: undefined,
                    phone: undefined,
                    parentPhone: undefined,
                    note: undefined,
                    nationality: undefined,
                    startDate: undefined,
                    level: undefined,
                    healthStatus: undefined,
                    address: undefined,
                    occupation: undefined,
                    height: undefined,
                    weight: undefined,
                    trainingStatus: "ACTIVE" as any,
                  } as any);
                  onChange(`${fn} ${ln}`.trim());
                  setCreateOpen(false);
                  setFirstName("");
                  setLastName("");
                }}>
                Lưu
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
