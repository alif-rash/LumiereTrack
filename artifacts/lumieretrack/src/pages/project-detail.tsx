import { useMemo, useState, type ReactNode } from "react";
import { Link, useParams } from "wouter";
import { ArrowLeft, Copy, Plus, Upload, Printer, Award, Search, ListChecks, Inbox } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Panel, Empty, Initials, Bar, Pill, Evidence, fmtDate, ago, isOverdue } from "@/components/kit";
import { TaskDialog, SubmitDialog, ReviewDialog, GradeDialog } from "@/components/forms";
import { TaskCard } from "@/components/task-bits";
import { GroupManage, Capacity } from "@/components/group-manage";
import { useWs, isProf, isLeader, groupCtx, progressOf, nameOf, STATUSES, type Rec } from "@/lib/ws";
import { exportReport } from "@/lib/report";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

const byNewest = (a: Rec, b: Rec) => b.createdAt.localeCompare(a.createdAt);

function Timeline({ tasks }: { tasks: Rec[] }) {
  const ws = useWs();
  const dated = tasks.filter((t) => t.dueDate || t.startDate).map((t) => {
    const s = new Date(t.startDate || t.dueDate!).getTime();
    const e = new Date(t.dueDate || t.startDate!).getTime();
    return { t, s: Math.min(s, e), e: Math.max(s, e) };
  }).sort((a, b) => a.s - b.s);
  if (!dated.length) return <Empty icon={<ListChecks className="h-5 w-5" />} title="Nothing scheduled" body="Add start and due dates to tasks to see them on the timeline." />;
  const min = Math.min(...dated.map((d) => d.s));
  const max = Math.max(...dated.map((d) => d.e)) + 86400000;
  const span = max - min;
  const now = Date.now();
  return (
    <div className="overflow-x-auto">
      <div className="min-w-[640px] border-t border-foreground">
        <div className="grid grid-cols-[35%_65%] border-b border-border py-2 font-mono text-[10.5px] text-muted-foreground"><span>Task · owner</span><span className="flex justify-between"><span>{fmtDate(new Date(min).toISOString())}</span><span>{fmtDate(new Date(max).toISOString())}</span></span></div>
        <div className="relative">
          {now > min && now < max && <div aria-hidden className="absolute inset-y-0 z-10 w-px bg-[hsl(var(--cinnabar))]" style={{ left: `calc(35% + ${((now - min) / span) * 65}%)` }} />}
          {dated.map(({ t, s, e }) => (
            <div key={t.id} className="grid grid-cols-[35%_65%] items-center border-b border-border/60 py-1.5 text-xs">
              <div className="truncate pr-3"><span className="font-semibold">{t.title}</span><span className="text-muted-foreground"> · {nameOf(ws, t.assigneeId)}</span></div>
              <div className="relative h-5">
                <div className="pill absolute top-0 h-5 overflow-hidden !p-0" data-s={t.status ?? "To Do"} style={{ left: `${((s - min) / span) * 100}%`, width: `max(${((e - s + 86400000) / span) * 100}%, 10px)` }} title={`${t.title} · ${t.status ?? "To Do"} · due ${fmtDate(t.dueDate)}`} />
              </div>
            </div>
          ))}
        </div>
        <div className="mt-3 text-[11px] text-muted-foreground">The red line marks today. Bars are coloured by task status.</div>
      </div>
    </div>
  );
}

function Fact({ label, children }: { label: string; children: ReactNode }) {
  return <div className="border-b border-border/70 py-2.5 last:border-0"><dt className="eyebrow !text-[9.5px]">{label}</dt><dd className="mt-0.5 text-sm">{children}</dd></div>;
}

/** One review decision, quoted under the version it concerns. */
function ReviewNote({ r }: { r: Rec }) {
  return (
    <div className="border-l-2 border-foreground/25 pl-3" data-testid={`row-review-${r.id}`}>
      <div className="flex flex-wrap items-center gap-2"><Pill s={r.status} /><span className="font-mono text-[10.5px] text-muted-foreground">{r.userName ?? r.professorName ?? "Reviewer"} · {fmtDate(r.createdAt, "MMM d, yyyy HH:mm")}</span></div>
      {r.feedback && <p className="mt-1.5 whitespace-pre-wrap font-display text-[14.5px] italic leading-snug text-foreground/85">{r.feedback}</p>}
      {r.objectPath && <div className="mt-1.5"><Evidence objectPath={r.objectPath} fileName={r.fileName} /></div>}
    </div>
  );
}

