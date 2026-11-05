import { useState } from "react";
import { Link, useParams } from "wouter";
import { ArrowLeft, Copy, Plus, Upload, Printer, Award, MessageSquareText, Inbox, ListChecks } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PageHeader, Panel, Empty, Initials, Bar, Pill, Evidence, Stat, fmtDate, ago } from "@/components/kit";
import { TaskDialog, SubmitDialog, ReviewDialog, GradeDialog } from "@/components/forms";
import { TaskCard } from "@/components/task-bits";
import { GroupManage, Capacity } from "@/components/group-manage";
import { useWs, isProf, isLeader, groupCtx, progressOf, nameOf, STATUSES, type Rec } from "@/lib/ws";
import { exportReport } from "@/lib/report";
import { useToast } from "@/hooks/use-toast";

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
    <Panel>
      <div className="mb-3 flex justify-between font-mono-num text-[11px] text-muted-foreground"><span>{fmtDate(new Date(min).toISOString())}</span><span>{fmtDate(new Date(max).toISOString())}</span></div>
      <div className="relative space-y-2">
        {now > min && now < max && <div className="absolute inset-y-0 z-10 w-px bg-destructive/60" style={{ left: `calc(35% + ${((now - min) / span) * 65}%)` }} />}
        {dated.map(({ t, s, e }) => (
          <div key={t.id} className="grid grid-cols-[35%_65%] items-center gap-0 text-xs">
            <div className="truncate pr-3"><span className="font-semibold">{t.title}</span><span className="text-muted-foreground"> · {nameOf(ws, t.assigneeId)}</span></div>
            <div className="relative h-6 rounded bg-[hsl(var(--background))]">
              <div className="pill absolute top-0.5 h-5 overflow-hidden" data-s={t.status ?? "To Do"} style={{ left: `${((s - min) / span) * 100}%`, width: `max(${((e - s + 86400000) / span) * 100}%, 10px)` }} title={`${t.status} · due ${fmtDate(t.dueDate)}`} />
            </div>
          </div>
        ))}
      </div>
      <div className="mt-4 text-[11px] text-muted-foreground">Red line marks today.</div>
    </Panel>
  );
}

