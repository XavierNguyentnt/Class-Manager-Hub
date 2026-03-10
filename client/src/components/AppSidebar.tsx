import { Link, useLocation, useRoute } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { useClass } from "@/hooks/use-classes";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarSeparator,
} from "@/components/ui/sidebar";
import {
  LayoutDashboard,
  Users,
  CreditCard,
  CalendarCheck,
  ArrowLeft,
  LogOut,
  BookOpen,
  UserCircle,
  Wallet,
} from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useTranslation } from "react-i18next";

import logoImg from "@assets/image_1772599459362.png";

export function AppSidebar() {
  const [location] = useLocation();
  const { user, logout } = useAuth();
  const { t } = useTranslation("common");

  const [isClassRoute, params] = useRoute("/classes/:id/*?");
  const classId = params?.id;
  const { data: classData } = useClass(classId || "");

  const handleLogout = async () => {
    await logout();
  };

  return (
    <Sidebar
      variant="inset"
      className="border-r border-border/50 bg-sidebar/50 backdrop-blur-xl">
      <SidebarHeader className="p-4 flex flex-row items-center gap-3">
        <div className="w-10 h-10 rounded-lg overflow-hidden flex items-center justify-center shadow-md">
          <img
            src={logoImg}
            alt="Logo"
            className="w-full h-full object-cover"
          />
        </div>
        <span className="font-display font-bold text-xl tracking-tight text-foreground">
          {t("app.name")}
        </span>
      </SidebarHeader>

      <SidebarContent>
        {isClassRoute ? (
          <>
            <SidebarGroup>
              <SidebarGroupContent>
                <SidebarMenu>
                  <SidebarMenuItem>
                    <SidebarMenuButton asChild tooltip={t("nav.backToClasses")}>
                      <Link
                        href="/"
                        className="text-muted-foreground hover:text-foreground transition-colors">
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        <span>{t("nav.myClasses")}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>

            <SidebarSeparator className="mx-4 opacity-50" />

            <SidebarGroup>
              <SidebarGroupLabel className="font-medium text-xs uppercase tracking-wider text-muted-foreground/70">
                {classData ? classData.name : t("status.loading")}
              </SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  <SidebarMenuItem>
                    <SidebarMenuButton
                      asChild
                      isActive={location === `/classes/${classId}/dashboard`}>
                      <Link href={`/classes/${classId}/dashboard`}>
                        <LayoutDashboard />
                        <span>{t("nav.dashboard")}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuButton
                      asChild
                      isActive={location === `/classes/${classId}/students`}>
                      <Link href={`/classes/${classId}/students`}>
                        <Users />
                        <span>{t("nav.students")}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuButton
                      asChild
                      isActive={
                        location === `/classes/${classId}/transactions`
                      }>
                      <Link href={`/classes/${classId}/transactions`}>
                        <CreditCard />
                        <span>{t("nav.financials")}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuButton
                      asChild
                      isActive={location === `/classes/${classId}/tuition`}>
                      <Link href={`/classes/${classId}/tuition`}>
                        <Wallet />
                        <span>Học phí</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuButton
                      asChild
                      isActive={location === `/classes/${classId}/attendance`}>
                      <Link href={`/classes/${classId}/attendance`}>
                        <CalendarCheck />
                        <span>{t("nav.attendance")}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </>
        ) : (
          <SidebarGroup>
            <SidebarGroupLabel className="font-medium text-xs uppercase tracking-wider text-muted-foreground/70">
              {t("nav.overview")}
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild isActive={location === "/"}>
                    <Link href="/">
                      <BookOpen />
                      <span>{t("nav.myClasses")}</span>
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
                  {user?.fullName?.charAt(0).toUpperCase() || (
                    <UserCircle className="h-4 w-4" />
                  )}
                </AvatarFallback>
              </Avatar>
              <div className="flex flex-col overflow-hidden">
                <span className="text-sm font-medium leading-none truncate">
                  {user?.fullName}
                </span>
                <span className="text-xs text-muted-foreground truncate">
                  {user?.role}
                </span>
              </div>
            </div>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton
              onClick={handleLogout}
              className="text-destructive hover:bg-destructive/10 hover:text-destructive transition-colors">
              <LogOut />
              <span>{t("nav.logout")}</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
