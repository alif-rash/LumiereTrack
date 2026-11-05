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
    <Link href={`/projects/${g.id}`} className={cn("lift rise relative flex flex-col overflow-hidden rounded-2xl border border-card-border bg-card p-5 card-shadow", `tone-${tone}`)} style={{ animationDelay: `${i * 40}ms` }} data-testid={`card-project-${g.id}`}>
      <span aria-hidden className="t-bg absolute inset-y-0 left-0 w-1" />
      <div className="flex items-center justify-between gap-2">
        <span className="t-soft t-fg font-mono-num rounded-md px-2 py-0.5 text-[11px] font-medium">{course?.courseCode ?? g.courseCode}</span>
        <div className="flex gap-1">{lead && <Pill s="Leader" />}<Pill s={g.groupFormationOpen === false ? "closed" : "open"} /></div>
      </div>
      <div className="mt-3 font-display text-lg font-bold leading-snug">{g.title}</div>
      <div className="text-xs text-muted-foreground">{assignment?.title ?? g.assignmentTitle}</div>
      <div className="mt-3 flex items-center gap-1.5 text-[11px] text-muted-foreground"><Crown className="h-3.5 w-3.5" />{g.leaderName || (g.leaderId ? "Leader" : "Professor-formed")}</div>
      <div className="mt-3"><Capacity g={g} /></div>
      <div className="mt-4 flex items-center justify-between text-xs"><span className="text-muted-foreground">{tasks.length} tasks</span><span className="font-mono-num font-semibold">{p}% approved</span></div>
      <Bar value={p} className="mt-2" />
      <div className="mt-4 flex items-center justify-between">
        <div className="flex -space-x-2">{(g.memberIds ?? []).slice(0, 5).map((id) => <Initials key={id} name={ws.people.find((x) => x.id === id)?.name} className="h-7 w-7 text-[10px]" />)}</div>
        <span className={late ? "text-xs font-semibold text-destructive" : "text-xs text-muted-foreground"}>Due {fmtDate(assignment?.dueDate, "MMM d")}</span>
      </div>
    </Link>
  );
}

export default function Projects() {
  const ws = useWs();
  const prof = isProf(ws);
  const actions = (
    <>
      {!prof && <Link href="/assignments" className="inline-flex h-9 items-center rounded-md border bg-card px-4 text-sm font-medium hover:bg-muted" data-testid="link-open-assignments"><ClipboardList className="mr-2 h-4 w-4 text-[#28B8A6]" />Open assignments</Link>}
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
              <h2 className="mb-3 flex items-center gap-2 text-sm font-bold"><Crown className="h-4 w-4 text-[#8B7CF6]" />Groups I lead</h2>
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{led.map((g, i) => <GroupCard key={g.id} g={g} i={i} />)}</div>
            </section>
          )}
          {rest.length > 0 && (
            <section>
              {led.length > 0 && <h2 className="mb-3 text-sm font-bold">{prof ? "Supervised groups" : "Other groups"}</h2>}
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{rest.map((g, i) => <GroupCard key={g.id} g={g} i={i} />)}</div>
            </section>
          )}
        </div>
      ) : <Empty icon={<FolderKanban className="h-5 w-5" />} title="No project groups yet" body={prof ? "Form a group for one of your assignments." : "Pick an open assignment to create a group, or join one with the code a teammate shared."} action={<div className="flex flex-wrap justify-center gap-2">{actions}</div>} />}
    </>
  );
}
