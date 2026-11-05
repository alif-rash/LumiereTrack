import { useState, type ReactElement, type ReactNode } from "react";
import { Paperclip } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Field } from "@/components/kit";
import { useToast } from "@/hooks/use-toast";
import { useAct, useWs, uploadFile, validUrl, errMsg, isProf, groupCtx, nameOf, type Rec } from "@/lib/ws";

type ModalProps = {
  trigger: ReactElement;
  title: string;
  description?: string;
  submitLabel: string;
  pending?: boolean;
  open: boolean;
  setOpen: (v: boolean) => void;
  onSubmit: () => void;
  children: ReactNode;
};

function Modal({ trigger, title, description, submitLabel, pending, open, setOpen, onSubmit, children }: ModalProps) {
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-display text-xl">{title}</DialogTitle>
          {description && <DialogDescription>{description}</DialogDescription>}
        </DialogHeader>
        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            onSubmit();
          }}
        >
          {children}
          <DialogFooter className="gap-2 pt-2">
            <Button type="button" variant="ghost" onClick={() => setOpen(false)} data-testid="button-cancel">Cancel</Button>
            <Button type="submit" disabled={pending} data-testid="button-confirm">{pending ? "Working…" : submitLabel}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

const day = (s?: string) => (s ? s.slice(0, 10) : "");

function FilePick({ file, setFile }: { file: File | null; setFile: (f: File | null) => void }) {
  return (
    <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-dashed bg-[hsl(var(--soft)/0.5)] px-4 py-3 text-sm hover:bg-accent">
      <Paperclip className="h-4 w-4 text-primary" />
      <span className="truncate">{file ? `${file.name} · ${(file.size / 1024).toFixed(0)} KB` : "Attach a file (max 20 MB)"}</span>
      <input type="file" className="hidden" onChange={(e) => setFile(e.target.files?.[0] ?? null)} data-testid="input-file" />
    </label>
  );
}

export function CourseDialog({ trigger, course }: { trigger: ReactElement; course?: Rec }) {
  const { run, pending } = useAct();
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState(course?.title ?? "");
  const [courseCode, setCode] = useState(course?.courseCode ?? "");
  const [description, setDesc] = useState(course?.description ?? "");
  return (
    <Modal trigger={trigger} open={open} setOpen={setOpen} pending={pending} title={course ? "Edit course" : "Create a course"} description="Students join with the invite code generated for this course." submitLabel={course ? "Save changes" : "Create course"}
      onSubmit={async () => {
        const r = await run(course ? { action: "editCourse", id: course.id, title, courseCode, description } : { action: "createCourse", title, courseCode, description });
        if (r) setOpen(false);
      }}>
      <Field label="Course title"><Input required value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Software Engineering Studio" data-testid="input-course-title" /></Field>
      <Field label="Course code"><Input required value={courseCode} onChange={(e) => setCode(e.target.value)} placeholder="CS 3410" data-testid="input-course-code" /></Field>
      <Field label="Description"><Textarea value={description} onChange={(e) => setDesc(e.target.value)} rows={3} data-testid="input-course-description" /></Field>
    </Modal>
  );
}

export function JoinDialog({ trigger, kind }: { trigger: ReactElement; kind: "course" | "group" }) {
  const { run, pending } = useAct();
  const [open, setOpen] = useState(false);
  const [code, setCode] = useState("");
  return (
    <Modal trigger={trigger} open={open} setOpen={setOpen} pending={pending} title={kind === "course" ? "Join a course" : "Join a project group"} description={kind === "course" ? "Enter the invite code your professor shared." : "Enter the group code a teammate shared with you."} submitLabel="Join"
      onSubmit={async () => {
        const r = await run({ action: kind === "course" ? "joinCourse" : "joinGroup", code: code.trim() });
        if (r) { setOpen(false); setCode(""); }
      }}>
      <Field label="Invite code"><Input required value={code} onChange={(e) => setCode(e.target.value)} className="font-mono-num uppercase tracking-widest" placeholder="XXXXXX" data-testid="input-join-code" /></Field>
    </Modal>
  );
}

