import { useMemo, useState, type ReactNode } from "react";
import { Link } from "wouter";
import { CalendarClock, ClipboardList, Eye, KeyRound, Plus, Users, Award, Pencil, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { PageHeader, Empty, Pill, fmtDate } from "@/components/kit";
import { GroupDialog, JoinDialog, AssignmentDialog } from "@/components/forms";
import { useWs, isProf, toneOf, myGroupFor, closingSoon, formationDeadline, type Rec } from "@/lib/ws";
import { cn } from "@/lib/utils";

type Filter = "all" | "notFormed" | "formed" | "soon";

function Meta({ icon, label, value }: { icon: ReactNode; label: string; value: ReactNode }) {
  return (
    <div className="flex items-start gap-2">
      <span className="mt-0.5 text-muted-foreground">{icon}</span>
      <div><div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{label}</div><div className="text-[13px] font-medium">{value}</div></div>
    </div>
  );
}

function Details({ a }: { a: Rec }) {
  return (
    <Dialog>
      <DialogTrigger asChild><Button variant="ghost" size="sm" data-testid={`button-details-${a.id}`}><Eye className="mr-1.5 h-4 w-4" />View details</Button></DialogTrigger>
      <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-xl">
        <DialogHeader>
          <div className="font-mono-num text-[11px] text-primary">{a.courseCode} · {a.courseName}</div>
          <DialogTitle className="font-display text-2xl">{a.title}</DialogTitle>
          <DialogDescription>{a.professorName ? `Set by ${a.professorName}` : "Group assignment"}</DialogDescription>
        </DialogHeader>
        <div className="grid grid-cols-2 gap-4 rounded-xl bg-[hsl(var(--soft)/0.6)] p-4">
          <Meta icon={<Users className="h-4 w-4" />} label="Group size" value={`${a.minGroupSize ?? 1}–${a.groupSize ?? "?"} students`} />
          <Meta icon={<Award className="h-4 w-4" />} label="Max marks" value={a.maxMarks ?? "Not set"} />
          <Meta icon={<CalendarClock className="h-4 w-4" />} label="Forming until" value={fmtDate(formationDeadline(a))} />
          <Meta icon={<CalendarClock className="h-4 w-4" />} label="Submission due" value={fmtDate(a.dueDate)} />
        </div>
        <div className="space-y-4">
          {[["Summary", a.description], ["Instructions", a.instructions], ["Deliverables", a.deliverables], ["Rubric", a.rubric]].map(([k, v]) => v ? (
            <div key={k}><div className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">{k}</div><p className="mt-1 whitespace-pre-wrap text-sm">{v}</p></div>
          ) : null)}
          <div className="flex flex-wrap gap-2 text-xs">
            <span className={cn("rounded-full px-2.5 py-1 font-semibold", a.canCreateGroup ? "bg-[#E8F8F5] text-[#1d7a6e]" : "bg-muted text-muted-foreground")}>{a.canCreateGroup ? "You can create a group" : "Group creation unavailable"}</span>
            <span className={cn("rounded-full px-2.5 py-1 font-semibold", a.canJoinGroup ? "bg-[#F2EEFF] text-[#5b4bc4]" : "bg-muted text-muted-foreground")}>{a.canJoinGroup ? "You can join with a code" : "Joining by code unavailable"}</span>
            {a.allowMemberManagement !== false && <span className="rounded-full bg-[#EEF4FF] px-2.5 py-1 font-semibold text-[#2b62ad]">Leaders manage membership</span>}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function AssignmentCard({ a, i }: { a: Rec; i: number }) {
  const ws = useWs();
  const prof = isProf(ws);
  const mine = myGroupFor(ws, a.id);
  const soon = closingSoon(a);
  const open = a.groupFormationOpen !== false && a.formationStatus !== "closed";
  const groupsCount = ws.groups.filter((g) => g.assignmentId === a.id).length;
  const tone = toneOf(a.courseId ?? a.id);
  return (
    <article className={cn("lift rise relative flex flex-col overflow-hidden rounded-2xl border border-card-border bg-card card-shadow", `tone-${tone}`)} style={{ animationDelay: `${i * 40}ms` }} data-testid={`card-assignment-${a.id}`}>
      <div className="t-soft border-b border-card-border px-5 pb-4 pt-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="font-mono-num text-[11px] font-medium t-fg">{a.courseCode}{a.courseName ? ` · ${a.courseName}` : ""}</div>
            <h3 className="mt-1 font-display text-lg font-bold leading-snug" data-testid={`text-assignment-title-${a.id}`}>{a.title}</h3>
            {a.professorName && <div className="text-xs text-muted-foreground">{a.professorName}</div>}
          </div>
          <span className="t-bg grid h-10 w-10 shrink-0 place-items-center rounded-xl text-white"><ClipboardList className="h-5 w-5" /></span>
        </div>
        <div className="mt-3 flex flex-wrap gap-1.5">
          <Pill s={open ? "open" : "closed"} />
          {soon && open && <Pill s="Closing soon" />}
          {mine && <span className="pill bg-[#EEF4FF] text-[#2b62ad]">Group formed</span>}
        </div>
      </div>
      <div className="flex flex-1 flex-col px-5 py-4">
        {a.description && <p className="line-clamp-2 text-sm text-muted-foreground">{a.description}</p>}
        <div className="mt-4 grid grid-cols-2 gap-3">
          <Meta icon={<Users className="h-4 w-4" />} label="Group size" value={`${a.minGroupSize ?? 1}–${a.groupSize ?? "?"}`} />
          <Meta icon={<Award className="h-4 w-4" />} label="Marks" value={a.maxMarks ?? "—"} />
          <Meta icon={<CalendarClock className="h-4 w-4" />} label="Forming until" value={<span className={soon && open ? "text-[#a66b00]" : ""}>{fmtDate(formationDeadline(a), "MMM d")}</span>} />
          <Meta icon={<CalendarClock className="h-4 w-4" />} label="Due" value={fmtDate(a.dueDate, "MMM d")} />
        </div>
        {prof && <div className="mt-3 text-xs text-muted-foreground">{groupsCount} group{groupsCount === 1 ? "" : "s"} formed · students {a.selfGroups !== false ? "can" : "cannot"} create · code joining {a.allowJoin !== false ? "on" : "off"}</div>}
        {!prof && !mine && (!a.canCreateGroup || !a.canJoinGroup) && (
          <p className="mt-3 text-[11px] text-muted-foreground">
            {!a.canCreateGroup && !a.canJoinGroup ? "Your professor assigns groups for this one." : !a.canCreateGroup ? "Only joining an existing group is allowed." : "Joining by code is off — create a group instead."}
          </p>
        )}
        <div className="mt-auto flex flex-wrap items-center gap-2 pt-4">
          {prof ? (
            <>
              {a.courseId && <AssignmentDialog courseId={a.courseId} assignment={a} trigger={<Button size="sm" variant="outline" data-testid={`button-edit-assignment-${a.id}`}><Pencil className="mr-1.5 h-4 w-4" />Edit rules</Button>} />}
              <GroupDialog assignmentId={a.id} trigger={<Button size="sm" data-testid={`button-create-group-${a.id}`}><Plus className="mr-1.5 h-4 w-4" />Form group</Button>} />
            </>
          ) : mine ? (
            <Link href={`/projects/${mine.id}`} className="inline-flex h-9 items-center rounded-md bg-primary px-3 text-sm font-semibold text-primary-foreground hover:bg-primary/90" data-testid={`link-my-group-${a.id}`}>Open {mine.title}<ArrowRight className="ml-1.5 h-4 w-4" /></Link>
          ) : (
            <>
              {a.canCreateGroup && <GroupDialog assignmentId={a.id} trigger={<Button size="sm" data-testid={`button-create-group-${a.id}`}><Plus className="mr-1.5 h-4 w-4" />Create group</Button>} />}
              {a.canJoinGroup && <JoinDialog kind="group" expectedAssignmentId={a.id} trigger={<Button size="sm" variant="outline" data-testid={`button-join-group-${a.id}`}><KeyRound className="mr-1.5 h-4 w-4" />Join existing</Button>} />}
            </>
          )}
          <Details a={a} />
        </div>
      </div>
    </article>
  );
}

export function useAssignmentBuckets() {
  const ws = useWs();
  return useMemo(() => {
    const open = ws.openAssignments ?? [];
    const formed = ws.assignments.filter((a) => a.groupFormationOpen && !open.some((o) => o.id === a.id) && myGroupFor(ws, a.id));
    return { open, formed, soon: open.filter(closingSoon) };
  }, [ws]);
}

export default function Assignments() {
  const ws = useWs();
  const prof = isProf(ws);
  const [filter, setFilter] = useState<Filter>("all");
  const { open, formed, soon } = useAssignmentBuckets();

  if (prof) {
    const list = [...ws.assignments].sort((a, b) => (a.dueDate ?? "9").localeCompare(b.dueDate ?? "9"));
    return (
      <>
        <PageHeader eyebrow="Assignments" title="Group assignments" description="Formation rules, deadlines and group counts for every assignment you manage." />
        {list.length ? <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{list.map((a, i) => <AssignmentCard key={a.id} a={a} i={i} />)}</div>
          : <Empty icon={<ClipboardList className="h-5 w-5" />} title="No assignments yet" body="Open a course and publish a group assignment to start group formation." action={<Link href="/courses" className="text-sm font-semibold text-primary">Go to courses</Link>} />}
      </>
    );
  }

  const tabs: { k: Filter; label: string; n: number }[] = [
    { k: "all", label: "All open", n: open.length },
    { k: "notFormed", label: "Group not formed", n: open.length },
    { k: "formed", label: "Group already formed", n: formed.length },
    { k: "soon", label: "Closing soon", n: soon.length },
  ];
  const list = filter === "all" ? open : filter === "notFormed" ? open : filter === "formed" ? formed : soon;

  return (
    <>
      <PageHeader eyebrow="Open group assignments" title="Find your group" description="Assignments in your courses that are currently forming groups. Create a group and lead it, or join a teammate's with their code."
        actions={<JoinDialog kind="group" trigger={<Button variant="outline" data-testid="button-join-group"><KeyRound className="mr-2 h-4 w-4" />Join with code</Button>} />} />
      <div className="-mx-4 mb-6 overflow-x-auto px-4">
        <div className="inline-flex gap-1 rounded-2xl border bg-card p-1 card-shadow" role="tablist">
          {tabs.map((t) => (
            <button key={t.k} role="tab" aria-selected={filter === t.k} onClick={() => setFilter(t.k)} data-testid={`filter-${t.k}`}
              className={cn("flex items-center gap-2 whitespace-nowrap rounded-xl px-3.5 py-2 text-[13px] font-semibold transition-colors", filter === t.k ? "bg-[hsl(var(--navy))] text-white" : "text-muted-foreground hover:bg-muted hover:text-foreground")}>
              {t.label}<span className={cn("font-mono-num rounded-full px-1.5 text-[10px]", filter === t.k ? "bg-white/20" : "bg-muted")}>{t.n}</span>
            </button>
          ))}
        </div>
      </div>
      {list.length ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{list.map((a, i) => <AssignmentCard key={a.id} a={a} i={i} />)}</div>
      ) : (
        <Empty icon={<ClipboardList className="h-5 w-5" />}
          title={filter === "formed" ? "No groups formed yet" : filter === "soon" ? "Nothing closing this week" : "No assignments are forming groups"}
          body={filter === "formed" ? "Once you create or join a group for an open assignment, it shows up here." : filter === "soon" ? "No group-formation deadline falls in the next seven days." : "Either formation has closed, you're already grouped for every open assignment, or you haven't joined the course yet. Ask your professor for a course code, or a teammate for a group code."}
          action={<div className="flex flex-wrap justify-center gap-2"><JoinDialog kind="course" trigger={<Button variant="outline" data-testid="button-empty-join-course">Join a course</Button>} /><JoinDialog kind="group" trigger={<Button data-testid="button-empty-join-group">Join a group</Button>} /></div>} />
      )}
    </>
  );
}
