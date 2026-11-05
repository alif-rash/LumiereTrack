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
      <div><div className="eyebrow !text-[9.5px]">{label}</div><div className="font-mono-num text-[13px] font-medium">{value}</div></div>
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
        <div className="grid grid-cols-2 gap-4 border-y border-border py-4">
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
            <span className={cn("rounded-[2px] px-2.5 py-1 font-semibold", a.canCreateGroup ? "bg-accent text-accent-foreground" : "bg-muted text-muted-foreground")}>{a.canCreateGroup ? "You can create a group" : "Group creation unavailable"}</span>
            <span className={cn("rounded-[2px] px-2.5 py-1 font-semibold", a.canJoinGroup ? "bg-secondary text-foreground" : "bg-muted text-muted-foreground")}>{a.canJoinGroup ? "You can join with a code" : "Joining by code unavailable"}</span>
            {a.allowMemberManagement !== false && <span className="rounded-[2px] bg-secondary px-2.5 py-1 font-semibold text-foreground">Leaders manage membership</span>}
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
    <article className={cn("rise grid gap-4 border-b border-border py-5 md:grid-cols-[120px_1fr_260px] md:gap-6", `tone-${tone}`)} style={{ animationDelay: `${i * 30}ms` }} data-testid={`card-assignment-${a.id}`}>
      <div className="flex items-center gap-2 md:block">
        <span aria-hidden className="t-bg mb-2 hidden h-1 w-8 md:block" />
        <div className="font-mono-num text-[12px] font-medium text-foreground">{a.courseCode}</div>
        {a.courseName && <div className="text-[11px] leading-snug text-muted-foreground md:mt-0.5"><span className="md:hidden"> · </span>{a.courseName}</div>}
      </div>
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-1.5">
          <Pill s={open ? "open" : "closed"} />
          {soon && open && <Pill s="Closing soon" />}
          {mine && <span className="pill" data-s="Approved">Group formed</span>}
        </div>
        <h3 className="mt-2 font-display text-[21px] leading-snug" data-testid={`text-assignment-title-${a.id}`}>{a.title}</h3>
        {a.professorName && <div className="text-xs text-muted-foreground">Set by {a.professorName}</div>}
        {a.description && <p className="mt-2 line-clamp-2 max-w-xl text-sm leading-relaxed text-muted-foreground">{a.description}</p>}
        {prof && <div className="mt-2 text-xs text-muted-foreground">{groupsCount} group{groupsCount === 1 ? "" : "s"} formed · students {a.selfGroups !== false ? "can" : "cannot"} create · code joining {a.allowJoin !== false ? "on" : "off"}</div>}
        {!prof && !mine && (!a.canCreateGroup || !a.canJoinGroup) && (
          <p className="mt-2 text-[11px] text-muted-foreground">
            {!a.canCreateGroup && !a.canJoinGroup ? "Your professor assigns groups for this one." : !a.canCreateGroup ? "Only joining an existing group is allowed." : "Joining by code is off — create a group instead."}
          </p>
        )}
        <div className="mt-4 flex flex-wrap items-center gap-2">
          {prof ? (
            <>
              {a.courseId && <AssignmentDialog courseId={a.courseId} assignment={a} trigger={<Button size="sm" variant="outline" data-testid={`button-edit-assignment-${a.id}`}><Pencil className="mr-1.5 h-4 w-4" />Edit rules</Button>} />}
              <GroupDialog assignmentId={a.id} trigger={<Button size="sm" data-testid={`button-create-group-${a.id}`}><Plus className="mr-1.5 h-4 w-4" />Form group</Button>} />
            </>
          ) : mine ? (
            <Link href={`/projects/${mine.id}`} className="inline-flex h-8 items-center rounded-[3px] bg-primary px-3 text-sm font-semibold text-primary-foreground hover:bg-primary/90" data-testid={`link-my-group-${a.id}`}>Open {mine.title}<ArrowRight className="ml-1.5 h-4 w-4" /></Link>
          ) : (
            <>
              {a.canCreateGroup && <GroupDialog assignmentId={a.id} trigger={<Button size="sm" data-testid={`button-create-group-${a.id}`}><Plus className="mr-1.5 h-4 w-4" />Create group</Button>} />}
              {a.canJoinGroup && <JoinDialog kind="group" expectedAssignmentId={a.id} trigger={<Button size="sm" variant="outline" data-testid={`button-join-group-${a.id}`}><KeyRound className="mr-1.5 h-4 w-4" />Join existing</Button>} />}
            </>
          )}
          <Details a={a} />
        </div>
      </div>
      <dl className="grid grid-cols-2 gap-x-4 gap-y-3 self-start border-l-0 border-border md:border-l md:pl-5">
        <Meta icon={<Users className="h-3.5 w-3.5" />} label="Group size" value={`${a.minGroupSize ?? 1}–${a.groupSize ?? "?"}`} />
        <Meta icon={<Award className="h-3.5 w-3.5" />} label="Marks" value={a.maxMarks ?? "—"} />
        <Meta icon={<CalendarClock className="h-3.5 w-3.5" />} label="Forming until" value={<span className={soon && open ? "text-[hsl(var(--ochre))] font-semibold" : ""}>{fmtDate(formationDeadline(a), "MMM d")}</span>} />
        <Meta icon={<CalendarClock className="h-3.5 w-3.5" />} label="Submission due" value={fmtDate(a.dueDate, "MMM d")} />
      </dl>
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
        {list.length ? <div className="border-t border-foreground">{list.map((a, i) => <AssignmentCard key={a.id} a={a} i={i} />)}</div>
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
        <div className="flex gap-6 border-b border-border" role="tablist">
          {tabs.map((t) => (
            <button key={t.k} role="tab" aria-selected={filter === t.k} onClick={() => setFilter(t.k)} data-testid={`filter-${t.k}`}
              className={cn("-mb-px flex items-center gap-2 whitespace-nowrap border-b-2 py-2.5 text-[13px] font-semibold transition-colors", filter === t.k ? "border-primary text-foreground" : "border-transparent text-muted-foreground hover:text-foreground")}>
              {t.label}<span className={cn("font-mono-num rounded-[2px] px-1.5 text-[10px]", filter === t.k ? "bg-primary text-primary-foreground" : "bg-muted")}>{t.n}</span>
            </button>
          ))}
        </div>
      </div>
      {list.length ? (
        <div className="border-t border-foreground">{list.map((a, i) => <AssignmentCard key={a.id} a={a} i={i} />)}</div>
      ) : (
        <Empty icon={<ClipboardList className="h-5 w-5" />}
          title={filter === "formed" ? "No groups formed yet" : filter === "soon" ? "Nothing closing this week" : "No assignments are forming groups"}
          body={filter === "formed" ? "Once you create or join a group for an open assignment, it shows up here." : filter === "soon" ? "No group-formation deadline falls in the next seven days." : "Either formation has closed, you're already grouped for every open assignment, or you haven't joined the course yet. Ask your professor for a course code, or a teammate for a group code."}
          action={<div className="flex flex-wrap justify-center gap-2"><JoinDialog kind="course" trigger={<Button variant="outline" data-testid="button-empty-join-course">Join a course</Button>} /><JoinDialog kind="group" trigger={<Button data-testid="button-empty-join-group">Join a group</Button>} /></div>} />
      )}
    </>
  );
}
