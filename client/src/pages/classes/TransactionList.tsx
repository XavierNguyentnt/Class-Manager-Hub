import { useState } from "react";
import { useRoute } from "wouter";
import { useTransactions, useCreateTransaction } from "@/hooks/use-transactions";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Loader2, ArrowUpCircle, ArrowDownCircle, Banknote } from "lucide-react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { api } from "@shared/routes";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";

// Need to extend schema on frontend to handle string -> number for the input
const formSchema = api.transactions.create.input.extend({
  amount: z.coerce.number().positive("Amount must be positive")
});

export default function TransactionList() {
  const [, params] = useRoute("/classes/:id/transactions");
  const classId = params?.id || "";
  
  const { data: transactions, isLoading } = useTransactions(classId);
  const createTx = useCreateTransaction(classId);
  const { toast } = useToast();
  const [open, setOpen] = useState(false);

  const { register, handleSubmit, control, reset, formState: { errors } } = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      type: "INCOME",
      date: format(new Date(), 'yyyy-MM-dd')
    }
  });

  const onSubmit = async (data: z.infer<typeof formSchema>) => {
    try {
      await createTx.mutateAsync(data);
      setOpen(false);
      reset({ type: "INCOME", date: format(new Date(), 'yyyy-MM-dd') });
      toast({ title: "Transaction recorded" });
    } catch (error: any) {
      toast({ variant: "destructive", title: "Error", description: error.message });
    }
  };

  const formatCurrency = (val: number | string) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(Number(val));
  };

  return (
    <div className="p-6 md:p-10 max-w-7xl mx-auto space-y-6 animate-in fade-in duration-300">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold text-foreground tracking-tight">Financial Records</h1>
          <p className="text-muted-foreground mt-1">Track income from fees and class expenses.</p>
        </div>
        
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="shadow-sm gap-2">
              <Plus className="w-4 h-4" />
              Add Transaction
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>New Transaction</DialogTitle>
              <DialogDescription>Record a payment or expense.</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 pt-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Type</Label>
                  <Controller
                    control={control}
                    name="type"
                    render={({ field }) => (
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="INCOME">Income (Fee)</SelectItem>
                          <SelectItem value="EXPENSE">Expense</SelectItem>
                        </SelectContent>
                      </Select>
                    )}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="date">Date</Label>
                  <Input id="date" type="date" {...register("date")} />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="amount">Amount ($)</Label>
                <Input id="amount" type="number" step="0.01" min="0" placeholder="0.00" {...register("amount")} />
                {errors.amount && <p className="text-sm text-destructive">{errors.amount.message}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                <Input id="category" placeholder="e.g. Tuition, Supplies" {...register("category")} />
                {errors.category && <p className="text-sm text-destructive">{errors.category.message}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="person">Person (Optional)</Label>
                <Input id="person" placeholder="Student name or vendor" {...register("person")} />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description (Optional)</Label>
                <Input id="description" placeholder="Brief detail" {...register("description")} />
              </div>

              <DialogFooter className="pt-4">
                <Button type="submit" disabled={createTx.isPending}>
                  {createTx.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : "Save Record"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card className="border-border/50 shadow-sm overflow-hidden">
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex h-40 items-center justify-center">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : transactions?.length === 0 ? (
            <div className="text-center py-16 px-4">
              <Banknote className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
              <h3 className="text-lg font-medium">No transactions yet</h3>
              <p className="text-muted-foreground mt-1">Record your first income or expense.</p>
            </div>
          ) : (
            <Table>
              <TableHeader className="bg-muted/50">
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Person</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {transactions?.map((tx) => (
                  <TableRow key={tx.id} className="hover:bg-muted/30 transition-colors">
                    <TableCell className="whitespace-nowrap">
                      {format(new Date(tx.date), 'MMM d, yyyy')}
                    </TableCell>
                    <TableCell>
                      {tx.type === 'INCOME' ? (
                        <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 border-emerald-200">
                          <ArrowUpCircle className="w-3 h-3 mr-1" /> Income
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="bg-rose-500/10 text-rose-600 border-rose-200">
                          <ArrowDownCircle className="w-3 h-3 mr-1" /> Expense
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="font-medium text-sm">{tx.category}</TableCell>
                    <TableCell className="text-muted-foreground text-sm max-w-[200px] truncate">{tx.description || '-'}</TableCell>
                    <TableCell className="text-sm">{tx.person || '-'}</TableCell>
                    <TableCell className={`text-right font-display font-semibold ${tx.type === 'INCOME' ? 'text-emerald-600' : 'text-rose-600'}`}>
                      {tx.type === 'INCOME' ? '+' : '-'}{formatCurrency(tx.amount)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
