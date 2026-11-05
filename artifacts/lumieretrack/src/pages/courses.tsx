import { Link } from "wouter";
import { BookOpen, Plus, Users, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageHeader, Empty } from "@/components/kit";
import { CourseDialog, JoinDialog } from "@/components/forms";
import { useWs, isProf, toneOf } from "@/lib/ws";

export default function Courses() {
  const ws = useWs();
  const prof = isProf(ws);
  const action = prof
    ? <CourseDialog trigger={<Button data-testid="button-create-course"><Plus className="mr-2 h-4 w-4" />Create course</Button>} />
    : <JoinDialog kind="course" trigger={<Button data-testid="button-join-course"><Plus className="mr-2 h-4 w-4" />Join with code</Button>} />;
  return (
    <>
      <PageHeader eyebrow="Courses" title={prof ? "Courses you teach" : "Your courses"} description={prof ? "Share a course's invite code with students, or add them by email." : "Courses you're enrolled in. Ask your professor for an invite code to join another."} actions={action} />
      {ws.courses.length ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {ws.courses.map((c, i) => {
            const assignments = ws.assignments.filter((a) => a.courseId === c.id).length;
            return (
              <Link key={c.id} href={`/courses/${c.id}`} className={`tone-${toneOf(c.id)} rise lift group relative flex flex-col overflow-hidden rounded-2xl border border-card-border bg-card p-5 card-shadow`} style={{ animationDelay: `${i * 40}ms` }} data-testid={`card-course-${c.id}`}>
                <span aria-hidden className="t-bg absolute inset-x-0 top-0 h-1" />
                <div className="flex items-start justify-between">
                  <span className="t-soft t-fg font-mono-num rounded-md px-2 py-0.5 text-xs font-medium">{c.courseCode}</span>
                  {prof && c.code && <span className="font-mono-num text-[11px] text-muted-foreground">Invite {c.code}</span>}
                </div>
                <div className="mt-4 font-display text-lg font-bold leading-snug group-hover:text-primary">{c.title}</div>
                {c.description && <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{c.description}</p>}
                <div className="mt-auto flex gap-4 pt-5 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1.5"><Users className="h-3.5 w-3.5" />{c.memberIds?.length ?? 0} students</span>
                  <span className="flex items-center gap-1.5"><FileText className="h-3.5 w-3.5" />{assignments} assignments</span>
                </div>
                {c.professorName && <div className="mt-3 border-t pt-3 text-xs text-muted-foreground">{c.professorName}</div>}
              </Link>
            );
          })}
        </div>
      ) : (
        <Empty icon={<BookOpen className="h-5 w-5" />} title={prof ? "You haven't created a course" : "You're not enrolled anywhere yet"} body={prof ? "Create a course to get an invite code and start publishing group assignments." : "Enter the invite code from your professor to join a course."} action={action} />
      )}
    </>
  );
}
