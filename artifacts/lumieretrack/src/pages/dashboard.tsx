import { Link } from "wouter";
import { ArrowRight, BookOpen, ClipboardCheck, FolderKanban, ListChecks } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageHeader, Panel, Stat, Empty, Pill, Bar, fmtDate, ago, isOverdue, Initials } from "@/components/kit";
import { TaskCard } from "@/components/task-bits";
import { JoinDialog, CourseDialog, ReviewDialog } from "@/components/forms";
import { useWs, isProf, progressOf, groupCtx } from "@/lib/ws";

function greeting() {
  const h = new Date().getHours();
  return h < 12 ? "Good morning" : h < 18 ? "Good afternoon" : "Good evening";
}

function Activity() {
  const ws = useWs();
  const items = [...ws.activity].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 8);
  return (
    <Panel title="Recent activity">
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

function ProjectsPanel() {
  const ws = useWs();
  return (
    <Panel title="Projects" action={<Link href="/projects" className="text-xs font-semibold text-primary">View all</Link>}>
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
        <PageHeader eyebrow={fmtDate(new Date().toISOString(), "EEEE, MMMM d")} title={`${greeting()}, ${first}.`} description={queue.length ? `${queue.length} submission${queue.length === 1 ? "" : "s"} are waiting for your judgement.` : "Your review queue is clear."}
          actions={<CourseDialog trigger={<Button data-testid="button-new-course"><BookOpen className="mr-2 h-4 w-4" />New course</Button>} />} />
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <Stat label="Courses" value={c.courses} />
          <Stat label="Project groups" value={c.projects} />
          <Stat label="Awaiting review" value={c.review} />
          <Stat label="Tasks approved" value={`${c.completed}/${c.tasks}`} />
        </div>
        <div className="mt-6 grid gap-6 lg:grid-cols-[1.6fr_1fr]">
          <Panel title="Review queue" action={<Link href="/reviews" className="text-xs font-semibold text-primary">Open queue</Link>}>
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
          <Panel title="Your courses" action={<Link href="/courses" className="text-xs font-semibold text-primary">Manage</Link>}>
            {ws.courses.length ? ws.courses.slice(0, 5).map((co) => (
              <Link key={co.id} href={`/courses/${co.id}`} className="flex items-center justify-between rounded-xl px-2 py-2.5 hover:bg-muted">
                <div><div className="text-sm font-semibold">{co.title}</div><div className="font-mono-num text-[11px] text-muted-foreground">{co.courseCode} · {co.memberIds?.length ?? 0} students</div></div>
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
  const feedback = [...ws.reviews].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 4);
  return (
    <>
      <PageHeader eyebrow={fmtDate(new Date().toISOString(), "EEEE, MMMM d")} title={`${greeting()}, ${first}.`}
        description={mine.length ? `You own ${mine.length} open task${mine.length === 1 ? "" : "s"}${overdue ? `, ${overdue} overdue` : ""}.` : "You have no open responsibilities right now."}
        actions={<><JoinDialog kind="course" trigger={<Button variant="outline" data-testid="button-join-course">Join course</Button>} /><JoinDialog kind="group" trigger={<Button data-testid="button-join-group">Join group</Button>} /></>} />
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Stat label="Courses" value={c.courses} />
        <Stat label="Projects" value={c.projects} />
        <Stat label="Pending tasks" value={c.pending} />
        <Stat label="Approved" value={`${c.completed}/${c.tasks}`} />
      </div>
      <div className="mt-6 grid gap-6 lg:grid-cols-[1.6fr_1fr]">
        <Panel title="Up next for you" action={<Link href="/tasks" className="text-xs font-semibold text-primary">All my tasks</Link>}>
          {mine.length ? <div className="grid gap-3 md:grid-cols-2">{mine.slice(0, 6).map((t) => <TaskCard key={t.id} task={t} showProject />)}</div>
            : <Empty icon={<ListChecks className="h-5 w-5" />} title="Nothing assigned to you" body="Open a project and document a responsibility you're taking on." action={<Link href="/projects" className="text-sm font-semibold text-primary">Go to projects</Link>} />}
        </Panel>
        <ProjectsPanel />
      </div>
      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Panel title="Latest feedback">
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
