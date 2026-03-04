import { Link, useLocation, useRoute } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { useClass } from "@/hooks/use-classes";
import { 
  Sidebar, SidebarContent, SidebarFooter, SidebarGroup, 
  SidebarGroupContent, SidebarGroupLabel, SidebarHeader, 
  SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarSeparator
} from "@/components/ui/sidebar";
import { 
  LayoutDashboard, Users, CreditCard, CalendarCheck, 
  ArrowLeft, LogOut, BookOpen, UserCircle
} from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

export function AppSidebar() {
  const [location] = useLocation();
  const { user, logout } = useAuth();
  
  const [isClassRoute, params] = useRoute("/classes/:id/*?");
  const classId = params?.id;
  const { data: classData } = useClass(classId || "");

  const handleLogout = async () => {
    await logout();
  };

  return (
    <Sidebar variant="inset" className="border-r border-border/50 bg-sidebar/50 backdrop-blur-xl">
      <SidebarHeader className="p-4 flex flex-row items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-primary text-primary-foreground flex items-center justify-center font-bold text-lg shadow-md shadow-primary/20">
          L
        </div>
        <span className="font-display font-bold text-xl tracking-tight text-foreground">Lizza LMS</span>
      </SidebarHeader>
      
      <SidebarContent>
        {isClassRoute ? (
          <>
            <SidebarGroup>
              <SidebarGroupContent>
                <SidebarMenu>
                  <SidebarMenuItem>
                    <SidebarMenuButton asChild tooltip="Back to Classes">
                      <Link href="/" className="text-muted-foreground hover:text-foreground transition-colors">
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        <span>All Classes</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>

            <SidebarSeparator className="mx-4 opacity-50" />

            <SidebarGroup>
              <SidebarGroupLabel className="font-medium text-xs uppercase tracking-wider text-muted-foreground/70">
                {classData ? classData.name : "Loading..."}
              </SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  <SidebarMenuItem>
                    <SidebarMenuButton asChild isActive={location === `/classes/${classId}/dashboard`}>
                      <Link href={`/classes/${classId}/dashboard`}>
                        <LayoutDashboard />
                        <span>Dashboard</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuButton asChild isActive={location === `/classes/${classId}/students`}>
                      <Link href={`/classes/${classId}/students`}>
                        <Users />
                        <span>Students</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuButton asChild isActive={location === `/classes/${classId}/transactions`}>
                      <Link href={`/classes/${classId}/transactions`}>
                        <CreditCard />
                        <span>Financials</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuButton asChild isActive={location === `/classes/${classId}/attendance`}>
                      <Link href={`/classes/${classId}/attendance`}>
                        <CalendarCheck />
                        <span>Attendance</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </>
        ) : (
          <SidebarGroup>
            <SidebarGroupLabel className="font-medium text-xs uppercase tracking-wider text-muted-foreground/70">Overview</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild isActive={location === "/"}>
                    <Link href="/">
                      <BookOpen />
                      <span>My Classes</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>

      <SidebarFooter className="p-4 border-t border-border/50 bg-background/50">
        <SidebarMenu>
          <SidebarMenuItem>
            <div className="flex items-center gap-3 px-2 py-2 mb-2">
              <Avatar className="h-8 w-8 ring-2 ring-border">
                <AvatarFallback className="bg-primary/10 text-primary font-medium text-xs">
                  {user?.fullName?.charAt(0).toUpperCase() || <UserCircle className="h-4 w-4" />}
                </AvatarFallback>
              </Avatar>
              <div className="flex flex-col overflow-hidden">
                <span className="text-sm font-medium leading-none truncate">{user?.fullName}</span>
                <span className="text-xs text-muted-foreground truncate">{user?.role}</span>
              </div>
            </div>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton onClick={handleLogout} className="text-destructive hover:bg-destructive/10 hover:text-destructive transition-colors">
              <LogOut />
              <span>Logout</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
