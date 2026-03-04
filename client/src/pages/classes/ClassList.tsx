import { useState } from "react";
import { Link } from "wouter";
import { useClasses, useCreateClass } from "@/hooks/use-classes";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Users, ArrowRight, Loader2, BookOpen } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { api } from "@shared/routes";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";

const createClassSchema = api.classes.create.input;

export default function ClassList() {
  const { data: classes, isLoading } = useClasses();
  const createClass = useCreateClass();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);

  const { register, handleSubmit, reset, formState: { errors } } = useForm<z.infer<typeof createClassSchema>>({
    resolver: zodResolver(createClassSchema),
  });

  const onSubmit = async (data: z.infer<typeof createClassSchema>) => {
    try {
      await createClass.mutateAsync(data);
      setOpen(false);
      reset();
      toast({ title: "Class created successfully" });
    } catch (error: any) {
      toast({ variant: "destructive", title: "Error", description: error.message });
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="p-6 md:p-10 max-w-7xl mx-auto space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold text-foreground tracking-tight">My Classes</h1>
          <p className="text-muted-foreground mt-1">Manage your educational spaces and students.</p>
        </div>
        
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="shadow-sm hover:shadow transition-all gap-2">
              <Plus className="w-4 h-4" />
              New Class
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Create new class</DialogTitle>
              <DialogDescription>
                Add a new class to your dashboard. You can add students later.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label htmlFor="name">Class Name</Label>
                <Input id="name" placeholder="e.g. Mathematics 101" {...register("name")} />
                {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description (Optional)</Label>
                <Textarea 
                  id="description" 
                  placeholder="Brief description of the class" 
                  {...register("description")} 
                  className="resize-none"
                />
              </div>
              <DialogFooter className="pt-4">
                <Button type="submit" disabled={createClass.isPending}>
                  {createClass.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : "Create Class"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {classes?.length === 0 ? (
        <div className="text-center py-20 bg-card rounded-2xl border border-dashed border-border/60">
          <BookOpen className="w-12 h-12 mx-auto text-muted-foreground/50 mb-4" />
          <h3 className="text-lg font-medium text-foreground">No classes yet</h3>
          <p className="text-muted-foreground mt-1 mb-6 max-w-sm mx-auto">Get started by creating your first class to manage students and tracking.</p>
          <Button onClick={() => setOpen(true)} variant="outline">Create your first class</Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {classes?.map((cls) => (
            <Card key={cls.id} className="group hover:shadow-xl hover:-translate-y-1 transition-all duration-300 border-border/50 overflow-hidden flex flex-col h-full bg-card">
              <div className="h-2 w-full bg-gradient-to-r from-primary to-indigo-400"></div>
              <CardHeader className="pb-4">
                <CardTitle className="font-display text-xl">{cls.name}</CardTitle>
                <CardDescription className="line-clamp-2 min-h-[2.5rem]">
                  {cls.description || "No description provided."}
                </CardDescription>
              </CardHeader>
              <CardContent className="flex-grow">
                {/* Additional brief stats could go here if we expand the API */}
              </CardContent>
              <CardFooter className="pt-0 pb-6 px-6">
                <Button asChild variant="secondary" className="w-full group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                  <Link href={`/classes/${cls.id}/dashboard`}>
                    Manage Class <ArrowRight className="w-4 h-4 ml-2" />
                  </Link>
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
