import { useState } from "react";
import { useRoute } from "wouter";
import { useStudents, useCreateStudent } from "@/hooks/use-students";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Loader2, UserPlus, Phone, Calendar } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { api } from "@shared/routes";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

const createStudentSchema = api.students.create.input;

export default function StudentList() {
  const [, params] = useRoute("/classes/:id/students");
  const classId = params?.id || "";
  
  const { data: students, isLoading } = useStudents(classId);
  const createStudent = useCreateStudent(classId);
  const { toast } = useToast();
  const [open, setOpen] = useState(false);

  const { register, handleSubmit, reset, formState: { errors } } = useForm<z.infer<typeof createStudentSchema>>({
    resolver: zodResolver(createStudentSchema),
  });

  const onSubmit = async (data: z.infer<typeof createStudentSchema>) => {
    try {
      await createStudent.mutateAsync(data);
      setOpen(false);
      reset();
      toast({ title: "Student added successfully" });
    } catch (error: any) {
      toast({ variant: "destructive", title: "Error", description: error.message });
    }
  };

  return (
    <div className="p-6 md:p-10 max-w-7xl mx-auto space-y-6 animate-in fade-in duration-300">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold text-foreground tracking-tight">Students Roster</h1>
          <p className="text-muted-foreground mt-1">Manage enrollments and contact information.</p>
        </div>
        
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="shadow-sm gap-2">
              <UserPlus className="w-4 h-4" />
              Add Student
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Add new student</DialogTitle>
              <DialogDescription>Enroll a new student to this class.</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label htmlFor="fullName">Full Name</Label>
                <Input id="fullName" placeholder="Jane Doe" {...register("fullName")} />
                {errors.fullName && <p className="text-sm text-destructive">{errors.fullName.message}</p>}
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="dateOfBirth">Date of Birth</Label>
                  <Input id="dateOfBirth" type="date" {...register("dateOfBirth")} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Student Phone</Label>
                  <Input id="phone" placeholder="+1..." {...register("phone")} />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="parentPhone">Parent/Guardian Phone</Label>
                <Input id="parentPhone" placeholder="+1..." {...register("parentPhone")} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="note">Notes</Label>
                <Input id="note" placeholder="Allergies, accommodations, etc." {...register("note")} />
              </div>
              <DialogFooter className="pt-4">
                <Button type="submit" disabled={createStudent.isPending}>
                  {createStudent.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : "Save Student"}
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
              <h3 className="text-lg font-medium">No students enrolled</h3>
              <p className="text-muted-foreground mt-1">Add students to build your roster.</p>
            </div>
          ) : (
            <Table>
              <TableHeader className="bg-muted/50">
                <TableRow>
                  <TableHead className="w-[300px]">Name</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Parent Contact</TableHead>
                  <TableHead>DOB</TableHead>
                  <TableHead>Notes</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {students?.map((student) => (
                  <TableRow key={student.id} className="hover:bg-muted/30 transition-colors">
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xs">
                          {student.fullName.charAt(0).toUpperCase()}
                        </div>
                        {student.fullName}
                      </div>
                    </TableCell>
                    <TableCell>
                      {student.phone ? (
                        <div className="flex items-center text-sm text-muted-foreground">
                          <Phone className="w-3 h-3 mr-2" /> {student.phone}
                        </div>
                      ) : <span className="text-muted-foreground/50">-</span>}
                    </TableCell>
                    <TableCell>
                      {student.parentPhone ? (
                        <div className="flex items-center text-sm text-muted-foreground">
                          <Phone className="w-3 h-3 mr-2 text-indigo-400" /> {student.parentPhone}
                        </div>
                      ) : <span className="text-muted-foreground/50">-</span>}
                    </TableCell>
                    <TableCell>
                      {student.dateOfBirth ? (
                        <div className="flex items-center text-sm">
                          <Calendar className="w-3 h-3 mr-2 text-muted-foreground" />
                          {format(new Date(student.dateOfBirth), 'MMM d, yyyy')}
                        </div>
                      ) : <span className="text-muted-foreground/50">-</span>}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground max-w-[200px] truncate">
                      {student.note || "-"}
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
