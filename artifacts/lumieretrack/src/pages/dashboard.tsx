import { Link } from "wouter";
import { ArrowRight, BookOpen, ClipboardCheck, FolderKanban, ListChecks, ClipboardList, Crown, CalendarClock, Activity as ActivityIcon, MessageSquareText, Users, Award, Plus, KeyRound } from "lucide-react";
import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Panel, Stat, Empty, Pill, Bar, fmtDate, ago, isOverdue, Initials } from "@/components/kit";
import { TaskCard } from "@/components/task-bits";
import { JoinDialog, CourseDialog, ReviewDialog, GroupDialog } from "@/components/forms";
import { GroupCard } from "@/pages/projects";
import { AssignmentCard, useAssignmentBuckets } from "@/pages/assignments";
import { useWs, isProf, progressOf, groupCtx, isLeader, toneOf, closingSoon, formationDeadline } from "@/lib/ws";
import { cn } from "@/lib/utils";

function greeting() {
  const h = new Date().getHours();
  return h < 12 ? "Good morning" : h < 18 ? "Good afternoon" : "Good evening";
}

function Activity() {
  const ws = useWs();
  const items = [...ws.activity].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 8);
  return (
    <Panel tone="sky" icon={<ActivityIcon className="h-4 w-4" />} title="Recent activity">
      {items.length ? (
        <ol className="relative space-y-4 border-l border-border pl-5">
          {items.map((a) => (
            <li key={a.id} className="relative" data-testid={`row-activity-${a.id}`}>
              <span className="absolute -left-[25px] top-1.5 h-2 w-2 rounded-full bg-primary ring-4 ring-card" />
              <div className="text-[13px]"><span className="font-semibold">{a.userName}</span> {a.title}</div>
              <div className="text-[11px] text-muted-foreground">{ago(a.createdAt)}</div>
            </li>
          ))}
        </ol>
      ) : <p className="text-sm text-muted-foreground">Activity from your courses and groups will appear here.</p>}
    </Panel>
  );
}

function Hero({ prof, eyebrow, title, body, actions }: { prof: boolean; eyebrow: string; title: string; body: string; actions?: ReactNode }) {
  return (
    <div className={cn("rise relative mb-6 overflow-hidden rounded-3xl px-6 py-7 text-white md:px-8 md:py-8", prof ? "hero-prof" : "hero-student")} data-testid="section-hero">
      <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
        <div className="min-w-0">
          <div className="mb-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-white/70">{eyebrow}</div>
          <h1 className="text-[28px] font-extrabold leading-tight md:text-[34px]">{title}</h1>
          <p className="mt-2 max-w-xl text-sm text-white/80">{body}</p>
        </div>
        {actions && <div className="flex flex-wrap gap-2 [&_button]:border-white/25">{actions}</div>}
      </div>
    </div>
  );
}

function Deadlines() {
  const ws = useWs();
  const items = ws.groups.map((g) => ({ g, a: groupCtx(ws, g).assignment })).filter((x) => x.a?.dueDate && new Date(x.a.dueDate).getTime() > Date.now() - 86400000)
    .sort((x, y) => x.a!.dueDate!.localeCompare(y.a!.dueDate!)).slice(0, 5);
  return (
    <Panel tone="coral" icon={<CalendarClock className="h-4 w-4" />} title="Upcoming group deadlines" testId="panel-deadlines">
      {items.length ? (
        <ul className="space-y-2.5">
          {items.map(({ g, a }) => {
            const d = new Date(a!.dueDate!);
            const days = Math.ceil((d.getTime() - Date.now()) / 86400000);
            return (
              <li key={g.id}>
                <Link href={`/projects/${g.id}`} className="flex items-center gap-3 rounded-xl p-1.5 hover:bg-muted" data-testid={`link-deadline-${g.id}`}>
                  <div className={cn("grid h-11 w-11 shrink-0 place-items-center rounded-xl text-center leading-none", days <= 3 ? "bg-[#FF8177] text-white" : "bg-[#FFF0EE] text-[#c4544a]")}>
                    <div><div className="text-[9px] font-bold uppercase">{fmtDate(a!.dueDate, "MMM")}</div><div className="font-mono-num text-base font-semibold">{fmtDate(a!.dueDate, "d")}</div></div>
                  </div>
                  <div className="min-w-0 flex-1"><div className="truncate text-sm font-semibold">{a!.title}</div><div className="truncate text-[11px] text-muted-foreground">{g.title} · {days <= 0 ? "due today" : `${days} day${days === 1 ? "" : "s"} left`}</div></div>
                </Link>
              </li>
            );
          })}
        </ul>
      ) : <p className="text-sm text-muted-foreground">No upcoming deadlines for your groups.</p>}
    </Panel>
  );
}

