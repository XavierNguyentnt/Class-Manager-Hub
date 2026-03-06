import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "./AppSidebar";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-background">
        <AppSidebar />
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
          <header className="h-14 border-b border-border/50 bg-background/95 backdrop-blur-sm flex items-center px-4 sticky top-0 z-10">
            <SidebarTrigger className="hover:bg-accent/50 text-muted-foreground hover:text-foreground transition-colors mr-4" />
            <div className="ml-auto">
              <LanguageSwitcher />
            </div>
          </header>
          <main className="flex-1 overflow-y-auto bg-slate-50/50 dark:bg-background/95">
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