const SUB_FILTERS = ["All", "Waiting", "Changes Requested", "Approved"] as const;

function Submissions({ g, subs, reviews, prof }: { g: Rec; subs: Rec[]; reviews: Rec[]; prof: boolean }) {
  const ws = useWs();
  const [q, setQ] = useState("");
  const [f, setF] = useState<(typeof SUB_FILTERS)[number]>("All");
  const threads = useMemo(() => {
    const map = new Map<string, Rec[]>();
    for (const s of subs) {
      const k = s.taskId ?? "__group";
      map.set(k, [...(map.get(k) ?? []), s]);
    }
    return [...map.entries()].map(([k, versions]) => {
      const sorted = [...versions].sort((a, b) => (b.version ?? 1) - (a.version ?? 1) || byNewest(a, b));
      return { key: k, task: k === "__group" ? undefined : ws.tasks.find((t) => t.id === k), versions: sorted, latest: sorted[0] };
    }).sort((a, b) => byNewest(a.latest, b.latest));
  }, [subs, ws.tasks]);
  const match = (t: (typeof threads)[number]) => {
    const st = t.latest.status;
    const okF = f === "All" || (f === "Waiting" ? st === "Submitted" || st === "Under Review" : st === f);
    const hay = `${t.task?.title ?? "group deliverable"} ${t.versions.map((v) => `${v.title} ${v.description ?? ""} ${v.userName ?? ""} ${v.fileName ?? ""}`).join(" ")}`.toLowerCase();
    return okF && (!q || hay.includes(q.toLowerCase()));
  };
  const shown = threads.filter(match);
  if (!subs.length) return <Empty icon={<Inbox className="h-5 w-5" />} title="No submissions yet" body="Submit evidence from a task, or submit a group deliverable. Every resubmission is kept as a new version." />;
  return (
    <div>
      <div className="mb-5 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div className="flex flex-wrap gap-5 border-b border-border" role="tablist" aria-label="Filter by latest status">
          {SUB_FILTERS.map((x) => {
            const n = threads.filter((t) => x === "All" || (x === "Waiting" ? ["Submitted", "Under Review"].includes(t.latest.status ?? "") : t.latest.status === x)).length;
            return <button key={x} role="tab" aria-selected={f === x} onClick={() => setF(x)} className={cn("-mb-px border-b-2 py-2 text-[13px] font-semibold", f === x ? "border-primary text-foreground" : "border-transparent text-muted-foreground hover:text-foreground")} data-testid={`filter-submissions-${x}`}>{x} <span className="font-mono text-[11px] font-normal">{n}</span></button>;
          })}
        </div>
        <div className="relative md:w-64"><Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" aria-hidden /><Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search evidence" aria-label="Search submissions" className="bg-card pl-9" data-testid="input-search-submissions" /></div>
      </div>
      <p className="mb-4 text-xs text-muted-foreground">{subs.length} version{subs.length === 1 ? "" : "s"} across {threads.length} record{threads.length === 1 ? "" : "s"}. Grouped by task or group deliverable; newest version first, every earlier version kept.</p>
      {shown.length ? (
        <div className="space-y-10">
          {shown.map((t) => (
            <section key={t.key} className="border-t-2 border-foreground" data-testid={`thread-${t.key}`}>
              <header className="flex flex-wrap items-baseline justify-between gap-2 py-3">
                <div className="min-w-0">
                  <div className="eyebrow !text-[9.5px]">{t.task ? "Task evidence" : "Group deliverable"}</div>
                  <h3 className="font-display text-[21px] leading-snug">{t.task ? t.task.title : g.title}</h3>
                  {t.task && <div className="text-xs text-muted-foreground">Owner: {nameOf(ws, t.task.assigneeId)}</div>}
                </div>
                <div className="flex items-center gap-2"><span className="font-mono text-[11px] text-muted-foreground">{t.versions.length} version{t.versions.length === 1 ? "" : "s"} · latest</span><Pill s={t.latest.status} /></div>
              </header>
              <ol>
                {t.versions.map((s, idx) => {
                  const rs = reviews.filter((r) => r.submissionId === s.id).sort(byNewest);
                  const latest = idx === 0;
                  return (
                    <li key={s.id} className={cn("grid gap-3 border-t border-border py-4 md:grid-cols-[88px_1fr_auto] md:gap-5", !latest && "text-foreground/80")} data-testid={`row-submission-${s.id}`}>
                      <div className="flex items-center gap-2 md:block">
                        <div className={cn("font-mono-num inline-block border px-1.5 text-[13px]", latest ? "border-foreground bg-foreground text-background" : "border-border")}>v{s.version ?? 1}</div>
                        <div className="eyebrow !text-[9px] md:mt-1.5">{latest ? "Latest" : "Earlier"}</div>
                      </div>
                      <div className="min-w-0 space-y-2.5">
                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                          <span className="font-semibold text-foreground">{s.userName ?? nameOf(ws, s.userId)}</span>
                          <span className="font-mono">{fmtDate(s.createdAt, "MMM d, yyyy HH:mm")}</span>
                          <Pill s={s.status} />
                        </div>
                        {s.description && <p className={cn("whitespace-pre-wrap text-sm leading-relaxed", !latest && "line-clamp-3")}>{s.description}</p>}
                        <Evidence link={s.link} objectPath={s.objectPath} fileName={s.fileName} />
                        {rs.length > 0 ? <div className="space-y-3 pt-1">{rs.map((r) => <ReviewNote key={r.id} r={r} />)}</div> : <div className="text-[11px] text-muted-foreground">No review recorded for this version.</div>}
                      </div>
                      {prof && <div className="md:text-right"><ReviewDialog submission={s} trigger={<Button size="sm" variant={latest ? "default" : "outline"} data-testid={`button-review-${s.id}`}>{s.status === "Approved" || s.status === "Changes Requested" ? `Revise review v${s.version ?? 1}` : `Review v${s.version ?? 1}`}</Button>} /></div>}
                    </li>
                  );
                })}
              </ol>
            </section>
          ))}
        </div>
      ) : <Empty title="No records match" body="Clear the search or choose another status." />}
    </div>
  );
}

