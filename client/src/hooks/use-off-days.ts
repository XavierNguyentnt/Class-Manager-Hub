import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl } from "@shared/routes";

export function useOffDay(classId: string | number, date?: string) {
  return useQuery({
    queryKey: [api.offDays.get.path, classId, date],
    queryFn: async () => {
      const url = buildUrl(api.offDays.get.path, { classId });
      const q = date ? `?date=${encodeURIComponent(date)}` : "";
      const res = await fetch(`${url}${q}`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch off day");
      const arr = api.offDays.get.responses[200].parse(await res.json());
      return arr[0] || null;
    },
    enabled: !!classId && !!date,
  });
}

export function useSetOffDay(classId: string | number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: { date: string; reason: string }) => {
      const url = buildUrl(api.offDays.set.path, { classId });
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to set off day");
      return api.offDays.set.responses[201].parse(await res.json());
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: [api.offDays.get.path, classId, variables.date],
      });
      queryClient.invalidateQueries({
        queryKey: [api.attendances.list.path, classId, variables.date],
      });
    },
  });
}

export function useClearOffDay(classId: string | number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (date: string) => {
      const url = buildUrl(api.offDays.clear.path, { classId, date });
      const res = await fetch(url, {
        method: "DELETE",
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to clear off day");
      return api.offDays.clear.responses[200].parse(await res.json());
    },
    onSuccess: (_, date) => {
      queryClient.invalidateQueries({
        queryKey: [api.offDays.get.path, classId, date],
      });
      queryClient.invalidateQueries({
        queryKey: [api.attendances.list.path, classId, date],
      });
    },
  });
}
