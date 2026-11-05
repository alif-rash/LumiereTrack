import { Link } from "wouter";
import { Award } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageHeader, Empty, ago } from "@/components/kit";
import { GradeDialog } from "@/components/forms";
import { useWs, isProf, groupCtx, nameOf } from "@/lib/ws";

export default function Grades() {
  const ws = useWs();
  const prof = isProf(ws);
  const latest = new Map<string, (typeof ws.grades)[number]>();
  for (const g of [...ws.grades].sort((a, b) => b.createdAt.localeCompare(a.createdAt))) {
    const key = `${g.groupId}:${g.scope === "individual" ? g.userId : "group"}`;
    if (!latest.has(key)) latest.set(key, g);
  }
  const list = [...latest.values()];
  const revisions = ws.grades.length - list.length;
  return (
    <>
      <PageHeader eyebrow="Grades" title={prof ? "Grades you've awarded" : "Your grades"} description={`${prof ? "Award group marks and individual marks separately." : "Group marks and any individual marks awarded to you."} Showing the latest grade per group and student${revisions > 0 ? ` (${revisions} earlier revision${revisions === 1 ? "" : "s"} kept in history)` : ""}.`}
        actions={prof && ws.groups.length > 0 && <GradeDialog trigger={<Button data-testid="button-award-grade"><Award className="mr-2 h-4 w-4" />Award grade</Button>} />} />
      {list.length ? (
        <div className="overflow-hidden border-y border-foreground bg-card">
          <div className="hidden grid-cols-[2fr_1fr_1fr_3fr] gap-4 border-b border-foreground px-5 py-3 eyebrow md:grid"><span>Project</span><span>Scope</span><span>Marks</span><span>Feedback</span></div>
          {list.map((x) => {
            const g = ws.groups.find((y) => y.id === x.groupId);
            const { assignment } = groupCtx(ws, g);
            const max = assignment?.maxMarks;
            return (
              <div key={x.id} className="grid gap-2 border-b px-5 py-4 last:border-0 md:grid-cols-[2fr_1fr_1fr_3fr] md:gap-4" data-testid={`row-grade-${x.id}`}>
                <div>{g ? <Link href={`/projects/${g.id}`} className="font-semibold hover:text-primary">{g.title}</Link> : <span className="font-semibold">{x.title}</span>}<div className="text-xs text-muted-foreground">{assignment?.title} · {ago(x.createdAt)}</div></div>
                <div className="text-sm">{x.scope === "individual" ? x.userName ?? nameOf(ws, x.userId) : "Group"}</div>
                <div><span className="font-mono-num text-lg font-semibold text-primary">{x.marks}</span>{max ? <span className="font-mono-num text-xs text-muted-foreground"> / {max}</span> : null}</div>
                <p className="text-sm text-muted-foreground">{x.feedback || "No written feedback."}</p>
              </div>
            );
          })}
        </div>
      ) : <Empty icon={<Award className="h-5 w-5" />} title="No grades yet" body={prof ? "Open a project to review its evidence, then award a grade." : "Grades appear here once your professor awards them."} />}
    </>
  );
}
