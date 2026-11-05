import type { ReactNode } from "react";
import { format, formatDistanceToNow, isValid } from "date-fns";
import { FileText, ExternalLink, RotateCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { fileHref, type Tone } from "@/lib/ws";

export function fmtDate(s?: string, f = "MMM d, yyyy") {
  if (!s) return "No date";
  const d = new Date(s);
  return isValid(d) ? format(d, f) : "No date";
}
export function ago(s?: string) {
  if (!s) return "";
  const d = new Date(s);
  return isValid(d) ? formatDistanceToNow(d, { addSuffix: true }) : "";
}
export function isOverdue(due?: string, status?: string) {
  if (!due || status === "Approved") return false;
  const d = new Date(due);
  return isValid(d) && d.getTime() < Date.now() - 86400000;
}

export function Pill({ s, className }: { s?: string; className?: string }) {
  return (
    <span className={cn("pill", className)} data-s={s} data-testid={`status-${s}`}>
      {s || "To Do"}
    </span>
  );
}

export function PageHeader({ eyebrow, title, description, actions }: { eyebrow?: string; title: ReactNode; description?: ReactNode; actions?: ReactNode }) {
  return (
    <div className="rise mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
      <div className="min-w-0">
        {eyebrow && <div className="mb-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-primary">{eyebrow}</div>}
        <h1 className="text-[28px] font-extrabold leading-tight text-foreground md:text-[32px]">{title}</h1>
        {description && <p className="mt-2 max-w-2xl text-sm text-muted-foreground">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  );
}

export function Panel({ title, action, children, className, tone, icon, testId }: { title?: ReactNode; action?: ReactNode; children: ReactNode; className?: string; tone?: Tone; icon?: ReactNode; testId?: string }) {
  return (
    <section className={cn("relative overflow-hidden rounded-2xl border border-card-border bg-card p-5 card-shadow", tone && `tone-${tone}`, className)} data-testid={testId}>
      {tone && <span aria-hidden className="t-bg absolute inset-x-0 top-0 h-[3px] opacity-90" />}
      {(title || action) && (
        <div className="mb-4 flex items-center justify-between gap-3">
          <h2 className="flex items-center gap-2.5 text-[15px] font-bold">{icon && <span className={cn("grid h-7 w-7 place-items-center rounded-lg", tone ? "t-soft t-fg" : "bg-[hsl(var(--soft))] text-primary")}>{icon}</span>}{title}</h2>
          {action}
        </div>
      )}
      {children}
    </section>
  );
}

export function Empty({ icon, title, body, action }: { icon?: ReactNode; title: string; body?: string; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-[hsl(var(--soft)/0.45)] px-6 py-12 text-center">
      {icon && <div className="mb-4 grid h-11 w-11 place-items-center rounded-xl bg-card text-primary shadow-sm">{icon}</div>}
      <div className="font-display text-base font-bold">{title}</div>
      {body && <p className="mt-1 max-w-sm text-sm text-muted-foreground">{body}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

export function ErrorState({ message, onRetry }: { message?: string; onRetry?: () => void }) {
  return (
    <div className="flex flex-col items-center rounded-2xl border border-destructive/20 bg-destructive/5 px-6 py-10 text-center">
      <div className="font-display font-bold">We couldn't load your workspace</div>
      <p className="mt-1 max-w-sm text-sm text-muted-foreground">{message || "The connection dropped or the server is busy."}</p>
      {onRetry && (
        <Button variant="outline" className="mt-4" onClick={onRetry} data-testid="button-retry">
          <RotateCw className="mr-2 h-4 w-4" /> Try again
        </Button>
      )}
    </div>
  );
}

export function Initials({ name, className }: { name?: string; className?: string }) {
  const i = (name || "?").split(/\s+/).filter(Boolean).slice(0, 2).map((p) => p[0]?.toUpperCase()).join("");
  return (
    <span className={cn("grid h-8 w-8 shrink-0 place-items-center rounded-full bg-[hsl(var(--soft))] text-[11px] font-bold text-[hsl(var(--navy))] ring-2 ring-card", className)}>
      {i || "?"}
    </span>
  );
}

export function Field({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-[13px] font-semibold">{label}</Label>
      {children}
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}

export function Evidence({ link, objectPath, fileName }: { link?: string; objectPath?: string; fileName?: string }) {
  if (!link && !objectPath) return null;
  return (
    <div className="flex flex-wrap gap-2">
      {objectPath && (
        <a href={fileHref(objectPath)} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 rounded-lg border bg-card px-2.5 py-1 text-xs font-medium text-primary hover:bg-accent" data-testid="link-file">
          <FileText className="h-3.5 w-3.5" /> {fileName || "Attachment"}
        </a>
      )}
      {link && (
        <a href={link} target="_blank" rel="noreferrer" className="inline-flex max-w-[260px] items-center gap-1.5 truncate rounded-lg border bg-card px-2.5 py-1 text-xs font-medium text-primary hover:bg-accent" data-testid="link-evidence">
          <ExternalLink className="h-3.5 w-3.5 shrink-0" /> <span className="truncate">{link.replace(/^https?:\/\//, "")}</span>
        </a>
      )}
    </div>
  );
}

export function Bar({ value, className, tone }: { value: number; className?: string; tone?: Tone }) {
  const auto: Tone = value >= 100 ? "teal" : value >= 60 ? "blue" : value >= 25 ? "lavender" : "coral";
  return (
    <div className={cn("h-1.5 w-full overflow-hidden rounded-full bg-[hsl(var(--soft))]", `tone-${tone ?? auto}`, className)}>
      <div className="t-bg h-full origin-left rounded-full transition-transform duration-700" style={{ transform: `scaleX(${Math.max(0, Math.min(100, value)) / 100})` }} />
    </div>
  );
}

export function Stat({ label, value, sub, tone, icon }: { label: string; value: ReactNode; sub?: string; tone?: Tone; icon?: ReactNode }) {
  return (
    <div className={cn("lift relative overflow-hidden rounded-2xl border border-card-border bg-card p-4 card-shadow", tone && `tone-${tone}`)} data-testid={`stat-${label.toLowerCase().replace(/\s/g, "-")}`}>
      <div className="flex items-center justify-between gap-2">
        <div className="text-xs font-medium text-muted-foreground">{label}</div>
        {icon && <span className={cn("grid h-8 w-8 place-items-center rounded-xl", tone ? "t-soft t-fg" : "bg-[hsl(var(--soft))] text-primary")}>{icon}</span>}
      </div>
      <div className="font-mono-num mt-1 text-2xl font-semibold text-foreground">{value}</div>
      {sub && <div className="mt-0.5 text-[11px] text-muted-foreground">{sub}</div>}
    </div>
  );
}

export function SkeletonBlock({ className }: { className?: string }) {
  return <div className={cn("animate-pulse rounded-xl bg-[hsl(var(--soft))]", className)} />;
}
