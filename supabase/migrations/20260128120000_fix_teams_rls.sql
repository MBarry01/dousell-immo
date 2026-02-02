-- Allow authenticated users to create new teams
-- This is necessary for the auto-team creation flow
CREATE POLICY "Enable insert for authenticated users" ON "public"."teams"
AS PERMISSIVE FOR INSERT
TO authenticated
WITH CHECK (true);

-- Allow users to add themselves as members (necessary when creating a team)
CREATE POLICY "Enable insert for users adding themselves" ON "public"."team_members"
AS PERMISSIVE FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);
