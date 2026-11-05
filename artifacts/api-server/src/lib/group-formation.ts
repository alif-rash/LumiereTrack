import { randomBytes } from "node:crypto";
import { activity, courseAccess, fail, groupAccess, uid, type Query, type Row } from "./lumiere";

// A date-only deadline includes the whole calendar day; timestamps keep their exact instant.
export function deadlineTime(value?: string): number {
  if (!value) return Infinity;
  return Date.parse(/^\d{4}-\d{2}-\d{2}$/.test(value) ? `${value}T23:59:59.999Z` : value);
}
export function formationRules(data: Row, now = Date.now()) {
  const end = data.groupFormationDeadline || data.dueDate || "";
  const start = data.startDate ? Date.parse(data.startDate) : -Infinity;
  const open = data.formationStatus !== "closed" && start <= now && now <= deadlineTime(end);
  return {
    formationStatus: data.formationStatus || "open",
    groupFormationDeadline: end,
    groupFormationOpen: open,
    allowJoin: data.allowJoin ?? !!data.selfGroups,
    allowMemberManagement: data.allowMemberManagement ?? true,
    selfGroups: !!data.selfGroups,
    minGroupSize: Number(data.minGroupSize || 1),
    groupSize: Number(data.groupSize || 4),
  };
}
export function validateFormation(data: Row) {
  const rules = formationRules(data);
  if (rules.minGroupSize > rules.groupSize) fail("Minimum group size cannot exceed the maximum.");
  if (data.groupFormationDeadline && !Number.isFinite(deadlineTime(data.groupFormationDeadline))) fail("Enter a valid group-formation deadline.");
  if (deadlineTime(data.groupFormationDeadline) > deadlineTime(data.dueDate) && data.groupFormationDeadline)
    fail("Group formation must close on or before the submission deadline.");
  if (data.startDate && Date.parse(data.startDate) > deadlineTime(data.groupFormationDeadline || data.dueDate))
    fail("Group formation must close after the assignment opens.");
}
function ensureOpen(data: Row) {
  const rules=formationRules(data);
  if (!rules.groupFormationOpen) fail("Group formation is closed or has not opened yet.",409);
  return rules;
}
export const invitationCode = () => randomBytes(6).toString("hex").toUpperCase();
function expiration(data: Row) {
  return new Date(Math.min(Date.now()+7*86400000,deadlineTime(data.groupFormationDeadline||data.dueDate)));
}
export async function invitationPreview(q: Query, code: string, user: Row) {
  if(user.role!=="student") fail("Only students can join project groups.",403);
  const g=(await q(`SELECT g.*,a.course_id,a.data AS assignment_data,a.title AS assignment_title,
    c.title AS course_name,c.data AS course_data,
    (SELECT count(*)::int FROM lt_group_members WHERE group_id=g.id) AS member_count
    FROM lt_groups g JOIN lt_assignments a ON a.id=g.assignment_id JOIN lt_courses c ON c.id=a.course_id
    WHERE g.code=$1`,[code.trim().toUpperCase()])).rows[0];
  if(!g) fail("This invitation code is invalid. Check it with your group leader.",404);
  await courseAccess(q,g.course_id,user);
  if(!g.invite_active) fail("This invitation code is no longer active. Ask the leader for a new code.",409);
  if(g.invite_expires_at && new Date(g.invite_expires_at).getTime()<Date.now()) fail("This invitation code has expired. Ask the leader to regenerate it.",409);
  const rules=ensureOpen(g.assignment_data);
  if(!rules.allowJoin) fail("Your professor has disabled joining with invitation codes.",403);
  const existing=(await q("SELECT group_id FROM lt_group_members WHERE assignment_id=$1 AND user_id=$2",[g.assignment_id,user.id])).rows[0];
  if(existing) fail(existing.group_id===g.id?"You have already used a code to join this group.":"You already belong to another group for this assignment.",409);
  if(g.member_count>=rules.groupSize) fail("This group is full. Ask your professor about another group.",409);
  return {id:g.id,title:g.title,assignmentId:g.assignment_id,assignmentTitle:g.assignment_title,
    courseName:g.course_name,courseCode:g.course_data.courseCode||"",memberCount:g.member_count,
    groupSize:rules.groupSize,remainingSlots:rules.groupSize-g.member_count,
    ...(g.invite_expires_at && {inviteExpiresAt:new Date(g.invite_expires_at).toISOString()})};
}
async function validateMember(q: Query, assignment: Row, userId: string) {
  const member=(await q(`SELECT u.role FROM lt_course_members cm JOIN lt_users u ON u.id=cm.user_id
    WHERE cm.course_id=$1 AND cm.user_id=$2 AND NOT cm.instructor`,[assignment.course_id,userId])).rows[0];
  if(member?.role!=="student") fail("All group members must be students enrolled in this course.");
  if((await q("SELECT 1 FROM lt_group_members WHERE assignment_id=$1 AND user_id=$2",[assignment.id,userId])).rows[0])
    fail("This student already belongs to a group for this assignment.",409);
}
export async function groupAction(q: Query, user: Row, d: Row): Promise<string> {
  if(d.action==="createGroup") {
    const a=(await q("SELECT * FROM lt_assignments WHERE id=$1 FOR UPDATE",[d.assignmentId])).rows[0];
    if(!a) fail("Select an available assignment.",404);
    const access=await courseAccess(q,a.course_id,user);
    const rules=formationRules(a.data);
    if(!access.instructor) {
      if(user.role!=="student") fail("Only enrolled students can create their own group.",403);
      ensureOpen(a.data);
      if(!rules.selfGroups) fail("Your professor creates the groups for this assignment.",403);
    }
    const members=[...new Set<string>([...(d.memberIds||[]),...(access.instructor?[]:[user.id])])];
    if(!access.instructor && members.some(id=>id!==user.id)) fail("Other students must confirm joining with a code.",403);
    if(members.length>rules.groupSize) fail("The maximum group size has been reached.",409);
    for(const id of members) await validateMember(q,a,id);
    const title=typeof d.title==="string"?d.title.trim():"";
    if(!title) fail("Group name is required.");
    const id=uid(), leader=access.instructor?(members[0]||null):user.id;
    await q(`INSERT INTO lt_groups(id,assignment_id,title,code,leader_id,invite_active,invite_expires_at)
      VALUES($1,$2,$3,$4,$5,$6,$7)`,[id,a.id,title,invitationCode(),leader,rules.allowJoin,expiration(a.data)]);
    for(const member of members) await q("INSERT INTO lt_group_members(group_id,user_id,assignment_id) VALUES($1,$2,$3)",[id,member,a.id]);
    await activity(q,id,user,"Created the group");
    return id;
  }
  if(d.action==="joinGroup") {
    // Assignment lock serializes joins across all groups for the assignment,
    // not just within a single group. The unique index is the final safety net.
    const code=typeof d.code==="string"?d.code.trim().toUpperCase():"";
    const target=(await q("SELECT assignment_id FROM lt_groups WHERE code=$1",[code])).rows[0];
    if(!target) fail("This invitation code is invalid.",404);
    await q("SELECT id FROM lt_assignments WHERE id=$1 FOR UPDATE",[target.assignment_id]);
    const preview=await invitationPreview(q,code,user);
    if(d.assignmentId && preview.assignmentId!==d.assignmentId) fail("This code belongs to a different assignment.");
    await q("INSERT INTO lt_group_members(group_id,user_id,assignment_id) VALUES($1,$2,$3)",[preview.id,user.id,preview.assignmentId]);
    await activity(q,preview.id,user,"Joined the group");
    return preview.id;
  }
  const initial=await groupAccess(q,d.groupId,user);
  await q("SELECT id FROM lt_assignments WHERE id=$1 FOR UPDATE",[initial.assignment_id]);
  const g=await groupAccess(q,d.groupId,user);
  if(!g.instructor && g.leader_id!==user.id) fail("Only the group leader or an authorized professor can manage this group.",403);
  const rules=formationRules(g.assignment_data);
  if(d.action==="revokeGroupCode") {
    await q("UPDATE lt_groups SET invite_active=false WHERE id=$1",[g.id]);
    await activity(q,g.id,user,"Deactivated the group invitation"); return g.id;
  }
  if(d.action==="regenerateGroupCode") {
    ensureOpen(g.assignment_data);
    if(!rules.allowJoin) fail("Your professor has disabled joining by invitation.",403);
    await q("UPDATE lt_groups SET code=$2,invite_active=true,invite_expires_at=$3 WHERE id=$1",[g.id,invitationCode(),expiration(g.assignment_data)]);
    await activity(q,g.id,user,"Generated a new group invitation");return g.id;
  }
  if(!g.instructor) {
    ensureOpen(g.assignment_data);
    if(!rules.allowMemberManagement) fail("Your professor has disabled leader membership changes.",403);
  }
  if(d.action==="addGroupMember") {
    if(!g.instructor) fail("Only professors can assign members directly. Share your invitation code instead.",403);
    const a=(await q("SELECT * FROM lt_assignments WHERE id=$1",[g.assignment_id])).rows[0]!;
    await validateMember(q,a,d.userId);
    const count=(await q("SELECT count(*)::int AS n FROM lt_group_members WHERE group_id=$1",[g.id])).rows[0]!.n;
    if(count>=rules.groupSize) fail("This group is full.",409);
    await q("INSERT INTO lt_group_members(group_id,user_id,assignment_id) VALUES($1,$2,$3)",[g.id,d.userId,a.id]);
    if(!g.leader_id) await q("UPDATE lt_groups SET leader_id=$2 WHERE id=$1",[g.id,d.userId]);
    await activity(q,g.id,user,"Assigned a member to the group");return g.id;
  }
  if(d.action==="removeGroupMember") {
    if(!d.userId || d.userId===g.leader_id) fail("The group leader cannot be removed.");
    if(!(await q("SELECT 1 FROM lt_group_members WHERE group_id=$1 AND user_id=$2",[g.id,d.userId])).rows[0]) fail("This student is not a member.",404);
    const work=(await q(`SELECT 1 FROM lt_tasks WHERE group_id=$1 AND (assignee_id=$2 OR creator_id=$2)
      UNION ALL SELECT 1 FROM lt_submissions WHERE group_id=$1 AND user_id=$2
      UNION ALL SELECT 1 FROM lt_grades WHERE group_id=$1 AND (student_id=$2 OR scope='group') LIMIT 1`,[g.id,d.userId])).rows[0];
    if(work) fail("This member has academic records in this group. Membership cannot be removed without losing access to their work.",409);
    await q("DELETE FROM lt_group_members WHERE group_id=$1 AND user_id=$2",[g.id,d.userId]);
    await activity(q,g.id,user,"Removed a member from the group");return g.id;
  }
  fail("Unknown group action.");
}
