import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl } from "@shared/routes";
import { z } from "zod";

type CreateTransactionInput = z.infer<typeof api.transactions.create.input>;

export function useTransactions(classId: string | number) {
  return useQuery({
    queryKey: [api.transactions.list.path, classId],
    queryFn: async () => {
      const url = buildUrl(api.transactions.list.path, { classId });
      const res = await fetch(url, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch transactions");
      return api.transactions.list.responses[200].parse(await res.json());
    },
    enabled: !!classId,
  });
}

export function useCreateTransaction(classId: string | number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: CreateTransactionInput) => {
      const url = buildUrl(api.transactions.create.path, { classId });
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to create transaction");
      return api.transactions.create.responses[201].parse(await res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.transactions.list.path, classId] });
      queryClient.invalidateQueries({ queryKey: [api.classes.dashboard.path, classId] });
    },
  });
}
