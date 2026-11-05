import { Link } from "wouter";
import { ArrowRight, BookOpen, ClipboardList, KeyRound, Upload } from "lucide-react";
import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Panel, Stat, Empty, Pill, Bar, fmtDate, ago, isOverdue, Initials } from "@/components/kit";
import { StatusControl } from "@/components/task-bits";
import { JoinDialog, CourseDialog, ReviewDialog, SubmitDialog } from "@/components/forms";
import { GroupCard } from "@/pages/projects";
import { AssignmentCard, useAssignmentBuckets } from "@/pages/assignments";
import { useWs, isProf, progressOf, groupCtx, isLeader, formationDeadline, myGroupFor } from "@/lib/ws";
import { cn } from "@/lib/utils";

function greeting() {
  const h = new Date().getHours();
  return h < 12 ? "Good morning" : h < 18 ? "Good afternoon" : "Good evening";
}

const more = (href: string, label: string, testId?: string) => (
  <Link href={href} className="inline-flex items-center gap-1 text-xs font-semibold text-primary underline-offset-4 hover:underline" data-testid={testId}>{label}<ArrowRight className="h-3 w-3" /></Link>
);

function Masthead({ role, title, body, actions }: { role: string; title: string; body: ReactNode; actions?: ReactNode }) {
  return (
    <header className="rise mb-10 border-b border-foreground pb-6" data-testid="section-hero">
      <div className="eyebrow mb-4">{role} · {fmtDate(new Date().toISOString(), "EEEE, d MMMM")}</div>
      <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
        <div className="min-w-0">
          <h1 className="text-[34px] leading-[1.02] md:text-[46px]">{title}</h1>
          <p className="mt-3 max-w-xl text-[15px] leading-relaxed text-muted-foreground">{body}</p>
        </div>
        {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
      </div>
    </header>
  );
}

function Activity() {
  const ws = useWs();
  const items = [...ws.activity].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 8);
  return (
    <Panel title="Recent activity">
      {items.length ? (
        <ol className="space-y-0">
          {items.map((a) => (
            <li key={a.id} className="grid grid-cols-[84px_1fr] gap-3 border-b border-border/70 py-2.5 last:border-0" data-testid={`row-activity-${a.id}`}>
              <span className="font-mono text-[10.5px] leading-5 text-muted-foreground">{ago(a.createdAt).replace("about ", "")}</span>
              <span className="text-[13px] leading-5"><span className="font-semibold">{a.userName}</span> {a.title}</span>
            </li>
          ))}
        </ol>
      ) : <p className="text-sm text-muted-foreground">Activity from your courses and groups will appear here.</p>}
    </Panel>
  );
}

