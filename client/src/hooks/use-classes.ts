import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl } from "@shared/routes";
import { z } from "zod";

type ClassData = z.infer<typeof api.classes.list.responses[200]>[0];
type DashboardData = z.infer<typeof api.classes.dashboard.responses[200]>;
type CreateClassInput = z.infer<typeof api.classes.create.input>;

export function useClasses() {
  return useQuery({
    queryKey: [api.classes.list.path],
    queryFn: async () => {
      const res = await fetch(api.classes.list.path, { credentials: "include" });
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
