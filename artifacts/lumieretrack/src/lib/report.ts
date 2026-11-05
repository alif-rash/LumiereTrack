import type { Workspace, Rec } from "@/lib/ws";
import { groupCtx, nameOf } from "@/lib/ws";

const esc = (s: unknown) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);
const d = (s?: string) => (s ? new Date(s).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" }) : "—");

export function buildReport(ws: Workspace, g: Rec) {
  const { assignment, course } = groupCtx(ws, g);
  const tasks = ws.tasks.filter((t) => t.groupId === g.id);
  const subs = ws.submissions.filter((s) => s.groupId === g.id);
  const reviews = ws.reviews.filter((r) => subs.some((s) => s.id === r.submissionId) || r.groupId === g.id);
  const gradeHistory = ws.grades.filter((x) => x.groupId === g.id).sort((a,b)=>b.createdAt.localeCompare(a.createdAt));
  const seen = new Set<string>();
  const grades = gradeHistory.filter(x => {
    const key = x.scope === "individual" ? `individual:${x.userId}` : "group";
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
  const members = g.memberIds ?? [];
  const rows = members.map((id) => {
    const mine = tasks.filter((t) => t.assigneeId === id);
    return `<tr><td>${esc(nameOf(ws, id))}</td><td>${mine.length}</td><td>${mine.filter((t) => t.status === "Approved").length}</td><td>${subs.filter((s) => s.userId === id).length}</td></tr>`;
  }).join("");
  return `<!doctype html><html><head><meta charset="utf-8"><title>${esc(g.title)} — LumiereTrack report</title>
<style>
body{font-family:"Plus Jakarta Sans",system-ui,sans-serif;color:#142B4A;margin:40px;font-size:12.5px;line-height:1.5}
h1{font-size:26px;margin:0}h2{font-size:15px;margin:28px 0 8px;border-bottom:2px solid #EAF2FC;padding-bottom:6px}
.meta{color:#5b6b82;margin-top:4px}table{width:100%;border-collapse:collapse}th,td{text-align:left;padding:6px 8px;border-bottom:1px solid #e3eaf4;vertical-align:top}
th{background:#F7F9FC;font-size:11px;text-transform:uppercase;letter-spacing:.05em}.tag{display:inline-block;padding:1px 8px;border-radius:99px;background:#EAF2FC;color:#3478D4;font-weight:600;font-size:11px}
.foot{margin-top:36px;color:#8593a8;font-size:11px}@media print{body{margin:16mm}}
</style></head><body>
<div style="font-weight:800;letter-spacing:-.02em;color:#3478D4">LumiereTrack</div>
<h1>${esc(g.title)}</h1>
<div class="meta">${esc(course?.courseCode ?? "")} ${esc(course?.title ?? "")} · ${esc(assignment?.title ?? "")} · Due ${d(assignment?.dueDate)}</div>
<div class="meta">Generated ${new Date().toLocaleString()} by ${esc(ws.profile.name)}</div>
<h2>Members & contribution evidence</h2><table><tr><th>Member</th><th>Tasks owned</th><th>Approved</th><th>Submissions</th></tr>${rows || "<tr><td colspan=4>No members</td></tr>"}</table>
<h2>Responsibilities</h2><table><tr><th>Task</th><th>Owner</th><th>Status</th><th>Priority</th><th>Due</th></tr>${tasks.map((t) => `<tr><td>${esc(t.title)}</td><td>${esc(nameOf(ws, t.assigneeId))}</td><td><span class="tag">${esc(t.status)}</span></td><td>${esc(t.priority)}</td><td>${d(t.dueDate)}</td></tr>`).join("") || "<tr><td colspan=5>No tasks recorded</td></tr>"}</table>
<h2>Submissions</h2><table><tr><th>Submission</th><th>By</th><th>Version</th><th>Status</th><th>Date</th></tr>${subs.map((s) => `<tr><td>${esc(s.title)}<br><span class="meta">${esc(s.description)}</span></td><td>${esc(s.userName ?? nameOf(ws, s.userId))}</td><td>v${esc(s.version ?? 1)}</td><td>${esc(s.status)}</td><td>${d(s.createdAt)}</td></tr>`).join("") || "<tr><td colspan=5>No submissions</td></tr>"}</table>
<h2>Review feedback</h2><table><tr><th>Decision</th><th>Reviewer</th><th>Feedback</th><th>Date</th></tr>${reviews.map((r) => `<tr><td>${esc(r.status)}</td><td>${esc(r.userName ?? nameOf(ws,r.userId))}</td><td>${esc(r.feedback)}</td><td>${d(r.createdAt)}</td></tr>`).join("") || "<tr><td colspan=4>No reviews yet</td></tr>"}</table>
<h2>Grades</h2><table><tr><th>Scope</th><th>Student</th><th>Marks</th><th>Feedback</th></tr>${grades.map((x) => `<tr><td>${esc(x.scope)}</td><td>${x.scope === "individual" ? esc(x.userName ?? nameOf(ws, x.userId)) : "Whole group"}</td><td>${esc(x.marks)}${assignment?.maxMarks ? " / " + esc(assignment.maxMarks) : ""}</td><td>${esc(x.feedback)}</td></tr>`).join("") || "<tr><td colspan=4>No grades awarded</td></tr>"}</table>
<div class="foot">This report contains only records visible to the account that generated it.</div>
<script>window.onload=function(){setTimeout(function(){window.print()},350)}</script>
</body></html>`;
}

export function exportReport(ws: Workspace, g: Rec): boolean {
  const w = window.open("", "_blank");
  if (!w) return false;
  w.document.open();
  w.document.write(buildReport(ws, g));
  w.document.close();
  return true;
}
