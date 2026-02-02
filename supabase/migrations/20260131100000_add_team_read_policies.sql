-- Migration to add SELECT policies for teams and team_members
-- Fixes issue where users cannot see their own team dashboard after joining

-- 1. Policies for team_members table
-- Allow users to view their own memberships (Essential for any RLS logic involving checks on self)
CREATE POLICY "View own memberships" ON "public"."team_members"
AS PERMISSIVE FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Allow users to view members of teams they belong to
-- This allows seeing colleagues in the member list
CREATE POLICY "View team members" ON "public"."team_members"
AS PERMISSIVE FOR SELECT
TO authenticated
USING (
  team_id IN (
    SELECT team_id FROM public.team_members WHERE user_id = auth.uid() AND status = 'active'
  )
);

-- 2. Policies for teams table
-- Allow users to view teams they are a member of
-- This allows the dashboard to load team details (name, logo, etc.)
CREATE POLICY "View teams" ON "public"."teams"
AS PERMISSIVE FOR SELECT
TO authenticated
USING (
  id IN (
    SELECT team_id FROM public.team_members WHERE user_id = auth.uid() AND status = 'active'
  )
);
