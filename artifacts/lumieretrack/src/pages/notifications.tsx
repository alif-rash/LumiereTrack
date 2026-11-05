import { Bell, CheckCheck, ExternalLink } from "lucide-react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { PageHeader, Empty, ago } from "@/components/kit";
import { useAct, useWs } from "@/lib/ws";
import { cn } from "@/lib/utils";

export default function Notifications() {
  const ws = useWs();
  const [, nav] = useLocation();
  const { run, pending } = useAct();
  const list = [...ws.notifications].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const unread = list.filter((n) => !n.read).length;
  return (
    <>
      <PageHeader eyebrow="Notifications" title="What changed" description={unread ? `${unread} unread` : "You're all caught up."}
        actions={unread > 0 && <Button variant="outline" disabled={pending} onClick={() => run({ action: "readNotification" })} data-testid="button-mark-all"><CheckCheck className="mr-2 h-4 w-4" />Mark all read</Button>} />
      {list.length ? (
        <div className="overflow-hidden border-y border-foreground bg-card">
          {list.map((n) => (
            <div key={n.id} className={cn("flex items-start gap-4 border-b px-5 py-4 last:border-0", !n.read && "bg-[hsl(var(--soft)/0.5)]")} data-testid={`row-notification-${n.id}`}>
              <span className={cn("mt-1.5 h-2 w-2 shrink-0", n.read ? "bg-border" : "bg-primary")} />
              <div className="min-w-0 flex-1">
                <div className={cn("text-sm", !n.read && "font-semibold")}>{n.title}</div>
                {n.description && <p className="mt-0.5 text-xs text-muted-foreground">{n.description}</p>}
                <div className="mt-1 text-[11px] text-muted-foreground">{ago(n.createdAt)}</div>
              </div>
              <div className="flex shrink-0 gap-1">
                {n.link && n.link.startsWith("/") && <Button size="sm" variant="ghost" onClick={() => { if (!n.read) run({ action: "readNotification", id: n.id }); nav(n.link!); }} aria-label={`Open ${n.title}`} data-testid={`button-open-${n.id}`}><ExternalLink className="h-3.5 w-3.5" /></Button>}
                {!n.read && <Button size="sm" variant="ghost" disabled={pending} onClick={() => run({ action: "readNotification", id: n.id })} data-testid={`button-read-${n.id}`}>Mark read</Button>}
              </div>
            </div>
          ))}
        </div>
      ) : <Empty icon={<Bell className="h-5 w-5" />} title="No notifications" body="Reviews, grades and group changes will be announced here." />}
    </>
  );
}
