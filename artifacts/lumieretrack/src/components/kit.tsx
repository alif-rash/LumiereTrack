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

/** Status mark: square key + mono label. Colour comes from data-s in index.css. */
export function Pill({ s, className }: { s?: string; className?: string }) {
  return (
    <span className={cn("pill", className)} data-s={s} data-testid={`status-${s}`}>
      {s || "To Do"}
    </span>
  );
}

/** Page masthead: mono eyebrow, serif title, ruled underline. */
export function PageHeader({ eyebrow, title, description, actions }: { eyebrow?: string; title: ReactNode; description?: ReactNode; actions?: ReactNode }) {
  return (
    <header className="rise mb-8 border-b border-foreground pb-5">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div className="min-w-0">
          {eyebrow && <div className="eyebrow mb-3">{eyebrow}</div>}
          <h1 className="text-[30px] leading-[1.05] text-foreground md:text-[40px]">{title}</h1>
          {description && <p className="mt-3 max-w-2xl text-[14px] leading-relaxed text-muted-foreground">{description}</p>}
        </div>
        {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
      </div>
    </header>
  );
}

/** Section: no floating card. A ruled heading line with content below. Pass className with border to frame. */
export function Panel({ title, action, children, className, tone, icon, testId }: { title?: ReactNode; action?: ReactNode; children: ReactNode; className?: string; tone?: Tone; icon?: ReactNode; testId?: string }) {
  return (
    <section className={cn("relative", tone && `tone-${tone}`, className)} data-testid={testId}>
      {(title || action) && (
        <div className="mb-4 flex items-center justify-between gap-3 border-b border-border pb-2.5">
          <h2 className="flex items-center gap-2 font-sans text-[13px] font-semibold uppercase tracking-[0.08em] text-foreground" style={{ fontFamily: "var(--app-font-sans)", letterSpacing: "0.08em" }}>
            {tone && <span aria-hidden className="t-bg h-2.5 w-2.5" />}
            {icon && <span aria-hidden className="text-muted-foreground [&_svg]:h-3.5 [&_svg]:w-3.5">{icon}</span>}
            {title}
          </h2>
          {action}
        </div>
      )}
      {children}
    </section>
  );
}

export function Empty({ icon, title, body, action }: { icon?: ReactNode; title: string; body?: string; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-start border border-dashed border-border bg-card/60 px-6 py-8">
      {icon && <div className="mb-3 text-muted-foreground [&_svg]:h-5 [&_svg]:w-5">{icon}</div>}
      <div className="font-display text-lg">{title}</div>
      {body && <p className="mt-1 max-w-md text-sm leading-relaxed text-muted-foreground">{body}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export function ErrorState({ message, onRetry }: { message?: string; onRetry?: () => void }) {
  return (
    <div className="max-w-md border-l-2 border-destructive bg-card px-6 py-6">
      <div className="eyebrow text-destructive">Connection</div>
      <div className="mt-2 font-display text-xl">We couldn't load your workspace</div>
      <p className="mt-1 text-sm text-muted-foreground">{message || "The connection dropped or the server is busy."}</p>
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
    <span aria-hidden className={cn("grid h-8 w-8 shrink-0 place-items-center rounded-full border border-foreground/20 bg-secondary font-mono text-[10.5px] font-medium text-foreground", className)}>
      {i || "?"}
    </span>
  );
}

export function Field({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-[12.5px] font-semibold text-foreground">{label}</Label>
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
        <a href={fileHref(objectPath)} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 border border-border bg-card px-2 py-1 font-mono text-[11px] text-foreground underline-offset-2 hover:border-foreground hover:underline" data-testid="link-file">
          <FileText className="h-3.5 w-3.5 text-primary" /> {fileName || "Attachment"}
        </a>
      )}
      {link && (
        <a href={link} target="_blank" rel="noreferrer" className="inline-flex max-w-[280px] items-center gap-1.5 truncate border border-border bg-card px-2 py-1 font-mono text-[11px] text-foreground underline-offset-2 hover:border-foreground hover:underline" data-testid="link-evidence">
          <ExternalLink className="h-3.5 w-3.5 shrink-0 text-primary" /> <span className="truncate">{link.replace(/^https?:\/\//, "")}</span>
        </a>
      )}
    </div>
  );
}

/** Progress: a hairline track with tick marks at quarters. */
export function Bar({ value, className, tone }: { value: number; className?: string; tone?: Tone }) {
  const auto: Tone = value >= 100 ? "teal" : value >= 50 ? "blue" : value > 0 ? "yellow" : "navy";
  const v = Math.max(0, Math.min(100, value));
  return (
    <div role="progressbar" aria-valuenow={Math.round(v)} aria-valuemin={0} aria-valuemax={100} className={cn("relative h-1.5 w-full bg-secondary", `tone-${tone ?? auto}`, className)}>
      <div className="t-bg h-full origin-left transition-transform duration-700" style={{ transform: `scaleX(${v / 100})` }} />
      {[25, 50, 75].map((t) => <span key={t} aria-hidden className="absolute top-0 h-full w-px bg-background" style={{ left: `${t}%` }} />)}
    </div>
  );
}

/** Ledger figure: big mono numeral over a label, separated by rules rather than boxed. */
export function Stat({ label, value, sub, tone, icon }: { label: string; value: ReactNode; sub?: string; tone?: Tone; icon?: ReactNode }) {
  return (
    <div className={cn("relative border-t-2 border-foreground pt-3", tone && `tone-${tone}`)} data-testid={`stat-${label.toLowerCase().replace(/\s/g, "-")}`}>
      <div className="flex items-center justify-between gap-2">
        <div className="eyebrow">{label}</div>
        {icon && <span aria-hidden className="text-muted-foreground [&_svg]:h-3.5 [&_svg]:w-3.5">{icon}</span>}
      </div>
      <div className="font-mono-num mt-2 text-[28px] font-medium leading-none text-foreground">{value}</div>
      {sub && <div className="mt-1.5 text-[11px] text-muted-foreground">{sub}</div>}
    </div>
  );
}

export function SkeletonBlock({ className }: { className?: string }) {
  return <div className={cn("animate-pulse bg-secondary", className)} />;
}
