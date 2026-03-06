import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl } from "@shared/routes";
import { z } from "zod";

type CreateTransactionInput = z.infer<typeof api.transactions.create.input>;
type UpdateTransactionInput = z.infer<typeof api.transactions.update.input>;

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

export function useUpdateTransaction(classId: string | number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateTransactionInput }) => {
      const url = buildUrl(api.transactions.update.path, { classId, id });
      const res = await fetch(url, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to update transaction");
      return api.transactions.update.responses[200].parse(await res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.transactions.list.path, classId] });
      queryClient.invalidateQueries({ queryKey: [api.classes.dashboard.path, classId] });
    },
  });
}

export function useDeleteTransaction(classId: string | number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const url = buildUrl(api.transactions.delete.path, { classId, id });
      const res = await fetch(url, { method: "DELETE", credentials: "include" });
      if (!res.ok) throw new Error("Failed to delete transaction");
      return api.transactions.delete.responses[200].parse(await res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.transactions.list.path, classId] });
      queryClient.invalidateQueries({ queryKey: [api.classes.dashboard.path, classId] });
    },
  });
}
