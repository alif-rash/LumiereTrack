import { useState, type ReactNode } from "react";
import { Link, useLocation } from "wouter";
import { useClerk } from "@clerk/react";
import { LayoutDashboard, BookOpen, ClipboardList, FolderKanban, ListChecks, ClipboardCheck, Award, Bell, Settings, LogOut, Menu } from "lucide-react";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { Initials } from "@/components/kit";
import { Assistant } from "@/components/assistant";
import { cn } from "@/lib/utils";
import { useWs, isProf } from "@/lib/ws";

const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");

export function Brand({ light }: { light?: boolean }) {
  return (
    <div className="flex items-center gap-2.5">
      {/* Reserved logo space — intentionally empty until the official mark is supplied */}
      <span aria-hidden className={cn("h-8 w-8 rounded-lg", light ? "bg-white/10" : "bg-[hsl(var(--soft))]")} />
      <span className={cn("font-display text-[17px] font-extrabold tracking-tight", light ? "text-white" : "text-[hsl(var(--navy))]")}>LumiereTrack</span>
    </div>
  );
}

function Nav({ onNavigate }: { onNavigate?: () => void }) {
  const ws = useWs();
  const [loc] = useLocation();
  const { signOut } = useClerk();
  const unread = ws.notifications.filter((n) => !n.read).length;
  const items = [
    { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard, tone: "#579BFF" },
    { href: "/courses", label: "Courses", icon: BookOpen, tone: "#8B7CF6" },
    { href: "/assignments", label: "Assignments", icon: ClipboardList, tone: "#28B8A6", badge: isProf(ws) ? 0 : (ws.openAssignments ?? []).length },
    { href: "/projects", label: "Projects", icon: FolderKanban, tone: "#F4C95D" },
    { href: "/tasks", label: isProf(ws) ? "All tasks" : "My tasks", icon: ListChecks, tone: "#FF8177" },
    ...(isProf(ws) ? [{ href: "/reviews", label: "Review queue", icon: ClipboardCheck, tone: "#8B7CF6", badge: ws.counts.review }] : []),
    { href: "/grades", label: "Grades", icon: Award, tone: "#28B8A6" },
    { href: "/notifications", label: "Notifications", icon: Bell, tone: "#579BFF", badge: unread },
  ];
  return (
    <div className="flex h-full flex-col">
      <div className="px-5 pb-6 pt-6"><Brand light /></div>
      <div className="mx-5 mb-3 flex items-center gap-2 rounded-lg bg-white/[0.06] px-2.5 py-1.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-white/70" data-testid="text-workspace-role">
        <span className="h-1.5 w-1.5 rounded-full" style={{ background: isProf(ws) ? "#F4C95D" : "#28B8A6" }} />{isProf(ws) ? "Instructor" : "Student"} workspace
      </div>
      <nav className="flex-1 space-y-0.5 overflow-y-auto px-3">
        {items.map((it) => {
          const active = loc === it.href || loc.startsWith(it.href + "/");
          return (
            <Link key={it.href} href={it.href} onClick={onNavigate} data-testid={`link-nav-${it.label.toLowerCase().replace(/\s/g, "-")}`}
              className={cn("group relative flex items-center gap-3 rounded-xl px-2.5 py-2 text-[13.5px] font-medium transition-all duration-200",
                active ? "bg-white text-[hsl(var(--navy))] shadow-[0_8px_20px_-10px_rgba(0,0,0,0.5)]" : "text-white/70 hover:bg-white/[0.07] hover:text-white")}>
              <span className={cn("grid h-8 w-8 place-items-center rounded-lg transition-colors", active ? "text-white" : "bg-white/[0.06] group-hover:bg-white/10")} style={{ background: active ? it.tone : undefined, color: active ? "#fff" : it.tone }}>
                <it.icon className="h-[17px] w-[17px]" />
              </span>
              <span className={cn("flex-1", active && "font-semibold")}>{it.label}</span>
              {!!it.badge && <span className={cn("font-mono-num rounded-full px-1.5 text-[10px] font-semibold", active ? "bg-[hsl(var(--navy))] text-white" : "bg-[#FF8177] text-white")}>{it.badge}</span>}
            </Link>
          );
        })}
      </nav>
      <div className="m-3 rounded-2xl border border-white/10 bg-white/[0.06] p-3 text-white">
        <Link href="/settings" onClick={onNavigate} className="flex items-center gap-3" data-testid="link-settings">
          <Initials name={ws.profile.name} className="h-9 w-9" />
          <div className="min-w-0 flex-1">
            <div className="truncate text-sm font-semibold" data-testid="text-username">{ws.profile.name}</div>
            <div className="truncate text-[11px] text-white/60">{ws.profile.university || ws.profile.email}</div>
          </div>
          <Settings className="h-4 w-4 text-white/60" />
        </Link>
        <button onClick={() => signOut({ redirectUrl: basePath || "/" })} className="mt-3 flex w-full items-center justify-center gap-2 rounded-lg py-1.5 text-xs font-medium text-white/60 hover:bg-white/10 hover:text-white" data-testid="button-signout">
          <LogOut className="h-3.5 w-3.5" /> Sign out
        </button>
      </div>
    </div>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="min-h-[100dvh] bg-background">
      <aside className="sidebar-navy fixed inset-y-0 left-0 z-30 hidden w-[256px] lg:block"><Nav /></aside>
      <header className="sticky top-0 z-20 flex items-center justify-between border-b bg-card/90 px-4 py-3 backdrop-blur lg:hidden">
        <Brand />
        <button onClick={() => setOpen(true)} className="rounded-lg p-2 hover:bg-muted" aria-label="Open menu" data-testid="button-menu"><Menu className="h-5 w-5" /></button>
      </header>
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="left" className="sidebar-navy w-[272px] border-0 p-0 text-white">
          <SheetTitle className="sr-only">Navigation</SheetTitle>
          <Nav onNavigate={() => setOpen(false)} />
        </SheetContent>
      </Sheet>
      <main className="lg:pl-[256px]">
        <div className="mx-auto max-w-[1240px] px-4 py-8 md:px-8 md:py-10">{children}</div>
      </main>
      <Assistant />
    </div>
  );
}
