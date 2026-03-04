import { useQuery } from "@tanstack/react-query";
import { api } from "@shared/routes";
import { z } from "zod";

type Monitor = z.infer<typeof api.auth.me.responses[200]>;

export function useMonitors(enabled: boolean = true) {
  return useQuery<Monitor[]>({
    queryKey: [api.monitors.list.path],
    queryFn: async () => {
      const res = await fetch(api.monitors.list.path, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch monitors");
      return api.monitors.list.responses[200].parse(await res.json());
    },
    enabled,
  });
}