export function AddStudentDialog({ trigger, courseId }: { trigger: ReactElement; courseId: string }) {
  const { run, pending } = useAct();
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  return (
    <Modal trigger={trigger} open={open} setOpen={setOpen} pending={pending} title="Add a student" description="The student must already have a LumiereTrack account." submitLabel="Add to course"
      onSubmit={async () => {
        const r = await run({ action: "addStudent", courseId, email: email.trim() });
        if (r) { setOpen(false); setEmail(""); }
      }}>
      <Field label="Student email"><Input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="name@university.edu" data-testid="input-student-email" /></Field>
    </Modal>
  );
}

export function AssignmentDialog({ trigger, courseId, assignment }: { trigger: ReactElement; courseId: string; assignment?: Rec }) {
  const { run, pending } = useAct();
  const [open, setOpen] = useState(false);
  const a = assignment;
  const [f, setF] = useState({
    title: a?.title ?? "", description: a?.description ?? "", instructions: a?.instructions ?? "", deliverables: a?.deliverables ?? "", rubric: a?.rubric ?? "",
    startDate: day(a?.startDate), dueDate: day(a?.dueDate), groupSize: String(a?.groupSize ?? 4), maxMarks: String(a?.maxMarks ?? 100), selfGroups: a?.selfGroups ?? true,
  });
  const set = (k: keyof typeof f) => (e: { target: { value: string } }) => setF({ ...f, [k]: e.target.value });
  return (
    <Modal trigger={trigger} open={open} setOpen={setOpen} pending={pending} title={a ? "Edit assignment" : "New group assignment"} submitLabel={a ? "Save assignment" : "Publish assignment"}
      onSubmit={async () => {
        const body = { ...f, groupSize: Number(f.groupSize), maxMarks: Number(f.maxMarks), courseId };
        const r = await run(a ? { action: "editAssignment", id: a.id, ...body } : { action: "createAssignment", ...body });
        if (r) setOpen(false);
      }}>
      <Field label="Title"><Input required value={f.title} onChange={set("title")} data-testid="input-assignment-title" /></Field>
      <Field label="Summary"><Textarea rows={2} value={f.description} onChange={set("description")} data-testid="input-assignment-description" /></Field>
      <Field label="Instructions"><Textarea rows={3} value={f.instructions} onChange={set("instructions")} data-testid="input-assignment-instructions" /></Field>
      <Field label="Deliverables" hint="One per line works well."><Textarea rows={2} value={f.deliverables} onChange={set("deliverables")} data-testid="input-assignment-deliverables" /></Field>
      <Field label="Rubric"><Textarea rows={3} value={f.rubric} onChange={set("rubric")} data-testid="input-assignment-rubric" /></Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Opens"><Input type="date" value={f.startDate} onChange={set("startDate")} data-testid="input-assignment-start" /></Field>
        <Field label="Due"><Input type="date" required value={f.dueDate} onChange={set("dueDate")} data-testid="input-assignment-due" /></Field>
        <Field label="Max group size"><Input type="number" min={2} max={30} value={f.groupSize} onChange={set("groupSize")} data-testid="input-assignment-size" /></Field>
        <Field label="Max marks"><Input type="number" min={1} value={f.maxMarks} onChange={set("maxMarks")} data-testid="input-assignment-marks" /></Field>
      </div>
      <div className="flex items-center justify-between rounded-xl border bg-[hsl(var(--soft)/0.5)] px-4 py-3">
        <div>
          <div className="text-sm font-semibold">Students form their own groups</div>
          <div className="text-xs text-muted-foreground">Off means only you can create groups.</div>
        </div>
        <Switch checked={f.selfGroups} onCheckedChange={(v) => setF({ ...f, selfGroups: v })} data-testid="switch-self-groups" />
      </div>
    </Modal>
  );
}

