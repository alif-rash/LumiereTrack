import { Link, useParams } from "wouter";
import { ArrowLeft, Copy, Pencil, Plus, UserPlus, FileText, Users, FolderKanban } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PageHeader, Empty, Initials, Bar } from "@/components/kit";
import { CourseDialog, AssignmentDialog, AddStudentDialog } from "@/components/forms";
import { useWs, isProf, progressOf } from "@/lib/ws";
import { AssignmentCard } from "@/pages/assignments";
import { useToast } from "@/hooks/use-toast";

export default function CourseDetail() {
  const { id } = useParams<{ id: string }>();
  const ws = useWs();
  const { toast } = useToast();
  const course = ws.courses.find((c) => c.id === id);
  if (!course) return <Empty title="Course not found" body="It may have been removed, or you don't have access." action={<Link href="/courses" className="text-sm font-semibold text-primary">Back to courses</Link>} />;
  const canManage = isProf(ws) && (course.instructorIds?.includes(ws.profile.id) ?? course.createdBy === ws.profile.id);
  const assignments = ws.assignments.filter((a) => a.courseId === course.id);
  const students = ws.people.filter((p) => course.memberIds?.includes(p.id));
  const groups = ws.groups.filter((g) => g.courseId === course.id || assignments.some((a) => a.id === g.assignmentId));
  const copy = () => { if (course.code) navigator.clipboard.writeText(course.code).then(() => toast({ title: "Invite code copied" })); };

  return (
    <>
      <Link href="/courses" className="mb-4 inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground"><ArrowLeft className="h-3.5 w-3.5" />Courses</Link>
      <PageHeader eyebrow={course.courseCode} title={course.title} description={course.description || course.professorName}
        actions={<>
          {course.code && <Button variant="outline" onClick={copy} className="font-mono-num" data-testid="button-copy-code"><Copy className="mr-2 h-4 w-4" />{course.code}</Button>}
          {canManage && <CourseDialog course={course} trigger={<Button variant="outline" data-testid="button-edit-course"><Pencil className="mr-2 h-4 w-4" />Edit</Button>} />}
        </>} />
      <Tabs defaultValue="assignments">
        <TabsList className="mb-6">
          <TabsTrigger value="assignments" data-testid="tab-assignments">Assignments · {assignments.length}</TabsTrigger>
          <TabsTrigger value="students" data-testid="tab-students">Students · {students.length}</TabsTrigger>
          <TabsTrigger value="groups" data-testid="tab-groups">Groups · {groups.length}</TabsTrigger>
        </TabsList>

        <TabsContent value="assignments" className="space-y-4">
          {canManage && <div className="flex justify-end"><AssignmentDialog courseId={course.id} trigger={<Button data-testid="button-new-assignment"><Plus className="mr-2 h-4 w-4" />New assignment</Button>} /></div>}
          {assignments.length ? <div className="border-t border-foreground">{assignments.map((a, i) => <AssignmentCard key={a.id} a={a} i={i} />)}</div> : <Empty icon={<FileText className="h-5 w-5" />} title="No assignments published" body={canManage ? "Publish a group assignment with a brief, rubric and due date." : "Your professor hasn't published an assignment yet."} />}
        </TabsContent>

        <TabsContent value="students">
          {canManage && <div className="mb-4 flex justify-end"><AddStudentDialog courseId={course.id} trigger={<Button data-testid="button-add-student"><UserPlus className="mr-2 h-4 w-4" />Add student</Button>} /></div>}
          {students.length ? (
            <div className="border-y border-foreground bg-card">
              {students.map((s) => (
                <div key={s.id} className="flex items-center gap-3 border-b px-4 py-3 last:border-0" data-testid={`row-student-${s.id}`}>
                  <Initials name={s.name} />
                  <div className="min-w-0 flex-1"><div className="text-sm font-semibold">{s.name}</div><div className="truncate text-xs text-muted-foreground">{s.email}</div></div>
                  <div className="hidden text-xs text-muted-foreground sm:block">{[s.major, s.studentId].filter(Boolean).join(" · ")}</div>
                </div>
              ))}
            </div>
          ) : <Empty icon={<Users className="h-5 w-5" />} title="No students enrolled" body={course.code ? `Share invite code ${course.code} or add students by email.` : "Students will appear here once they join."} />}
        </TabsContent>

        <TabsContent value="groups">
          {groups.length ? (
            <div className="grid gap-4 md:grid-cols-2">
              {groups.map((g) => (
                <Link key={g.id} href={`/projects/${g.id}`} className="border border-border bg-card p-5 hover:border-foreground" data-testid={`card-group-${g.id}`}>
                  <div className="flex items-center justify-between"><span className="font-display font-bold">{g.title}</span><span className="font-mono-num text-xs text-muted-foreground">{progressOf(ws, g)}%</span></div>
                  <div className="mt-1 text-xs text-muted-foreground">{ws.assignments.find((a) => a.id === g.assignmentId)?.title}</div>
                  <Bar value={progressOf(ws, g)} className="mt-3" />
                  <div className="mt-3 flex -space-x-2">{(g.memberNames ?? []).map((n) => <Initials key={n} name={n} className="h-7 w-7 text-[10px]" />)}</div>
                </Link>
              ))}
            </div>
          ) : <Empty icon={<FolderKanban className="h-5 w-5" />} title="No groups formed" body="Groups appear here as they're created for this course's assignments." />}
        </TabsContent>
      </Tabs>
    </>
  );
}