function OpenAssignmentsPanel() {
  const { open, soon } = useAssignmentBuckets();
  return (
    <Panel tone="teal" icon={<ClipboardList className="h-4 w-4" />} title="Open group assignments" testId="panel-open-assignments"
      action={<Link href="/assignments" className="text-xs font-semibold text-primary" data-testid="link-all-assignments">Browse all{open.length ? ` (${open.length})` : ""}</Link>}>
      {open.length ? (
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {open.slice(0, 3).map((a,i) => <AssignmentCard key={a.id} a={a} i={i} />)}
        </div>
      ) : (
        <div className="flex flex-col items-start gap-2 rounded-xl border border-dashed bg-[#E8F8F5]/60 p-4 text-sm sm:flex-row sm:items-center sm:justify-between">
          <span className="text-muted-foreground">No assignments are forming groups for you right now{soon.length ? "" : " — you're either grouped already or formation has closed"}.</span>
          <Link href="/assignments" className="shrink-0 text-xs font-semibold text-primary">See assignments</Link>
        </div>
      )}
    </Panel>
  );
}

function ProjectsPanel() {
  const ws = useWs();
  return (
    <Panel tone="yellow" icon={<FolderKanban className="h-4 w-4" />} title={isProf(ws) ? "Projects" : "My active groups"} action={<Link href="/projects" className="text-xs font-semibold text-primary">View all</Link>}>
      {ws.groups.length ? (
        <div className="space-y-4">
          {ws.groups.slice(0, 5).map((g) => {
            const { assignment } = groupCtx(ws, g);
            const p = progressOf(ws, g);
            return (
              <Link key={g.id} href={`/projects/${g.id}`} className="block rounded-xl p-2 -m-2 hover:bg-muted" data-testid={`link-project-${g.id}`}>
                <div className="flex items-center justify-between text-sm"><span className="font-semibold">{g.title}</span><span className="font-mono-num text-xs text-muted-foreground">{p}%</span></div>
                <div className="mb-2 text-[11px] text-muted-foreground">{assignment?.title} · due {fmtDate(assignment?.dueDate, "MMM d")}</div>
                <Bar value={p} />
              </Link>
            );
          })}
        </div>
      ) : <Empty icon={<FolderKanban className="h-5 w-5" />} title="No projects yet" body="Groups you belong to will show their progress here." />}
    </Panel>
  );
}

