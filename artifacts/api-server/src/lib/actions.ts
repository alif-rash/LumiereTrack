import { pool } from "@workspace/db";
import { activity, courseAccess, fail, groupAccess, uid, type Row, type Query } from "./lumiere";
import { groupAction, validateFormation } from "./group-formation";

const clean = (s: unknown) => typeof s === "string" ? s.trim() : "";
function required(s: unknown, field: string) { const value=clean(s); if(!value) fail(`${field} is required.`); return value; }
const only = (input: Row, fields: string[]) => Object.fromEntries(fields.filter(f=>input[f]!==undefined).map(f=>[f,input[f]]));
const assignmentFields=['description','instructions','deliverables','rubric','selfGroups','groupSize','maxMarks','dueDate','startDate','formationStatus','groupFormationDeadline','allowJoin','allowMemberManagement','minGroupSize'];
function validDates(d: Row) {
  for(const f of ['dueDate','startDate']) if(d[f] && !Number.isFinite(Date.parse(d[f]))) fail(`Invalid ${f}.`);
  if(d.startDate && d.dueDate && Date.parse(d.startDate)>Date.parse(d.dueDate)) fail("Start date must precede the deadline.");
}
function linkCheck(d: Row) {
  if(d.link) { try { const url=new URL(d.link); if(!['https:','http:'].includes(url.protocol)) fail("Links must use http or https."); } catch { fail("Please enter a valid web link."); } }
}
export async function perform(user: Row, d: Row) {
  const client=await pool.connect();
  const q:Query=(text,values)=>client.query(text,values);
  let id=d.id || uid();
  try {
    await client.query("BEGIN");
    if(d.action==='onboard' || d.action==='updateProfile') {
      const fields=only(d,['university','major','semester','department','studentId','avatar']);
      if(fields.avatar && !/^https?:\/\//.test(fields.avatar)) fail("Profile picture must be a web URL.");
      if(d.action==='onboard') {
        if(user.role!=='unassigned') fail("Your role has already been selected.");
        if(!['student','professor'].includes(d.role)) fail("Choose your role.");
        await q("UPDATE lt_users SET role=$2,name=$3,profile=profile||$4::jsonb WHERE id=$1 AND role='unassigned'",
          [user.id,d.role,required(d.name,'Full name'),JSON.stringify(fields)]);
      } else await q("UPDATE lt_users SET name=$2,profile=profile||$3::jsonb WHERE id=$1",[user.id,required(d.name||user.name,'Full name'),JSON.stringify(fields)]);
    } else {
      if(user.role==='unassigned') fail("Complete your profile first.");
      validDates(d); linkCheck(d);
      switch(d.action) {
        case 'createCourse': {
          if(user.role!=='professor') fail("Only professors can create courses.",403);
          id=uid();
          const code=uid().replace(/-/g,'').slice(0,10).toUpperCase();
          await q("INSERT INTO lt_courses(id,title,code,owner_id,data) VALUES($1,$2,$3,$4,$5)",
            [id,required(d.title,'Course title'),code,user.id,only(d,['courseCode','description'])]);
          await q("INSERT INTO lt_course_members(course_id,user_id,instructor) VALUES($1,$2,true)",[id,user.id]);
          break;
        }
        case 'editCourse': {
          await courseAccess(q,required(d.id,'Course'),user,true);
          await q("UPDATE lt_courses SET title=COALESCE($2,title),data=data||$3::jsonb WHERE id=$1",
            [d.id,d.title?required(d.title,'Title'):null,JSON.stringify(only(d,['courseCode','description']))]);
          break;
        }
        case 'joinCourse': {
          if(user.role!=='student') fail("Only students can enroll.",403);
          const c=(await q("SELECT * FROM lt_courses WHERE code=$1",[required(d.code,'Course code').toUpperCase()])).rows[0];
          if(!c) fail("This course invitation code was not found.",404);
          await q("INSERT INTO lt_course_members(course_id,user_id) VALUES($1,$2) ON CONFLICT DO NOTHING",[c.id,user.id]); id=c.id;
          break;
        }
        case 'addStudent': {
          await courseAccess(q,required(d.courseId,'Course'),user,true);
          const student=(await q("SELECT * FROM lt_users WHERE lower(email)=$1 AND role='student'",[required(d.email,'Student email').toLowerCase()])).rows[0];
          if(!student) fail("The student must register and complete their profile first.");
          await q("INSERT INTO lt_course_members(course_id,user_id) VALUES($1,$2) ON CONFLICT DO NOTHING",[d.courseId,student.id]);
          break;
        }
        case 'createAssignment': {
          await courseAccess(q,required(d.courseId,'Course'),user,true);
          required(d.dueDate,'Submission deadline');
          validateFormation(d);
          id=uid();
          await q("INSERT INTO lt_assignments(id,course_id,title,data) VALUES($1,$2,$3,$4)",
            [id,d.courseId,required(d.title,'Assignment title'),{groupSize:4,maxMarks:100,selfGroups:true,...only(d,assignmentFields)}]); break;
        }
        case 'editAssignment': {
          const a=(await q("SELECT * FROM lt_assignments WHERE id=$1 FOR UPDATE",[required(d.id,'Assignment')])).rows[0];
          if(!a) fail("Assignment not found.",404);
          await courseAccess(q,a.course_id,user,true);
          const merged={...a.data,...only(d,assignmentFields)}; validDates(merged);
          validateFormation(merged);
          const largest=(await q(`SELECT count(*)::int AS n FROM lt_group_members gm JOIN lt_groups g ON g.id=gm.group_id
            WHERE g.assignment_id=$1 GROUP BY gm.group_id ORDER BY n DESC LIMIT 1`,[a.id])).rows[0]?.n||0;
          if(merged.groupSize<largest) fail("Group size cannot be smaller than an existing group.");
          await q("UPDATE lt_assignments SET title=COALESCE($2,title),data=$3 WHERE id=$1",[a.id,d.title||null,merged]); break;
        }
        case 'createGroup':
        case 'joinGroup':
        case 'regenerateGroupCode':
        case 'revokeGroupCode':
        case 'removeGroupMember':
        case 'addGroupMember':
          id=await groupAction(q,user,d);break;
        case 'createTask':
        case 'editTask':
        case 'updateTaskStatus': {
          let t:Row|undefined;
          if(d.action!=='createTask') {
            t=(await q("SELECT * FROM lt_tasks WHERE id=$1 FOR UPDATE",[required(d.id,'Task')])).rows[0];
            if(!t) fail("Task not found.",404);
          }
          const groupId=t?.group_id||required(d.groupId,'Group');
          await groupAccess(q,groupId,user);
          if(d.action==='updateTaskStatus') {
            if(!['To Do','In Progress'].includes(d.status)) fail("Submit work for review to update this status.");
            if(t!.status==='Approved') fail("Approved work cannot be reopened by students.");
            await q("UPDATE lt_tasks SET status=$2 WHERE id=$1",[t!.id,d.status]);
          } else {
            if(t && ['Submitted','Under Review','Approved'].includes(t.status)) fail("Work under review or approved cannot be edited.");
            const assignee=d.assigneeId||t?.assignee_id||user.id;
            if(!(await q("SELECT 1 FROM lt_group_members WHERE group_id=$1 AND user_id=$2",[groupId,assignee])).rows[0]) fail("Assign tasks to a group member.");
            const data=only(d,['description','priority','dueDate','startDate','link','objectPath','fileName']);
            if(d.action==='createTask') {
              id=uid();
              await q("INSERT INTO lt_tasks(id,group_id,assignee_id,creator_id,title,data) VALUES($1,$2,$3,$4,$5,$6)",[id,groupId,assignee,user.id,required(d.title,'Task title'),{priority:'Medium',...data}]);
            } else await q("UPDATE lt_tasks SET title=COALESCE($2,title),assignee_id=$3,data=data||$4::jsonb WHERE id=$1",[t!.id,d.title||null,assignee,JSON.stringify(data)]);
          }
          await activity(q,groupId,user,d.action==='createTask'?`Created task: ${d.title}`:d.action==='editTask'?`Updated task: ${t!.title}`:`Moved ${t!.title} to ${d.status}`,{taskId:id}); break;
        }
        case 'submit': {
          const g=await groupAccess(q,required(d.groupId,'Group'),user);
          if(!g.member || user.role!=='student') fail("Only group members submit work.",403);
          if(d.taskId) {
            const t=(await q("SELECT * FROM lt_tasks WHERE id=$1 FOR UPDATE",[d.taskId])).rows[0];
            if(!t || t.group_id!==g.id || t.assignee_id!==user.id) fail("You can only submit your own assigned tasks.",403);
            if(t.status==='Approved') fail("This task is already approved.");
          } else await q("SELECT id FROM lt_groups WHERE id=$1 FOR UPDATE",[g.id]);
          required(d.description,'Contribution explanation');
          if(!d.link && !d.objectPath) fail("Add a supporting web link or uploaded file.");
          if(d.objectPath && !(await q("SELECT 1 FROM lt_uploads WHERE path=$1 AND user_id=$2 AND group_id=$3",[d.objectPath,user.id,g.id])).rows[0]) fail("Uploaded file does not belong to this submission.",403);
          const v=(await q("SELECT COALESCE(max(version),0)+1 AS n FROM lt_submissions WHERE group_id=$1 AND task_id IS NOT DISTINCT FROM $2 AND user_id=$3",[g.id,d.taskId||null,user.id])).rows[0]!.n;
          id=uid();
          await q("INSERT INTO lt_submissions(id,group_id,task_id,user_id,version,data) VALUES($1,$2,$3,$4,$5,$6)",[id,g.id,d.taskId||null,user.id,v,only(d,['description','link','objectPath','fileName'])]);
          if(d.taskId) await q("UPDATE lt_tasks SET status='Submitted' WHERE id=$1",[d.taskId]);
          await activity(q,g.id,user,`Submitted ${d.taskId?'a contribution':'group project'} (version ${v})`,{submissionId:id,taskId:d.taskId}); break;
        }
        case 'review': {
          const s=(await q("SELECT * FROM lt_submissions WHERE id=$1 FOR UPDATE",[required(d.submissionId,'Submission')])).rows[0];
          if(!s) fail("Submission not found.",404);
          await groupAccess(q,s.group_id,user,true);
          if(!['Approved','Changes Requested','Under Review'].includes(d.status)) fail("Choose a valid review outcome.");
          required(d.feedback,'Written feedback');
          if(d.objectPath && !(await q("SELECT 1 FROM lt_uploads WHERE path=$1 AND user_id=$2 AND group_id=$3",[d.objectPath,user.id,s.group_id])).rows[0]) fail("Feedback file does not belong to this project.",403);
          const latest=(await q("SELECT max(version) AS n FROM lt_submissions WHERE group_id=$1 AND task_id IS NOT DISTINCT FROM $2 AND user_id=$3",[s.group_id,s.task_id,s.user_id])).rows[0]!.n;
          if(s.version!==latest) fail("Review the latest version instead.");
          id=uid();
          await q("INSERT INTO lt_reviews(id,submission_id,user_id,status,data) VALUES($1,$2,$3,$4,$5)",[id,s.id,user.id,d.status,only(d,['feedback','objectPath','fileName'])]);
          await q("UPDATE lt_submissions SET status=$2 WHERE id=$1",[s.id,d.status]);
          if(s.task_id) await q("UPDATE lt_tasks SET status=$2 WHERE id=$1",[s.task_id,d.status]);
          await activity(q,s.group_id,user,`Reviewed submission: ${d.status}`,{submissionId:s.id}); break;
        }
        case 'grade': {
          const g=await groupAccess(q,required(d.groupId,'Group'),user,true);
          if(!['individual','group'].includes(d.scope)) fail("Choose individual or group grading.");
          if(typeof d.marks!=='number'||d.marks<0||d.marks>(g.assignment_data.maxMarks||100)) fail("Marks must be within the assignment maximum.");
          if(d.scope==='individual' && !(await q("SELECT 1 FROM lt_group_members WHERE group_id=$1 AND user_id=$2",[g.id,required(d.userId,'Student')])).rows[0]) fail("Student is not in this group.");
          id=uid();
          await q("INSERT INTO lt_grades(id,group_id,student_id,professor_id,scope,marks,data) VALUES($1,$2,$3,$4,$5,$6,$7)",
            [id,g.id,d.scope==='individual'?d.userId:null,user.id,d.scope,d.marks,{feedback:d.feedback||"",maxMarks:g.assignment_data.maxMarks||100}]);
          // Never put individual marks in the shared timeline or group notifications.
          if(d.scope==='individual') {
            await q("INSERT INTO lt_notifications(id,user_id,title,data) VALUES($1,$2,$3,$4)",
              [uid(),d.userId,"Your individual mark has been published",{groupId:g.id}]);
          } else await activity(q,g.id,user,"Published a group mark");
          break;
        }
        case 'readNotification':
          await q("UPDATE lt_notifications SET read=true WHERE user_id=$1 AND ($2::text IS NULL OR id=$2)",[user.id,d.id||null]); break;
        default: fail("Unknown action.");
      }
    }
    await client.query("COMMIT");
    return {success:true,message:"Saved successfully.",id};
  } catch(error) { await client.query("ROLLBACK"); throw error; }
  finally { client.release(); }
}
