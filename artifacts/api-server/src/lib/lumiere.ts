import { pool } from "@workspace/db";
import { clerkClient, getAuth } from "@clerk/express";
import type { Request } from "express";
import { randomUUID } from "node:crypto";
import { formationRules } from "./group-formation";

export const uid = () => randomUUID();
export type Row = { [key: string]: any };
export type Query = (sql: string, values?: any[]) => Promise<{ rows: Row[] }>;
export const query: Query = (sql, values) => pool.query(sql, values);
export function fail(message: string, status = 400): never {
  throw Object.assign(new Error(message), { status });
}
export async function resolveClerkAccount(q: Query, identity: {
  id: string; email: string; name: string; emailVerified: boolean;
}): Promise<Row> {
  const existing=(await q("SELECT * FROM lt_users WHERE id=$1",[identity.id])).rows[0];
  if(existing) return existing;
  // A verified primary email proves ownership when Clerk gives the same person
  // a different identity (for example, development versus published sign-in).
  // Keep the application's original ID so all academic foreign keys remain intact.
  if(!identity.emailVerified) fail("Please verify your email address before opening your workspace.",403);
  const email=identity.email.trim().toLowerCase();
  if(!email) fail("An email address is required.");
  const owners=(await q("SELECT * FROM lt_users WHERE lower(email)=$1",[email])).rows;
  if(owners.length===1) return owners[0]!;
  if(owners.length>1) fail("This email matches more than one account. Account ownership must be resolved before continuing.",409);
  const inserted=(await q(`INSERT INTO lt_users(id,name,email) VALUES($1,$2,$3)
    ON CONFLICT DO NOTHING RETURNING *`,[identity.id,identity.name,email])).rows[0];
  if(inserted) return inserted;
  // Handles concurrent first requests as well as an existing email. Never
  // overwrite the established profile, role, ID, or academic ownership.
  const matches=(await q("SELECT * FROM lt_users WHERE id=$1 OR lower(email)=$2",[identity.id,email])).rows;
  const own=matches.find(u=>u.id===identity.id);
  if(own) return own;
  if(matches.length===1) return matches[0]!;
  fail("This email matches more than one account. Account ownership must be resolved before continuing.",409);
}
export async function currentUser(req: Request): Promise<Row> {
  const id = getAuth(req).userId;
  if (!id) fail("Please sign in to continue.", 401);
  let user = (await query("SELECT * FROM lt_users WHERE id=$1", [id])).rows[0];
  if (!user) {
    const clerk = await clerkClient.users.getUser(id);
    const primary=clerk.emailAddresses.find(e => e.id === clerk.primaryEmailAddressId);
    if (!primary?.emailAddress) fail("An email address is required.", 400);
    user=await resolveClerkAccount(query,{id,email:primary.emailAddress,
      name:clerk.fullName||primary.emailAddress.split("@")[0],
      emailVerified:primary.verification?.status==="verified"});
  }
  return user!;
}
export function profile(u: Row, own = false) {
  return { id: u.id, name: u.name, email: u.email, role: u.role,
    university: u.profile.university || "", major: u.profile.major || "",
    semester: u.profile.semester || "", department: u.profile.department || "",
    studentId: own ? u.profile.studentId || "" : "", avatar: u.profile.avatar || "" };
}
export async function courseAccess(q: Query, courseId: string, user: Row, professor = false) {
  const row = (await q(`SELECT c.*,m.instructor FROM lt_courses c JOIN lt_course_members m ON m.course_id=c.id
    WHERE c.id=$1 AND m.user_id=$2`, [courseId, user.id])).rows[0];
  if (!row || (professor && !row.instructor)) fail("You do not have access to this course.", 403);
  return row;
}
export async function groupAccess(q: Query, groupId: string, user: Row, professor = false) {
  const row = (await q(`SELECT g.*,a.course_id,a.data AS assignment_data,a.title AS assignment_title,
    EXISTS(SELECT 1 FROM lt_course_members cm WHERE cm.course_id=a.course_id AND cm.user_id=$2 AND cm.instructor) AS instructor,
    EXISTS(SELECT 1 FROM lt_group_members gm WHERE gm.group_id=g.id AND gm.user_id=$2) AS member
    FROM lt_groups g JOIN lt_assignments a ON a.id=g.assignment_id WHERE g.id=$1`, [groupId, user.id])).rows[0];
  if (!row || !(row.instructor || (!professor && row.member))) fail("You do not have access to this group.", 403);
  return row;
}
export async function activity(q: Query, groupId: string, user: Row, title: string, data: Row = {}) {
  await q("INSERT INTO lt_activity(id,group_id,user_id,title,data) VALUES($1,$2,$3,$4,$5)", [uid(), groupId, user.id, title, data]);
  const recipients = (await q(`SELECT user_id FROM lt_group_members WHERE group_id=$1
    UNION SELECT cm.user_id FROM lt_course_members cm JOIN lt_assignments a ON cm.course_id=a.course_id
    JOIN lt_groups g ON g.assignment_id=a.id WHERE g.id=$1 AND cm.instructor`, [groupId])).rows;
  for (const r of recipients) if (r.user_id !== user.id)
    await q("INSERT INTO lt_notifications(id,user_id,title,data) VALUES($1,$2,$3,$4)",
      [uid(), r.user_id, `${user.name}: ${title}`, { groupId, ...data }]);
}
const record = (r: Row): Row & {id:string;title:string;createdAt:string} => ({
  ...r.data, id:r.id, title:r.title || r.data?.title || "", createdAt:new Date(r.created_at).toISOString(),
  ...(r.course_id && {courseId:r.course_id}), ...(r.assignment_id && {assignmentId:r.assignment_id}),
  ...(r.group_id && {groupId:r.group_id}), ...(r.task_id && {taskId:r.task_id}),
  ...(r.submission_id && {submissionId:r.submission_id}), ...(r.user_id && {userId:r.user_id}),
  ...(r.assignee_id && {assigneeId:r.assignee_id}), ...(r.creator_id && {createdBy:r.creator_id}),
  ...(r.status && {status:r.status}), ...(r.code && {code:r.code}),
  ...(r.version && {version:r.version}), ...(r.scope && {scope:r.scope}),
  ...(r.marks != null && {marks:Number(r.marks)}), ...(r.read != null && {read:r.read})
});
export async function workspace(user: Row) {
  const courses = (await query(`SELECT c.*,u.name AS professor_name,
    ARRAY(SELECT user_id FROM lt_course_members WHERE course_id=c.id AND NOT instructor) AS member_ids,
    ARRAY(SELECT user_id FROM lt_course_members WHERE course_id=c.id AND instructor) AS instructor_ids
    FROM lt_courses c JOIN lt_users u ON u.id=c.owner_id
    JOIN lt_course_members m ON m.course_id=c.id WHERE m.user_id=$1 ORDER BY c.created_at DESC`, [user.id])).rows;
  const cids = courses.map(c=>c.id);
  const assignments = (await query("SELECT * FROM lt_assignments WHERE course_id=ANY($1::text[]) ORDER BY created_at DESC", [cids])).rows;
  const groups = (await query(`SELECT g.*,a.course_id,
    ARRAY(SELECT user_id FROM lt_group_members WHERE group_id=g.id) AS member_ids
    FROM lt_groups g JOIN lt_assignments a ON a.id=g.assignment_id WHERE a.course_id=ANY($1::text[])
    AND (EXISTS(SELECT 1 FROM lt_course_members WHERE course_id=a.course_id AND user_id=$2 AND instructor)
    OR EXISTS(SELECT 1 FROM lt_group_members WHERE group_id=g.id AND user_id=$2)) ORDER BY g.created_at DESC`, [cids,user.id])).rows;
  const gids=groups.map(g=>g.id);
  const tasks=(await query("SELECT * FROM lt_tasks WHERE group_id=ANY($1::text[]) ORDER BY created_at DESC",[gids])).rows;
  const submissions=(await query("SELECT * FROM lt_submissions WHERE group_id=ANY($1::text[]) ORDER BY created_at DESC",[gids])).rows;
  const reviews=(await query(`SELECT r.*,s.group_id FROM lt_reviews r JOIN lt_submissions s ON s.id=r.submission_id
    WHERE s.group_id=ANY($1::text[]) ORDER BY r.created_at DESC`,[gids])).rows;
  const grades=(await query(`SELECT gr.* FROM lt_grades gr JOIN lt_groups g ON g.id=gr.group_id JOIN lt_assignments a ON a.id=g.assignment_id
    WHERE gr.group_id=ANY($1::text[]) AND (gr.scope='group' OR gr.student_id=$2
    OR EXISTS(SELECT 1 FROM lt_course_members WHERE course_id=a.course_id AND user_id=$2 AND instructor))
    ORDER BY gr.created_at DESC`,[gids,user.id])).rows;
  const people=(await query(`SELECT DISTINCT u.* FROM lt_users u JOIN lt_course_members m ON m.user_id=u.id
    WHERE m.course_id=ANY($1::text[]) OR u.id=$2`,[cids,user.id])).rows;
  if(!people.some(p=>p.id===user.id)) people.push(user);
  const logs=(await query(`SELECT a.*,u.name AS user_name FROM lt_activity a JOIN lt_users u ON u.id=a.user_id
    WHERE a.group_id=ANY($1::text[]) ORDER BY a.created_at DESC LIMIT 300`,[gids])).rows;
  // Deterministic reminder IDs make repeated polling idempotent.
  for (const g of groups) {
    const a=assignments.find(a=>a.id===g.assignment_id);
    if(!a?.data.dueDate) continue;
    const remaining=Date.parse(a.data.dueDate)-Date.now();
    const ts=tasks.filter(t=>t.group_id===g.id);
    if(remaining<=3*86400000 && remaining>-30*86400000 && !(ts.length && ts.every(t=>t.status==='Approved'))) {
      const key=`deadline:${user.id}:${g.id}:${a.data.dueDate}:${remaining<0?'overdue':'soon'}`;
      await query(`INSERT INTO lt_notifications(id,user_id,title,data) VALUES($1,$2,$3,$4) ON CONFLICT(id) DO NOTHING`,
        [key,user.id,`${g.title}: ${remaining<0?'project deadline has passed':'project deadline is approaching'}`,{groupId:g.id}]);
    }
  }
  const notifications=(await query("SELECT * FROM lt_notifications WHERE user_id=$1 ORDER BY created_at DESC LIMIT 200",[user.id])).rows;
  const ownTasks=user.role==='professor'?tasks:tasks.filter(t=>t.assignee_id===user.id);
  const decoratedAssignments=assignments.map(a=>{
    const course=courses.find(c=>c.id===a.course_id)!;
    const rules=formationRules(a.data);
    const formed=groups.some(g=>g.assignment_id===a.id && g.member_ids.includes(user.id));
    return {...record(a),...rules,courseName:course.title,courseCode:course.data.courseCode||"",professorName:course.professor_name,
      canCreateGroup:user.role==='student' && !formed && rules.groupFormationOpen && rules.selfGroups,
      canJoinGroup:user.role==='student' && !formed && rules.groupFormationOpen && rules.allowJoin};
  });
  return {
    profile:profile(user,true),people:people.map(p=>profile(p)),
    courses:courses.map(c=>({...record(c),courseCode:c.data.courseCode||"",professorName:c.professor_name,memberIds:c.member_ids,instructorIds:c.instructor_ids})),
    assignments:decoratedAssignments,
    openAssignments:decoratedAssignments.filter(a=>a.canCreateGroup||a.canJoinGroup),
    groups:groups.map(g=>{
      const ts=tasks.filter(t=>t.group_id===g.id), a=assignments.find(a=>a.id===g.assignment_id)!;
      const rules=formationRules(a.data);
      return {...record(g),...rules,leaderId:g.leader_id||"",leaderName:people.find(p=>p.id===g.leader_id)?.name||"",
        memberCount:g.member_ids.length,remainingSlots:Math.max(0,rules.groupSize-g.member_ids.length),
        inviteActive:g.invite_active,inviteExpiresAt:g.invite_expires_at?new Date(g.invite_expires_at).toISOString():"",
        description:a.data.description||"",dueDate:a.data.dueDate,courseName:courses.find(c=>c.id===a.course_id)?.title,
        professorName:courses.find(c=>c.id===a.course_id)?.professor_name,memberIds:g.member_ids,memberNames:g.member_ids.map((id:string)=>people.find(p=>p.id===id)?.name||"Member"),
        progress:ts.length?Math.round(ts.filter(t=>t.status==='Approved').length/ts.length*100):0,status:ts.length&&ts.every(t=>t.status==='Approved')?'Completed':'In Progress'};
    }),
    tasks:tasks.map(t=>({...record(t),courseId:groups.find(g=>g.id===t.group_id)?.course_id})),
    submissions:submissions.map(s=>({...record(s),title:s.task_id?tasks.find(t=>t.id===s.task_id)?.title||"Contribution":"Group submission",userName:people.find(p=>p.id===s.user_id)?.name})),
    reviews:reviews.map(r=>({...record(r),title:"Professor review",userName:people.find(p=>p.id===r.user_id)?.name})),
    grades:grades.map(g=>({...record(g),userId:g.student_id||"",title:g.scope==='group'?"Group grade":"Individual grade",userName:people.find(p=>p.id===g.student_id)?.name||"Group"})),
    activity:logs.map(l=>({...record(l),userName:l.user_name})),notifications:notifications.map(record),
    counts:{courses:courses.length,projects:groups.length,tasks:ownTasks.length,completed:ownTasks.filter(t=>t.status==='Approved').length,
      pending:ownTasks.filter(t=>['To Do','In Progress','Changes Requested'].includes(t.status)).length,
      review:submissions.filter(s=>['Submitted','Under Review'].includes(s.status)).length}
  };
}
