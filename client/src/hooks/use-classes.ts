import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl } from "@shared/routes";
import { z } from "zod";

type ClassData = z.infer<(typeof api.classes.list.responses)[200]>[0];
type DashboardData = z.infer<(typeof api.classes.dashboard.responses)[200]>;
type CreateClassInput = z.infer<typeof api.classes.create.input>;
type ClassTeacherMember = z.infer<(typeof api.classes.listTeachers.responses)[200]>[0];
type ClassMonitorMember = z.infer<(typeof api.classes.listMonitors.responses)[200]>[0];

export function useClasses() {
  return useQuery({
    queryKey: [api.classes.list.path],
    queryFn: async () => {
      const res = await fetch(api.classes.list.path, {
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to fetch classes");
      return api.classes.list.responses[200].parse(await res.json());
    },
  });
}

export function useClass(id: string | number) {
  return useQuery({
    queryKey: [api.classes.get.path, id],
    queryFn: async () => {
      const url = buildUrl(api.classes.get.path, { id });
      const res = await fetch(url, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch class");
      return api.classes.get.responses[200].parse(await res.json());
    },
    enabled: !!id,
  });
}

export function useClassDashboard(id: string | number) {
  return useQuery({
    queryKey: [api.classes.dashboard.path, id],
    queryFn: async () => {
      const url = buildUrl(api.classes.dashboard.path, { id });
      const res = await fetch(url, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch dashboard data");
      return api.classes.dashboard.responses[200].parse(await res.json());
    },
    enabled: !!id,
  });
}

export function useCreateClass() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: CreateClassInput) => {
      const res = await fetch(api.classes.create.path, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to create class");
      return api.classes.create.responses[201].parse(await res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.classes.list.path] });
    },
  });
}

export function useUpdateClassTeacher(id: string | number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (teacherId: string) => {
      const url = buildUrl(api.classes.updateTeacher.path, { id });
      const res = await fetch(url, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ teacherId }),
        credentials: "include",
      });
      if (!res.ok) {
        const msg = await res.text();
        throw new Error(msg || "Failed to update teacher");
      }
      return api.classes.updateTeacher.responses[200].parse(await res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.classes.get.path, id] });
      queryClient.invalidateQueries({ queryKey: [api.classes.list.path] });
    },
  });
}

export function useClassTeachers(id: string | number) {
  return useQuery<ClassTeacherMember[]>({
    queryKey: [api.classes.listTeachers.path, id],
    queryFn: async () => {
      const url = buildUrl(api.classes.listTeachers.path, { id });
      const res = await fetch(url, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch class teachers");
      return api.classes.listTeachers.responses[200].parse(await res.json());
    },
    enabled: !!id,
  });
}

export function useAddClassTeacher(id: string | number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: z.infer<typeof api.classes.addTeacher.input>) => {
      const url = buildUrl(api.classes.addTeacher.path, { id });
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to add teacher");
      return api.classes.addTeacher.responses[200].parse(await res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [api.classes.listTeachers.path, id],
      });
      queryClient.invalidateQueries({ queryKey: [api.classes.list.path] });
    },
  });
}

export function useRemoveClassTeacher(id: string | number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (teacherId: string) => {
      const url = buildUrl(api.classes.removeTeacher.path, { id, teacherId });
      const res = await fetch(url, {
        method: "DELETE",
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to remove teacher");
      return api.classes.removeTeacher.responses[200].parse(await res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [api.classes.listTeachers.path, id],
      });
      queryClient.invalidateQueries({ queryKey: [api.classes.list.path] });
    },
  });
}

export function useClassMonitors(id: string | number) {
  return useQuery<ClassMonitorMember[]>({
    queryKey: [api.classes.listMonitors.path, id],
    queryFn: async () => {
      const url = buildUrl(api.classes.listMonitors.path, { id });
      const res = await fetch(url, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch class monitors");
      return api.classes.listMonitors.responses[200].parse(await res.json());
    },
    enabled: !!id,
  });
}

export function useAddClassMonitor(id: string | number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: z.infer<typeof api.classes.addMonitor.input>) => {
      const url = buildUrl(api.classes.addMonitor.path, { id });
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to add monitor");
      return api.classes.addMonitor.responses[200].parse(await res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.classes.listMonitors.path, id] });
      queryClient.invalidateQueries({ queryKey: [api.classes.list.path] });
    },
  });
}

export function useRemoveClassMonitor(id: string | number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (monitorId: string) => {
      const url = buildUrl(api.classes.removeMonitor.path, { id, monitorId });
      const res = await fetch(url, {
        method: "DELETE",
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to remove monitor");
      return api.classes.removeMonitor.responses[200].parse(await res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.classes.listMonitors.path, id] });
      queryClient.invalidateQueries({ queryKey: [api.classes.list.path] });
    },
  });
}
