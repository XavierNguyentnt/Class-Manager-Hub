import { useQuery } from "@tanstack/react-query";
import { api, buildUrl } from "@shared/routes";

export function useMonthlyOffDays(classId: string | number, dates: string[]) {
  return useQuery({
    queryKey: [api.offDays.get.path, classId, "month", dates],
    queryFn: async () => {
      const urlBase = buildUrl(api.offDays.get.path, { classId });
      const out: Record<string, { reason: string | null } | null> = {};
      for (const d of dates) {
        const res = await fetch(`${urlBase}?date=${encodeURIComponent(d)}`, {
          credentials: "include",
        });
        if (!res.ok) throw new Error("Failed to fetch off days");
        const arr = api.offDays.get.responses[200].parse(await res.json());
        out[d] = arr[0] ? { reason: arr[0].reason ?? null } : null;
      }
      return out;
    },
    enabled: !!classId && dates.length > 0,
  });
}