export function GroupDialog({ trigger, assignmentId }: { trigger: ReactElement; assignmentId?: string }) {
  const ws = useWs();
  const prof = isProf(ws);
  const { run, pending } = useAct();
  const [open, setOpen] = useState(false);
  const [aid, setAid] = useState(assignmentId ?? "");
  const [title, setTitle] = useState("");
  const [members, setMembers] = useState<string[]>([]);
  const options = ws.assignments.filter((a) => prof || a.selfGroups !== false);
  const course = ws.courses.find((c) => c.id === ws.assignments.find((a) => a.id === aid)?.courseId);
  const students = ws.people.filter((p) => course?.memberIds?.includes(p.id));
  return (
    <Modal trigger={trigger} open={open} setOpen={setOpen} pending={pending} title="Create a project group" description={prof ? "Assign students now or let them join with the group code." : "You'll join this group automatically."} submitLabel="Create group"
      onSubmit={async () => {
        const r = await run({ action: "createGroup", assignmentId: aid, title, ...(prof ? { memberIds: members } : {}) });
        if (r) { setOpen(false); setTitle(""); setMembers([]); }
      }}>
      {!assignmentId && (
        <Field label="Assignment">
          <Select value={aid} onValueChange={setAid}>
            <SelectTrigger data-testid="select-assignment"><SelectValue placeholder={options.length ? "Choose an assignment" : "No open assignments"} /></SelectTrigger>
            <SelectContent>{options.map((a) => <SelectItem key={a.id} value={a.id}>{a.courseCode ? `${a.courseCode} · ` : ""}{a.title}</SelectItem>)}</SelectContent>
          </Select>
        </Field>
      )}
      <Field label="Group name"><Input required value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Team Meridian" data-testid="input-group-title" /></Field>
      {prof && aid && (
        <Field label="Members" hint={students.length ? `${members.length} selected` : "No students enrolled in this course yet."}>
          <div className="max-h-48 space-y-1 overflow-y-auto rounded-xl border p-2">
            {students.map((s) => (
              <label key={s.id} className="flex cursor-pointer items-center gap-3 rounded-lg px-2 py-1.5 text-sm hover:bg-accent">
                <Checkbox checked={members.includes(s.id)} onCheckedChange={(v) => setMembers(v ? [...members, s.id] : members.filter((m) => m !== s.id))} data-testid={`checkbox-member-${s.id}`} />
                <span className="font-medium">{s.name}</span><span className="text-xs text-muted-foreground">{s.email}</span>
              </label>
            ))}
          </div>
        </Field>
      )}
    </Modal>
  );
}

