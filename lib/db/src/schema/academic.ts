import { pgTable, text, boolean, timestamp, jsonb, integer, numeric, primaryKey, index, check } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
const created = () => timestamp("created_at",{withTimezone:true}).notNull().defaultNow();
const data = () => jsonb("data").notNull().default({});
export const ltUsers=pgTable("lt_users",{
  id:text("id").primaryKey(),name:text("name").notNull(),email:text("email").notNull().unique(),
  role:text("role").notNull().default("unassigned"),profile:jsonb("profile").notNull().default({}),createdAt:created(),
},t=>[check("lt_users_role_check",sql`${t.role} IN ('unassigned','student','professor')`)]);
export const ltCourses=pgTable("lt_courses",{
  id:text("id").primaryKey(),title:text("title").notNull(),code:text("code").notNull().unique(),
  ownerId:text("owner_id").notNull().references(()=>ltUsers.id),data:data(),createdAt:created(),
});
export const ltCourseMembers=pgTable("lt_course_members",{
  courseId:text("course_id").references(()=>ltCourses.id),userId:text("user_id").references(()=>ltUsers.id),
  instructor:boolean("instructor").notNull().default(false),
},t=>[primaryKey({columns:[t.courseId,t.userId]})]);
export const ltAssignments=pgTable("lt_assignments",{
  id:text("id").primaryKey(),courseId:text("course_id").notNull().references(()=>ltCourses.id),
  title:text("title").notNull(),data:data(),createdAt:created(),
});
export const ltGroups=pgTable("lt_groups",{
  id:text("id").primaryKey(),assignmentId:text("assignment_id").notNull().references(()=>ltAssignments.id),
  title:text("title").notNull(),code:text("code").notNull().unique(),createdAt:created(),
});
export const ltGroupMembers=pgTable("lt_group_members",{
  groupId:text("group_id").references(()=>ltGroups.id),userId:text("user_id").references(()=>ltUsers.id),
},t=>[primaryKey({columns:[t.groupId,t.userId]})]);
export const ltTasks=pgTable("lt_tasks",{
  id:text("id").primaryKey(),groupId:text("group_id").notNull().references(()=>ltGroups.id),
  assigneeId:text("assignee_id").references(()=>ltUsers.id),creatorId:text("creator_id").notNull().references(()=>ltUsers.id),
  title:text("title").notNull(),status:text("status").notNull().default("To Do"),data:data(),createdAt:created(),
},t=>[index("lt_tasks_group").on(t.groupId),check("lt_tasks_status_check",sql`${t.status} IN ('To Do','In Progress','Submitted','Under Review','Changes Requested','Approved')`)]);
export const ltSubmissions=pgTable("lt_submissions",{
  id:text("id").primaryKey(),groupId:text("group_id").notNull().references(()=>ltGroups.id),
  taskId:text("task_id").references(()=>ltTasks.id),userId:text("user_id").notNull().references(()=>ltUsers.id),
  version:integer("version").notNull(),status:text("status").notNull().default("Submitted"),data:data(),createdAt:created(),
},t=>[index("lt_submissions_group").on(t.groupId)]);
export const ltReviews=pgTable("lt_reviews",{
  id:text("id").primaryKey(),submissionId:text("submission_id").notNull().references(()=>ltSubmissions.id),
  userId:text("user_id").notNull().references(()=>ltUsers.id),status:text("status").notNull(),data:data(),createdAt:created(),
});
export const ltGrades=pgTable("lt_grades",{
  id:text("id").primaryKey(),groupId:text("group_id").notNull().references(()=>ltGroups.id),
  studentId:text("student_id").references(()=>ltUsers.id),professorId:text("professor_id").notNull().references(()=>ltUsers.id),
  scope:text("scope").notNull(),marks:numeric("marks").notNull(),data:data(),createdAt:created(),
},t=>[check("lt_grades_scope_check",sql`${t.scope} IN ('group','individual')`),check("lt_grades_marks_check",sql`${t.marks}>=0`)]);
export const ltActivity=pgTable("lt_activity",{
  id:text("id").primaryKey(),groupId:text("group_id").notNull().references(()=>ltGroups.id),
  userId:text("user_id").notNull().references(()=>ltUsers.id),title:text("title").notNull(),data:data(),createdAt:created(),
},t=>[index("lt_activity_group").on(t.groupId)]);
export const ltNotifications=pgTable("lt_notifications",{
  id:text("id").primaryKey(),userId:text("user_id").notNull().references(()=>ltUsers.id),
  title:text("title").notNull(),data:data(),read:boolean("read").notNull().default(false),createdAt:created(),
},t=>[index("lt_notifications_user").on(t.userId)]);
export const ltUploads=pgTable("lt_uploads",{
  path:text("path").primaryKey(),groupId:text("group_id").notNull().references(()=>ltGroups.id),
  userId:text("user_id").notNull().references(()=>ltUsers.id),name:text("name").notNull(),createdAt:created(),
});
