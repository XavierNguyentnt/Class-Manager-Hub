import { useQuery } from "@tanstack/react-query";
import { api, buildUrl } from "@shared/routes";
import { z } from "zod";

type AttendArray = z.infer<(typeof api.attendances.list.responses)[200]>;

export function useMonthlyAttendanceReport(
  classId: string | number,
  dates: string[],
) {
  return useQuery({
    queryKey: [api.attendances.list.path, classId, "monthReport", dates],
    queryFn: async () => {
      const urlBase = buildUrl(api.attendances.list.path, { classId });
      const out: Record<string, AttendArray> = {};
      for (const d of dates) {
        const res = await fetch(`${urlBase}?date=${encodeURIComponent(d)}`, {
          credentials: "include",
        });
        if (!res.ok) throw new Error("Failed to fetch attendances");
        out[d] = api.attendances.list.responses[200].parse(await res.json());
      }
      return out;
    },
    enabled: !!classId && dates.length > 0,
  });
}
