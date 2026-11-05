import { useState } from "react";
import { Link } from "wouter";
import { ClipboardCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageHeader, Empty, Pill, Evidence, Initials, ago } from "@/components/kit";
import { ReviewDialog } from "@/components/forms";
import { useWs, isProf } from "@/lib/ws";
import { cn } from "@/lib/utils";

const FILTERS = ["Waiting", "Changes Requested", "Approved", "All"];

export default function Reviews() {
  const ws = useWs();
  const [f, setF] = useState("Waiting");
  if (!isProf(ws)) return <Empty icon={<ClipboardCheck className="h-5 w-5" />} title="The review queue is for professors" body="Your submissions and their review status live in each project's Submissions tab." action={<Link href="/projects" className="text-sm font-semibold text-primary">Go to projects</Link>} />;
  const list = ws.submissions.filter((s) => f === "All" || (f === "Waiting" ? s.status === "Submitted" || s.status === "Under Review" : s.status === f)).sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  return (
    <>
      <PageHeader eyebrow="Review queue" title="Evidence awaiting judgement" description="Oldest first. Each review is attached to a specific version." />
      <div className="mb-6 flex flex-wrap gap-1.5">
        {FILTERS.map((x) => <button key={x} onClick={() => setF(x)} className={cn("rounded-full border px-3.5 py-1.5 text-xs font-semibold", f === x ? "border-primary bg-primary text-white" : "bg-card hover:bg-accent")} data-testid={`filter-${x}`}>{x}</button>)}
      </div>
      {list.length ? (
        <div className="space-y-3">
          {list.map((s) => {
            const g = ws.groups.find((x) => x.id === s.groupId);
            const task = ws.tasks.find((t) => t.id === s.taskId);
            return (
              <div key={s.id} className="flex flex-col gap-4 rounded-2xl border bg-card p-5 md:flex-row md:items-start" data-testid={`row-submission-${s.id}`}>
                <Initials name={s.userName} className="h-10 w-10" />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2"><span className="font-display font-bold">{s.title}</span><span className="font-mono-num rounded bg-muted px-1.5 text-[11px]">v{s.version ?? 1}</span><Pill s={s.status} /></div>
                  <div className="text-xs text-muted-foreground">{s.userName} · {g ? <Link href={`/projects/${g.id}`} className="text-primary hover:underline">{g.title}</Link> : "Group"} · {task ? `Task: ${task.title}` : "Group deliverable"} · {ago(s.createdAt)}</div>
                  {s.description && <p className="mt-2 line-clamp-3 text-sm">{s.description}</p>}
                  <div className="mt-2"><Evidence link={s.link} objectPath={s.objectPath} fileName={s.fileName} /></div>
                </div>
                <ReviewDialog submission={s} trigger={<Button data-testid={`button-review-${s.id}`}>Review</Button>} />
              </div>
            );
          })}
        </div>
      ) : <Empty icon={<ClipboardCheck className="h-5 w-5" />} title="Nothing here" body={f === "Waiting" ? "Every submission has been reviewed." : "No submissions in this state."} />}
    </>
  );
}
