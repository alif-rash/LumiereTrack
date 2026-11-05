import { test } from "node:test";
import assert from "node:assert/strict";
import { pool } from "@workspace/db";
import { perform } from "./actions";
import { query, workspace, type Row } from "./lumiere";
import { deadlineTime, formationRules, invitationPreview } from "./group-formation";
import { randomUUID } from "node:crypto";

test("date-only group deadline includes the whole final day",()=>{
  assert.equal(deadlineTime("2030-01-01"),Date.parse("2030-01-01T23:59:59.999Z"));
  assert.equal(formationRules({selfGroups:true,dueDate:"2030-01-01"},Date.parse("2030-01-01T15:00:00Z")).groupFormationOpen,true);
  assert.equal(formationRules({selfGroups:true,dueDate:"2030-01-01"},Date.parse("2030-01-02T00:00:00Z")).groupFormationOpen,false);
  assert.equal(formationRules({selfGroups:true,formationStatus:"closed",dueDate:"2030-01-01"},0).groupFormationOpen,false);
});

test("group lifecycle, concurrency, eligibility, permissions and academic privacy",async()=>{
  const prefix=`group-regression-${randomUUID()}`;
  const users:Row[]=[];
  let courseId="",assignmentId="",groupId="";
  try {
    for(const [i,role] of ["professor","student","student","student","student","professor"].entries()) {
      const id=`${prefix}-${i}`;
      const user=(await query("INSERT INTO lt_users(id,name,email,role) VALUES($1,$2,$3,$4) RETURNING *",[id,`Test ${i}`,`${id}@example.test`,role])).rows[0]!;
      users.push(user);
    }
    const [prof,s1,s2,s3,outsider,otherProf]=users as [Row,Row,Row,Row,Row,Row];
    courseId=(await perform(prof,{action:"createCourse",title:prefix,courseCode:"REG-101"})).id;
    const code=(await query("SELECT code FROM lt_courses WHERE id=$1",[courseId])).rows[0]!.code;
    for(const s of [s1,s2,s3]) await perform(s,{action:"joinCourse",code});
    assignmentId=(await perform(prof,{action:"createAssignment",courseId,title:"Regression assignment",dueDate:"2030-12-31",
      groupFormationDeadline:"2030-11-30",selfGroups:true,allowJoin:true,groupSize:2,minGroupSize:2})).id;
    assert.ok((await workspace(s1)).openAssignments.some(a=>a.id===assignmentId),"eligible assignment discoverable");
    groupId=(await perform(s1,{action:"createGroup",assignmentId,title:"Regression team"})).id;
    const g1=(await workspace(s1)).groups.find(g=>g.id===groupId)!;
    assert.equal(g1.leaderId,s1.id);
    assert.equal(g1.memberCount,1);
    assert.equal(g1.remainingSlots,1);
    assert.equal((await workspace(s1)).openAssignments.some(a=>a.id===assignmentId),false);
    const initialCode=(await query("SELECT code FROM lt_groups WHERE id=$1",[groupId])).rows[0]!.code;
    await perform(s1,{action:"regenerateGroupCode",groupId});
    const invite=(await query("SELECT code FROM lt_groups WHERE id=$1",[groupId])).rows[0]!.code;
    await assert.rejects(()=>invitationPreview(query,initialCode,s2),/invalid/i);
    const preview=await invitationPreview(query,invite,s2);
    assert.equal(preview.assignmentId,assignmentId);
    assert.equal(preview.title,"Regression team");
    assert.equal(preview.remainingSlots,1);
    await assert.rejects(()=>perform(outsider,{action:"joinGroup",code:invite}),/access/i);
    await assert.rejects(()=>perform(otherProf,{action:"regenerateGroupCode",groupId}),/access/i);
    await assert.rejects(()=>perform(s2,{action:"createGroup",assignmentId,title:"Sneak",memberIds:[s3.id]}),/confirm/i);
    // Two students compete for one remaining slot. Exactly one succeeds.
    const attempts=await Promise.allSettled([s2,s3].map(s=>perform(s,{action:"joinGroup",code:invite})));
    assert.equal(attempts.filter(a=>a.status==="fulfilled").length,1);
    const joined=attempts[0]!.status==="fulfilled"?s2:s3;
    const unjoined=joined===s2?s3:s2;
    await assert.rejects(()=>perform(joined,{action:"joinGroup",code:invite}),/already/i);
    await assert.rejects(()=>perform(unjoined,{action:"joinGroup",code:invite}),/full/i);
    await assert.rejects(()=>perform(joined,{action:"createGroup",assignmentId,title:"Duplicate"}),/already/i);
    for(const actor of [s1,joined,prof]) {
      const group=(await workspace(actor)).groups.find(g=>g.id===groupId)!;
      assert.equal(group.memberCount,2); assert.equal(group.remainingSlots,0);
    }
    await assert.rejects(()=>perform(joined,{action:"regenerateGroupCode",groupId}),/leader/i);
    await perform(s1,{action:"revokeGroupCode",groupId});
    await assert.rejects(()=>invitationPreview(query,invite,unjoined),/no longer active/i);
    await perform(s1,{action:"regenerateGroupCode",groupId});
    let activeCode=(await query("SELECT code FROM lt_groups WHERE id=$1",[groupId])).rows[0]!.code;
    await query("UPDATE lt_groups SET invite_expires_at=now()-interval '1 day' WHERE id=$1",[groupId]);
    await assert.rejects(()=>invitationPreview(query,activeCode,unjoined),/expired/i);
    await perform(s1,{action:"regenerateGroupCode",groupId});
    activeCode=(await query("SELECT code FROM lt_groups WHERE id=$1",[groupId])).rows[0]!.code;
    await perform(prof,{action:"editAssignment",id:assignmentId,formationStatus:"closed"});
    await assert.rejects(()=>perform(unjoined,{action:"createGroup",assignmentId,title:"Closed"}),/closed/i);
    await assert.rejects(()=>perform(unjoined,{action:"joinGroup",code:activeCode}),/closed/i);
    assert.equal((await workspace(unjoined)).openAssignments.some(a=>a.id===assignmentId),false);
    await perform(prof,{action:"editAssignment",id:assignmentId,formationStatus:"open",groupFormationDeadline:"2020-01-01"});
    await assert.rejects(()=>perform(unjoined,{action:"createGroup",assignmentId,title:"Past"}),/closed/i);
    await perform(prof,{action:"editAssignment",id:assignmentId,groupFormationDeadline:"2030-11-30",allowMemberManagement:false});
    await assert.rejects(()=>perform(s1,{action:"removeGroupMember",groupId,userId:joined.id}),/disabled/i);
    await perform(prof,{action:"editAssignment",id:assignmentId,allowMemberManagement:true});
    await perform(s1,{action:"removeGroupMember",groupId,userId:joined.id});
    assert.equal((await workspace(s1)).groups.find(g=>g.id===groupId)!.remainingSlots,1);
    await perform(joined,{action:"joinGroup",code:activeCode});
    await perform(joined,{action:"createTask",groupId,title:"Preserved work",assigneeId:joined.id});
    await assert.rejects(()=>perform(s1,{action:"removeGroupMember",groupId,userId:joined.id}),/academic records/i);
    await perform(prof,{action:"grade",groupId,scope:"individual",userId:s1.id,marks:81,feedback:"Private assessment"});
    assert.equal((await workspace(s1)).grades.length,1);
    assert.equal((await workspace(joined)).grades.length,0);
    assert.equal((await workspace(outsider)).groups.length,0);
    await perform(prof,{action:"editAssignment",id:assignmentId,selfGroups:false,allowJoin:false});
    await assert.rejects(()=>perform(s1,{action:"regenerateGroupCode",groupId}),/disabled/i);
    await assert.rejects(()=>perform(unjoined,{action:"createGroup",assignmentId,title:"Not allowed"}),/professor creates/i);
    const g2=(await perform(prof,{action:"createGroup",assignmentId,title:"Assigned by professor",memberIds:[unjoined.id]})).id;
    assert.ok(g2);
    assert.equal((await workspace(unjoined)).groups.some(g=>g.id===g2),true);
  } finally {
    // Delete only this test's records, in foreign-key order. Existing academic data is untouched.
    const ids=users.map(u=>u.id);
    await query("DELETE FROM lt_notifications WHERE user_id=ANY($1::text[])",[ids]);
    await query("DELETE FROM lt_activity WHERE user_id=ANY($1::text[])",[ids]);
    if(courseId) {
      const groups=(await query("SELECT g.id FROM lt_groups g JOIN lt_assignments a ON a.id=g.assignment_id WHERE a.course_id=$1",[courseId])).rows.map(g=>g.id);
      await query("DELETE FROM lt_grades WHERE group_id=ANY($1::text[])",[groups]);
      await query("DELETE FROM lt_tasks WHERE group_id=ANY($1::text[])",[groups]);
      await query("DELETE FROM lt_group_members WHERE group_id=ANY($1::text[])",[groups]);
      await query("DELETE FROM lt_groups WHERE id=ANY($1::text[])",[groups]);
      await query("DELETE FROM lt_assignments WHERE course_id=$1",[courseId]);
      await query("DELETE FROM lt_course_members WHERE course_id=$1",[courseId]);
      await query("DELETE FROM lt_courses WHERE id=$1",[courseId]);
    }
    await query("DELETE FROM lt_users WHERE id=ANY($1::text[])",[ids]);
    await pool.end();
  }
});
