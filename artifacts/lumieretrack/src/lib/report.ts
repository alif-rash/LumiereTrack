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
@import url("https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,500;9..144,600&family=IBM+Plex+Sans:wght@400;600&family=IBM+Plex+Mono:wght@400;500&display=swap");
body{font-family:"IBM Plex Sans",system-ui,sans-serif;color:#1A2420;background:#FAF7F0;margin:40px;font-size:12px;line-height:1.5}
h1{font-family:Fraunces,Georgia,serif;font-weight:500;font-size:30px;letter-spacing:-.015em;margin:6px 0 0}
h2{font-family:"IBM Plex Mono",monospace;font-weight:500;font-size:10.5px;text-transform:uppercase;letter-spacing:.14em;margin:30px 0 8px;border-bottom:1px solid #1A2420;padding-bottom:6px}
.meta{color:#5A645F;margin-top:3px}table{width:100%;border-collapse:collapse}th,td{text-align:left;padding:7px 8px 7px 0;border-bottom:1px solid #D9D3C4;vertical-align:top}
th{font-family:"IBM Plex Mono",monospace;font-weight:400;font-size:9.5px;text-transform:uppercase;letter-spacing:.1em;color:#5A645F}
td:nth-child(n+2){font-variant-numeric:tabular-nums}
.tag{display:inline-block;padding:0 6px;border:1px solid #1B5448;color:#1B5448;font-family:"IBM Plex Mono",monospace;font-size:10px}
.mast{display:flex;justify-content:space-between;border-bottom:2px solid #1A2420;padding-bottom:14px}
.brand{font-family:Fraunces,Georgia,serif;font-size:15px}
.foot{margin-top:36px;border-top:1px solid #D9D3C4;padding-top:8px;color:#5A645F;font-size:10.5px}@media print{body{margin:16mm;background:#fff}}
</style></head><body>
<div class="mast"><div><div class="brand">LumiereTrack</div><h1>${esc(g.title)}</h1></div><div class="meta" style="text-align:right;font-family:'IBM Plex Mono',monospace;font-size:10px;text-transform:uppercase;letter-spacing:.12em">Contribution report</div></div>
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