export default function ProjectDetail() {
  const { id } = useParams<{ id: string }>();
  const ws = useWs();
  const { toast } = useToast();
  const [tab, setTab] = useState("tasks");
  const g = ws.groups.find((x) => x.id === id);
  if (!g) return <Empty title="Project not found" body="It may not exist, or you're not a member." action={<Link href="/projects" className="text-sm font-semibold text-primary">Back to projects</Link>} />;
  const prof = isProf(ws);
  const member = g.memberIds?.includes(ws.profile.id);
  const { assignment, course } = groupCtx(ws, g);
  const tasks = ws.tasks.filter((t) => t.groupId === g.id);
  const subs = ws.submissions.filter((s) => s.groupId === g.id).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const reviews = ws.reviews.filter((r) => r.groupId === g.id || subs.some((s) => s.id === r.submissionId)).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const grades = (() => {
    const seen = new Set<string>();
    return ws.grades.filter((x) => x.groupId === g.id).sort((a, b) => b.createdAt.localeCompare(a.createdAt)).filter((x) => {
      const k = x.scope === "individual" ? x.userId ?? "" : "group";
      if (seen.has(k)) return false;
      seen.add(k);
      return true;
    });
  })();
  const p = progressOf(ws, g);
  const members = g.memberIds ?? [];
  const lead = isLeader(ws, g);

  return (
    <>
      <Link href="/projects" className="mb-4 inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground"><ArrowLeft className="h-3.5 w-3.5" />Projects</Link>
      <PageHeader eyebrow={`${course?.courseCode ?? ""} · ${assignment?.title ?? ""}`} title={g.title} description={`Due ${fmtDate(assignment?.dueDate)} · ${members.length} member${members.length === 1 ? "" : "s"} · ${p}% approved`}
        actions={<>
          {g.code && g.inviteActive !== false && (member || prof) && <Button variant="outline" className="font-mono-num" onClick={() => navigator.clipboard.writeText(g.code!).then(() => toast({ title: "Invitation code copied" }), () => toast({ title: "Couldn't copy", description: g.code, variant: "destructive" }))} data-testid="button-copy-group-code"><Copy className="mr-2 h-4 w-4" />{g.code}</Button>}
          {member && <SubmitDialog groupId={g.id} trigger={<Button data-testid="button-submit-group"><Upload className="mr-2 h-4 w-4" />Submit deliverable</Button>} />}
          {prof && <GradeDialog groupId={g.id} trigger={<Button data-testid="button-grade"><Award className="mr-2 h-4 w-4" />Award grade</Button>} />}
        </>} />
      <Tabs value={tab} onValueChange={setTab}>
        <div className="-mx-4 mb-6 overflow-x-auto px-4">
          <TabsList>
            {["Overview", "Members", "Tasks", "Timeline", "Contributions", "Submissions", "Feedback", "Reports"].map((t) => <TabsTrigger key={t} value={t.toLowerCase()} data-testid={`tab-${t.toLowerCase()}`}>{t}</TabsTrigger>)}
          </TabsList>
        </div>

        <TabsContent value="overview" className="grid gap-6 lg:grid-cols-[1.6fr_1fr]">
          <Panel tone="blue" title="Assignment brief">
            {assignment?.description && <p className="text-sm">{assignment.description}</p>}
            <div className="mt-4 space-y-4">
              {[["Instructions", assignment?.instructions], ["Deliverables", assignment?.deliverables], ["Rubric", assignment?.rubric]].map(([k, v]) => v ? (
                <div key={k}><div className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">{k}</div><p className="mt-1 whitespace-pre-wrap text-[13px]">{v}</p></div>
              ) : null)}
              {!assignment?.instructions && !assignment?.deliverables && !assignment?.rubric && <p className="text-sm text-muted-foreground">No detailed brief was provided.</p>}
            </div>
          </Panel>
          <div className="space-y-6">
            <Panel tone="teal" title="Progress"><div className="font-mono-num text-3xl font-semibold">{p}%</div><Bar value={p} className="mt-3" /><div className="mt-2 text-xs text-muted-foreground">{tasks.filter((t) => t.status === "Approved").length} of {tasks.length} tasks approved · {assignment?.maxMarks ?? "—"} marks available</div></Panel>
            <Panel tone="lavender" title="Members" action={<button onClick={() => setTab("members")} className="text-xs font-semibold text-primary" data-testid="button-open-members">{lead || prof ? "Manage" : "View all"}</button>}>
              <Capacity g={g} />
              <div className="mt-4 space-y-3">{members.map((m) => <div key={m} className="flex items-center gap-3"><Initials name={nameOf(ws, m)} /><div className="flex-1 text-sm font-medium">{nameOf(ws, m)}{m === ws.profile.id && <span className="text-muted-foreground"> (you)</span>}</div>{m === g.leaderId && <Pill s="Leader" />}</div>)}</div>
              {!members.length && <p className="text-sm text-muted-foreground">No members yet. Share the group code.</p>}
            </Panel>
          </div>
        </TabsContent>

        <TabsContent value="members"><GroupManage g={g} /></TabsContent>

        <TabsContent value="tasks">
          {(member || prof) && <div className="mb-4 flex justify-end"><TaskDialog groupId={g.id} trigger={<Button data-testid="button-new-task"><Plus className="mr-2 h-4 w-4" />Add task</Button>} /></div>}
          <div className="-mx-4 overflow-x-auto px-4 pb-4">
            <div className="grid min-w-[1320px] grid-cols-6 gap-3">
              {STATUSES.map((s) => {
                const col = tasks.filter((t) => (t.status ?? "To Do") === s);
                return (
                  <div key={s} className="rounded-2xl bg-[hsl(var(--soft)/0.55)] p-2.5" data-testid={`column-${s}`}>
                    <div className="mb-3 flex items-center justify-between px-1"><Pill s={s} /><span className="font-mono-num text-xs text-muted-foreground">{col.length}</span></div>
                    <div className="space-y-2.5">{col.map((t) => <TaskCard key={t.id} task={t} />)}</div>
                    {!col.length && <div className="rounded-xl border border-dashed px-3 py-6 text-center text-[11px] text-muted-foreground">Empty</div>}
                  </div>
                );
              })}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="timeline"><Timeline tasks={tasks} /></TabsContent>

        <TabsContent value="contributions">
          {members.length ? (
            <div className="grid gap-4 md:grid-cols-2">
              {members.map((m) => {
                const mine = tasks.filter((t) => t.assigneeId === m);
                const appr = mine.filter((t) => t.status === "Approved").length;
                const ms = subs.filter((s) => s.userId === m).length;
                const share = tasks.length ? Math.round((mine.length / tasks.length) * 100) : 0;
                return (
                  <Panel key={m}>
                    <div className="flex items-center gap-3"><Initials name={nameOf(ws, m)} className="h-10 w-10" /><div><div className="font-display font-bold">{nameOf(ws, m)}</div><div className="text-xs text-muted-foreground">Owns {share}% of documented tasks</div></div></div>
                    <div className="mt-4 grid grid-cols-3 gap-2 text-center">
                      {[["Owned", mine.length], ["Approved", appr], ["Submissions", ms]].map(([k, v]) => <div key={k as string} className="rounded-xl bg-[hsl(var(--background))] p-2"><div className="font-mono-num text-lg font-semibold">{v}</div><div className="text-[10px] uppercase tracking-wider text-muted-foreground">{k}</div></div>)}
                    </div>
                    <Bar value={mine.length ? (appr / mine.length) * 100 : 0} className="mt-4" />
                    <div className="mt-1 text-[11px] text-muted-foreground">{mine.length ? `${Math.round((appr / mine.length) * 100)}% of owned work approved` : "No responsibilities documented yet"}</div>
                  </Panel>
                );
              })}
            </div>
          ) : <Empty title="No members" />}
        </TabsContent>

        <TabsContent value="submissions">
          {subs.length ? (
            <div className="space-y-3">
              {subs.map((s) => (
                <Panel key={s.id}>
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div><div className="flex items-center gap-2"><span className="font-display font-bold">{s.title}</span><span className="font-mono-num rounded bg-muted px-1.5 text-[11px]">v{s.version ?? 1}</span></div>
                      <div className="text-xs text-muted-foreground">{s.userName ?? nameOf(ws, s.userId)} · {s.taskId ? "Task evidence" : "Group deliverable"} · {ago(s.createdAt)}</div></div>
                    <div className="flex items-center gap-2"><Pill s={s.status} />{prof && <ReviewDialog submission={s} trigger={<Button size="sm" data-testid={`button-review-${s.id}`}>{s.status === "Approved" || s.status === "Changes Requested" ? "Revise review" : "Review"}</Button>} />}</div>
                  </div>
                  {s.description && <p className="mt-3 whitespace-pre-wrap text-sm">{s.description}</p>}
                  <div className="mt-3"><Evidence link={s.link} objectPath={s.objectPath} fileName={s.fileName} /></div>
                </Panel>
              ))}
            </div>
          ) : <Empty icon={<Inbox className="h-5 w-5" />} title="No submissions yet" body="Submit evidence from a task card, or submit a group deliverable." />}
        </TabsContent>

        <TabsContent value="feedback" className="grid gap-6 lg:grid-cols-[1.6fr_1fr]">
          <Panel title="Reviews">
            {reviews.length ? <div className="space-y-4">{reviews.map((r) => (
              <div key={r.id} className="border-l-2 border-primary/40 pl-4">
                <div className="flex flex-wrap items-center gap-2"><span className="text-sm font-semibold">{r.title}</span><Pill s={r.status} /></div>
                {r.feedback && <p className="mt-1 whitespace-pre-wrap text-sm">{r.feedback}</p>}
                <div className="mt-2"><Evidence objectPath={r.objectPath} fileName={r.fileName} /></div>
                <div className="mt-1 text-[11px] text-muted-foreground">{r.userName ?? r.professorName} · {ago(r.createdAt)}</div>
              </div>
            ))}</div> : <Empty icon={<MessageSquareText className="h-5 w-5" />} title="No feedback yet" />}
          </Panel>
          <Panel title="Grades">
            {grades.length ? <div className="space-y-3">{grades.map((x) => (
              <div key={x.id} className="rounded-xl border p-3">
                <div className="flex justify-between"><span className="text-sm font-semibold">{x.scope === "individual" ? x.userName ?? nameOf(ws, x.userId) : "Whole group"}</span><span className="font-mono-num text-sm font-semibold text-primary">{x.marks}{assignment?.maxMarks ? `/${assignment.maxMarks}` : ""}</span></div>
                {x.feedback && <p className="mt-1 text-xs text-muted-foreground">{x.feedback}</p>}
              </div>
            ))}</div> : <p className="text-sm text-muted-foreground">No grades awarded yet.</p>}
          </Panel>
        </TabsContent>

        <TabsContent value="reports">
          <div className="grid gap-3 md:grid-cols-4">
            <Stat label="Tasks" value={tasks.length} /><Stat label="Approved" value={tasks.filter((t) => t.status === "Approved").length} />
            <Stat label="Submissions" value={subs.length} /><Stat label="Reviews" value={reviews.length} />
          </div>
          <Panel className="mt-6" title="Contribution report">
            <p className="max-w-xl text-sm text-muted-foreground">A printable document with members, responsibilities, versioned submissions, review decisions and grades. Use your browser's print dialog to save it as PDF. It includes only records your account can see.</p>
            <Button className="mt-4" onClick={() => { if (!exportReport(ws, g)) toast({ title: "Allow pop-ups to export the report", variant: "destructive" }); }} data-testid="button-export-report"><Printer className="mr-2 h-4 w-4" />Export report</Button>
          </Panel>
        </TabsContent>
      </Tabs>
    </>
  );
}
