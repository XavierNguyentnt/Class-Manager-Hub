import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl } from "@shared/routes";
import { z } from "zod";

type CreateStudentInput = z.infer<typeof api.students.create.input>;
type UpdateStudentInput = z.infer<typeof api.students.update.input>;

export function useStudents(classId: string | number) {
  return useQuery({
    queryKey: [api.students.list.path, classId],
    queryFn: async () => {
      const url = buildUrl(api.students.list.path, { classId });
      const res = await fetch(url, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch students");
      return api.students.list.responses[200].parse(await res.json());
    },
    enabled: !!classId,
  });
}

export function useCreateStudent(classId: string | number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: CreateStudentInput) => {
      const url = buildUrl(api.students.create.path, { classId });
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to create student");
      return api.students.create.responses[201].parse(await res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.students.list.path, classId] });
      queryClient.invalidateQueries({ queryKey: [api.classes.dashboard.path, classId] });
    },
  });
}

export function useUpdateStudent(classId: string | number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateStudentInput }) => {
      const url = buildUrl(api.students.update.path, { classId, id });
      const res = await fetch(url, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to update student");
      return api.students.update.responses[200].parse(await res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.students.list.path, classId] });
    },
  });
}

export function useDeleteStudent(classId: string | number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const url = buildUrl(api.students.delete.path, { classId, id });
      const res = await fetch(url, { method: "DELETE", credentials: "include" });
      if (!res.ok) throw new Error("Failed to delete student");
      return api.students.delete.responses[200].parse(await res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.students.list.path, classId] });
      queryClient.invalidateQueries({ queryKey: [api.classes.dashboard.path, classId] });
    },
  });
}
