import { useState, useEffect } from "react";
import { useRoute } from "wouter";
import { useStudents } from "@/hooks/use-students";
import { useAttendances, useCreateAttendances } from "@/hooks/use-attendances";
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
import { Loader2, Save, CheckCircle2, XCircle, Clock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";

type Status = "PRESENT" | "ABSENT" | "LATE";

export default function AttendanceList() {
  const [, params] = useRoute("/classes/:id/attendance");
  const classId = params?.id || "";

  const [selectedDate, setSelectedDate] = useState(
    format(new Date(), "yyyy-MM-dd"),
  );

  const { data: students, isLoading: isLoadingStudents } = useStudents(classId);
  const { data: attendances, isLoading: isLoadingAttendances } = useAttendances(
    classId,
    selectedDate,
  );
  const saveAttendances = useCreateAttendances(classId);

  const { toast } = useToast();

  // Local state for the current editing view
  const [attendanceState, setAttendanceState] = useState<
    Record<string, Status>
  >({});

  // Sync state when data is fetched
  useEffect(() => {
    if (students && attendances) {
      const newState: Record<string, Status> = {};
      // Default everyone to PRESENT if no records exist for this date
      students.forEach((s) => {
        const record = attendances.find((a) => a.studentId === s.id);
        newState[s.id] = record ? (record.status as Status) : "PRESENT";
      });
      setAttendanceState(newState);
    }
  }, [students, attendances]);

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

      toast({ title: "Attendance saved successfully" });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message,
      });
    }
  };

  const isLoading = isLoadingStudents || isLoadingAttendances;

  return (
    <div className="p-6 md:p-10 max-w-7xl mx-auto space-y-6 animate-in fade-in duration-300">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold text-foreground tracking-tight">
            Attendance
          </h1>
          <p className="text-muted-foreground mt-1">
            Track daily presence for your students.
          </p>
        </div>

        <div className="flex items-center gap-4">
          <div className="space-y-1">
            <Label
              htmlFor="date-picker"
              className="text-xs text-muted-foreground">
              Select Date
            </Label>
            <Input
              id="date-picker"
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-auto font-medium"
            />
          </div>
          <Button
            onClick={handleSave}
            disabled={
              isLoading || saveAttendances.isPending || !students?.length
            }
            className="mb-[2px] shadow-md">
            {saveAttendances.isPending ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Save className="w-4 h-4 mr-2" />
            )}
            Save Attendance
          </Button>
        </div>
      </div>

      <Card className="border-border/50 shadow-sm overflow-hidden">
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex h-64 items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : students?.length === 0 ? (
            <div className="text-center py-16 px-4">
              <h3 className="text-lg font-medium">No students found</h3>
              <p className="text-muted-foreground mt-1">
                Add students to the class before tracking attendance.
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader className="bg-muted/50">
                <TableRow>
                  <TableHead className="w-[300px]">Student Name</TableHead>
                  <TableHead>Status Selection</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {students?.map((student) => (
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
                        {`${student.lastName} ${student.firstName}`}
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
                            <CheckCircle2 className="w-4 h-4 mr-1" /> Present
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
                            <XCircle className="w-4 h-4 mr-1" /> Absent
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
                            <Clock className="w-4 h-4 mr-1" /> Late
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
