import { Link } from "wouter";
import { FolderKanban, Plus, KeyRound, ClipboardList, Crown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageHeader, Empty, Bar, Initials, Pill, fmtDate, isOverdue } from "@/components/kit";
import { GroupDialog, JoinDialog } from "@/components/forms";
import { Capacity } from "@/components/group-manage";
import { useWs, groupCtx, progressOf, isProf, isLeader, toneOf, type Rec } from "@/lib/ws";
import { cn } from "@/lib/utils";

export function GroupCard({ g, i = 0 }: { g: Rec; i?: number }) {
  const ws = useWs();
  const { assignment, course } = groupCtx(ws, g);
  const p = progressOf(ws, g);
  const tasks = ws.tasks.filter((t) => t.groupId === g.id);
  const late = isOverdue(assignment?.dueDate, p === 100 ? "Approved" : undefined);
  const lead = isLeader(ws, g);
  const tone = toneOf(course?.id ?? g.id);
  return (
    <Link href={`/projects/${g.id}`} className={cn("rise group grid items-center gap-3 border-b border-border px-1 py-4 transition-colors hover:bg-card md:grid-cols-[1.6fr_1fr_1fr_110px] md:gap-6", `tone-${tone}`)} style={{ animationDelay: `${i * 30}ms` }} data-testid={`card-project-${g.id}`}>
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-mono-num text-[11px] text-muted-foreground">{course?.courseCode ?? g.courseCode}</span>
          {lead && <Pill s="Leader" />}<Pill s={g.groupFormationOpen === false ? "closed" : "open"} />
        </div>
        <div className="mt-1 font-display text-[19px] leading-snug group-hover:underline group-hover:decoration-1 group-hover:underline-offset-4">{g.title}</div>
        <div className="truncate text-xs text-muted-foreground">{assignment?.title ?? g.assignmentTitle} · <Crown className="inline h-3 w-3" aria-hidden /> {g.leaderName || (g.leaderId ? "Leader" : "Professor-formed")}</div>
      </div>
      <div>
        <div className="mb-1.5 flex -space-x-1.5">{(g.memberIds ?? []).slice(0, 5).map((id) => <Initials key={id} name={ws.people.find((x) => x.id === id)?.name} className="h-6 w-6 text-[9px]" />)}</div>
        <Capacity g={g} />
      </div>
      <div>
        <div className="mb-1.5 flex justify-between text-xs"><span className="text-muted-foreground">{tasks.length} tasks</span><span className="font-mono-num font-medium">{p}% approved</span></div>
        <Bar value={p} />
      </div>
      <div className="md:text-right">
        <div className="eyebrow !text-[9.5px]">Due</div>
        <div className={late ? "font-mono-num text-sm font-semibold text-destructive" : "font-mono-num text-sm"}>{fmtDate(assignment?.dueDate, "MMM d")}</div>
      </div>
    </Link>
  );
}

export default function Projects() {
  const ws = useWs();
  const prof = isProf(ws);
  const actions = (
    <>
      {!prof && <Link href="/assignments" className="inline-flex h-9 items-center rounded-[3px] border bg-card px-4 text-sm font-medium hover:bg-muted" data-testid="link-open-assignments"><ClipboardList className="mr-2 h-4 w-4 text-primary" />Open assignments</Link>}
      {!prof && <JoinDialog kind="group" trigger={<Button variant="outline" data-testid="button-join-group"><KeyRound className="mr-2 h-4 w-4" />Join with code</Button>} />}
      <GroupDialog trigger={<Button data-testid="button-create-group"><Plus className="mr-2 h-4 w-4" />New group</Button>} />
    </>
  );
  const led = ws.groups.filter((g) => isLeader(ws, g));
  const rest = ws.groups.filter((g) => !isLeader(ws, g));
  return (
    <>
      <PageHeader eyebrow="Projects" title="Group projects" description="Every group you belong to or supervise, with honest progress — approved work only." actions={actions} />
      {ws.groups.length ? (
        <div className="space-y-8">
          {led.length > 0 && (
            <section>
              <h2 className="eyebrow mb-2 flex items-center gap-2"><Crown className="h-4 w-4 text-[hsl(var(--ochre))]" />Groups I lead</h2>
              <div className="border-t border-foreground">{led.map((g, i) => <GroupCard key={g.id} g={g} i={i} />)}</div>
            </section>
          )}
          {rest.length > 0 && (
            <section>
              {led.length > 0 && <h2 className="eyebrow mb-2">{prof ? "Supervised groups" : "Other groups"}</h2>}
              <div className="border-t border-foreground">{rest.map((g, i) => <GroupCard key={g.id} g={g} i={i} />)}</div>
            </section>
          )}
        </div>
      ) : <Empty icon={<FolderKanban className="h-5 w-5" />} title="No project groups yet" body={prof ? "Form a group for one of your assignments." : "Pick an open assignment to create a group, or join one with the code a teammate shared."} action={<div className="flex flex-wrap justify-center gap-2">{actions}</div>} />}
    </>
  );
}
