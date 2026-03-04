import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl } from "@shared/routes";
import { z } from "zod";

type CreateAttendanceInput = z.infer<typeof api.attendances.create.input>;

export function useAttendances(classId: string | number, date?: string) {
  return useQuery({
    queryKey: [api.attendances.list.path, classId, date],
    queryFn: async () => {
      const url = buildUrl(api.attendances.list.path, { classId });
      const queryParams = date ? `?date=${encodeURIComponent(date)}` : "";
      const res = await fetch(`${url}${queryParams}`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch attendances");
      return api.attendances.list.responses[200].parse(await res.json());
    },
    enabled: !!classId,
  });
}

export function useCreateAttendances(classId: string | number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: CreateAttendanceInput) => {
      const url = buildUrl(api.attendances.create.path, { classId });
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to save attendance");
      return api.attendances.create.responses[201].parse(await res.json());
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: [api.attendances.list.path, classId] });
      queryClient.invalidateQueries({ queryKey: [api.classes.dashboard.path, classId] });
    },
  });
}
