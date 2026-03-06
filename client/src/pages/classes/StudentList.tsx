import { useState } from "react";
import { useRoute } from "wouter";
import {
  useStudents,
  useCreateStudent,
  useUpdateStudent,
  useDeleteStudent,
} from "@/hooks/use-students";
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
  Plus,
  Loader2,
  UserPlus,
  Phone,
  Calendar,
  Users,
  Calendar as CalendarIcon,
} from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar as DayCalendar } from "@/components/ui/calendar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { api } from "@shared/routes";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { formatDateDisplay, formatFullName } from "@/lib/utils";
import { useTranslation } from "react-i18next";

const createStudentSchema = api.students.create.input;

export default function StudentList() {
  const [, params] = useRoute("/classes/:id/students");
  const classId = params?.id || "";

  const { data: students, isLoading } = useStudents(classId);
  const createStudent = useCreateStudent(classId);
  const updateStudent = useUpdateStudent(classId);
  const deleteStudent = useDeleteStudent(classId);
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [editOpen, setEditOpen] = useState<string | null>(null);
  const { t } = useTranslation("common");

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors },
  } = useForm<z.infer<typeof createStudentSchema>>({
    resolver: zodResolver(createStudentSchema),
  });

  const onSubmit = async (data: z.infer<typeof createStudentSchema>) => {
    try {
      const payload = { ...data } as any;
      if (payload.dateOfBirth)
        payload.dateOfBirth = (await import("@/lib/utils")).parseDateInputToISO(
          payload.dateOfBirth,
        );
      if (payload.startDate)
        payload.startDate = (await import("@/lib/utils")).parseDateInputToISO(
          payload.startDate,
        );
      if (!data.trainingStatus || !data.trainingStatus.trim())
        data.trainingStatus = "ACTIVE" as any;
      await createStudent.mutateAsync(payload);
      setOpen(false);
      reset();
      toast({ title: t("students.save") });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message,
      });
    }
  };

  const onUpdate = async (
    id: string,
    data: Partial<z.infer<typeof createStudentSchema>>,
  ) => {
    try {
      await updateStudent.mutateAsync({ id, data });
      setEditOpen(null);
      toast({ title: t("students.save") });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message,
      });
    }
  };

  const onChangeStatus = async (
    id: string,
    status: "ACTIVE" | "INACTIVE" | "SUSPEND",
  ) => {
    try {
      await updateStudent.mutateAsync({
        id,
        data: { trainingStatus: status } as any,
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

  return (
    <div className="p-6 md:p-10 max-w-7xl mx-auto space-y-6 animate-in fade-in duration-300">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold text-foreground tracking-tight">
            {t("students.title")}
          </h1>
          <p className="text-muted-foreground mt-1">{t("students.subtitle")}</p>
        </div>

        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="shadow-sm gap-2">
              <UserPlus className="w-4 h-4" />
              {t("students.add")}
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-[95vw] md:max-w-3xl lg:max-w-5xl xl:max-w-[1200px]">
            <DialogHeader>
              <DialogTitle>{t("students.addTitle")}</DialogTitle>
              <DialogDescription>{t("students.addSubtitle")}</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 pt-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-8 gap-4">
                <div className="space-y-2 xl:col-span-2">
                  <Label htmlFor="firstName">{t("students.firstName")}</Label>
                  <Input
                    id="firstName"
                    placeholder="Nguyen"
                    {...register("firstName")}
                  />
                  {"firstName" in errors && errors.firstName && (
                    <p className="text-sm text-destructive">
                      {errors.firstName.message as any}
                    </p>
                  )}
                </div>
                <div className="space-y-2 xl:col-span-2">
                  <Label htmlFor="lastName">{t("students.lastName")}</Label>
                  <Input
                    id="lastName"
                    placeholder="Van A"
                    {...register("lastName")}
                  />
                  {"lastName" in errors && errors.lastName && (
                    <p className="text-sm text-destructive">
                      {errors.lastName.message as any}
                    </p>
                  )}
                </div>
                <div className="space-y-2 xl:col-span-2">
                  <Label htmlFor="dateOfBirth">{t("students.dob")}</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      id="dateOfBirth"
                      type="text"
                      placeholder="dd/MM/yyyy"
                      {...register("dateOfBirth", {
                        onChange: (e) => {
                          e.target.value = normalizeDateTyping(e.target.value);
                        },
                      })}
                    />
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button type="button" variant="outline">
                          <CalendarIcon className="h-4 w-4" />
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
                            setValue(
                              "dateOfBirth",
                              `${dd}/${mm}/${yyyy}` as any,
                              { shouldDirty: true },
                            );
                          }}
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>
                <div className="space-y-2 xl:col-span-2">
                  <Label htmlFor="phone">{t("students.studentPhone")}</Label>
                  <Input
                    id="phone"
                    placeholder="+84..."
                    {...register("phone")}
                  />
                </div>
                <div className="space-y-2 xl:col-span-2">
                  <Label htmlFor="nationality">
                    {t("students.nationality")}
                  </Label>
                  <Input
                    id="nationality"
                    placeholder="Vietnamese"
                    {...register("nationality")}
                  />
                </div>
                <div className="space-y-2 xl:col-span-2">
                  <Label htmlFor="startDate">{t("students.startDate")}</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      id="startDate"
                      type="text"
                      placeholder="dd/MM/yyyy"
                      {...register("startDate", {
                        onChange: (e) => {
                          e.target.value = normalizeDateTyping(e.target.value);
                        },
                      })}
                    />
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button type="button" variant="outline">
                          <CalendarIcon className="h-4 w-4" />
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
                            setValue(
                              "startDate",
                              `${dd}/${mm}/${yyyy}` as any,
                              { shouldDirty: true },
                            );
                          }}
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>
                <div className="space-y-2 xl:col-span-2">
                  <Label htmlFor="level">{t("students.level")}</Label>
                  <Input
                    id="level"
                    placeholder="Sơ cấp 2"
                    {...register("level")}
                  />
                </div>
                <div className="space-y-2 xl:col-span-2">
                  <Label htmlFor="healthStatus">
                    {t("students.healthStatus")}
                  </Label>
                  <Input
                    id="healthStatus"
                    placeholder="Good"
                    {...register("healthStatus")}
                  />
                </div>
                <div className="space-y-2 xl:col-span-8">
                  <Label htmlFor="address">{t("students.address")}</Label>
                  <Input
                    id="address"
                    placeholder="Đào Tấn, Ba Đình, Hà Nội"
                    {...register("address")}
                  />
                </div>
                <div className="space-y-2 xl:col-span-2">
                  <Label htmlFor="occupation">{t("students.occupation")}</Label>
                  <Input
                    id="occupation"
                    placeholder="Đào tạo"
                    {...register("occupation")}
                  />
                </div>
                <div className="space-y-2 xl:col-span-2">
                  <Label htmlFor="height">{t("students.height")}</Label>
                  <Input
                    id="height"
                    placeholder="1m67–1m7"
                    {...register("height")}
                  />
                </div>
                <div className="space-y-2 xl:col-span-2">
                  <Label htmlFor="weight">{t("students.weight")}</Label>
                  <Input
                    id="weight"
                    placeholder="56–58kg"
                    {...register("weight")}
                  />
                </div>
                <div className="space-y-2 xl:col-span-2">
                  <Label htmlFor="trainingStatus">
                    {t("students.trainingStatus")}
                  </Label>
                  <Input
                    id="trainingStatus"
                    placeholder="..."
                    {...register("trainingStatus")}
                  />
                </div>
                <div className="space-y-2 xl:col-span-2">
                  <Label htmlFor="parentPhone">
                    {t("students.parentPhone")}
                  </Label>
                  <Input
                    id="parentPhone"
                    placeholder="+84..."
                    {...register("parentPhone")}
                  />
                </div>
                <div className="space-y-2 xl:col-span-8">
                  <Label htmlFor="note">{t("students.note")}</Label>
                  <Input
                    id="note"
                    placeholder="Allergies, accommodations, etc."
                    {...register("note")}
                  />
                </div>
              </div>
              <DialogFooter className="pt-4">
                <Button type="submit" disabled={createStudent.isPending}>
                  {createStudent.isPending ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    t("students.save")
                  )}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card className="border-border/50 shadow-sm overflow-hidden">
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex h-40 items-center justify-center">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : students?.length === 0 ? (
            <div className="text-center py-16 px-4">
              <Users className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
              <h3 className="text-lg font-medium">
                {t("students.empty.title")}
              </h3>
              <p className="text-muted-foreground mt-1">
                {t("students.empty.description")}
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader className="bg-muted/50">
                <TableRow>
                  <TableHead className="w-[300px]">
                    {t("students.table.name")}
                  </TableHead>
                  <TableHead>{t("students.table.contact")}</TableHead>
                  <TableHead>{t("students.table.parentContact")}</TableHead>
                  <TableHead>{t("students.table.dob")}</TableHead>
                  <TableHead>{t("students.note")}</TableHead>
                  <TableHead className="w-[140px] text-right"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {students?.map((student) => (
                  <TableRow
                    key={student.id}
                    className="hover:bg-muted/30 transition-colors">
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xs">
                          {(student.lastName || student.firstName)
                            .charAt(0)
                            .toUpperCase()}
                        </div>
                        <div className="flex items-center gap-2">
                          <span>
                            {formatFullName(
                              student.firstName,
                              student.lastName,
                            )}
                          </span>
                          {student.trainingStatus && (
                            <Badge variant="outline">
                              {student.trainingStatus}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {student.phone ? (
                        <div className="flex items-center text-sm text-muted-foreground">
                          <Phone className="w-3 h-3 mr-2" /> {student.phone}
                        </div>
                      ) : (
                        <span className="text-muted-foreground/50">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {student.parentPhone ? (
                        <div className="flex items-center text-sm text-muted-foreground">
                          <Phone className="w-3 h-3 mr-2 text-indigo-400" />{" "}
                          {student.parentPhone}
                        </div>
                      ) : (
                        <span className="text-muted-foreground/50">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {student.dateOfBirth ? (
                        <div className="flex items-center text-sm">
                          <Calendar className="w-3 h-3 mr-2 text-muted-foreground" />
                          {formatDateDisplay(student.dateOfBirth)}
                        </div>
                      ) : (
                        <span className="text-muted-foreground/50">-</span>
                      )}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground max-w-[200px] truncate">
                      {student.note || "-"}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Dialog
                          open={editOpen === student.id}
                          onOpenChange={(v) =>
                            setEditOpen(v ? student.id : null)
                          }>
                          <DialogTrigger asChild>
                            <Button variant="outline" size="sm">
                              Edit
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="sm:max-w-[600px]">
                            <DialogHeader>
                              <DialogTitle>Edit Student</DialogTitle>
                              <DialogDescription>
                                {t("students.addSubtitle")}
                              </DialogDescription>
                            </DialogHeader>
                            <EditStudentForm
                              initial={student}
                              onCancel={() => setEditOpen(null)}
                              onSave={(data) => onUpdate(student.id, data)}
                            />
                          </DialogContent>
                        </Dialog>
                        <Select
                          onValueChange={(v) =>
                            onChangeStatus(student.id, v as any)
                          }
                          defaultValue={
                            (student.trainingStatus as any) || "ACTIVE"
                          }>
                          <SelectTrigger className="w-[160px]">
                            <SelectValue placeholder="Trạng thái" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="ACTIVE">Active</SelectItem>
                            <SelectItem value="INACTIVE">Inactive</SelectItem>
                            <SelectItem value="SUSPEND">Suspend</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
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

function EditStudentForm({
  initial,
  onSave,
  onCancel,
}: {
  initial: any;
  onSave: (data: any) => void;
  onCancel: () => void;
}) {
  const { register, handleSubmit, setValue } = useForm<any>({
    defaultValues: {
      firstName: initial.firstName,
      lastName: initial.lastName,
      dateOfBirth: initial.dateOfBirth || "",
      phone: initial.phone || "",
      parentPhone: initial.parentPhone || "",
      note: initial.note || "",
      nationality: initial.nationality || "",
      startDate: initial.startDate || "",
      level: initial.level || "",
      healthStatus: initial.healthStatus || "",
      address: initial.address || "",
      occupation: initial.occupation || "",
      height: initial.height || "",
      weight: initial.weight || "",
      trainingStatus: initial.trainingStatus || "",
    },
  });
  return (
    <form
      onSubmit={handleSubmit((data) => {
        Object.keys(data).forEach((k) => {
          if (data[k] === "") data[k] = null;
        });
        const patch = { ...data };
        if (patch.dateOfBirth) {
          const { parseDateInputToISO } = require("@/lib/utils");
          patch.dateOfBirth = parseDateInputToISO(patch.dateOfBirth);
        }
        if (patch.startDate) {
          const { parseDateInputToISO } = require("@/lib/utils");
          patch.startDate = parseDateInputToISO(patch.startDate);
        }
        onSave(patch);
      })}
      className="space-y-4 pt-2">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label>Họ</Label>
          <Input {...register("lastName")} />
        </div>
        <div>
          <Label>Tên</Label>
          <Input {...register("firstName")} />
        </div>
        <div>
          <Label>Ngày sinh</Label>
          <div className="flex items-center gap-2">
            <Input
              type="text"
              placeholder="dd/MM/yyyy"
              {...register("dateOfBirth", {
                onChange: (e) => {
                  e.target.value = normalizeDateTyping(e.target.value);
                },
              })}
            />
            <Popover>
              <PopoverTrigger asChild>
                <Button type="button" variant="outline">
                  <CalendarIcon className="h-4 w-4" />
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
                    setValue("dateOfBirth", `${dd}/${mm}/${yyyy}`);
                  }}
                />
              </PopoverContent>
            </Popover>
          </div>
        </div>
        <div>
          <Label>SĐT</Label>
          <Input {...register("phone")} />
        </div>
        <div>
          <Label>SĐT phụ huynh</Label>
          <Input {...register("parentPhone")} />
        </div>
        <div>
          <Label>Quốc tịch</Label>
          <Input {...register("nationality")} />
        </div>
        <div>
          <Label>Ngày bắt đầu</Label>
          <div className="flex items-center gap-2">
            <Input
              type="text"
              placeholder="dd/MM/yyyy"
              {...register("startDate", {
                onChange: (e) => {
                  e.target.value = normalizeDateTyping(e.target.value);
                },
              })}
            />
            <Popover>
              <PopoverTrigger asChild>
                <Button type="button" variant="outline">
                  <CalendarIcon className="h-4 w-4" />
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
                    setValue("startDate", `${dd}/${mm}/${yyyy}`);
                  }}
                />
              </PopoverContent>
            </Popover>
          </div>
        </div>
        <div>
          <Label>Trình độ</Label>
          <Input {...register("level")} />
        </div>
        <div>
          <Label>Tình trạng sức khỏe</Label>
          <Input {...register("healthStatus")} />
        </div>
        <div className="col-span-2">
          <Label>Địa chỉ</Label>
          <Input {...register("address")} />
        </div>
        <div>
          <Label>Nghề nghiệp</Label>
          <Input {...register("occupation")} />
        </div>
        <div>
          <Label>Chiều cao</Label>
          <Input {...register("height")} />
        </div>
        <div>
          <Label>Cân nặng</Label>
          <Input {...register("weight")} />
        </div>
        <div>
          <Label>Tình trạng tập luyện</Label>
          <Input {...register("trainingStatus")} />
        </div>
        <div className="col-span-2">
          <Label>Ghi chú</Label>
          <Input {...register("note")} />
        </div>
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