export default function ProjectDetail() {
  const { id } = useParams<{ id: string }>();
  const ws = useWs();
  const { toast } = useToast();
  const [tab, setTab] = useState("overview");
  const g = ws.groups.find((x) => x.id === id);
  if (!g) return <Empty title="Project not found" body="It may not exist, or you're not a member." action={<Link href="/projects" className="text-sm font-semibold text-primary">Back to projects</Link>} />;
  const prof = isProf(ws);
  const member = g.memberIds?.includes(ws.profile.id);
  const { assignment, course } = groupCtx(ws, g);
  const tasks = ws.tasks.filter((t) => t.groupId === g.id);
  const subs = ws.submissions.filter((s) => s.groupId === g.id).sort(byNewest);
  const reviews = ws.reviews.filter((r) => r.groupId === g.id || subs.some((s) => s.id === r.submissionId)).sort(byNewest);
  const grades = (() => {
    const seen = new Set<string>();
    return ws.grades.filter((x) => x.groupId === g.id).sort(byNewest).filter((x) => {
      const k = x.scope === "individual" ? x.userId ?? "" : "group";
      if (seen.has(k)) return false;
      seen.add(k);
      return true;
    });
  })();
  const groupGrade = grades.find((x) => x.scope !== "individual");
  const indivGrades = grades.filter((x) => x.scope === "individual");
  const p = progressOf(ws, g);
  const members = g.memberIds ?? [];
  const lead = isLeader(ws, g);
  const approved = tasks.filter((t) => t.status === "Approved").length;
  const overdueTasks = tasks.filter((t) => isOverdue(t.dueDate, t.status));
  const latestByThread = new Map<string, Rec>();
  for (const s of subs) { const k = s.taskId ?? "__group"; if (!latestByThread.has(k)) latestByThread.set(k, s); }
  const returned = [...latestByThread.values()].filter((s) => s.status === "Changes Requested");
  const waiting = [...latestByThread.values()].filter((s) => s.status === "Submitted" || s.status === "Under Review");
  const myOpen = tasks.filter((t) => t.assigneeId === ws.profile.id && t.status !== "Approved");
  const activity = ws.activity.filter((a) => a.groupId === g.id).sort(byNewest).slice(0, 8);
  const looseReviews = reviews.filter((r) => !r.submissionId || !subs.some((s) => s.id === r.submissionId));

  const attention: { key: string; tone: string; text: ReactNode; go: string }[] = [
    ...returned.map((s) => ({ key: `r-${s.id}`, tone: "Changes Requested", text: <><span className="font-semibold">{s.title}</span> v{s.version ?? 1} was returned with changes requested</>, go: "submissions" })),
    ...(prof ? waiting.map((s) => ({ key: `w-${s.id}`, tone: "Under Review", text: <><span className="font-semibold">{s.title}</span> v{s.version ?? 1} is waiting for your review</>, go: "submissions" })) : []),
    ...overdueTasks.map((t) => ({ key: `o-${t.id}`, tone: "High", text: <><span className="font-semibold">{t.title}</span> is overdue · {nameOf(ws, t.assigneeId)}</>, go: "tasks" })),
    ...(!prof ? myOpen.filter((t) => !isOverdue(t.dueDate, t.status)).slice(0, 4).map((t) => ({ key: `m-${t.id}`, tone: t.status ?? "To Do", text: <>You own <span className="font-semibold">{t.title}</span>{t.dueDate ? ` · due ${fmtDate(t.dueDate, "MMM d")}` : ""}</>, go: "tasks" })) : []),
  ];

  return (
    <>
      <Link href="/projects" className="mb-5 inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground"><ArrowLeft className="h-3.5 w-3.5" />Projects</Link>
      <header className="rise mb-6 border-b border-foreground pb-5">
        <div className="eyebrow mb-3">{course?.courseCode ?? ""}{course?.title ? ` · ${course.title}` : ""}</div>
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="min-w-0">
            <h1 className="text-[32px] leading-[1.03] md:text-[42px]">{g.title}</h1>
            <p className="mt-2 text-sm text-muted-foreground">{assignment?.title ?? g.assignmentTitle}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {g.code && g.inviteActive !== false && (member || prof) && <Button variant="outline" className="font-mono-num" aria-label={`Copy invitation code ${g.code}`} onClick={() => navigator.clipboard.writeText(g.code!).then(() => toast({ title: "Invitation code copied" }), () => toast({ title: "Couldn't copy", description: g.code, variant: "destructive" }))} data-testid="button-copy-group-code"><Copy className="mr-2 h-4 w-4" />{g.code}</Button>}
            {member && <SubmitDialog groupId={g.id} trigger={<Button data-testid="button-submit-group"><Upload className="mr-2 h-4 w-4" />Submit deliverable</Button>} />}
            {prof && <GradeDialog groupId={g.id} trigger={<Button data-testid="button-grade"><Award className="mr-2 h-4 w-4" />Award grade</Button>} />}
          </div>
        </div>
        <dl className="mt-5 grid grid-cols-2 gap-x-6 gap-y-3 sm:grid-cols-4">
          <div><dt className="eyebrow !text-[9.5px]">Submission due</dt><dd className="font-mono-num text-sm">{fmtDate(assignment?.dueDate)}</dd></div>
          <div><dt className="eyebrow !text-[9.5px]">Members</dt><dd className="font-mono-num text-sm">{members.length}{g.groupSize ? ` / ${g.groupSize}` : assignment?.groupSize ? ` / ${assignment.groupSize}` : ""}</dd></div>
          <div><dt className="eyebrow !text-[9.5px]">Tasks approved</dt><dd className="font-mono-num text-sm">{approved} / {tasks.length}</dd></div>
          <div><dt className="eyebrow !text-[9.5px]">Evidence versions</dt><dd className="font-mono-num text-sm">{subs.length}</dd></div>
        </dl>
      </header>

      <Tabs value={tab} onValueChange={setTab}>
        <div className="-mx-4 mb-8 overflow-x-auto px-4">
          <TabsList className="min-w-max">
            {["Overview", "Members", "Tasks", "Timeline", "Contributions", "Submissions", "Feedback", "Reports"].map((t) => <TabsTrigger key={t} value={t.toLowerCase()} data-testid={`tab-${t.toLowerCase()}`}>{t}{t === "Submissions" && subs.length ? <span className="ml-1.5 font-mono text-[10.5px] font-normal">{subs.length}</span> : null}</TabsTrigger>)}
          </TabsList>
        </div>

        <TabsContent value="overview" className="grid gap-12 lg:grid-cols-[1.55fr_1fr]">
          <div className="space-y-12">
            <Panel title="Needs attention">
              {attention.length ? (
                <ul>
                  {attention.slice(0, 8).map((a) => (
                    <li key={a.key}>
                      <button onClick={() => setTab(a.go)} className="flex w-full items-center gap-3 border-b border-border/70 py-2.5 text-left text-sm hover:bg-card">
                        <span aria-hidden className="pill !px-1 !py-1" data-s={a.tone} /><span className="flex-1">{a.text}</span><span className="eyebrow !text-[9.5px]">Open {a.go}</span>
                      </button>
                    </li>
                  ))}
                </ul>
              ) : <p className="text-sm text-muted-foreground">Nothing is overdue or returned. {prof ? "No versions are waiting for review." : "Keep documenting work as it lands."}</p>}
            </Panel>
            <Panel title="Assignment brief">
              {assignment?.description && <p className="max-w-2xl text-[15px] leading-relaxed">{assignment.description}</p>}
              <div className="mt-5 grid gap-6 md:grid-cols-3">
                {[["Instructions", assignment?.instructions], ["Deliverables", assignment?.deliverables], ["Rubric", assignment?.rubric]].map(([k, v]) => v ? (
                  <div key={k} className="border-t border-border pt-3"><div className="eyebrow !text-[9.5px]">{k}</div><p className="mt-1.5 whitespace-pre-wrap text-[13px] leading-relaxed">{v}</p></div>
                ) : null)}
              </div>
              {!assignment?.instructions && !assignment?.deliverables && !assignment?.rubric && !assignment?.description && <p className="text-sm text-muted-foreground">No detailed brief was provided.</p>}
            </Panel>
            <Panel title="Recent group activity">
              {activity.length ? (
                <ol>{activity.map((a) => <li key={a.id} className="grid grid-cols-[96px_1fr] gap-3 border-b border-border/70 py-2 text-[13px] last:border-0"><span className="font-mono text-[10.5px] leading-5 text-muted-foreground">{ago(a.createdAt).replace("about ", "")}</span><span><span className="font-semibold">{a.userName}</span> {a.title}</span></li>)}</ol>
              ) : <p className="text-sm text-muted-foreground">Group activity will be recorded here as work is documented.</p>}
            </Panel>
          </div>
          <div className="space-y-12">
            <Panel title="Progress">
              <div className="flex items-baseline gap-2"><span className="font-mono-num text-[40px] leading-none">{p}%</span><span className="text-xs text-muted-foreground">of tasks approved</span></div>
              <Bar value={p} className="mt-3" />
              <dl className="mt-4">
                <Fact label="Formation deadline">{fmtDate(assignment?.groupFormationDeadline || assignment?.dueDate)} · <Pill s={g.groupFormationOpen === false ? "closed" : "open"} /></Fact>
                <Fact label="Submission deadline">{fmtDate(assignment?.dueDate)}</Fact>
                <Fact label="Marks available">{assignment?.maxMarks ?? "Not set"}</Fact>
                <Fact label="Professor">{assignment?.professorName ?? course?.professorName ?? "—"}</Fact>
              </dl>
            </Panel>
            <Panel title="Members" action={<button onClick={() => setTab("members")} className="text-xs font-semibold text-primary hover:underline" data-testid="button-open-members">{lead || prof ? "Manage" : "View all"}</button>}>
              <Capacity g={g} />
              <ul className="mt-3">{members.map((m) => <li key={m} className="flex items-center gap-3 border-b border-border/70 py-2 last:border-0"><Initials name={nameOf(ws, m)} className="h-7 w-7" /><div className="flex-1 text-sm">{nameOf(ws, m)}{m === ws.profile.id && <span className="text-muted-foreground"> (you)</span>}</div>{m === g.leaderId && <Pill s="Leader" />}</li>)}</ul>
              {!members.length && <p className="text-sm text-muted-foreground">No members yet. Share the group code.</p>}
            </Panel>
          </div>
        </TabsContent>

        <TabsContent value="members"><GroupManage g={g} /></TabsContent>

        <TabsContent value="tasks">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <p className="text-xs text-muted-foreground">{tasks.length} task{tasks.length === 1 ? "" : "s"} · {approved} approved{overdueTasks.length ? ` · ${overdueTasks.length} overdue` : ""}. The board scrolls sideways on smaller screens; on phones columns stack.</p>
            {(member || prof) && <TaskDialog groupId={g.id} trigger={<Button data-testid="button-new-task"><Plus className="mr-2 h-4 w-4" />Add task</Button>} />}
          </div>
          <div className="-mx-4 overflow-x-auto px-4 pb-4">
            <div className="grid grid-cols-1 gap-6 md:min-w-[1320px] md:grid-cols-6 md:gap-3">
              {STATUSES.map((s) => {
                const col = tasks.filter((t) => (t.status ?? "To Do") === s);
                return (
                  <div key={s} className="border-t-2 border-foreground pt-2" data-testid={`column-${s}`}>
                    <div className="mb-3 flex items-center justify-between"><Pill s={s} /><span className="font-mono-num text-xs text-muted-foreground">{col.length}</span></div>
                    <div className="space-y-2.5">{col.map((t) => <TaskCard key={t.id} task={t} />)}</div>
                    {!col.length && <div className="border border-dashed border-border px-3 py-4 text-center text-[11px] text-muted-foreground">Empty</div>}
                  </div>
                );
              })}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="timeline"><Timeline tasks={tasks} /></TabsContent>

        <TabsContent value="contributions">
          {members.length ? (
            <div className="overflow-x-auto">
              <p className="mb-3 text-xs text-muted-foreground">Counts come only from documented tasks and submitted evidence. Open a member's work on the Tasks and Submissions tabs.</p>
              <table className="w-full min-w-[720px] border-t border-foreground text-left text-sm">
                <thead><tr className="eyebrow !text-[9.5px]"><th className="py-2 font-normal">Member</th><th className="py-2 font-normal">Owned</th><th className="py-2 font-normal">Open</th><th className="py-2 font-normal">Approved</th><th className="py-2 font-normal">Evidence versions</th><th className="py-2 font-normal">Last submitted</th><th className="w-[180px] py-2 font-normal">Owned work approved</th></tr></thead>
                <tbody>
                  {members.map((m) => {
                    const mine = tasks.filter((t) => t.assigneeId === m);
                    const appr = mine.filter((t) => t.status === "Approved").length;
                    const ms = subs.filter((s) => s.userId === m);
                    const share = tasks.length ? Math.round((mine.length / tasks.length) * 100) : 0;
                    return (
                      <tr key={m} className="border-t border-border align-middle" data-testid={`row-contribution-${m}`}>
                        <td className="py-3 pr-3"><div className="flex items-center gap-2.5"><Initials name={nameOf(ws, m)} className="h-7 w-7" /><div><div className="font-semibold">{nameOf(ws, m)} {m === g.leaderId && <Pill s="Leader" className="ml-1" />}</div><div className="text-[11px] text-muted-foreground">{share}% of documented tasks</div></div></div></td>
                        <td className="font-mono-num py-3">{mine.length}</td>
                        <td className="font-mono-num py-3">{mine.length - appr}</td>
                        <td className="font-mono-num py-3">{appr}</td>
                        <td className="font-mono-num py-3">{ms.length}</td>
                        <td className="py-3 font-mono text-[11px] text-muted-foreground">{ms[0] ? fmtDate(ms[0].createdAt, "MMM d") : "—"}</td>
                        <td className="py-3">{mine.length ? <><Bar value={(appr / mine.length) * 100} /><div className="mt-1 font-mono text-[10.5px] text-muted-foreground">{Math.round((appr / mine.length) * 100)}%</div></> : <span className="text-[11px] text-muted-foreground">No tasks documented</span>}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              {tasks.some((t) => !t.assigneeId) && <p className="mt-3 text-xs text-muted-foreground">{tasks.filter((t) => !t.assigneeId).length} task(s) have no owner yet.</p>}
            </div>
          ) : <Empty title="No members" />}
        </TabsContent>

        <TabsContent value="submissions"><Submissions g={g} subs={subs} reviews={reviews} prof={prof} /></TabsContent>

        <TabsContent value="feedback" className="grid gap-12 lg:grid-cols-[1.5fr_1fr]">
          <Panel title="Review decisions">
            {reviews.length ? <div className="space-y-5">{reviews.map((r) => {
              const s = subs.find((x) => x.id === r.submissionId);
              return (
                <div key={r.id}>
                  <div className="mb-1.5 text-sm font-semibold">{s ? `${s.title} · v${s.version ?? 1}` : r.title}</div>
                  <ReviewNote r={r} />
                </div>
              );
            })}</div> : <Empty title="No feedback yet" body="Review decisions appear here and under each version in Submissions." />}
            {looseReviews.length > 0 && reviews.length > looseReviews.length && <p className="mt-4 text-[11px] text-muted-foreground">Some decisions are not tied to a listed version.</p>}
          </Panel>
          <div className="space-y-10">
            <Panel title="Group mark">
              {groupGrade ? (
                <div data-testid={`row-grade-${groupGrade.id}`}>
                  <div className="font-mono-num text-[36px] leading-none">{groupGrade.marks}<span className="text-base text-muted-foreground">{assignment?.maxMarks ? ` / ${assignment.maxMarks}` : ""}</span></div>
                  <div className="mt-1 text-[11px] text-muted-foreground">Applies to the whole group · {ago(groupGrade.createdAt)}</div>
                  {groupGrade.feedback && <p className="mt-3 border-l-2 border-foreground/25 pl-3 text-sm">{groupGrade.feedback}</p>}
                </div>
              ) : <p className="text-sm text-muted-foreground">No group mark awarded yet.</p>}
            </Panel>
            <Panel title={prof ? "Individual marks" : "Your individual mark"}>
              <p className="mb-3 text-[11px] text-muted-foreground">{prof ? "Each individual mark is visible only to you and the student concerned." : "Private to you. Other members' individual marks are never shown here."}</p>
              {indivGrades.length ? <div>{indivGrades.map((x) => (
                <div key={x.id} className="border-b border-border/70 py-3 last:border-0" data-testid={`row-grade-${x.id}`}>
                  <div className="flex items-baseline justify-between gap-3"><span className="text-sm font-semibold">{x.userName ?? nameOf(ws, x.userId)}</span><span className="font-mono-num text-lg">{x.marks}{assignment?.maxMarks ? <span className="text-xs text-muted-foreground"> / {assignment.maxMarks}</span> : null}</span></div>
                  {x.feedback && <p className="mt-1 text-xs text-muted-foreground">{x.feedback}</p>}
                </div>
              ))}</div> : <p className="text-sm text-muted-foreground">No individual marks awarded.</p>}
            </Panel>
          </div>
        </TabsContent>

        <TabsContent value="reports">
          <div className="grid gap-10 lg:grid-cols-[1.4fr_1fr]">
            <Panel title="Contribution report">
              <p className="max-w-xl text-sm leading-relaxed text-muted-foreground">A printable document listing members, responsibilities, every submission version, review decisions and grades. Use your browser's print dialog to save it as PDF. It includes only records your account can see, so a student's copy contains only their own individual mark.</p>
              <Button className="mt-5" onClick={() => { if (!exportReport(ws, g)) toast({ title: "Allow pop-ups to export the report", variant: "destructive" }); }} data-testid="button-export-report"><Printer className="mr-2 h-4 w-4" />Export report</Button>
            </Panel>
            <Panel title="Contents">
              <dl>
                <Fact label="Tasks recorded"><span className="font-mono-num">{tasks.length}</span></Fact>
                <Fact label="Tasks approved"><span className="font-mono-num">{approved}</span></Fact>
                <Fact label="Submission versions"><span className="font-mono-num">{subs.length}</span></Fact>
                <Fact label="Review decisions"><span className="font-mono-num">{reviews.length}</span></Fact>
              </dl>
            </Panel>
          </div>
        </TabsContent>
      </Tabs>
    </>
  );
}
