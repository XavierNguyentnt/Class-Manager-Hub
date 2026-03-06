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
  const createTx = useCreateTransaction(classId);
  const updateTx = useUpdateTransaction(classId);
  const deleteTx = useDeleteTransaction(classId);
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const { t } = useTranslation("common");
  const [categoryFilter, setCategoryFilter] = useState<string>("");
  useEffect(() => {
    const handler = (e: Event) =>
      setCategoryFilter((e as CustomEvent<string>).detail || "");
    window.addEventListener("tx-category-filter", handler as any);
    return () =>
      window.removeEventListener("tx-category-filter", handler as any);
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

  const onSubmit = async (data: z.infer<typeof formSchema>) => {
    try {
      const payload = { ...data, date: parseDateInputToISO(data.date) as any };
      await createTx.mutateAsync(payload as any);
      setOpen(false);
      reset({ type: "INCOME", date: format(new Date(), "yyyy-MM-dd") });
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
                      onChange={field.onChange}
                    />
                  )}
                />
              </div>

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
      <TransactionCategoryFilter />

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
                  <TableHead>{t("transactions.table.date")}</TableHead>
                  <TableHead>{t("transactions.table.type")}</TableHead>
                  <TableHead>{t("transactions.table.category")}</TableHead>
                  <TableHead>{t("transactions.table.description")}</TableHead>
                  <TableHead>{t("transactions.table.person")}</TableHead>
                  <TableHead className="text-right">
                    {t("transactions.table.amount")}
                  </TableHead>
                  <TableHead className="text-right"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(categoryFilter
                  ? transactions?.filter(
                      (tx) =>
                        typeof tx.category === "string" &&
                        tx.category.startsWith("transactions.categories.") &&
                        tx.category === categoryFilter,
                    )
                  : transactions
                )?.map((tx) => (
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
  const [selected, setSelected] = useState<string>("ALL");
  // Publish a custom event so the table below can pick up the filter without lifting too much state
  const publish = (val: string) => {
    const key = val === "ALL" ? "" : val;
    setSelected(val);
    window.dispatchEvent(
      new CustomEvent("tx-category-filter", { detail: key }),
    );
  };
  const allKeys = [
    "transactions.categories.income.tuition",
    "transactions.categories.income.donation",
    "transactions.categories.other",
    "transactions.categories.expense.field",
    "transactions.categories.expense.food",
    "transactions.categories.expense.developmentFund",
    "transactions.categories.expense.donation",
    "transactions.categories.expense.reward",
    "transactions.categories.expense.gift",
  ];
  return (
    <div className="flex items-center gap-2">
      <Label className="text-sm">{t("transactions.category")}</Label>
      <Select onValueChange={publish} defaultValue={selected}>
        <SelectTrigger className="w-[240px]">
          <SelectValue placeholder={`${t("transactions.category")} — All`} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="ALL">{`All`}</SelectItem>
          {allKeys.map((key) => (
            <SelectItem key={key} value={key}>
              {t(key)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
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
  const { register, handleSubmit, control, watch, setValue } = useForm<any>({
    defaultValues: {
      type: initial.type,
      date: initial.date,
      amount: Number(initial.amount),
      category: initial.category,
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
  return (
    <form
      onSubmit={handleSubmit((data) => {
        Object.keys(data).forEach((k) => {
          if (data[k] === "") data[k] = null;
        });
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
            />
          )}
        />
      </div>
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
}: {
  classId: string;
  value: string;
  onChange: (val: string) => void;
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