function Deadlines() {
  const ws = useWs();
  const now = Date.now() - 86400000;
  const items = [
    ...ws.groups.map((g) => ({ key: `d-${g.id}`, g, a: groupCtx(ws, g).assignment, date: groupCtx(ws, g).assignment?.dueDate, kind: "Submission" })),
  ].filter((x) => x.date && new Date(x.date).getTime() > now).sort((x, y) => x.date!.localeCompare(y.date!)).slice(0, 6);
  return (
    <Panel title="Upcoming group deadlines" testId="panel-deadlines">
      {items.length ? (
        <ul>
          {items.map(({ key, g, a, date, kind }) => {
            const days = Math.ceil((new Date(date!).getTime() - Date.now()) / 86400000);
            return (
              <li key={key} className="border-b border-border/70 last:border-0">
                <Link href={`/projects/${g.id}`} className="grid grid-cols-[52px_1fr] items-center gap-3 py-2.5 hover:bg-card" data-testid={`link-deadline-${g.id}`}>
                  <div className={cn("border-l-2 pl-2 leading-none", days <= 3 ? "border-[hsl(var(--cinnabar))]" : "border-foreground/30")}>
                    <div className="font-mono text-[9.5px] uppercase text-muted-foreground">{fmtDate(date, "MMM")}</div>
                    <div className="font-mono-num mt-0.5 text-lg">{fmtDate(date, "d")}</div>
                  </div>
                  <div className="min-w-0">
                    <div className="truncate text-[13px] font-semibold">{a?.title}</div>
                    <div className={cn("truncate text-[11px]", days <= 3 ? "text-[hsl(var(--cinnabar))]" : "text-muted-foreground")}>{kind} · {g.title} · {days <= 0 ? "due today" : `${days} day${days === 1 ? "" : "s"} left`}</div>
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      ) : <p className="text-sm text-muted-foreground">No upcoming deadlines for your groups.</p>}
    </Panel>
  );
}

function ProjectsList() {
  const ws = useWs();
  return (
    <Panel title={isProf(ws) ? "Group progress" : "My active groups"} action={more("/projects", "All projects")}>
      {ws.groups.length ? (
        <div>
          {[...ws.groups].sort((a, b) => progressOf(ws, a) - progressOf(ws, b)).slice(0, 6).map((g) => {
            const { assignment } = groupCtx(ws, g);
            const p = progressOf(ws, g);
            return (
              <Link key={g.id} href={`/projects/${g.id}`} className="block border-b border-border/70 py-3 last:border-0 hover:bg-card" data-testid={`link-project-${g.id}`}>
                <div className="flex items-baseline justify-between gap-3 text-sm"><span className="truncate font-semibold">{g.title}</span><span className="font-mono-num text-xs">{p}%</span></div>
                <div className="mb-2 truncate text-[11px] text-muted-foreground">{assignment?.title} · due {fmtDate(assignment?.dueDate, "MMM d")}</div>
                <Bar value={p} />
              </Link>
            );
          })}
        </div>
      ) : <Empty title="No projects yet" body="Groups you belong to or supervise will show their approved progress here." />}
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
    const changes = ws.submissions.filter((s) => s.status === "Changes Requested").length;
    const ungraded = ws.groups.filter((g) => !ws.grades.some((x) => x.groupId === g.id)).length;
    return (
      <>
        <Masthead role="Instructor" title={`${greeting()}, ${first}.`}
          body={queue.length ? <><span className="font-semibold text-foreground">{queue.length} submission{queue.length === 1 ? "" : "s"}</span> {queue.length === 1 ? "is" : "are"} waiting for your judgement, oldest first below.</> : "Your review queue is clear."}
          actions={<CourseDialog trigger={<Button data-testid="button-new-course"><BookOpen className="mr-2 h-4 w-4" />New course</Button>} />} />
        <div className="grid grid-cols-2 gap-x-8 gap-y-6 md:grid-cols-4">
          <Stat label="Awaiting review" value={c.review} sub="Submitted or under review" />
          <Stat label="Changes requested" value={changes} sub="Returned to groups" />
          <Stat label="Groups without a grade" value={ungraded} sub={`of ${c.projects} project groups`} />
          <Stat label="Tasks approved" value={`${c.completed}/${c.tasks}`} sub={`across ${c.courses} course${c.courses === 1 ? "" : "s"}`} />
        </div>
        <div className="mt-12 grid gap-12 lg:grid-cols-[1.65fr_1fr]">
          <Panel title="Review queue" action={more("/reviews", "Open full queue")}>
            {queue.length ? (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[560px] text-left text-sm">
                  <thead><tr className="eyebrow !text-[9.5px]"><th className="pb-2 font-normal">Submission</th><th className="pb-2 font-normal">Group</th><th className="pb-2 font-normal">Waiting</th><th className="pb-2" /></tr></thead>
                  <tbody>
                    {queue.slice(0, 8).map((s) => {
                      const g = ws.groups.find((x) => x.id === s.groupId);
                      return (
                        <tr key={s.id} className="border-t border-border/70 align-middle">
                          <td className="py-3 pr-3">
                            <div className="flex items-center gap-2.5"><Initials name={s.userName} className="h-7 w-7" />
                              <div className="min-w-0"><div className="truncate font-semibold">{s.title} <span className="font-mono-num text-[11px] font-normal text-muted-foreground">v{s.version ?? 1}</span></div><div className="truncate text-[11px] text-muted-foreground">{s.userName} · {s.taskId ? "task evidence" : "group deliverable"}</div></div>
                            </div>
                          </td>
                          <td className="py-3 pr-3 text-[13px]">{g ? <Link href={`/projects/${g.id}`} className="hover:underline">{g.title}</Link> : "—"}</td>
                          <td className="py-3 pr-3 font-mono text-[11px] text-muted-foreground">{ago(s.createdAt).replace(" ago", "")}</td>
                          <td className="py-3 text-right"><ReviewDialog submission={s} trigger={<Button size="sm" variant="outline" data-testid={`button-review-${s.id}`}>Review</Button>} /></td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : <Empty title="Nothing to review" body="New submissions from your groups will land here, oldest first." />}
          </Panel>
          <ProjectsList />
        </div>
        <div className="mt-12 grid gap-12 lg:grid-cols-[1fr_1.2fr]">
          <Panel title="Your courses" action={more("/courses", "Manage courses")}>
            {ws.courses.length ? ws.courses.slice(0, 6).map((co) => (
              <Link key={co.id} href={`/courses/${co.id}`} className="grid grid-cols-[80px_1fr_auto] items-center gap-3 border-b border-border/70 py-3 last:border-0 hover:bg-card" data-testid={`link-course-${co.id}`}>
                <span className="font-mono-num text-[12px]">{co.courseCode}</span>
                <span className="truncate text-sm font-semibold">{co.title}</span>
                <span className="font-mono text-[11px] text-muted-foreground">{co.memberIds?.length ?? 0} students</span>
              </Link>
            )) : <Empty title="No courses yet" body="Create your first course to generate an invite code." />}
          </Panel>
          <Activity />
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
      <Masthead role="Student" title={`${greeting()}, ${first}.`}
        body={mine.length ? <>You own <span className="font-semibold text-foreground">{mine.length} open task{mine.length === 1 ? "" : "s"}</span>{overdue ? <>, <span className="font-semibold text-[hsl(var(--cinnabar))]">{overdue} overdue</span></> : ""}. Start at the top of your docket.</> : "You have no open responsibilities right now."}
        actions={<>
          <JoinDialog kind="course" trigger={<Button variant="outline" data-testid="button-join-course">Join course</Button>} />
          <JoinDialog kind="group" trigger={<Button variant="outline" data-testid="button-join-group"><KeyRound className="mr-2 h-4 w-4" />Join group</Button>} />
          <Link href="/assignments" className="inline-flex min-h-9 items-center rounded-[3px] bg-primary px-4 text-sm font-semibold text-primary-foreground hover:bg-foreground" data-testid="link-hero-assignments"><ClipboardList className="mr-2 h-4 w-4" />Open assignments</Link>
        </>} />
      <div className="grid grid-cols-2 gap-x-8 gap-y-6 md:grid-cols-4">
        <Stat label="Open tasks" value={mine.length} sub={overdue ? `${overdue} overdue` : "none overdue"} />
        <Stat label="Pending in groups" value={c.pending} sub="tasks not yet approved" />
        <Stat label="Approved" value={`${c.completed}/${c.tasks}`} sub="tasks across your groups" />
        <Stat label="Projects" value={c.projects} sub={`in ${c.courses} course${c.courses === 1 ? "" : "s"}`} />
      </div>

      <div className="mt-12 grid gap-12 lg:grid-cols-[1.65fr_1fr]">
        <Panel title="My docket" action={more("/tasks", "All my tasks")}>
          {mine.length ? (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[520px] text-left text-sm">
                <thead><tr className="eyebrow !text-[9.5px]"><th className="pb-2 font-normal">Task</th><th className="pb-2 font-normal">Due</th><th className="pb-2 font-normal">Status</th><th className="pb-2" /></tr></thead>
                <tbody>
                  {mine.slice(0, 8).map((t) => {
                    const g = ws.groups.find((x) => x.id === t.groupId);
                    const over = isOverdue(t.dueDate, t.status);
                    const canSubmit = ["To Do", "In Progress", "Changes Requested", undefined].includes(t.status);
                    return (
                      <tr key={t.id} className="border-t border-border/70" data-testid={`card-task-${t.id}`}>
                        <td className="py-3 pr-3">
                          <div className="flex items-center gap-2">
                            <span aria-label={`${t.priority ?? "No"} priority`} className={cn("h-2 w-2 shrink-0", t.priority === "High" ? "bg-[hsl(var(--cinnabar))]" : t.priority === "Medium" ? "bg-[hsl(var(--ochre))]" : "bg-foreground/25")} />
                            <span className="font-semibold">{t.title}</span>
                          </div>
                          {g && <Link href={`/projects/${g.id}`} className="ml-4 text-[11px] text-muted-foreground hover:text-foreground hover:underline">{g.title}</Link>}
                        </td>
                        <td className={cn("py-3 pr-3 font-mono text-[12px]", over ? "font-semibold text-[hsl(var(--cinnabar))]" : "text-muted-foreground")}>{t.dueDate ? fmtDate(t.dueDate, "MMM d") : "—"}{over && " · late"}</td>
                        <td className="py-3 pr-3"><StatusControl task={t} /></td>
                        <td className="py-3 text-right">{canSubmit && t.groupId && <SubmitDialog groupId={t.groupId} task={t} trigger={<Button size="sm" variant="ghost" className="text-primary" data-testid={`button-submit-task-${t.id}`}><Upload className="mr-1 h-3.5 w-3.5" />Evidence</Button>} />}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : <Empty title="Nothing assigned to you" body="Open a project and document a responsibility you are taking on." action={more("/projects", "Go to projects")} />}
        </Panel>
        <Deadlines />
      </div>

      <div className="mt-12"><OpenAssignments /></div>

      {led.length > 0 && (
        <section className="mt-12" data-testid="section-groups-i-lead">
          <Panel title="Groups I lead" action={more("/projects", "All projects")}>
            <div className="-mt-4">{led.slice(0, 4).map((g, i) => <GroupCard key={g.id} g={g} i={i} />)}</div>
          </Panel>
        </section>
      )}

      <div className="mt-12 grid gap-12 lg:grid-cols-[1fr_1fr_1fr]">
        <ProjectsList />
        <Panel title="Latest feedback">
          {feedback.length ? (
            <div>
              {feedback.map((r) => (
                <div key={r.id} className="border-b border-border/70 py-3 last:border-0">
                  <div className="flex items-start justify-between gap-2"><span className="text-sm font-semibold">{r.title}</span><Pill s={r.status} /></div>
                  {r.feedback && <p className="mt-1.5 line-clamp-3 border-l-2 border-foreground/20 pl-3 font-display text-[14px] italic leading-snug text-foreground/80">{r.feedback}</p>}
                  <div className="mt-2 font-mono text-[10.5px] text-muted-foreground">{r.userName ?? r.professorName} · {ago(r.createdAt)}</div>
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

function OpenAssignments() {
  const ws = useWs();
  const { open } = useAssignmentBuckets();
  const notMine = open.filter((a) => !myGroupFor(ws, a.id));
  const list = notMine.length ? notMine : open;
  return (
    <Panel title="Assignments forming groups" testId="panel-open-assignments" action={more("/assignments", `Browse all${open.length ? ` (${open.length})` : ""}`, "link-all-assignments")}>
      {list.length ? (
        <div className="-mt-4">{[...list].sort((a, b) => (formationDeadline(a) ?? "9").localeCompare(formationDeadline(b) ?? "9")).slice(0, 3).map((a, i) => <AssignmentCard key={a.id} a={a} i={i} />)}</div>
      ) : (
        <p className="text-sm text-muted-foreground">No assignments are forming groups for you right now — you are grouped already, or formation has closed. {more("/assignments", "See assignments")}</p>
      )}
    </Panel>
  );
}
