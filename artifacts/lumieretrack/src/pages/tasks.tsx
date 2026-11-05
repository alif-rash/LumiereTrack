import { useMemo, useState } from "react";
import { ListChecks, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PageHeader, Empty, isOverdue } from "@/components/kit";
import { TaskCard } from "@/components/task-bits";
import { useWs, isProf, STATUSES } from "@/lib/ws";

export default function Tasks() {
  const ws = useWs();
  const prof = isProf(ws);
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("all");
  const [priority, setPriority] = useState("all");
  const [group, setGroup] = useState("all");
  const [when, setWhen] = useState("all");
  const base = useMemo(() => (prof ? ws.tasks : ws.tasks.filter((t) => t.assigneeId === ws.profile.id)), [ws, prof]);
  const list = base.filter((t) =>
    (status === "all" || (t.status ?? "To Do") === status) && (priority === "all" || t.priority === priority) && (group === "all" || t.groupId === group) &&
    (when === "all" || (when === "overdue" ? isOverdue(t.dueDate, t.status) : t.status !== "Approved")) &&
    (!q || `${t.title} ${t.description ?? ""}`.toLowerCase().includes(q.toLowerCase())))
    .sort((a, b) => (a.dueDate ?? "9").localeCompare(b.dueDate ?? "9"));
  const sel = (v: string, set: (v: string) => void, ph: string, opts: [string, string][], id: string) => (
    <Select value={v} onValueChange={set}>
      <SelectTrigger className="w-full bg-card sm:w-44" data-testid={`select-filter-${id}`}><SelectValue placeholder={ph} /></SelectTrigger>
      <SelectContent><SelectItem value="all">{ph}</SelectItem>{opts.map(([k, l]) => <SelectItem key={k} value={k}>{l}</SelectItem>)}</SelectContent>
    </Select>
  );
  return (
    <>
      <PageHeader eyebrow="Tasks" title={prof ? "All tasks across your groups" : "My responsibilities"} description={`${list.length} of ${base.length} shown`} />
      <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
        <div className="relative flex-1 sm:min-w-[220px]"><Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" /><Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search tasks" className="bg-card pl-9" data-testid="input-search-tasks" /></div>
        {sel(status, setStatus, "All statuses", STATUSES.map((s) => [s, s]), "status")}
        {sel(priority, setPriority, "All priorities", [["High", "High"], ["Medium", "Medium"], ["Low", "Low"]], "priority")}
        {sel(group, setGroup, "All projects", ws.groups.map((g) => [g.id, g.title]), "project")}
        {sel(when, setWhen, "Any time", [["open", "Open only"], ["overdue", "Overdue"]], "when")}
      </div>
      {list.length ? <div className="border-t border-foreground">
          <div className="eyebrow hidden grid-cols-[minmax(0,2.2fr)_minmax(0,1.2fr)_96px_150px_auto] gap-x-4 border-b border-border px-1 py-2 !text-[9.5px] md:grid"><span>Task</span><span>Project and owner</span><span>Due</span><span>Status</span><span /></div>
          {list.map((t) => <TaskCard key={t.id} task={t} showProject row />)}
        </div>
        : <Empty icon={<ListChecks className="h-5 w-5" />} title={base.length ? "No tasks match these filters" : "No tasks yet"} body={base.length ? "Try clearing a filter." : "Tasks you own in project groups will collect here."} />}
    </>
  );
}