export default function Dashboard() {
  const ws = useWs();
  const prof = isProf(ws);
  const first = ws.profile.name.split(" ")[0];
  const c = ws.counts;

  if (prof) {
    const queue = ws.submissions.filter((s) => s.status === "Submitted" || s.status === "Under Review").sort((a, b) => a.createdAt.localeCompare(b.createdAt));
    return (
      <>
        <Hero prof eyebrow={`Instructor · ${fmtDate(new Date().toISOString(), "EEEE, MMMM d")}`} title={`${greeting()}, ${first}.`} body={queue.length ? `${queue.length} submission${queue.length === 1 ? "" : "s"} are waiting for your judgement.` : "Your review queue is clear."}
          actions={<CourseDialog trigger={<Button className="bg-[#F4C95D] text-[#172B4D] hover:bg-[#F4C95D]/90" data-testid="button-new-course"><BookOpen className="mr-2 h-4 w-4" />New course</Button>} />} />
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <Stat tone="lavender" icon={<BookOpen className="h-4 w-4" />} label="Courses" value={c.courses} />
          <Stat tone="blue" icon={<FolderKanban className="h-4 w-4" />} label="Project groups" value={c.projects} />
          <Stat tone="coral" icon={<ClipboardCheck className="h-4 w-4" />} label="Awaiting review" value={c.review} />
          <Stat tone="teal" icon={<Award className="h-4 w-4" />} label="Tasks approved" value={`${c.completed}/${c.tasks}`} />
        </div>
        <div className="mt-6 grid gap-6 lg:grid-cols-[1.6fr_1fr]">
          <Panel tone="coral" icon={<ClipboardCheck className="h-4 w-4" />} title="Review queue" action={<Link href="/reviews" className="text-xs font-semibold text-primary">Open queue</Link>}>
            {queue.length ? (
              <div className="divide-y">
                {queue.slice(0, 6).map((s) => {
                  const g = ws.groups.find((x) => x.id === s.groupId);
                  return (
                    <div key={s.id} className="flex items-center gap-3 py-3">
                      <Initials name={s.userName} />
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-sm font-semibold">{s.title} <span className="font-mono-num text-xs text-muted-foreground">v{s.version ?? 1}</span></div>
                        <div className="truncate text-xs text-muted-foreground">{s.userName} · {g?.title} · {ago(s.createdAt)}</div>
                      </div>
                      <ReviewDialog submission={s} trigger={<Button size="sm" variant="outline" data-testid={`button-review-${s.id}`}>Review</Button>} />
                    </div>
                  );
                })}
              </div>
            ) : <Empty icon={<ClipboardCheck className="h-5 w-5" />} title="Nothing to review" body="New submissions from your groups will land here." />}
          </Panel>
          <Activity />
        </div>
        <div className="mt-6 grid gap-6 lg:grid-cols-2">
          <ProjectsPanel />
          <Panel tone="lavender" icon={<BookOpen className="h-4 w-4" />} title="Your courses" action={<Link href="/courses" className="text-xs font-semibold text-primary">Manage</Link>}>
            {ws.courses.length ? ws.courses.slice(0, 5).map((co) => (
              <Link key={co.id} href={`/courses/${co.id}`} className={cn("flex items-center gap-3 rounded-xl px-2 py-2.5 hover:bg-muted", `tone-${toneOf(co.id)}`)} data-testid={`link-course-${co.id}`}>
                <span className="t-bg h-9 w-1.5 rounded-full" />
                <div className="flex-1"><div className="text-sm font-semibold">{co.title}</div><div className="font-mono-num text-[11px] text-muted-foreground">{co.courseCode} · {co.memberIds?.length ?? 0} students</div></div>
                <ArrowRight className="h-4 w-4 text-muted-foreground" />
              </Link>
            )) : <Empty icon={<BookOpen className="h-5 w-5" />} title="No courses yet" body="Create your first course to generate an invite code." />}
          </Panel>
        </div>
      </>
    );
  }

  const mine = ws.tasks.filter((t) => t.assigneeId === ws.profile.id && t.status !== "Approved")
    .sort((a, b) => (a.dueDate ?? "9").localeCompare(b.dueDate ?? "9"));
  const overdue = mine.filter((t) => isOverdue(t.dueDate, t.status)).length;
  const led = ws.groups.filter((g) => isLeader(ws, g));
  const feedback = [...ws.reviews].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 4);
  return (
    <>
      <Hero prof={false} eyebrow={`Student · ${fmtDate(new Date().toISOString(), "EEEE, MMMM d")}`} title={`${greeting()}, ${first}.`}
        body={mine.length ? `You own ${mine.length} open task${mine.length === 1 ? "" : "s"}${overdue ? `, ${overdue} overdue` : ""}.` : "You have no open responsibilities right now."}
        actions={<><JoinDialog kind="course" trigger={<Button variant="outline" className="bg-white/10 text-white hover:bg-white/20 hover:text-white" data-testid="button-join-course">Join course</Button>} /><JoinDialog kind="group" trigger={<Button variant="outline" className="bg-white/10 text-white hover:bg-white/20 hover:text-white" data-testid="button-join-group">Join group</Button>} /><Link href="/assignments" className="inline-flex h-9 items-center rounded-md bg-white px-4 text-sm font-semibold text-[#172B4D] hover:bg-white/90" data-testid="link-hero-assignments"><ClipboardList className="mr-2 h-4 w-4 text-[#3478D4]" />Open assignments</Link></>} />
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Stat tone="lavender" icon={<BookOpen className="h-4 w-4" />} label="Courses" value={c.courses} />
        <Stat tone="blue" icon={<FolderKanban className="h-4 w-4" />} label="Projects" value={c.projects} />
        <Stat tone="coral" icon={<ListChecks className="h-4 w-4" />} label="Pending tasks" value={c.pending} />
        <Stat tone="teal" icon={<Award className="h-4 w-4" />} label="Approved" value={`${c.completed}/${c.tasks}`} />
      </div>
      <div className="mt-6"><OpenAssignmentsPanel /></div>
      {led.length > 0 && (
        <section className="mt-6" data-testid="section-groups-i-lead">
          <h2 className="mb-3 flex items-center gap-2 text-[15px] font-bold"><span className="grid h-7 w-7 place-items-center rounded-lg bg-[#F2EEFF] text-[#8B7CF6]"><Crown className="h-4 w-4" /></span>Groups I lead</h2>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{led.slice(0, 3).map((g, i) => <GroupCard key={g.id} g={g} i={i} />)}</div>
        </section>
      )}
      <div className="mt-6 grid gap-6 lg:grid-cols-[1.6fr_1fr]">
        <Panel tone="blue" icon={<ListChecks className="h-4 w-4" />} title="Tasks assigned to me" action={<Link href="/tasks" className="text-xs font-semibold text-primary">All my tasks</Link>}>
          {mine.length ? <div className="grid gap-3 md:grid-cols-2">{mine.slice(0, 6).map((t) => <TaskCard key={t.id} task={t} showProject />)}</div>
            : <Empty icon={<ListChecks className="h-5 w-5" />} title="Nothing assigned to you" body="Open a project and document a responsibility you're taking on." action={<Link href="/projects" className="text-sm font-semibold text-primary">Go to projects</Link>} />}
        </Panel>
        <div className="space-y-6"><Deadlines /><ProjectsPanel /></div>
      </div>
      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Panel tone="lavender" icon={<MessageSquareText className="h-4 w-4" />} title="Latest feedback">
          {feedback.length ? (
            <div className="space-y-3">
              {feedback.map((r) => (
                <div key={r.id} className="rounded-xl border p-3">
                  <div className="flex items-center justify-between gap-2"><span className="text-sm font-semibold">{r.title}</span><Pill s={r.status} /></div>
                  {r.feedback && <p className="mt-1.5 line-clamp-3 text-xs text-muted-foreground">{r.feedback}</p>}
                  <div className="mt-2 text-[11px] text-muted-foreground">{r.userName ?? r.professorName} · {ago(r.createdAt)}</div>
                </div>
              ))}
            </div>
          ) : <p className="text-sm text-muted-foreground">When a professor reviews your submissions, their notes appear here.</p>}
        </Panel>
        <Activity />
      </div>
    </>
  );
}
