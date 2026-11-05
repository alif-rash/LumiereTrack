CREATE TABLE IF NOT EXISTS lt_users (
 id text PRIMARY KEY, name text NOT NULL, email text NOT NULL UNIQUE,
 role text NOT NULL DEFAULT 'unassigned' CHECK(role IN ('unassigned','student','professor')),
 profile jsonb NOT NULL DEFAULT '{}', created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS lt_courses (
 id text PRIMARY KEY, title text NOT NULL, code text NOT NULL UNIQUE,
 owner_id text NOT NULL REFERENCES lt_users(id), data jsonb NOT NULL DEFAULT '{}',
 created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS lt_course_members (
 course_id text REFERENCES lt_courses(id), user_id text REFERENCES lt_users(id),
 instructor boolean NOT NULL DEFAULT false, PRIMARY KEY(course_id,user_id)
);
CREATE TABLE IF NOT EXISTS lt_assignments (
 id text PRIMARY KEY, course_id text NOT NULL REFERENCES lt_courses(id),
 title text NOT NULL, data jsonb NOT NULL DEFAULT '{}', created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS lt_groups (
 id text PRIMARY KEY, assignment_id text NOT NULL REFERENCES lt_assignments(id),
 title text NOT NULL, code text NOT NULL UNIQUE, created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS lt_group_members (
 group_id text REFERENCES lt_groups(id), user_id text REFERENCES lt_users(id),
 PRIMARY KEY(group_id,user_id)
);
CREATE TABLE IF NOT EXISTS lt_tasks (
 id text PRIMARY KEY, group_id text NOT NULL REFERENCES lt_groups(id),
 assignee_id text REFERENCES lt_users(id), creator_id text NOT NULL REFERENCES lt_users(id),
 title text NOT NULL, status text NOT NULL DEFAULT 'To Do'
 CHECK(status IN ('To Do','In Progress','Submitted','Under Review','Changes Requested','Approved')),
 data jsonb NOT NULL DEFAULT '{}', created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS lt_submissions (
 id text PRIMARY KEY, group_id text NOT NULL REFERENCES lt_groups(id),
 task_id text REFERENCES lt_tasks(id), user_id text NOT NULL REFERENCES lt_users(id),
 version integer NOT NULL, status text NOT NULL DEFAULT 'Submitted',
 data jsonb NOT NULL DEFAULT '{}', created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS lt_reviews (
 id text PRIMARY KEY, submission_id text NOT NULL REFERENCES lt_submissions(id),
 user_id text NOT NULL REFERENCES lt_users(id), status text NOT NULL,
 data jsonb NOT NULL DEFAULT '{}', created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS lt_grades (
 id text PRIMARY KEY, group_id text NOT NULL REFERENCES lt_groups(id),
 student_id text REFERENCES lt_users(id), professor_id text NOT NULL REFERENCES lt_users(id),
 scope text NOT NULL CHECK(scope IN ('group','individual')), marks numeric NOT NULL CHECK(marks>=0),
 data jsonb NOT NULL DEFAULT '{}', created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS lt_activity (
 id text PRIMARY KEY, group_id text NOT NULL REFERENCES lt_groups(id),
 user_id text NOT NULL REFERENCES lt_users(id), title text NOT NULL,
 data jsonb NOT NULL DEFAULT '{}', created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS lt_notifications (
 id text PRIMARY KEY, user_id text NOT NULL REFERENCES lt_users(id),
 title text NOT NULL, data jsonb NOT NULL DEFAULT '{}', read boolean NOT NULL DEFAULT false,
 created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS lt_uploads (
 path text PRIMARY KEY, group_id text NOT NULL REFERENCES lt_groups(id),
 user_id text NOT NULL REFERENCES lt_users(id), name text NOT NULL,
 created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS lt_tasks_group ON lt_tasks(group_id);
CREATE INDEX IF NOT EXISTS lt_submissions_group ON lt_submissions(group_id);
CREATE INDEX IF NOT EXISTS lt_activity_group ON lt_activity(group_id);
CREATE INDEX IF NOT EXISTS lt_notifications_user ON lt_notifications(user_id);