export function TaskDialog({ trigger, groupId, task }: { trigger: ReactElement; groupId: string; task?: Rec }) {
  const ws = useWs();
  const { toast } = useToast();
  const { run, pending } = useAct();
  const [open, setOpen] = useState(false);
  const group = ws.groups.find((g) => g.id === groupId);
  const [f, setF] = useState({
    title: task?.title ?? "", description: task?.description ?? "", assigneeId: task?.assigneeId ?? ws.profile.id,
    priority: (task?.priority as "Low" | "Medium" | "High") ?? "Medium", startDate: day(task?.startDate), dueDate: day(task?.dueDate), link: task?.link ?? "",
  });
  const set = (k: keyof typeof f) => (e: { target: { value: string } }) => setF({ ...f, [k]: e.target.value });
  return (
    <Modal trigger={trigger} open={open} setOpen={setOpen} pending={pending} title={task ? "Edit responsibility" : "Document a responsibility"} description="Name the work, who owns it, and when it lands." submitLabel={task ? "Save task" : "Add task"}
      onSubmit={async () => {
        if (!validUrl(f.link)) return void toast({ title: "Links must start with http:// or https://", variant: "destructive" });
        const body = { ...f, assigneeId: f.assigneeId === "none" ? undefined : f.assigneeId, link: f.link.trim() || undefined };
        const r = await run(task ? { action: "editTask", id: task.id, groupId, ...body } : { action: "createTask", groupId, ...body });
        if (r) setOpen(false);
      }}>
      <Field label="Task"><Input required value={f.title} onChange={set("title")} placeholder="Draft the literature review" data-testid="input-task-title" /></Field>
      <Field label="Details"><Textarea rows={3} value={f.description} onChange={set("description")} data-testid="input-task-description" /></Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Owner">
          <Select value={f.assigneeId || "none"} onValueChange={(v) => setF({ ...f, assigneeId: v })}>
            <SelectTrigger data-testid="select-assignee"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="none">Unassigned</SelectItem>
              {(group?.memberIds ?? []).map((id) => <SelectItem key={id} value={id}>{nameOf(ws, id)}</SelectItem>)}
            </SelectContent>
          </Select>
        </Field>
        <Field label="Priority">
          <Select value={f.priority} onValueChange={(v) => setF({ ...f, priority: v as "Low" | "Medium" | "High" })}>
            <SelectTrigger data-testid="select-priority"><SelectValue /></SelectTrigger>
            <SelectContent>{["Low", "Medium", "High"].map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent>
          </Select>
        </Field>
        <Field label="Start"><Input type="date" value={f.startDate} onChange={set("startDate")} data-testid="input-task-start" /></Field>
        <Field label="Due"><Input type="date" value={f.dueDate} onChange={set("dueDate")} data-testid="input-task-due" /></Field>
      </div>
      <Field label="Reference link (optional)"><Input value={f.link} onChange={set("link")} placeholder="https://" data-testid="input-task-link" /></Field>
    </Modal>
  );
}

export function SubmitDialog({ trigger, groupId, task }: { trigger: ReactElement; groupId: string; task?: Rec }) {
  const { toast } = useToast();
  const { run, pending } = useAct();
  const [open, setOpen] = useState(false);
  const [description, setDesc] = useState("");
  const [link, setLink] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  return (
    <Modal trigger={trigger} open={open} setOpen={setOpen} pending={pending || uploading} title={task ? `Submit evidence: ${task.title}` : "Submit group deliverable"} description="Every submission is kept as a new version — nothing gets overwritten." submitLabel={uploading ? "Uploading…" : "Submit for review"}
      onSubmit={async () => {
        if (!validUrl(link)) return void toast({ title: "Links must start with http:// or https://", variant: "destructive" });
        if (!description.trim()) return void toast({ title: "Describe what you're submitting", variant: "destructive" });
        if (!link.trim() && !file) return void toast({ title: "Add a web link or attach a file as evidence", variant: "destructive" });
        let meta: { objectPath?: string; fileName?: string } = {};
        if (file) {
          setUploading(true);
          try { meta = await uploadFile(file, groupId); } catch (e) { setUploading(false); return void toast({ title: "Upload failed", description: errMsg(e), variant: "destructive" }); }
          setUploading(false);
        }
        const r = await run({ action: "submit", groupId, ...(task ? { taskId: task.id } : {}), description, link: link.trim() || undefined, ...meta });
        if (r) { setOpen(false); setDesc(""); setLink(""); setFile(null); }
      }}>
      <Field label="What are you submitting?"><Textarea rows={4} value={description} onChange={(e) => setDesc(e.target.value)} placeholder="Summarise what changed and what a reviewer should look at." data-testid="input-submission-description" /></Field>
      <Field label="Web link" hint="A link or a file is required."><Input value={link} onChange={(e) => setLink(e.target.value)} placeholder="https://github.com/…" data-testid="input-submission-link" /></Field>
      <FilePick file={file} setFile={setFile} />
    </Modal>
  );
}

export function ReviewDialog({ trigger, submission }: { trigger: ReactElement; submission: Rec }) {
  const { toast } = useToast();
  const { run, pending } = useAct();
  const [open, setOpen] = useState(false);
  const [status, setStatus] = useState(submission.status === "Approved" || submission.status === "Changes Requested" ? submission.status : "Approved");
  const [feedback, setFeedback] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  return (
    <Modal trigger={trigger} open={open} setOpen={setOpen} pending={pending || uploading} title="Review submission" description={`${submission.title} · version ${submission.version ?? 1}`} submitLabel="Send review"
      onSubmit={async () => {
        let meta: { objectPath?: string; fileName?: string } = {};
        if (file && submission.groupId) {
          setUploading(true);
          try { meta = await uploadFile(file, submission.groupId); } catch (e) { setUploading(false); return void toast({ title: "Upload failed", description: errMsg(e), variant: "destructive" }); }
          setUploading(false);
        }
        const r = await run({ action: "review", submissionId: submission.id, status, feedback, ...meta });
        if (r) { setOpen(false); setFeedback(""); setFile(null); }
      }}>
      <Field label="Decision">
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger data-testid="select-review-status"><SelectValue /></SelectTrigger>
          <SelectContent>{["Approved", "Changes Requested", "Under Review"].map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
        </Select>
      </Field>
      <Field label="Feedback"><Textarea rows={5} required={status === "Changes Requested"} value={feedback} onChange={(e) => setFeedback(e.target.value)} placeholder="Point to the evidence: what works, what needs to change." data-testid="input-review-feedback" /></Field>
      <FilePick file={file} setFile={setFile} />
    </Modal>
  );
}

export function GradeDialog({ trigger, groupId: fixed }: { trigger: ReactElement; groupId?: string }) {
  const ws = useWs();
  const { run, pending } = useAct();
  const [open, setOpen] = useState(false);
  const [groupId, setGroupId] = useState(fixed ?? "");
  const [scope, setScope] = useState<"group" | "individual">("group");
  const [userId, setUserId] = useState("");
  const [marks, setMarks] = useState("");
  const [feedback, setFeedback] = useState("");
  const group = ws.groups.find((g) => g.id === groupId);
  const max = groupCtx(ws, group).assignment?.maxMarks;
  return (
    <Modal trigger={trigger} open={open} setOpen={setOpen} pending={pending} title="Award a grade" description="Grades are visible to the students they concern." submitLabel="Award grade"
      onSubmit={async () => {
        const r = await run({ action: "grade", groupId, scope, ...(scope === "individual" ? { userId } : {}), marks: Number(marks), feedback });
        if (r) { setOpen(false); setMarks(""); setFeedback(""); }
      }}>
      {!fixed && (
        <Field label="Project group">
          <Select value={groupId} onValueChange={setGroupId}>
            <SelectTrigger data-testid="select-grade-group"><SelectValue placeholder="Choose a group" /></SelectTrigger>
            <SelectContent>{ws.groups.map((g) => <SelectItem key={g.id} value={g.id}>{g.title}</SelectItem>)}</SelectContent>
          </Select>
        </Field>
      )}
      <div className="grid grid-cols-2 gap-3">
        <Field label="Scope">
          <Select value={scope} onValueChange={(v) => setScope(v as "group" | "individual")}>
            <SelectTrigger data-testid="select-grade-scope"><SelectValue /></SelectTrigger>
            <SelectContent><SelectItem value="group">Whole group</SelectItem><SelectItem value="individual">Individual</SelectItem></SelectContent>
          </Select>
        </Field>
        <Field label={`Marks${max ? ` / ${max}` : ""}`}><Input type="number" min={0} max={max} step="0.5" required value={marks} onChange={(e) => setMarks(e.target.value)} data-testid="input-grade-marks" /></Field>
      </div>
      {scope === "individual" && (
        <Field label="Student">
          <Select value={userId} onValueChange={setUserId}>
            <SelectTrigger data-testid="select-grade-student"><SelectValue placeholder="Choose a member" /></SelectTrigger>
            <SelectContent>{(group?.memberIds ?? []).map((id) => <SelectItem key={id} value={id}>{nameOf(ws, id)}</SelectItem>)}</SelectContent>
          </Select>
        </Field>
      )}
      <Field label="Feedback"><Textarea rows={4} value={feedback} onChange={(e) => setFeedback(e.target.value)} data-testid="input-grade-feedback" /></Field>
    </Modal>
  );
}
