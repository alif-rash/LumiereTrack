import { Link } from "wouter";
import { CalendarDays, Pencil, Upload } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Pill, fmtDate, isOverdue, Initials, Evidence } from "@/components/kit";
import { TaskDialog, SubmitDialog } from "@/components/forms";
import { useAct, useWs, isProf, nameOf, type Rec } from "@/lib/ws";
import { cn } from "@/lib/utils";

export function StatusControl({ task }: { task: Rec }) {
  const ws = useWs();
  const { run, pending } = useAct();
  const prof = isProf(ws);
  const options = ["To Do", "In Progress"];
  const member = ws.groups.find((g) => g.id === task.groupId)?.memberIds?.includes(ws.profile.id);
  const canChange = !prof && member && ((task.status ?? "To Do") === "To Do" || task.status === "In Progress");
  if (!canChange) return <Pill s={task.status} />;
  return (
    <Select value={task.status ?? "To Do"} disabled={pending} onValueChange={(v) => run({ action: "updateTaskStatus", id: task.id, status: v })}>
      <SelectTrigger className="h-7 w-auto gap-1 border-0 bg-transparent p-0 shadow-none focus:ring-0" data-testid={`select-status-${task.id}`}>
        <SelectValue><Pill s={task.status ?? "To Do"} /></SelectValue>
      </SelectTrigger>
      <SelectContent>{options.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
    </Select>
  );
}

export function TaskCard({ task, showProject }: { task: Rec; showProject?: boolean }) {
  const ws = useWs();
  const group = ws.groups.find((g) => g.id === task.groupId);
  const mine = task.assigneeId === ws.profile.id;
  const member = group?.memberIds?.includes(ws.profile.id);
  const canSubmit = !isProf(ws) && member && ["To Do", "In Progress", "Changes Requested", undefined].includes(task.status);
  const over = isOverdue(task.dueDate, task.status);
  return (
    <div className="group rounded-xl border border-card-border bg-card p-3.5 transition-shadow hover:shadow-[0_6px_20px_-10px_hsl(215_57%_18%/0.25)]" data-testid={`card-task-${task.id}`}>
      <div className="flex items-start justify-between gap-2">
        <div className="text-[13.5px] font-semibold leading-snug">{task.title}</div>
        {task.priority && <span className="pill shrink-0" data-s={task.priority}>{task.priority}</span>}
      </div>
      {task.description && <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{task.description}</p>}
      {showProject && group && <Link href={`/projects/${group.id}`} className="mt-2 block text-[11px] font-medium text-primary hover:underline">{group.title}</Link>}
      {task.link && <div className="mt-2"><Evidence link={task.link} /></div>}
      <div className="mt-3 flex items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2">
          <Initials name={nameOf(ws, task.assigneeId)} className="h-6 w-6 text-[9px]" />
          <span className={cn("flex items-center gap-1 text-[11px]", over ? "font-semibold text-destructive" : "text-muted-foreground")}>
            <CalendarDays className="h-3 w-3" /> {task.dueDate ? fmtDate(task.dueDate, "MMM d") : "No due date"}{over && " · overdue"}
          </span>
        </div>
        <StatusControl task={task} />
      </div>
      {(member || isProf(ws)) && task.groupId && (
        <div className="mt-3 flex gap-1.5 border-t pt-2.5">
          <TaskDialog groupId={task.groupId} task={task} trigger={<button className="flex items-center gap-1 rounded-md px-2 py-1 text-[11px] font-medium text-muted-foreground hover:bg-muted hover:text-foreground" data-testid={`button-edit-task-${task.id}`}><Pencil className="h-3 w-3" /> Edit</button>} />
          {canSubmit && (mine || !task.assigneeId) && (
            <SubmitDialog groupId={task.groupId} task={task} trigger={<button className="flex items-center gap-1 rounded-md px-2 py-1 text-[11px] font-semibold text-primary hover:bg-accent" data-testid={`button-submit-task-${task.id}`}><Upload className="h-3 w-3" /> Submit evidence</button>} />
          )}
        </div>
      )}
    </div>
  );
}
