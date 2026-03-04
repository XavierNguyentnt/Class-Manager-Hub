import { useQuery } from "@tanstack/react-query";
import { api } from "@shared/routes";
import { z } from "zod";

type Teacher = z.infer<typeof api.auth.me.responses[200]>;

export function useTeachers(enabled: boolean = true) {
  return useQuery<Teacher[]>({
    queryKey: [api.teachers.list.path],
    queryFn: async () => {
      const res = await fetch(api.teachers.list.path, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch teachers");
      return api.teachers.list.responses[200].parse(await res.json());
    },
    enabled,
  });
}
