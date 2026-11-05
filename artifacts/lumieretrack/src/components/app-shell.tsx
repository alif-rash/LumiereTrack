import { useState, type ReactNode } from "react";
import { Link, useLocation } from "wouter";
import { useClerk } from "@clerk/react";
import { LayoutDashboard, BookOpen, ClipboardList, FolderKanban, ListChecks, ClipboardCheck, Award, Bell, Settings, LogOut, Menu } from "lucide-react";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { Initials, fmtDate } from "@/components/kit";
import { Assistant } from "@/components/assistant";
import { cn } from "@/lib/utils";
import { useWs, isProf } from "@/lib/ws";

const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");

export function Brand({ light, previewLogo = false }: { light?: boolean; previewLogo?: boolean }) {
  return (
    <div className="flex items-center gap-2.5">
      {/* Trial mark is opt-in; official branding stays unchanged until approval. */}
      {previewLogo ? (
        <img
          src={`${basePath}/logo-preview-polished.svg`}
          alt="Refined LumiereTrack logo preview"
          width="44"
          height="36"
          className="h-9 w-11 shrink-0 object-contain mix-blend-multiply"
        />
      ) : (
        <span aria-hidden className={cn("h-7 w-7 border border-dashed", light ? "border-white/30" : "border-foreground/30")} />
      )}
      <span className={cn("font-display text-[19px] font-semibold tracking-tight", light ? "text-[hsl(42_38%_97%)]" : "text-foreground")}>LumiereTrack</span>
    </div>
  );
}

function Nav({ onNavigate }: { onNavigate?: () => void }) {
  const ws = useWs();
  const [loc] = useLocation();
  const { signOut } = useClerk();
  const prof = isProf(ws);
  const unread = ws.notifications.filter((n) => !n.read).length;
  const groups: { head: string; items: { href: string; label: string; icon: typeof Bell; badge?: number; urgent?: boolean }[] }[] = [
    { head: "Work", items: [
      { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
      { href: "/tasks", label: prof ? "All tasks" : "My tasks", icon: ListChecks },
      ...(prof ? [{ href: "/reviews", label: "Review queue", icon: ClipboardCheck, badge: ws.counts.review, urgent: true }] : []),
      { href: "/projects", label: "Projects", icon: FolderKanban },
    ] },
    { head: "Academic", items: [
      { href: "/courses", label: "Courses", icon: BookOpen },
      { href: "/assignments", label: "Assignments", icon: ClipboardList, badge: prof ? 0 : (ws.openAssignments ?? []).length },
      { href: "/grades", label: "Grades", icon: Award },
    ] },
    { head: "You", items: [
      { href: "/notifications", label: "Notifications", icon: Bell, badge: unread, urgent: true },
    ] },
  ];
  return (
    <div className="flex h-full flex-col">
      <div className="px-5 pb-5 pt-6"><Brand /></div>
      <div className="mx-5 mb-4 flex items-center justify-between border-y border-foreground/15 py-2" data-testid="text-workspace-role">
        <span className="eyebrow">{prof ? "Instructor" : "Student"} workspace</span>
        <span aria-hidden className={cn("h-2 w-2", prof ? "bg-[hsl(var(--ochre))]" : "bg-primary")} />
      </div>
      <nav aria-label="Primary" className="flex-1 overflow-y-auto px-3">
        {groups.map((grp) => (
          <div key={grp.head} className="mb-5">
            <div className="eyebrow px-2 pb-1.5">{grp.head}</div>
            {grp.items.map((it) => {
              const active = loc === it.href || loc.startsWith(it.href + "/");
              return (
                <Link key={it.href} href={it.href} onClick={onNavigate} aria-current={active ? "page" : undefined} data-testid={`link-nav-${it.label.toLowerCase().replace(/\s/g, "-")}`}
                  className={cn("relative flex items-center gap-3 px-2 py-[7px] text-[13.5px] transition-colors",
                    active ? "bg-card font-semibold text-foreground" : "text-foreground/70 hover:bg-card/60 hover:text-foreground")}>
                  {active && <span aria-hidden className="absolute inset-y-1 left-0 w-[3px] bg-primary" />}
                  <it.icon className={cn("h-4 w-4", active ? "text-primary" : "text-foreground/45")} strokeWidth={1.75} />
                  <span className="flex-1">{it.label}</span>
                  {!!it.badge && <span className={cn("font-mono-num min-w-[20px] px-1 text-center text-[10.5px] font-medium", it.urgent ? "bg-[hsl(var(--cinnabar))] text-[hsl(42_38%_97%)]" : "bg-foreground/10 text-foreground")}>{it.badge}</span>}
                </Link>
              );
            })}
          </div>
        ))}
      </nav>
      <div className="border-t border-foreground/15 p-3">
        <Link href="/settings" onClick={onNavigate} className="flex items-center gap-3 px-2 py-2 hover:bg-card/60" data-testid="link-settings">
          <Initials name={ws.profile.name} className="h-8 w-8" />
          <div className="min-w-0 flex-1">
            <div className="truncate text-[13px] font-semibold" data-testid="text-username">{ws.profile.name}</div>
            <div className="truncate text-[11px] text-muted-foreground">{ws.profile.university || ws.profile.email}</div>
          </div>
          <Settings className="h-4 w-4 text-muted-foreground" aria-label="Settings" />
        </Link>
        <button onClick={() => signOut({ redirectUrl: basePath || "/" })} className="mt-1 flex w-full items-center gap-2 px-2 py-1.5 text-xs text-muted-foreground hover:text-foreground" data-testid="button-signout">
          <LogOut className="h-3.5 w-3.5" /> Sign out
        </button>
      </div>
    </div>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const ws = useWs();
  return (
    <div className="paper-noise min-h-[100dvh] bg-background">
      <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:left-3 focus:top-3 focus:z-50 focus:bg-card focus:px-3 focus:py-2">Skip to content</a>
      <aside className="sidebar-navy fixed inset-y-0 left-0 z-30 hidden w-[240px] border-r border-foreground/15 lg:block"><Nav /></aside>
      <header className="sticky top-0 z-20 flex items-center justify-between border-b border-foreground/15 bg-background/95 px-4 py-3 lg:hidden">
        <Brand />
        <button onClick={() => setOpen(true)} className="p-2 hover:bg-secondary" aria-label="Open menu" data-testid="button-menu"><Menu className="h-5 w-5" /></button>
      </header>
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="left" className="sidebar-navy w-[272px] border-r border-foreground/15 p-0">
          <SheetTitle className="sr-only">Navigation</SheetTitle>
          <Nav onNavigate={() => setOpen(false)} />
        </SheetContent>
      </Sheet>
      <main id="main" className="lg:pl-[240px]">
        <div className="hidden items-center justify-between border-b border-foreground/10 px-8 py-2 lg:flex">
          <span className="eyebrow">{fmtDate(new Date().toISOString(), "EEEE, d MMMM yyyy")}</span>
          <span className="eyebrow">{ws.profile.university || "LumiereTrack"}</span>
        </div>
        <div className="mx-auto max-w-[1200px] px-4 pb-28 pt-8 md:px-8 md:pt-10">{children}</div>
      </main>
      <Assistant />
    </div>
  );
}
