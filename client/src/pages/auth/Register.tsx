import { useState } from "react";
import { useLocation, Link } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { api } from "@shared/routes";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

import logoImg from "@assets/image_1772599459362.png";

const registerSchema = api.auth.register.input;

export default function Register() {
  const [, setLocation] = useLocation();
  const { register: registerUser, isRegistering } = useAuth();
  const { toast } = useToast();

  const { register, handleSubmit, formState: { errors } } = useForm<z.infer<typeof registerSchema>>({
    resolver: zodResolver(registerSchema),
  });

  const onSubmit = async (data: z.infer<typeof registerSchema>) => {
    try {
      await registerUser(data);
      setLocation("/");
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Registration Failed",
        description: error.message,
      });
    }
  };

  return (
    <div className="min-h-screen w-full flex flex-col justify-center items-center bg-gradient-to-br from-background to-secondary/30 p-4">
      <div className="w-full max-w-md">
        <div className="flex justify-center mb-8">
          <div className="w-20 h-20 rounded-xl overflow-hidden flex items-center justify-center shadow-lg shadow-primary/25">
            <img src={logoImg} alt="Logo" className="w-full h-full object-cover" />
          </div>
        </div>

        <Card className="border-border/50 shadow-xl shadow-black/5 bg-background/80 backdrop-blur-xl">
          <CardHeader className="space-y-2 text-center pb-6">
            <CardTitle className="text-3xl font-display font-bold tracking-tight">Create account</CardTitle>
            <CardDescription className="text-muted-foreground">
              Sign up to start managing your classes
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="fullName">Full Name</Label>
                <Input 
                  id="fullName" 
                  placeholder="John Doe" 
                  {...register("fullName")}
                  className="bg-card"
                />
                {errors.fullName && <p className="text-sm text-destructive">{errors.fullName.message}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input 
                  id="email" 
                  type="email" 
                  placeholder="name@example.com" 
                  {...register("email")}
                  className="bg-card"
                />
                {errors.email && <p className="text-sm text-destructive">{errors.email.message}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input 
                  id="password" 
                  type="password" 
                  placeholder="••••••••"
                  {...register("password")}
                  className="bg-card"
                />
                {errors.password && <p className="text-sm text-destructive">{errors.password.message}</p>}
              </div>
              <Button type="submit" className="w-full shadow-md hover:shadow-lg transition-all" disabled={isRegistering}>
                {isRegistering ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : "Sign up"}
              </Button>
            </form>
          </CardContent>
          <CardFooter className="flex justify-center border-t border-border/50 pt-6 text-sm text-muted-foreground">
            Already have an account? 
            <Link href="/login" className="ml-1 text-primary hover:underline font-medium">
              Sign in
            </Link>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
