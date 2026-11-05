import { Link } from "wouter";
import { FolderKanban, Plus, KeyRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageHeader, Empty, Bar, Initials, fmtDate, isOverdue } from "@/components/kit";
import { GroupDialog, JoinDialog } from "@/components/forms";
import { useWs, groupCtx, progressOf } from "@/lib/ws";

export default function Projects() {
  const ws = useWs();
  const actions = (
    <>
      <JoinDialog kind="group" trigger={<Button variant="outline" data-testid="button-join-group"><KeyRound className="mr-2 h-4 w-4" />Join with code</Button>} />
      <GroupDialog trigger={<Button data-testid="button-create-group"><Plus className="mr-2 h-4 w-4" />New group</Button>} />
    </>
  );
  return (
    <>
      <PageHeader eyebrow="Projects" title="Group projects" description="Every group you belong to or supervise, with honest progress — approved work only." actions={actions} />
      {ws.groups.length ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {ws.groups.map((g, i) => {
            const { assignment, course } = groupCtx(ws, g);
            const p = progressOf(ws, g);
            const tasks = ws.tasks.filter((t) => t.groupId === g.id);
            const late = isOverdue(assignment?.dueDate, p === 100 ? "Approved" : undefined);
            return (
              <Link key={g.id} href={`/projects/${g.id}`} className="rise flex flex-col rounded-2xl border border-card-border bg-card p-5 transition-all hover:-translate-y-0.5 hover:border-primary/40" style={{ animationDelay: `${i * 40}ms` }} data-testid={`card-project-${g.id}`}>
                <div className="font-mono-num text-[11px] text-primary">{course?.courseCode}</div>
                <div className="mt-2 font-display text-lg font-bold">{g.title}</div>
                <div className="text-xs text-muted-foreground">{assignment?.title}</div>
                <div className="mt-5 flex items-center justify-between text-xs"><span className="text-muted-foreground">{tasks.length} tasks</span><span className="font-mono-num font-semibold">{p}% approved</span></div>
                <Bar value={p} className="mt-2" />
                <div className="mt-5 flex items-center justify-between">
                  <div className="flex -space-x-2">{(g.memberIds ?? []).slice(0, 5).map((id) => <Initials key={id} name={ws.people.find((x) => x.id === id)?.name} className="h-7 w-7 text-[10px]" />)}</div>
                  <span className={late ? "text-xs font-semibold text-destructive" : "text-xs text-muted-foreground"}>Due {fmtDate(assignment?.dueDate, "MMM d")}</span>
                </div>
              </Link>
            );
          })}
        </div>
      ) : <Empty icon={<FolderKanban className="h-5 w-5" />} title="No project groups yet" body="Create a group for an open assignment, or join one with the code a teammate shared." action={<div className="flex gap-2">{actions}</div>} />}
    </>
  );
}
