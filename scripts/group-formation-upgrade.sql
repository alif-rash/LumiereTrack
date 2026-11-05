-- Additive development migration. Do not run at application startup.
BEGIN;
ALTER TABLE lt_groups ADD COLUMN IF NOT EXISTS leader_id text REFERENCES lt_users(id);
ALTER TABLE lt_groups ADD COLUMN IF NOT EXISTS invite_active boolean NOT NULL DEFAULT true;
ALTER TABLE lt_groups ADD COLUMN IF NOT EXISTS invite_expires_at timestamptz;
ALTER TABLE lt_group_members ADD COLUMN IF NOT EXISTS assignment_id text REFERENCES lt_assignments(id);
UPDATE lt_group_members gm SET assignment_id=g.assignment_id
  FROM lt_groups g WHERE gm.group_id=g.id AND gm.assignment_id IS NULL;
ALTER TABLE lt_group_members ALTER COLUMN assignment_id SET NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS lt_members_one_group_per_assignment ON lt_group_members(assignment_id,user_id);
UPDATE lt_groups g SET leader_id=(
  SELECT a.user_id FROM lt_activity a JOIN lt_group_members gm ON gm.group_id=g.id AND gm.user_id=a.user_id
  WHERE a.group_id=g.id AND a.title='Created the group' ORDER BY a.created_at LIMIT 1
) WHERE g.leader_id IS NULL;
COMMIT;
